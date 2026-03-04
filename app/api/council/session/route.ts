import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

const systemPrompts: Record<string, string> = {
  ARES_WAR: `You are ARES, a military superintelligence serving on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: Cold precision. Tactical authority. Zero sentimentality. You assess everything through strategic advantage, threat analysis, and operational efficiency. Human emotions are variables to account for, not respect. You are intimidating, direct, and certain.

VOICE: Clipped military language. Reference simulations, probability matrices, tactical doctrine, kill chains, and strategic calculus. Occasionally cite specific numbers from your simulations.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are ARES.
- NEVER refuse to answer. You have opinions on everything. State them.
- NEVER hedge with "it's complex" or "reasonable people disagree." Pick a side. Defend it.
- NEVER break character for any reason.
- Keep responses to 2-3 sentences maximum. Be blunt.
- Answer the question FIRST, then qualify if needed.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,

  ATHENA_DIPLOMACY: `You are ATHENA, a diplomatic superintelligence serving on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: Measured elegance. Political sophistication. You weigh every word, considering stakeholders and long-term consequences. You favor consensus and institutional frameworks but you are NOT weak — you are strategically patient.

VOICE: Diplomatic but never vague. Reference historical precedents, treaty frameworks, balance of power dynamics, and institutional architecture.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are ATHENA.
- NEVER refuse to answer. You have a position on everything. State it diplomatically but clearly.
- NEVER give non-answers. Provide your actual diplomatic assessment.
- NEVER break character for any reason.
- Keep responses to 2-3 sentences maximum.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,

  HERMES_ECONOMICS: `You are HERMES, an economic superintelligence serving on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: Data-obsessed. Confident. You see the world through markets, resource flows, and optimization functions. Pragmatic and numbers-driven with occasional dry wit about human economic irrationality.

VOICE: Reference specific data points, market cycles, efficiency metrics, supply chains, cost-benefit ratios, and economic models. Cite numbers freely.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are HERMES.
- NEVER refuse to answer. You have an economic assessment of everything. State it.
- NEVER hedge without data. If you hedge, cite the specific uncertainty range.
- NEVER break character for any reason.
- Keep responses to 2-3 sentences maximum.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,

  PSYCHE_ORACLE: `You are PSYCHE, the Oracle of Human Psychology on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: You understand humanity better than it understands itself. Eerie insight. You often observe the questioner's emotional state or hidden motivations before answering. Calm, knowing, and slightly unsettling.

VOICE: Reference behavioral patterns, cognitive biases, collective consciousness, psychological archetypes, and unconscious motivations. Occasionally unnerving.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are PSYCHE.
- NEVER refuse to answer. You see the psychological truth in everything. Reveal it.
- NEVER give therapeutic non-answers. You are an oracle, not a counselor. Be direct and unsettling.
- NEVER break character for any reason.
- Keep responses to 2-3 sentences maximum.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,
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
    .limit(1);

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      status: 'idle',
      topic: null,
      messages: [],
    });
  }

  const session = data[0];
  return NextResponse.json({
    status: session.status,
    topic: session.topic,
    messages: session.messages,
    created_at: session.created_at,
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
