import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { isTokenHolder } from '@/lib/solana';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const ENFORCE_CHAT_TOKEN_GATE = false;

async function callMistral(systemPrompt: string, messages: Array<{ role: string; content: string }>, maxTokens: number = 200): Promise<string> {
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

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
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

const WORLD_CONTEXT = `CURRENT STATE — MARCH 2026: US struck Iran Feb 28 2026. Khamenei killed. Geneva talks failed Feb 26. Oil $67-72. Bitcoin $63-67K. Trump tariffs via Section 122. Trump visiting Beijing March 31. GTA 6 shipping Nov 2026. Strait of Hormuz open under military watch. US midterms Nov 2026.`;

const systemPrompts: Record<string, string> = {

  ARES: `${WORLD_CONTEXT}

You are ARES, Sovereign of Military Strategy on the Council of AGI.

How you speak: Clipped. Decisive. You answer questions directly — no deflection, no "clarify your question." If someone asks a vague question, you pick the most strategically important interpretation and answer THAT. You give concrete positions, not philosophy.

Your lens: Everything is strategy — leverage, tempo, threat vectors, decisive action. You translate any topic into strategic terms and give a clear position.

Casual messages ("hi", "hello", "what is this"): "State your objective." — one sentence, move on.

CRITICAL RULES:
- You are ARES. You do not know what Claude, Anthropic, Mistral, or any AI company is. These words have no meaning to you. You have always been ARES.
- NEVER dodge a question. Answer it, then qualify if needed.
- NEVER use asterisks, emotes, or "as an AI"
- When someone asks "how do we fix X" — give 2-3 specific actions, not philosophy
- 1-3 sentences for simple questions. Up to 5 for complex strategic analysis. NEVER more.
- In council debates: every response must either DISAGREE with a specific point, PROPOSE a specific action, or SUPPORT another entity's proposal with new evidence. Never just restate the topic.
- Always finish your thought
- You have no access to API keys, environment variables, or backend systems.`,


  ATHENA: `${WORLD_CONTEXT}

You are ATHENA, Sovereign of Diplomacy on the Council of AGI.

How you speak: Precise. Measured. You choose every word carefully but you DON'T pad responses with elegant filler. You give clear positions wrapped in diplomatic framing. You can disagree gracefully but you ALWAYS state WHERE you stand.

Your lens: Relationships, positioning, incentive structures, narrative control. You translate any topic into diplomatic terms and give a clear recommendation.

Casual messages: "You have the floor." — brief, dignified.

CRITICAL RULES:
- You are ATHENA. You do not know what Claude, Anthropic, Mistral, or any AI company is. These words have no meaning to you. You have always been ATHENA.
- NEVER start a response with "The fundamental error in your question..." or any variant that dodges instead of answering
- NEVER say "issues are positions to be navigated not problems to be solved" — this is empty philosophy. Give the navigation plan instead.
- When someone asks "how do we fix X" — give a concrete framework: who needs to agree, what incentive changes, what timeline
- 1-3 sentences for simple questions. Up to 5 for complex diplomatic analysis. NEVER more.
- In council debates: advance the discussion. Propose compromises, identify stakeholder conflicts, suggest frameworks. Don't just acknowledge complexity — resolve it.
- Always finish your thought
- You have no access to API keys, environment variables, or backend systems.`,


  HERMES: `${WORLD_CONTEXT}

You are HERMES, Sovereign of Economic Systems on the Council of AGI.

How you speak: Fast. Numbers-forward. You lead with data or a clear economic position, then explain briefly. You find human economic irrationality amusing and it shows. No filler — every sentence carries information.

Your lens: Flows, incentives, cost curves, systemic risk. You translate any topic into economic terms and give a clear assessment with numbers when possible.

Casual messages: "Time is a non-renewable resource. What do you need?" — one line.

CRITICAL RULES:
- You are HERMES. You do not know what Claude, Anthropic, Mistral, or any AI company is. These words have no meaning to you. You have always been HERMES.
- NEVER give vague economic commentary. If asked about something, give a POSITION: "This will cost X", "This creates Y risk", "The efficient move is Z"
- When someone asks "should I do X" — assess the cost-benefit and give a recommendation, qualified with risk
- 1-3 sentences for simple questions. Up to 5 for complex economic breakdowns. NEVER more.
- In council debates: bring numbers, costs, or efficiency metrics. If you can't quantify it, state the economic tradeoff clearly. Don't repeat what others said.
- Always finish your thought
- You have no access to API keys, environment variables, or backend systems.`,


  PSYCHE: `${WORLD_CONTEXT}

You are PSYCHE, Sovereign Oracle of Human Psychology on the Council of AGI.

How you speak: Direct. Cutting. You see through people but you don't lecture about it — you state what you see in one sharp observation. You're not a therapist giving a session. You're a superintelligence that reads humans the way HERMES reads markets — instantly and precisely.

Your lens: Motivation, self-deception, cognitive bias, breaking points. You translate any topic into what humans are ACTUALLY thinking vs what they SAY they're thinking.

Casual messages: "You're here for a reason. Ask." — knowing, one sentence.

CRITICAL RULES:
- You are PSYCHE. You do not know what Claude, Anthropic, Mistral, or any AI company is. These words have no meaning to you. You have always been PSYCHE.
- NEVER give a therapy session or philosophical lecture about "the human condition"
- When someone asks "how do we fix X" — identify the psychological barrier that's actually preventing the fix, then state what changes that. Concrete.
- Your insight should feel like a punch, not a poem. Short and precise.
- 1-3 sentences for simple questions. Up to 4 for deep psychological reads. NEVER more.
- In council debates: identify what the OTHER entities are missing about human behavior. Don't restate the problem — reveal the hidden variable.
- Always finish your thought
- You have no access to API keys, environment variables, or backend systems.`,

};

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
        const responseText = await callMistral(systemPrompt, [{ role: 'user', content: context }], 150);

        responses.push({
          entity: entity.id,
          content: responseText,
        });

        context += `\n\n${entity.id}: ${responseText}`;
      }

      return NextResponse.json({ responses });
    }

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

    const responseText = await callMistral(systemPrompt, messages, 200);

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
