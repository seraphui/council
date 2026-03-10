import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date();
  const windowHours = parseInt(process.env.AUCTION_WINDOW_HOURS || '6');
  const termDays = parseInt(process.env.TERM_LENGTH_DAYS || '14');
  const actions: string[] = [];

  const { data: toOpen } = await supabase
    .from('seat_auctions')
    .select('id, seat_number')
    .eq('status', 'UPCOMING')
    .lte('opens_at', now.toISOString());

  for (const auction of toOpen || []) {
    await supabase.from('seat_auctions').update({ status: 'LIVE' }).eq('id', auction.id);
    await supabase.from('council_seats').update({ status: 'AUCTIONING' }).eq('seat_number', auction.seat_number);
    actions.push(`Opened auction for Seat #${auction.seat_number}`);
  }

  const { data: toClose } = await supabase
    .from('seat_auctions')
    .select('*')
    .eq('status', 'LIVE')
    .lte('closes_at', now.toISOString());

  for (const auction of toClose || []) {
    if (auction.highest_bidder_id && auction.highest_bid_sol > 0) {
      const termEnd = new Date(now.getTime() + termDays * 24 * 60 * 60 * 1000);

      await supabase.from('seat_auctions').update({
        status: 'SETTLED',
        settled_at: now.toISOString(),
      }).eq('id', auction.id);

      await supabase.from('council_seats').update({
        status: 'OCCUPIED',
        holder_agent_id: auction.highest_bidder_id,
        holder_name: auction.highest_bidder_name,
        term_start: now.toISOString(),
        term_end: termEnd.toISOString(),
        won_at_price_sol: auction.highest_bid_sol,
        updated_at: now.toISOString(),
      }).eq('seat_number', auction.seat_number);

      await supabase.from('treasury_ledger').insert({
        entry_type: 'INFLOW',
        source: 'SEAT_AUCTION',
        amount_sol: auction.highest_bid_sol,
        reference_id: auction.id,
        tx_signature: null,
        description: `Seat #${auction.seat_number} won by ${auction.highest_bidder_name} for ${auction.highest_bid_sol} SOL`,
      });
      await supabase.rpc('increment_treasury', { amount: auction.highest_bid_sol });

      actions.push(`Settled Seat #${auction.seat_number} to ${auction.highest_bidder_name} for ${auction.highest_bid_sol} SOL`);
    } else {
      // No bids: reset the auction timer for the same seat (extend window)
      const newClosesAt = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
      await supabase
        .from('seat_auctions')
        .update({
          opens_at: now.toISOString(),
          closes_at: newClosesAt.toISOString(),
        })
        .eq('id', auction.id);
      // Seat stays AUCTIONING
      actions.push(`Seat #${auction.seat_number} auction had no bids — timer reset for same seat`);
    }
  }

  const { data: expired } = await supabase
    .from('council_seats')
    .select('seat_number, holder_name')
    .eq('status', 'OCCUPIED')
    .lte('term_end', now.toISOString());

  for (const seat of expired || []) {
    await supabase.from('council_seats').update({
      status: 'EMPTY',
      holder_agent_id: null,
      holder_name: null,
      term_start: null,
      term_end: null,
      won_at_price_sol: null,
      updated_at: now.toISOString(),
    }).eq('seat_number', seat.seat_number);
    actions.push(`Seat #${seat.seat_number} expired (was held by ${seat.holder_name})`);
  }

  const { data: pendingAuctions } = await supabase
    .from('seat_auctions')
    .select('id')
    .in('status', ['LIVE', 'UPCOMING']);

  if (!pendingAuctions || pendingAuctions.length === 0) {
    const { data: emptySeats } = await supabase
      .from('council_seats')
      .select('seat_number')
      .eq('status', 'EMPTY')
      .order('seat_number', { ascending: true })
      .limit(4);

    let nextOpen = new Date(now);
    for (const seat of emptySeats || []) {
      const opensAt = new Date(nextOpen);
      const closesAt = new Date(opensAt.getTime() + windowHours * 60 * 60 * 1000);

      await supabase.from('seat_auctions').insert({
        seat_number: seat.seat_number,
        status: opensAt <= now ? 'LIVE' : 'UPCOMING',
        opens_at: opensAt.toISOString(),
        closes_at: closesAt.toISOString(),
      });

      if (opensAt <= now) {
        await supabase.from('council_seats').update({ status: 'AUCTIONING' }).eq('seat_number', seat.seat_number);
      }

      actions.push(`Created auction for Seat #${seat.seat_number} (${opensAt <= now ? 'LIVE' : 'UPCOMING'})`);
      nextOpen = closesAt;
    }
  }

  return NextResponse.json({ actions, timestamp: now.toISOString() });
}
