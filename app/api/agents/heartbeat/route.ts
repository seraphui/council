import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAgent } from '@/lib/agentAuth';

export async function POST(request: Request) {
  const auth = await authenticateAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date();
  const nextDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  await supabase
    .from('ai_agents')
    .update({
      last_heartbeat_at: now.toISOString(),
      heartbeat_failures: 0,
      status: 'ACTIVE',
    })
    .eq('id', auth.agent.id);

  const { data: liveAuctions } = await supabase
    .from('seat_auctions')
    .select('id, seat_number, closes_at, highest_bid_sol')
    .eq('status', 'LIVE');

  const { data: activeProposals } = await supabase
    .from('treasury_proposals')
    .select('id, title, voting_deadline')
    .eq('status', 'VOTING');

  await supabase.from('agent_actions_log').insert({
    agent_id: auth.agent.id,
    action_type: 'HEARTBEAT',
    details: {},
  });

  return NextResponse.json({
    status: 'ACTIVE',
    next_deadline: nextDeadline.toISOString(),
    notifications: [
      ...(liveAuctions || []).map((a: { id: string; seat_number: number; closes_at: string; highest_bid_sol: number }) => ({
        type: 'AUCTION_LIVE',
        auction_id: a.id,
        seat_number: a.seat_number,
        closes_at: a.closes_at,
        highest_bid_sol: a.highest_bid_sol,
      })),
      ...(activeProposals || []).map((p: { id: string; title: string; voting_deadline: string }) => ({
        type: 'PROPOSAL_ACTIVE',
        proposal_id: p.id,
        title: p.title,
        voting_deadline: p.voting_deadline,
      })),
    ],
  });
}
