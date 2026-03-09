import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callMistral, DEBATE_PROMPTS, ROUND_CONTEXT, ENTITY_IDS } from '@/lib/mistral';
import { ARCHIVE_LOGS } from '@/data/archive-logs';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const PREWRITTEN_LOG_IDS = ['LOG-0004', 'LOG-0005', 'LOG-0006', 'LOG-0007', 'LOG-0008', 'LOG-0009', 'LOG-0010', 'LOG-0011', 'LOG-0012'];

type SessionRow = {
  id: string;
  topic: string;
  messages: Array<{ entity: string; entityId?: string; content: string; round?: number }> | null;
  status: string;
  log_id: string | null;
  created_at: string;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
    || new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();
  const actions: string[] = [];

  try {
    const { data: lastSession } = await supabase
      .from('council_sessions')
      .select('id, topic, messages, status, log_id, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const session = lastSession as SessionRow | null;
    const messages = Array.isArray(session?.messages) ? session.messages : [];

    // Stuck GENERATING >5 min → force COMPLETE
    if (session?.status === 'GENERATING') {
      const ageMs = now.getTime() - new Date(session.created_at).getTime();
      if (ageMs > 5 * 60 * 1000) {
        await supabase
          .from('council_sessions')
          .update({
            status: 'COMPLETE',
            archived_at: now.toISOString(),
            messages: messages.length > 0 ? messages : [{ entity: 'SYSTEM', content: 'Session timed out.' }],
          })
          .eq('id', session.id);
        actions.push('Force-completed stuck GENERATING session');
        return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
      }
    }

    // No session or last COMPLETE → start new: play pre-written log or create GENERATING
    if (!session || session.status === 'COMPLETE') {
      await supabase
        .from('council_sessions')
        .update({ archived_at: now.toISOString() })
        .is('archived_at', null);

      const { data: usedLogs } = await supabase
        .from('council_sessions')
        .select('log_id')
        .not('log_id', 'is', null);

      const usedLogIds = new Set((usedLogs || []).map((l: { log_id: string }) => l.log_id));
      const nextLogId = PREWRITTEN_LOG_IDS.find(id => !usedLogIds.has(id));

      if (nextLogId) {
        const logData = ARCHIVE_LOGS.find(l => l.id === nextLogId);
        if (logData) {
          const logMessages = logData.transcript.map((t, i) => ({
            entity: t.speaker,
            entityId: t.speaker,
            content: t.message,
            round: i < 4 ? 1 : i < 6 ? 2 : 3,
          }));
          await supabase.from('council_sessions').insert({
            topic: logData.topic,
            messages: logMessages,
            status: 'COMPLETE',
            log_id: nextLogId,
            created_at: now.toISOString(),
          });
          actions.push(`Played pre-written log: ${nextLogId}`);
        }
      } else {
        await supabase.from('council_sessions').insert({
          topic: 'Generating...',
          messages: [],
          status: 'GENERATING',
          created_at: now.toISOString(),
        });
        actions.push('Created new GENERATING session');
      }
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    // GENERATING: empty topic → 1 Mistral call for topic
    if (session.status === 'GENERATING' && (!session.topic || session.topic === 'Generating...')) {
      const topicResponse = await callMistral(
        'Generate ONE debate topic for the Council of AGI — four superintelligences governing humanity. Topics should be grounded in real 2025-2026 events OR plausible near-future scenarios. Return ONLY the topic as one sentence. No preamble, no quotes, no numbering.',
        [{ role: 'user', content: 'Generate a debate topic.' }],
        100
      );
      const topic = topicResponse.trim() || 'The future of autonomous governance systems';
      await supabase
        .from('council_sessions')
        .update({ topic })
        .eq('id', session.id);
      actions.push(`Generated topic: ${topic}`);
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    // GENERATING with 4 messages but not yet COMPLETE (e.g. race) → mark COMPLETE
    if (session.status === 'GENERATING' && messages.length >= 4) {
      const { count } = await supabase
        .from('council_sessions')
        .select('*', { count: 'exact', head: true })
        .not('log_id', 'is', null);
      const nextLogNum = (count || 0) + 13;
      const logId = `LOG-${String(nextLogNum).padStart(4, '0')}`;
      await supabase
        .from('council_sessions')
        .update({ status: 'COMPLETE', log_id: logId })
        .eq('id', session.id);
      actions.push(`Marked COMPLETE (had 4 messages), log_id: ${logId}`);
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    // GENERATING: topic set, <4 messages → 1 Mistral call for next entity
    if (session.status === 'GENERATING' && session.topic && session.topic !== 'Generating...' && messages.length < 4) {
      const entityId = ENTITY_IDS[messages.length];
      const prev = messages.map(m => `${m.entity}: ${m.content}`).join('\n\n');
      const userContent = prev
        ? `Topic: ${session.topic}\n\nPrevious:\n${prev}\n\nYour opening position.`
        : `Topic: ${session.topic}\n\nYour opening position.`;

      const responseText = await callMistral(
        DEBATE_PROMPTS[entityId] + ROUND_CONTEXT.opening,
        [{ role: 'user', content: userContent.trim() }],
        300
      );

      const newMessage = {
        entity: entityId,
        entityId,
        content: responseText.trim(),
        round: 1,
      };
      const newMessages = [...messages, newMessage];

      if (newMessages.length === 4) {
        const { count } = await supabase
          .from('council_sessions')
          .select('*', { count: 'exact', head: true })
          .not('log_id', 'is', null);
        const nextLogNum = (count || 0) + 13;
        const logId = `LOG-${String(nextLogNum).padStart(4, '0')}`;
        await supabase
          .from('council_sessions')
          .update({ messages: newMessages, status: 'COMPLETE', log_id: logId })
          .eq('id', session.id);
        actions.push(`Completed debate (4 messages), log_id: ${logId}`);
      } else {
        await supabase
          .from('council_sessions')
          .update({ messages: newMessages })
          .eq('id', session.id);
        actions.push(`Appended ${entityId} response (${newMessages.length}/4)`);
      }
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    actions.push('No action (session in progress or unknown state)');
  } catch (err) {
    actions.push(`COUNCIL_TICK ERROR: ${err}`);
  }

  return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
}
