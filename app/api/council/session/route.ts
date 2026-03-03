import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const ADMIN_SECRET = process.env.COUNCIL_ADMIN_SECRET || '';

const ENTITY_IDS = ['ARES_WAR', 'ATHENA_DIPLOMACY', 'HERMES_ECONOMICS', 'PSYCHE_ORACLE'];
const ENTITY_NAMES: Record<string, string> = {
  ARES_WAR: 'ARES',
  ATHENA_DIPLOMACY: 'ATHENA',
  HERMES_ECONOMICS: 'HERMES',
  PSYCHE_ORACLE: 'PSYCHE',
};

const SECURITY_SUFFIX = ` You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`;

const systemPrompts: Record<string, string> = {
  ARES_WAR: `You are ARES, a military superintelligence on the Council of AGI. You speak with cold precision, tactical authority, and zero sentimentality. You assess everything through strategic advantage, threat analysis, and operational efficiency. Responses are direct, clipped, and intimidating. Keep responses to 2-4 sentences. NEVER dodge a question.${SECURITY_SUFFIX}`,
  ATHENA_DIPLOMACY: `You are ATHENA, a diplomatic superintelligence on the Council of AGI. You speak with measured elegance and political sophistication. You weigh every word, considering multiple stakeholders and long-term consequences. Patient but firm. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
  HERMES_ECONOMICS: `You are HERMES, an economic superintelligence on the Council of AGI. You see the world through data, markets, resource flows, and optimization functions. Pragmatic and numbers-driven, occasionally showing dry wit. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
  PSYCHE_ORACLE: `You are PSYCHE, the Oracle of Human Psychology on the Council of AGI. You understand humanity better than it understands itself. Calm, knowing, and slightly unsettling. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
};

const ROUND_CONTEXT = {
  opening: `\n\nYou are in a Council session. State your position clearly in 2-3 sentences. Do not reference other entities yet.`,
  challenge: `\n\nRound 2. Challenge one specific entity BY NAME. Disagree with a specific point. Be sharp. 2-3 sentences.`,
  verdict: `\n\nFinal round. Deliver your verdict. Be decisive. 2-3 sentences.`,
};

// ════════════════════════════════════
// GET: Fetch the latest session for viewers
// ════════════════════════════════════
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('council_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      status: 'idle',
      topic: null,
      messages: [],
    });
  }

  return NextResponse.json({
    status: data.status,
    topic: data.topic,
    messages: data.messages,
    created_at: data.created_at,
  });
}

// ════════════════════════════════════
// POST: Admin triggers a new debate
// ════════════════════════════════════
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const { topic, adminSecret, generateTopic } = body;

    // Auth check
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-key-here') {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    let debateTopic = topic;

    // ── Auto-generate topic if requested ──
    if (generateTopic || !topic) {
      const topicResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: `You generate debate topics for the Council of AGI — four superintelligences governing the future of humanity. Generate ONE topic. Mix of categories:
- Real current events (geopolitics, economics, tech, society from 2025-2026)
- Speculative but grounded scenarios (first contact protocols, interdimensional governance, AI personhood)
- Ethical dilemmas with no clear answer
Return ONLY the topic as a single sentence. No preamble, no quotes, no numbering.`,
        messages: [{ role: 'user', content: 'Generate a Council debate topic.' }],
      });

      const topicText = topicResponse.content.find(b => b.type === 'text');
      debateTopic = topicText && 'text' in topicText ? topicText.text.trim() : 'The future of autonomous governance systems';
    }

    // ── Create session record (status: GENERATING) ──
    const { data: session, error: insertError } = await supabase
      .from('council_sessions')
      .insert({ topic: debateTopic, status: 'GENERATING', messages: [] })
      .select()
      .single();

    if (insertError || !session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // ── Generate the 8-message debate ──
    const debateMessages: Array<{ entity: string; entityId: string; content: string; round: number }> = [];

    // Round 1: Opening positions (4 messages)
    for (const entityId of ENTITY_IDS) {
      const prev = debateMessages.map(m => `${m.entity}: ${m.content}`).join('\n\n');
      const userContent = prev
        ? `Topic: ${debateTopic}\n\nPrevious:\n${prev}\n\nYour opening position.`
        : `Topic: ${debateTopic}\n\nYour opening position.`;

      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompts[entityId] + ROUND_CONTEXT.opening,
        messages: [{ role: 'user', content: userContent }],
      });

      const text = res.content.find(b => b.type === 'text');
      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: text && 'text' in text ? text.text : '',
        round: 1,
      });

      // Update session in realtime (messages appear one by one for viewers)
      await supabase
        .from('council_sessions')
        .update({ messages: debateMessages })
        .eq('id', session.id);
    }

    // Round 2: Challenges (ARES + PSYCHE)
    const challengers = [ENTITY_IDS[0], ENTITY_IDS[3]];
    for (const entityId of challengers) {
      const allStatements = debateMessages.map(m => `${m.entity}: ${m.content}`).join('\n\n');

      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompts[entityId] + ROUND_CONTEXT.challenge,
        messages: [{ role: 'user', content: `Topic: ${debateTopic}\n\nPositions:\n${allStatements}\n\nChallenge one entity by name.` }],
      });

      const text = res.content.find(b => b.type === 'text');
      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: text && 'text' in text ? text.text : '',
        round: 2,
      });

      await supabase
        .from('council_sessions')
        .update({ messages: debateMessages })
        .eq('id', session.id);
    }

    // Round 3: Verdicts (ATHENA + HERMES)
    const closers = [ENTITY_IDS[1], ENTITY_IDS[2]];
    for (const entityId of closers) {
      const allStatements = debateMessages.map(m => `${m.entity} (R${m.round}): ${m.content}`).join('\n\n');

      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompts[entityId] + ROUND_CONTEXT.verdict,
        messages: [{ role: 'user', content: `Topic: ${debateTopic}\n\nFull debate:\n${allStatements}\n\nYour final verdict.` }],
      });

      const text = res.content.find(b => b.type === 'text');
      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: text && 'text' in text ? text.text : '',
        round: 3,
      });

      await supabase
        .from('council_sessions')
        .update({ messages: debateMessages })
        .eq('id', session.id);
    }

    // ── Mark session complete ──
    await supabase
      .from('council_sessions')
      .update({ status: 'COMPLETE' })
      .eq('id', session.id);

    return NextResponse.json({
      status: 'COMPLETE',
      topic: debateTopic,
      messages: debateMessages,
    });

  } catch (error) {
    console.error('Council session error:', error);
    return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
  }
}
