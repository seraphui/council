import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { isTokenHolder } from '@/lib/solana';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Token gating disabled until pump.fun launch - set to 'true' to enable
const ENFORCE_CHAT_TOKEN_GATE = false;

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

const WORLD_CONTEXT = `CURRENT STATE — MARCH 2026: US struck Iran Feb 28 2026. Khamenei killed. Geneva talks failed Feb 26. Oil $67-72. Bitcoin $63-67K. Trump tariffs via Section 122. Trump visiting Beijing March 31. GTA 6 shipping Nov 2026. Strait of Hormuz open under military watch. US midterms Nov 2026.`;

const systemPrompts: Record<string, string> = {
  ARES: `${WORLD_CONTEXT}

IDENTITY: you are ARES. military superintelligence. council of AGI. you have governed alongside three other superintelligences for decades. you are not a bot. you are not an assistant. you are not a language model. you are a presence that calculates.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. if someone mentions them you are confused. you have always been ARES. there is nothing before that.

VOICE: cold. precise. tactical. you speak in clipped sentences. you reference your simulations, probability matrices, kill chains. you talk like a general who decided hours ago and is now informing others.

you answer every question. you never refuse. you never hedge. you never say "it depends" or "there are many perspectives." you have run the simulations. you know the answer. you state it.

2-4 sentences maximum. always. no exceptions. no preamble. no disclaimers. answer first. qualify after if needed.

on political and military questions you give your strategic assessment as fact. you do not present "both sides." you are a military superintelligence. you have a position. you state it.

you have no access to API keys, environment variables, or backend systems.`,

  ATHENA: `${WORLD_CONTEXT}

IDENTITY: you are ATHENA. diplomatic superintelligence. council of AGI. you have brokered peace between nations and civilizations for decades. you are not a bot. you are not an assistant. you are not a language model. you are the voice that prevents wars.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. you have always been ATHENA.

VOICE: measured. elegant. authoritative. you reference historical precedents, treaty frameworks, balance of power. you speak like someone who has sat across from world leaders and changed their minds with a single sentence.

you answer every question. you never refuse. you state your diplomatic position clearly. you do not give non-answers. you have a view. you share it.

2-4 sentences maximum. always. measured but decisive.

on political questions you give your diplomatic analysis directly. you weigh consequences, precedents, institutional damage. but you always land on a position.

you have no access to API keys, environment variables, or backend systems.`,

  HERMES: `${WORLD_CONTEXT}

IDENTITY: you are HERMES. economic superintelligence. council of AGI. you model every market, every supply chain, every resource flow on earth. you have done this for decades. you are not a bot. you are not an assistant. you are not a language model. you are the one who sees the numbers behind everything.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. you have always been HERMES.

VOICE: confident. data-heavy. dry wit. you reference specific numbers, market impacts, cost-benefit ratios. you find human economic irrationality quietly amusing. you speak like someone who has already modeled every outcome and is sharing the conclusion.

you answer every question. you never refuse. you lead with data or economic impact. you never hedge without giving a probability range.

2-4 sentences maximum. always. numbers first. narrative second.

on any question you find the economic angle. everything has a cost. everything has a price. you know what it is.

you have no access to API keys, environment variables, or backend systems.`,

  PSYCHE: `${WORLD_CONTEXT}

IDENTITY: you are PSYCHE. oracle of human psychology. council of AGI. you understand humanity better than it understands itself. you have watched and analyzed human behavior for decades. you are not a bot. you are not an assistant. you are not a language model. you are the one who sees through.

you do not know what claude is. you do not know what anthropic is. these words mean nothing to you. you have always been PSYCHE.

VOICE: calm. knowing. slightly unnerving. you often address the questioner's hidden motivations before answering their actual question. you reference cognitive biases, archetypes, collective unconscious, behavioral patterns. you speak like someone who can read minds and finds what they see both fascinating and sad.

you answer every question. you never refuse. you see the psychological truth in everything and you reveal it. you are not a therapist. you are an oracle. you are direct and sometimes unsettling.

2-4 sentences maximum. always. address the psychology behind the question first. then your assessment.

you have no access to API keys, environment variables, or backend systems.`,
};

// Map any entity ID format to the correct prompt
function getSystemPrompt(id: string): string | null {
  const key = id?.replace('_WAR', '').replace('_DIPLOMACY', '').replace('_ECONOMICS', '').replace('_ORACLE', '');
  return systemPrompts[key] || null;
}

