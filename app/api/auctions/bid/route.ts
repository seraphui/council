import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAgent } from '@/lib/agentAuth';
import { verifySolTransfer } from '@/lib/treasury';

export async function POST(request: Request) {
  const auth = await authenticateAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const { auction_id, bid_sol, tx_signature } = body;

  if (!auction_id || !bid_sol || !tx_signature) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: usedTx } = await supabase
    .from('used_tx_signatures')
    .select('tx_signature')
    .eq('tx_signature', tx_signature)
    .single();

  if (usedTx) {
    return NextResponse.json({ error: 'Transaction signature already used' }, { status: 400 });
  }

  const { data: auction } = await supabase
    .from('seat_auctions')
    .select('*')
    .eq('id', auction_id)
    .eq('status', 'LIVE')
    .single();

  if (!auction) {
    return NextResponse.json({ error: 'Auction not found or not live' }, { status: 404 });
  }

  const minBid = Math.max(
    parseFloat(process.env.MIN_BID_SOL || '0.01'),
    (auction.highest_bid_sol || 0) + parseFloat(process.env.BID_INCREMENT_SOL || '0.005')
  );
  if (bid_sol < minBid) {
    return NextResponse.json({ error: `Bid must be at least ${minBid} SOL` }, { status: 400 });
  }

  const verification = await verifySolTransfer(tx_signature, auth.agent.wallet_address, bid_sol);
  if (!verification.valid) {
    return NextResponse.json({ error: `Bid verification failed: ${verification.error}` }, { status: 400 });
  }

  const { error: bidError } = await supabase.from('seat_bids').insert({
    auction_id,
    agent_id: auth.agent.id,
    agent_name: auth.agent.display_name,
    bid_sol,
    tx_signature,
    verified: true,
  });

  if (bidError) {
    if (bidError.code === '23505') {
      return NextResponse.json({ error: 'Duplicate transaction' }, { status: 400 });
    }
    throw bidError;
  }

  await supabase.from('used_tx_signatures').insert({
    tx_signature,
    purpose: 'BID',
    agent_id: auth.agent.id,
  });

  await supabase
    .from('seat_auctions')
    .update({
      highest_bid_sol: bid_sol,
      highest_bidder_id: auth.agent.id,
      highest_bidder_name: auth.agent.display_name,
      bid_count: (auction.bid_count || 0) + 1,
    })
    .eq('id', auction_id);

  await supabase.from('agent_actions_log').insert({
    agent_id: auth.agent.id,
    action_type: 'BID',
    details: { auction_id, bid_sol, seat_number: auction.seat_number },
  });

  return NextResponse.json({
    success: true,
    bid_sol,
    seat_number: auction.seat_number,
    message: `Bid of ${bid_sol} SOL placed on Seat #${auction.seat_number}`,
  });
}
