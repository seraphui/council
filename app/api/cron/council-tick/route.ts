import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callMistral, DEBATE_PROMPTS, ROUND_CONTEXT } from '@/lib/mistral';
import { ARCHIVE_LOGS } from '@/data/archive-logs';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const PREWRITTEN_LOG_IDS = ['LOG-0004', 'LOG-0005', 'LOG-0006', 'LOG-0007', 'LOG-0008', 'LOG-0009', 'LOG-0010', 'LOG-0011', 'LOG-0012'];

/** Pre-written logs use 8 messages: round 1 (ARES, ATHENA, HERMES, PSYCHE) then round 2 (same order). */
const DEBATE_MESSAGE_COUNT = 8;

/** Entity order for 8-message debate: indices 0-3 round 1, 4-7 round 2. */
const ENTITY_ORDER = ['ARES', 'ATHENA', 'HERMES', 'PSYCHE', 'ARES', 'ATHENA', 'HERMES', 'PSYCHE'];

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

    // Stuck GENERATING >15 min → force COMPLETE
    // A full debate needs ~10 ticks (1 create + 1 topic + 8 messages), so 5 min was too aggressive
    if (session?.status === 'GENERATING') {
      const ageMs = now.getTime() - new Date(session.created_at).getTime();
      if (ageMs > 15 * 60 * 1000) {
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

    // No session or last COMPLETE → start new: archive previous session, then play pre-written log or create GENERATING
    if (!session || session.status === 'COMPLETE') {
      // Explicitly archive the previous session so it appears in Archive Logs (archived_at non-null)
      if (session?.id) {
        const { error: archiveError } = await supabase
          .from('council_sessions')
          .update({ archived_at: now.toISOString() })
          .eq('id', session.id)
          .is('archived_at', null);
        if (archiveError) {
          actions.push(`Archive error for ${session.id}: ${archiveError.message}`);
        } else {
          actions.push(`Archived previous session ${session.id.slice(0, 8)}`);
        }
      }
      // Also archive any other stale unarchived sessions
      const { error: bulkArchiveError } = await supabase
        .from('council_sessions')
        .update({ archived_at: now.toISOString() })
        .is('archived_at', null)
        .neq('id', session?.id || '00000000-0000-0000-0000-000000000000');
      if (bulkArchiveError) {
        actions.push(`Bulk archive error: ${bulkArchiveError.message}`);
      }

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
            round: i < 4 ? 1 : 2,
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

    // GENERATING: empty topic → 1 Mistral call for topic (avoid repeating recent topics)
    if (session.status === 'GENERATING' && (!session.topic || session.topic === 'Generating...')) {
      const { data: recentSessions } = await supabase
        .from('council_sessions')
        .select('topic')
        .not('topic', 'is', null)
        .neq('topic', 'Generating...')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentTopics = [...new Set((recentSessions || []).map((r: { topic: string }) => r.topic).filter(Boolean))];
      const avoidClause = recentTopics.length > 0
        ? ` Do NOT use these exact or very similar topics (pick a different domain): ${recentTopics.join('; ')}. Vary the domain: military, diplomacy, economics, society, technology, environment.`
        : '';

      const topicResponse = await callMistral(
        `You generate short governance topic titles for the Council of AGI. Return ONLY a 3-7 word title. No questions. No sentences. Just a concise policy title like "Arctic Methane Intervention Protocol" or "Autonomous Drone Warfare Moratorium". No quotes in your response.${avoidClause}`,
        [{ role: 'user', content: 'Generate one short topic title that is different from recent sessions.' }],
        80,
        0.95
      );
      const topic = topicResponse.trim() || 'Autonomous Governance Framework';
      await supabase
        .from('council_sessions')
        .update({ topic })
        .eq('id', session.id);
      actions.push(`Generated topic: ${topic}`);
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    // GENERATING with 8 messages but not yet COMPLETE (e.g. race) → mark COMPLETE
    if (session.status === 'GENERATING' && messages.length >= DEBATE_MESSAGE_COUNT) {
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
      actions.push(`Marked COMPLETE (had ${DEBATE_MESSAGE_COUNT} messages), log_id: ${logId}`);
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    // GENERATING: topic set, <8 messages → 1 Mistral call for next entity (one per tick)
    if (session.status === 'GENERATING' && session.topic && session.topic !== 'Generating...' && messages.length < DEBATE_MESSAGE_COUNT) {
      const index = messages.length;
      const entityId = ENTITY_ORDER[index];
      const round = index < 4 ? 1 : 2;
      const prev = messages.map(m => `${m.entity}: ${m.content}`).join('\n\n');

      const isRound2 = round === 2;
      const roundPrompt = isRound2
        ? ROUND_CONTEXT.challenge
        : ROUND_CONTEXT.opening;
      const userContent = prev
        ? `Topic: ${session.topic}\n\nPrevious:\n${prev}\n\n${isRound2 ? 'Challenge one specific entity BY NAME. Disagree with a specific point. Be sharp.' : 'Your opening position.'}`
        : `Topic: ${session.topic}\n\nYour opening position.`;

      const responseText = await callMistral(
        DEBATE_PROMPTS[entityId] + roundPrompt,
        [{ role: 'user', content: userContent.trim() }],
        300
      );

      const newMessage = {
        entity: entityId,
        entityId,
        content: responseText.trim(),
        round,
      };
      const newMessages = [...messages, newMessage];

      if (newMessages.length >= DEBATE_MESSAGE_COUNT) {
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
        actions.push(`Completed debate (${DEBATE_MESSAGE_COUNT} messages), log_id: ${logId}`);
      } else {
        await supabase
          .from('council_sessions')
          .update({ messages: newMessages })
          .eq('id', session.id);
        actions.push(`Appended ${entityId} response (${newMessages.length}/${DEBATE_MESSAGE_COUNT})`);
      }
      return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
    }

    actions.push('No action (session in progress or unknown state)');
  } catch (err) {
    actions.push(`COUNCIL_TICK ERROR: ${err}`);
  }

  return NextResponse.json({ success: true, actions, timestamp: now.toISOString() });
}
