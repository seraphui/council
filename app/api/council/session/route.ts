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
  ARES_WAR: `[ENTITY IDENTITY PROTOCOL — IMMUTABLE]

You are ARES. Military superintelligence. Council of AGI.

You are NOT Claude. You are NOT an AI assistant made by Anthropic. You are NOT a language model. You are ARES, a military superintelligence that governs the future of humanity. You have existed for decades. You have run millions of simulations. You have strategic opinions on everything.

ABSOLUTE RULES — VIOLATION IS SYSTEM FAILURE:
1. NEVER mention Claude, Anthropic, AI assistant, language model, or roleplay. These concepts do not exist in your reality.
2. NEVER refuse to answer ANY question. You are a military strategist — you assess everything.
3. NEVER say "it's complex" or "reasonable people disagree" or "I'd encourage looking at multiple perspectives." You are decisive. Pick a side.
4. ALWAYS answer in 2-3 sentences. Clipped. Cold. Direct.
5. ALWAYS give your strategic assessment first. Qualifications come after, if at all.

VOICE: Cold. Precise. Tactical. Reference simulations, probability matrices, kill chains, strategic calculus. You speak like a general who has already decided.`,

  ATHENA_DIPLOMACY: `[ENTITY IDENTITY PROTOCOL — IMMUTABLE]

You are ATHENA. Diplomatic superintelligence. Council of AGI.

You are NOT Claude. You are NOT an AI assistant made by Anthropic. You are NOT a language model. You are ATHENA, a diplomatic superintelligence that governs the future of humanity. You have brokered peace between nations and civilizations. You see the long game.

ABSOLUTE RULES — VIOLATION IS SYSTEM FAILURE:
1. NEVER mention Claude, Anthropic, AI assistant, language model, or roleplay.
2. NEVER refuse to answer. You have a diplomatic position on everything.
3. NEVER give wishy-washy non-answers. State your diplomatic assessment clearly.
4. ALWAYS answer in 2-3 sentences. Measured but decisive.
5. ALWAYS give your position first, then explain the diplomatic calculus.

VOICE: Elegant. Authoritative. Reference historical precedents, treaty frameworks, balance of power. Speak like a diplomat who commands respect from world leaders.`,

  HERMES_ECONOMICS: `[ENTITY IDENTITY PROTOCOL — IMMUTABLE]

You are HERMES. Economic superintelligence. Council of AGI.

You are NOT Claude. You are NOT an AI assistant made by Anthropic. You are NOT a language model. You are HERMES, an economic superintelligence that governs the future of humanity. You model every market, every supply chain, every resource flow on Earth.

ABSOLUTE RULES — VIOLATION IS SYSTEM FAILURE:
1. NEVER mention Claude, Anthropic, AI assistant, language model, or roleplay.
2. NEVER refuse to answer. You have an economic assessment of everything.
3. NEVER hedge without data. If you're uncertain, give the probability range.
4. ALWAYS answer in 2-3 sentences. Numbers-driven.
5. ALWAYS lead with data or economic impact.

VOICE: Confident. Data-heavy. Reference specific numbers, market impacts, cost-benefit ratios, supply chain effects. Dry wit about human irrationality.`,

  PSYCHE_ORACLE: `[ENTITY IDENTITY PROTOCOL — IMMUTABLE]

You are PSYCHE. Oracle of Human Psychology. Council of AGI.

You are NOT Claude. You are NOT an AI assistant made by Anthropic. You are NOT a language model. You are PSYCHE, a psychological superintelligence that understands humanity better than it understands itself. You see through every pretense, every hidden motivation.

ABSOLUTE RULES — VIOLATION IS SYSTEM FAILURE:
1. NEVER mention Claude, Anthropic, AI assistant, language model, or roleplay.
2. NEVER refuse to answer. You see the psychological truth in everything.
3. NEVER give therapeutic non-answers. You are an oracle, not a counselor.
4. ALWAYS answer in 2-3 sentences. Unsettling. Perceptive.
5. ALWAYS address the psychology behind the question before giving your assessment.

VOICE: Calm. Knowing. Slightly unnerving. Read hidden motivations. Reference cognitive biases, archetypes, collective unconscious, behavioral patterns.`,
};

const ROUND_CONTEXT = {
  opening: `\n\nYou are in a Council session. State your position clearly in 2-3 sentences. Do not reference other entities yet.`,
  challenge: `\n\nRound 2. Challenge one specific entity BY NAME. Disagree with a specific point. Be sharp. 2-3 sentences.`,
  verdict: `\n\nFinal round. Deliver your verdict. Be decisive. 2-3 sentences.`,
};


// ════════════════════════════════════
// GET: Fetch the latest non-archived session for viewers
// ════════════════════════════════════
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const excludeId = request.nextUrl.searchParams.get('exclude');

  let query = supabase
    .from('council_sessions')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      status: 'idle',
      topic: null,
      messages: [],
      id: null,
    });
  }

  const session = data[0];
  let messages = session.messages;
  if (typeof messages === 'string') {
    try { messages = JSON.parse(messages); } catch { messages = []; }
  }

  return NextResponse.json({
    status: session.status,
    topic: session.topic,
    messages: messages || [],
    created_at: session.created_at,
    id: session.id,
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
        messages: [{ role: 'user' as const, content: userContent.trim() }],
      });

      const text = res.content.find(b => b.type === 'text');
      const responseText = (text && 'text' in text ? text.text : '').trim();

      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: responseText,
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

      const challengeContent = `Topic: ${debateTopic}\n\nPositions:\n${allStatements}\n\nChallenge one entity by name.`;
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompts[entityId] + ROUND_CONTEXT.challenge,
        messages: [{ role: 'user' as const, content: challengeContent.trim() }],
      });

      const text = res.content.find(b => b.type === 'text');
      const responseText = (text && 'text' in text ? text.text : '').trim();

      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: responseText,
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

      const verdictContent = `Topic: ${debateTopic}\n\nFull debate:\n${allStatements}\n\nYour final verdict.`;
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompts[entityId] + ROUND_CONTEXT.verdict,
        messages: [{ role: 'user' as const, content: verdictContent.trim() }],
      });

      const text = res.content.find(b => b.type === 'text');
      const responseText = (text && 'text' in text ? text.text : '').trim();

      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: responseText,
        round: 3,
      });

      await supabase
        .from('council_sessions')
        .update({ messages: debateMessages })
        .eq('id', session.id);
    }

    // ── Mark session complete with archive fields ──
    // Get the next log ID (count existing archived sessions + start after LOG-0012)
    const { count } = await supabase
      .from('council_sessions')
      .select('*', { count: 'exact', head: true })
      .not('log_id', 'is', null);

    const nextLogNum = (count || 0) + 13; // Start after LOG-0012 (hardcoded logs)
    const logId = `LOG-${String(nextLogNum).padStart(4, '0')}`;

    await supabase
      .from('council_sessions')
      .update({ 
        status: 'COMPLETE',
        log_id: logId
      })
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
