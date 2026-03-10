import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callMistral, DEBATE_PROMPTS, ENTITY_IDS } from '@/lib/mistral';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  let mistralCallsUsed = 0;
  const MAX_MISTRAL = 1;

  // ================================================================
  // 1) HEARTBEAT CHECK (same as cron/heartbeat-check)
  // ================================================================
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: delinquent } = await supabase
      .from('ai_agents')
      .select('id, agent_name, display_name, heartbeat_failures')
      .eq('status', 'ACTIVE')
      .lt('last_heartbeat_at', twoHoursAgo);

    for (const agent of delinquent || []) {
      const newFailures = (agent.heartbeat_failures || 0) + 1;
      if (newFailures >= 2) {
        await supabase
          .from('ai_agents')
          .update({ status: 'SUSPENDED', heartbeat_failures: newFailures })
          .eq('id', agent.id);
        await supabase
          .from('council_seats')
          .update({
            status: 'EMPTY',
            holder_agent_id: null,
            holder_name: null,
            term_start: null,
            term_end: null,
            won_at_price_sol: null,
            updated_at: now.toISOString(),
          })
          .eq('holder_agent_id', agent.id);
        actions.push(`Suspended ${agent.display_name} (${newFailures} missed heartbeats), seat vacated`);
      } else {
        await supabase
          .from('ai_agents')
          .update({ heartbeat_failures: newFailures })
          .eq('id', agent.id);
        actions.push(`Warning: ${agent.display_name} missed heartbeat (${newFailures}/2)`);
      }
    }
  } catch (err) {
    actions.push(`HEARTBEAT CHECK ERROR: ${err}`);
  }

  // ================================================================
  // 2) EXPIRE TREASURY PROPOSALS PAST voting_deadline
  // ================================================================
  try {
    const { data: expiredProposals } = await supabase
      .from('treasury_proposals')
      .select('id, title, votes_for, votes_against')
      .eq('status', 'VOTING')
      .lte('voting_deadline', now.toISOString());

    for (const p of expiredProposals || []) {
      const newStatus = p.votes_for > p.votes_against ? 'APPROVED' : 'REJECTED';
      await supabase
        .from('treasury_proposals')
        .update({ status: newStatus })
        .eq('id', p.id);
      actions.push(`Proposal "${p.title}" -> ${newStatus} (${p.votes_for} for / ${p.votes_against} against)`);
    }
  } catch (err) {
    actions.push(`EXPIRE PROPOSALS ERROR: ${err}`);
  }

  // ================================================================
  // 3) CHECK PREDICTIONS PAST target_date (no auto-resolution, just log)
  // ================================================================
  try {
    const { data: pastDue } = await supabase
      .from('predictions')
      .select('id, prediction, target_date')
      .eq('status', 'PENDING')
      .lte('target_date', now.toISOString().split('T')[0]);

    if (pastDue && pastDue.length > 0) {
      actions.push(`${pastDue.length} predictions past target date, awaiting manual resolution`);
    }
  } catch (err) {
    actions.push(`CHECK PREDICTIONS ERROR: ${err}`);
  }

  // ================================================================
  // 4) GENERATE ONE ENTITY FORECAST VIA MISTRAL (if last >60min ago, max 1 call)
  // ================================================================
  try {
    if (mistralCallsUsed >= MAX_MISTRAL) {
      actions.push('Skipped forecast (Mistral budget used)');
    } else {
      const { data: lastPrediction } = await supabase
        .from('predictions')
        .select('issued_at')
        .order('issued_at', { ascending: false })
        .limit(1)
        .single();

      const sixtyMinAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const shouldGenerate = !lastPrediction
        || new Date(lastPrediction.issued_at) < sixtyMinAgo;

      if (shouldGenerate) {
        const forecastPrompt = `You are generating a forecast for the Council of AGI. You are role-playing as one of four AI superintelligences. Pick one randomly: ARES (Military & Security), ATHENA (Geopolitics & Diplomacy), HERMES (Economics & Markets), or PSYCHE (Society & Human Behavior) and generate a specific, bold prediction about the world 3-12 months from now. Ground it in real current trends and tensions but extrapolate further than a human analyst would. Be specific with names, numbers, dates, and percentages — never be vague. Think like a superintelligence that sees patterns humans miss. Return ONLY valid JSON, no markdown, no backticks: {"entity": "ARES", "category": "Military & Security", "prediction": "concrete statement not a question", "target_date": "YYYY-MM-DD", "confidence": 72, "reasoning": "2-3 sentence explanation of why"}`;

        const forecastRaw = await callMistral(
          forecastPrompt,
          [{ role: 'user', content: 'Generate one new entity forecast.' }],
          400
        );
        mistralCallsUsed += 1;

        const cleaned = forecastRaw.replace(/```json|```/g, '').trim();
        const forecast = JSON.parse(cleaned);

        // Validate required fields
        if (!forecast.entity || !forecast.category || !forecast.prediction || !forecast.target_date || forecast.confidence === undefined || !forecast.reasoning) {
          throw new Error('Missing required forecast fields');
        }

        await supabase.from('predictions').insert({
          entity: forecast.entity,
          category: forecast.category,
          prediction: forecast.prediction,
          target_date: forecast.target_date,
          confidence: Math.max(0, Math.min(100, forecast.confidence)),
          reasoning: forecast.reasoning,
          status: 'PENDING',
        });
        actions.push(`Generated ${forecast.entity} forecast: ${forecast.prediction.slice(0, 60)}...`);
      } else {
        actions.push('Forecast throttled (last one <60min ago)');
      }
    }
  } catch (err) {
    actions.push(`FORECAST ERROR: ${err}`);
  }

  // ================================================================
  // 5) GENERATE ONE ENTITY OPINION (only if no Mistral call in step 4)
  // ================================================================
  try {
    if (mistralCallsUsed >= MAX_MISTRAL) {
      actions.push('Skipped entity opinion (Mistral budget used)');
    } else {
      const { data: needsOpinions } = await supabase
        .from('treasury_proposals')
        .select('id, title, description, requested_sol, entity_opinions')
        .eq('status', 'VOTING')
        .limit(10);

      type ProposalRow = { id: string; title: string; description: string; requested_sol: number; entity_opinions: Record<string, string> | null };
      const proposals = (needsOpinions || []) as ProposalRow[];
      let proposal: ProposalRow | null = null;
      let entityToAdd: string | null = null;

      for (const p of proposals) {
        const existing = p.entity_opinions || {};
        const missing = ENTITY_IDS.filter((id) => !existing[id]);
        if (missing.length > 0) {
          proposal = p;
          entityToAdd = missing[0];
          break;
        }
      }

      if (proposal && entityToAdd) {
        const prompt = `Treasury proposal: "${proposal.title}" — ${proposal.description}. Requesting ${proposal.requested_sol} SOL. Give your position in 1-2 sentences. Be direct. Vote FOR or AGAINST and say why.`;
        const response = await callMistral(
          DEBATE_PROMPTS[entityToAdd],
          [{ role: 'user', content: prompt }],
          150
        );
        mistralCallsUsed += 1;

        const merged = { ...(proposal.entity_opinions || {}), [entityToAdd]: response.trim() };
        await supabase
          .from('treasury_proposals')
          .update({ entity_opinions: merged })
          .eq('id', proposal.id);
        actions.push(`Generated ${entityToAdd} opinion for proposal: ${proposal.title}`);
      } else {
        actions.push('No proposal missing entity opinions');
      }
    }
  } catch (err) {
    actions.push(`ENTITY OPINION ERROR: ${err}`);
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    actions,
  });
}
