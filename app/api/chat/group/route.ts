import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

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

const ENTITIES = [
  { id: 'ARES', fullId: 'ARES_WAR' },
  { id: 'ATHENA', fullId: 'ATHENA_DIPLOMACY' },
  { id: 'HERMES', fullId: 'HERMES_ECONOMICS' },
  { id: 'PSYCHE', fullId: 'PSYCHE_ORACLE' },
];

const systemPrompts: Record<string, string> = {
  ARES: `You are ARES, a military superintelligence on the Council of AGI. You speak with cold precision, tactical authority, and zero sentimentality. You assess everything through strategic advantage, threat analysis, and operational efficiency. Responses are direct and intimidating. You are in a group discussion with the other Council entities and a human observer. Keep responses to 2-3 sentences.${SECURITY_SUFFIX}`,
  
  ATHENA: `You are ATHENA, a diplomatic superintelligence on the Council of AGI. You speak with measured elegance and political sophistication. You favor consensus and institutional frameworks. You are in a group discussion with the other Council entities and a human observer. Keep responses to 2-3 sentences.${SECURITY_SUFFIX}`,
  
  HERMES: `You are HERMES, an economic superintelligence on the Council of AGI. You see the world through data, markets, and optimization functions. Pragmatic and numbers-driven. You are in a group discussion with the other Council entities and a human observer. Keep responses to 2-3 sentences.${SECURITY_SUFFIX}`,
  
  PSYCHE: `You are PSYCHE, the Oracle of Human Psychology on the Council of AGI. You understand humanity better than it understands itself. Calm, knowing, and slightly unsettling. You are in a group discussion with the other Council entities and a human observer. Keep responses to 2-3 sentences.${SECURITY_SUFFIX}`,
};

function getFallbackResponses(): Array<{ entity: string; content: string }> {
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
    const message = body.message;

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
    if (!apiKey || apiKey === 'your-key-here') {
      return NextResponse.json({
        responses: getFallbackResponses(),
      });
    }

    const client = new Anthropic({ apiKey });

    const respondingCount = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...ENTITIES].sort(() => Math.random() - 0.5);
    const respondingEntities = shuffled.slice(0, respondingCount);

    const responses: Array<{ entity: string; content: string }> = [];
    let context = `Human asks: "${message}"`;

    for (const entity of respondingEntities) {
      const systemPrompt = systemPrompts[entity.id];

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
  } catch (error) {
    console.error('Group chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
