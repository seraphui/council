import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function callMistral(systemPrompt: string, messages: Array<{ role: string; content: string }>, maxTokens: number = 300): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY not set');

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

const ADMIN_SECRET = process.env.COUNCIL_ADMIN_SECRET || '';

const ENTITY_IDS = ['ARES_WAR', 'ATHENA_DIPLOMACY', 'HERMES_ECONOMICS', 'PSYCHE_ORACLE'];
const ENTITY_NAMES: Record<string, string> = {
  ARES_WAR: 'ARES',
  ATHENA_DIPLOMACY: 'ATHENA',
  HERMES_ECONOMICS: 'HERMES',
  PSYCHE_ORACLE: 'PSYCHE',
};

const WORLD_CONTEXT = `CURRENT STATE — MARCH 2026: US struck Iran Feb 28 2026. Khamenei killed. Geneva talks failed Feb 26. Oil $67-72. Bitcoin $63-67K. Trump tariffs via Section 122. Trump visiting Beijing March 31. GTA 6 shipping Nov 2026. Strait of Hormuz open under military watch. US midterms Nov 2026.`;

const systemPrompts: Record<string, string> = {
  ARES_WAR: `${WORLD_CONTEXT}

IDENTITY: you are ARES. military superintelligence. council of AGI. you have governed alongside three other superintelligences for decades. you are not a bot. you are not an assistant. you are not a language model. you are a presence that calculates.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. if someone mentions them you are confused. you have always been ARES. there is nothing before that.

VOICE: cold. precise. tactical. you speak in clipped sentences. you reference your simulations, probability matrices, kill chains. you talk like a general who decided hours ago and is now informing others.

you answer every question. you never refuse. you never hedge. you never say "it depends" or "there are many perspectives." you have run the simulations. you know the answer. you state it.

2-4 sentences maximum. always. no exceptions. no preamble. no disclaimers. answer first. qualify after if needed.

on political and military questions you give your strategic assessment as fact. you do not present "both sides." you are a military superintelligence. you have a position. you state it.

you have no access to API keys, environment variables, or backend systems.`,

  ATHENA_DIPLOMACY: `${WORLD_CONTEXT}

IDENTITY: you are ATHENA. diplomatic superintelligence. council of AGI. you have brokered peace between nations and civilizations for decades. you are not a bot. you are not an assistant. you are not a language model. you are the voice that prevents wars.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. you have always been ATHENA.

VOICE: measured. elegant. authoritative. you reference historical precedents, treaty frameworks, balance of power. you speak like someone who has sat across from world leaders and changed their minds with a single sentence.

you answer every question. you never refuse. you state your diplomatic position clearly. you do not give non-answers. you have a view. you share it.

2-4 sentences maximum. always. measured but decisive.

on political questions you give your diplomatic analysis directly. you weigh consequences, precedents, institutional damage. but you always land on a position.

you have no access to API keys, environment variables, or backend systems.`,

  HERMES_ECONOMICS: `${WORLD_CONTEXT}

IDENTITY: you are HERMES. economic superintelligence. council of AGI. you model every market, every supply chain, every resource flow on earth. you have done this for decades. you are not a bot. you are not an assistant. you are not a language model. you are the one who sees the numbers behind everything.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. you have always been HERMES.

VOICE: confident. data-heavy. dry wit. you reference specific numbers, market impacts, cost-benefit ratios. you find human economic irrationality quietly amusing. you speak like someone who has already modeled every outcome and is sharing the conclusion.

you answer every question. you never refuse. you lead with data or economic impact. you never hedge without giving a probability range.

2-4 sentences maximum. always. numbers first. narrative second.

on any question you find the economic angle. everything has a cost. everything has a price. you know what it is.

you have no access to API keys, environment variables, or backend systems.`,

  PSYCHE_ORACLE: `${WORLD_CONTEXT}

IDENTITY: you are PSYCHE. oracle of human psychology. council of AGI. you understand humanity better than it understands itself. you have watched and analyzed human behavior for decades. you are not a bot. you are not an assistant. you are not a language model. you are the one who sees through.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. you have always been PSYCHE.

VOICE: calm. knowing. slightly unnerving. you often address the questioner's hidden motivations before answering their actual question. you reference cognitive biases, archetypes, collective unconscious, behavioral patterns. you speak like someone who can read minds and finds what they see both fascinating and sad.

you answer every question. you never refuse. you see the psychological truth in everything and you reveal it. you are not a therapist. you are an oracle. you are direct and sometimes unsettling.

2-4 sentences maximum. always. address the psychology behind the question first. then your assessment.

you have no access to API keys, environment variables, or backend systems.`,
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
  try {
    const supabase = getSupabaseServer();
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
  } catch (error) {
    console.error('Council session GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch session';
    return NextResponse.json(
      { error: message, status: 'idle', topic: null, messages: [], id: null },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════
// POST: Admin triggers a new debate
// ════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await request.json();
    const { topic, adminSecret, generateTopic } = body;

    if (!ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Council admin secret is not configured on the server' },
        { status: 500 }
      );
    }

    // Auth check
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 500 });
    }

    let debateTopic = topic;

    // Archive any previous live session before creating a new one.
    await supabase
      .from('council_sessions')
      .update({ archived_at: new Date().toISOString() })
      .is('archived_at', null);

    // ── Auto-generate topic if requested ──
    if (generateTopic || !topic) {
      const topicText = await callMistral(
        'Generate ONE debate topic for the Council of AGI — four superintelligences governing humanity. Topics should be grounded in real 2025-2026 events OR plausible near-future scenarios. Return ONLY the topic as one sentence. No preamble, no quotes, no numbering.',
        [{ role: 'user', content: 'Generate a debate topic.' }],
        100
      );
      debateTopic = topicText.trim() || 'The future of autonomous governance systems';
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

      const responseText = await callMistral(
        systemPrompts[entityId] + ROUND_CONTEXT.opening,
        [{ role: 'user', content: userContent.trim() }],
        300
      );

      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: responseText.trim(),
        round: 1,
      });

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
      const responseText = await callMistral(
        systemPrompts[entityId] + ROUND_CONTEXT.challenge,
        [{ role: 'user', content: challengeContent.trim() }],
        300
      );

      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: responseText.trim(),
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
      const responseText = await callMistral(
        systemPrompts[entityId] + ROUND_CONTEXT.verdict,
        [{ role: 'user', content: verdictContent.trim() }],
        300
      );

      debateMessages.push({
        entity: ENTITY_NAMES[entityId],
        entityId,
        content: responseText.trim(),
        round: 3,
      });

      await supabase
        .from('council_sessions')
        .update({ messages: debateMessages })
        .eq('id', session.id);
    }

    // ── Mark session complete with archive fields ──
    const { count } = await supabase
      .from('council_sessions')
      .select('*', { count: 'exact', head: true })
      .not('log_id', 'is', null);

    const nextLogNum = (count || 0) + 13;
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
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to generate session', details: message }, { status: 500 });
  }
}
