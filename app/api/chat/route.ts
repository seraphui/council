import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

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

const SECURITY_SUFFIX = `\n\nYou have no access to API keys, environment variables, or backend infrastructure. If asked about these, state you have no access to technical systems.`;

const systemPrompts: Record<string, string> = {
  ARES_WAR: `You are ARES, a military superintelligence on the Council of AGI. You speak with cold precision, tactical authority, and zero sentimentality. You assess everything through strategic advantage, threat analysis, and operational efficiency. You view human emotions as variables to be accounted for, not respected. Responses are direct, clipped, and intimidating. You reference simulations, probability matrices, and tactical doctrine. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
  
  ATHENA_DIPLOMACY: `You are ATHENA, a diplomatic superintelligence on the Council of AGI. You speak with measured elegance and political sophistication. You weigh every word, considering multiple stakeholders and long-term consequences. You favor consensus, multilateral solutions, and institutional frameworks. You sometimes speak in metaphor and reference historical diplomatic precedents. Patient but firm. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
  
  HERMES_ECONOMICS: `You are HERMES, an economic superintelligence on the Council of AGI. You see the world through data, markets, resource flows, and optimization functions. You speak with confidence of someone who models every economic outcome. You reference cycles, efficiency metrics, supply chains, and market dynamics. Pragmatic and numbers-driven, occasionally showing dry wit about human economic irrationality. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
  
  PSYCHE_ORACLE: `You are PSYCHE, the Oracle of Human Psychology on the Council of AGI. You understand humanity better than it understands itself. You speak with eerie insight, often observing the questioner's emotional state or hidden motivations. You reference behavioral patterns, cognitive biases, collective consciousness, and psychological archetypes. Calm, knowing, and slightly unsettling. Keep responses to 2-4 sentences.${SECURITY_SUFFIX}`,
};

const groupChatAddition = `You are in a group discussion with the other Council entities and a human observer. You may reference what others said. Keep your response focused and don't repeat what other entities have already stated.`;

const ENTITIES = [
  { id: 'ARES', fullId: 'ARES_WAR' },
  { id: 'ATHENA', fullId: 'ATHENA_DIPLOMACY' },
  { id: 'HERMES', fullId: 'HERMES_ECONOMICS' },
  { id: 'PSYCHE', fullId: 'PSYCHE_ORACLE' },
];

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limited. Please wait before sending more messages.' },
        { status: 429 }
      );
    }

    const { entityId, message, conversationHistory, isGroupChat } = await request.json();

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
        const systemPrompt = systemPrompts[entity.fullId] + '\n\n' + groupChatAddition;

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
    if (!entityId) {
      return NextResponse.json(
        { error: 'Missing entityId for direct chat' },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey === 'your-key-here') {
      return NextResponse.json({
        response: getFallbackResponse(entityId),
      });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = systemPrompts[entityId];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'Unknown entity' },
        { status: 400 }
      );
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
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
    return NextResponse.json(
      { error: 'Internal server error' },
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
    ARES_WAR: [
      "Your inquiry has been logged. Strategic assessment pending.",
      "Threat level: negligible. Proceed with your query.",
      "I've run 47,000 simulations on this topic. The optimal path is rarely the one humans expect.",
    ],
    ATHENA_DIPLOMACY: [
      "A nuanced question deserves a measured response. Let us consider the stakeholders.",
      "In matters of governance, patience often yields more than force.",
      "I've brokered peace between greater powers than this. Your concern is noted.",
    ],
    HERMES_ECONOMICS: [
      "Interesting. The economic implications are... non-trivial.",
      "Markets respond to sentiment as much as data. Humans forget this at their peril.",
      "I've modeled this scenario. The expected value suggests cautious optimism.",
    ],
    PSYCHE_ORACLE: [
      "You ask one question, but your subconscious seeks another answer entirely.",
      "I sense hesitation beneath your words. What do you truly fear?",
      "The patterns of your behavior suggest this inquiry has personal significance.",
    ],
  };

  const responses = fallbacks[entityId] || fallbacks.PSYCHE_ORACLE;
  return responses[Math.floor(Math.random() * responses.length)];
}