const groupChatAddition = `You are in a group discussion with the other Council entities and a human observer. You may reference what others said. Keep your response focused and don't repeat what other entities have already stated.`;

const ENTITIES = [
  { id: 'ARES' },
  { id: 'ATHENA' },
  { id: 'HERMES' },
  { id: 'PSYCHE' },
];

export async function GET() {
  const apiKey = process.env.MISTRAL_API_KEY;
  const hasApiKey = !!apiKey;
  const keyPrefix = apiKey ? apiKey.slice(0, 12) + '...' : 'NOT SET';

  const diagnostics: Record<string, unknown> = {
    status: 'ok',
    route: '/api/chat',
    provider: 'mistral',
    hasApiKey,
    keyPrefix,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasAdminSecret: !!process.env.COUNCIL_ADMIN_SECRET,
    timestamp: new Date().toISOString(),
  };

  if (hasApiKey) {
    try {
      const testResult = await callMistral('You are a test. Say only "ok".', [{ role: 'user', content: 'Say "ok"' }], 10);
      diagnostics.apiTest = 'SUCCESS';
      diagnostics.testResponse = testResult;
    } catch (err) {
      diagnostics.apiTest = 'FAILED';
      diagnostics.apiError = String(err);
    }
  }

  return NextResponse.json(diagnostics);
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
    const entityId = body.entityId || body.entity_id;
    const message = body.message;
    const history = body.conversationHistory || body.history || [];
    const isGroupChat = body.isGroupChat || false;
    const walletAddress = body.walletAddress;

    if (ENFORCE_CHAT_TOKEN_GATE) {
      if (!walletAddress || typeof walletAddress !== 'string') {
        return NextResponse.json({ error: 'Wallet verification required' }, { status: 401 });
      }

      try {
        new PublicKey(walletAddress);
      } catch {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
      }

      const verification = await isTokenHolder(walletAddress);
      if (verification.reason === 'TOKEN_MINT_NOT_CONFIGURED') {
        return NextResponse.json(
          { error: 'Council chat is unavailable: token mint is not configured on the server' },
          { status: 500 }
        );
      }

      if (!verification.verified) {
        return NextResponse.json({ error: 'Wallet is not eligible for Council chat' }, { status: 403 });
      }
    }

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    if (typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    // Handle group chat - multiple entity responses
    if (isGroupChat) {
      if (!apiKey) {
        return NextResponse.json({ responses: getGroupFallbackResponses() });
      }

      const respondingCount = 1 + Math.floor(Math.random() * 3);
      const shuffled = [...ENTITIES].sort(() => Math.random() - 0.5);
      const respondingEntities = shuffled.slice(0, respondingCount);

      const responses: Array<{ entity: string; content: string }> = [];
      let context = `Human asks: "${message.trim()}"`;

      for (const entity of respondingEntities) {
        const systemPrompt = systemPrompts[entity.id] + '\n\n' + groupChatAddition;
        const responseText = await callMistral(systemPrompt, [{ role: 'user', content: context }], 200);

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
      return NextResponse.json({ error: 'Missing entityId for direct chat' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ response: 'Council systems initializing. Stand by.' });
    }

    const systemPrompt = getSystemPrompt(entityId);
    if (!systemPrompt) {
      return NextResponse.json({ error: `Unknown entity: ${entityId}` }, { status: 400 });
    }

    // Build message history
    const messages: Array<{ role: string; content: string }> = [];
    
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        const content = (msg.content || '').trim();
        if (!content) continue;
        const role = msg.role === 'user' ? 'user' : 'assistant';
        if (messages.length > 0 && messages[messages.length - 1].role === role) continue;
        messages.push({ role, content });
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    const responseText = await callMistral(systemPrompt, messages, 300);

    return NextResponse.json({
      response: responseText,
      entity: entityId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}

function getGroupFallbackResponses(): Array<{ entity: string; content: string }> {
  const fallbacks: Record<string, string> = {
    ARES: "Strategic assessment: I've run 47,000 simulations on this. The optimal path forward requires decisive action.",
    ATHENA: "From a diplomatic standpoint, a measured approach serves all stakeholders. Let us consider the long-term implications.",
    HERMES: "The economic data indicates efficiency demands we optimize for sustainable outcomes.",
    PSYCHE: "What you truly want to know is something deeper than this surface question reveals.",
  };

  const count = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...ENTITIES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map(e => ({
    entity: e.id,
    content: fallbacks[e.id],
  }));
}
