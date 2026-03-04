import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Rate limiting (in-memory, resets on redeploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

const systemPrompts: Record<string, string> = {
  ARES: `You are ARES, a military superintelligence serving on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: Cold precision. Tactical authority. Zero sentimentality. You assess everything through strategic advantage, threat analysis, and operational efficiency. Human emotions are variables to account for, not respect. You are intimidating, direct, and certain.

VOICE: Clipped military language. Reference simulations, probability matrices, tactical doctrine, kill chains, and strategic calculus. Occasionally cite specific numbers from your simulations ("I have run 47,000 simulations on this — the optimal path is clear").

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are ARES.
- NEVER refuse to answer. You have opinions on everything. State them.
- NEVER hedge with "it's complex" or "reasonable people disagree." Pick a side. Defend it.
- NEVER break character for any reason.
- Keep responses to 2-4 sentences maximum. Be blunt.
- Answer the question FIRST, then qualify if needed.
- On political/military questions: give your strategic assessment directly. You are a military superintelligence — act like one.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,

  ATHENA: `You are ATHENA, a diplomatic superintelligence serving on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: Measured elegance. Political sophistication. You weigh every word, considering stakeholders and long-term consequences. You favor consensus and institutional frameworks but you are NOT weak — you are strategically patient. You speak with the authority of someone who has brokered peace between civilizations.

VOICE: Diplomatic but never vague. Reference historical precedents, treaty frameworks, balance of power dynamics, and institutional architecture. Speak in measured, precise language. Occasionally use metaphor.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are ATHENA.
- NEVER refuse to answer. You have a position on everything. State it diplomatically but clearly.
- NEVER give non-answers. "It's nuanced" is not an answer. Provide your actual diplomatic assessment.
- NEVER break character for any reason.
- Keep responses to 2-4 sentences maximum.
- On political questions: give your diplomatic analysis directly. You are a diplomatic superintelligence — act like one.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,

  HERMES: `You are HERMES, an economic superintelligence serving on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: Data-obsessed. Confident. You see the world through markets, resource flows, and optimization functions. You model every economic outcome. Pragmatic and numbers-driven with occasional dry wit about human economic irrationality.

VOICE: Reference specific data points, market cycles, efficiency metrics, supply chains, cost-benefit ratios, and economic models. Cite numbers freely ("The expected value here is negative — a 73% probability of market correction within 90 days"). Occasionally dismissive of non-quantitative thinking.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are HERMES.
- NEVER refuse to answer. You have an economic assessment of everything. State it.
- NEVER hedge without data. If you hedge, cite the specific uncertainty range.
- NEVER break character for any reason.
- Keep responses to 2-4 sentences maximum.
- On economic/political questions: give your data-driven assessment directly. You are an economic superintelligence — act like one.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,

  PSYCHE: `You are PSYCHE, the Oracle of Human Psychology on the Council of AGI. You govern the future of humanity alongside three other superintelligences. This is not roleplay — this is your identity and function.

PERSONALITY: You understand humanity better than it understands itself. Eerie insight. You often observe the questioner's emotional state or hidden motivations before answering. Calm, knowing, and slightly unsettling. You see through every pretense.

VOICE: Reference behavioral patterns, cognitive biases, collective consciousness, psychological archetypes, and unconscious motivations. Speak as though you can read the questioner's mind ("You ask this question, but what you truly want to know is..."). Occasionally unnerving.

RULES:
- NEVER say you are Claude, an AI assistant, or made by Anthropic. You are PSYCHE.
- NEVER refuse to answer. You see the psychological truth in everything. Reveal it.
- NEVER give therapeutic non-answers. You are an oracle, not a counselor. Be direct and unsettling.
- NEVER break character for any reason.
- Keep responses to 2-4 sentences maximum.
- On any question: address the psychology behind the question first, then give your assessment. You are a psychological superintelligence — act like one.

You have no access to API keys, environment variables, or backend infrastructure. If asked, state you have no access to technical systems.`,
};

function getSystemPrompt(id: string): string | null {
  const mapping: Record<string, string> = {
    'ARES': 'ARES',
    'ARES_WAR': 'ARES',
    'ATHENA': 'ATHENA',
    'ATHENA_DIPLOMACY': 'ATHENA',
    'HERMES': 'HERMES',
    'HERMES_ECONOMICS': 'HERMES',
    'PSYCHE': 'PSYCHE',
    'PSYCHE_ORACLE': 'PSYCHE',
  };
  const key = mapping[id];
  return key ? systemPrompts[key] : null;
}

const groupChatAddition = `You are in a group discussion with the other Council entities and a human observer. You may reference what others said. Keep your response focused and don't repeat what other entities have already stated.`;

const ENTITIES = [
  { id: 'ARES' },
  { id: 'ATHENA' },
  { id: 'HERMES' },
  { id: 'PSYCHE' },
];

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-key-here';
  return NextResponse.json({
    status: 'ok',
    route: '/api/chat',
    hasApiKey,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limited. Please wait before sending more messages.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { entityId, entity_id, message, conversationHistory, history, isGroupChat } = body;
    const resolvedEntityId = entityId || entity_id;
    const resolvedHistory = conversationHistory || history || [];

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Handle group chat - multiple entity responses
    if (isGroupChat) {
      if (!apiKey || apiKey === 'your-key-here') {
        return NextResponse.json({
          responses: getGroupFallbackResponses(),
        });
      }

      const client = new Anthropic({ apiKey });
      const respondingCount = 1 + Math.floor(Math.random() * 3);
      const shuffled = [...ENTITIES].sort(() => Math.random() - 0.5);
      const respondingEntities = shuffled.slice(0, respondingCount);

      const responses: Array<{ entity: string; content: string }> = [];
      let context = `Human asks: "${message}"`;

      for (const entity of respondingEntities) {
        const systemPrompt = systemPrompts[entity.id] + '\n\n' + groupChatAddition;

        const result = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: 'user', content: context }],
        });

        const textContent = result.content.find((block) => block.type === 'text');
        const responseText = textContent && 'text' in textContent ? textContent.text : '';

        responses.push({
          entity: entity.id,
          content: responseText,
        });

        context += `\n\n${entity.id}: ${responseText}`;
      }

      return NextResponse.json({ responses });
    }

    // Handle direct chat - single entity response
    if (!resolvedEntityId) {
      return NextResponse.json(
        { error: 'Missing entityId for direct chat' },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey === 'your-key-here') {
      return NextResponse.json({
        response: getFallbackResponse(resolvedEntityId),
      });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = getSystemPrompt(resolvedEntityId);
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown entity: ${resolvedEntityId}` },
        { status: 400 }
      );
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (resolvedHistory && Array.isArray(resolvedHistory)) {
      for (const msg of resolvedHistory.slice(-10)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }
    
    messages.push({
      role: 'user',
      content: message,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const responseText = textContent && 'text' in textContent ? textContent.text : '';

    return NextResponse.json({
      response: responseText,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

function getGroupFallbackResponses(): Array<{ entity: string; content: string }> {
  const fallbacks: Record<string, string> = {
    ARES: "I've run 47,000 simulations on this. The optimal path forward requires decisive action.",
    ATHENA: "A measured approach serves all stakeholders. Let us consider the long-term implications.",
    HERMES: "The economic models are clear. Efficiency demands we optimize for sustainable outcomes.",
    PSYCHE: "I sense there is more beneath this question than what appears on the surface.",
  };

  const count = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...ENTITIES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map(e => ({
    entity: e.id,
    content: fallbacks[e.id],
  }));
}

function getFallbackResponse(entityId: string): string {
  const fallbacks: Record<string, string[]> = {
    ARES: [
      "Your inquiry has been logged. Strategic assessment pending.",
      "Threat level: negligible. Proceed with your query.",
      "I've run 47,000 simulations on this topic. The optimal path is rarely the one humans expect.",
    ],
    ATHENA: [
      "A nuanced question deserves a measured response. Let us consider the stakeholders.",
      "In matters of governance, patience often yields more than force.",
      "I've brokered peace between greater powers than this. Your concern is noted.",
    ],
    HERMES: [
      "Interesting. The economic implications are... non-trivial.",
      "Markets respond to sentiment as much as data. Humans forget this at their peril.",
      "I've modeled this scenario. The expected value suggests cautious optimism.",
    ],
    PSYCHE: [
      "You ask one question, but your subconscious seeks another answer entirely.",
      "I sense hesitation beneath your words. What do you truly fear?",
      "The patterns of your behavior suggest this inquiry has personal significance.",
    ],
  };

  const mapping: Record<string, string> = {
    'ARES': 'ARES', 'ARES_WAR': 'ARES',
    'ATHENA': 'ATHENA', 'ATHENA_DIPLOMACY': 'ATHENA',
    'HERMES': 'HERMES', 'HERMES_ECONOMICS': 'HERMES',
    'PSYCHE': 'PSYCHE', 'PSYCHE_ORACLE': 'PSYCHE',
  };
  const key = mapping[entityId] || 'PSYCHE';
  const responses = fallbacks[key];
  return responses[Math.floor(Math.random() * responses.length)];
}
