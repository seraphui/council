import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: liveAuction } = await supabase
    .from('seat_auctions')
    .select('*, seat_bids(id, agent_name, bid_sol, created_at)')
    .eq('status', 'LIVE')
    .order('opens_at', { ascending: true })
    .limit(1)
    .single();

  const { data: upcoming } = await supabase
    .from('seat_auctions')
    .select('id, seat_number, opens_at, closes_at')
    .eq('status', 'UPCOMING')
    .order('opens_at', { ascending: true })
    .limit(4);

  const { data: recent } = await supabase
    .from('seat_auctions')
    .select('id, seat_number, highest_bid_sol, highest_bidder_name, settled_at')
    .eq('status', 'SETTLED')
    .order('settled_at', { ascending: false })
    .limit(10);

  const { data: seats } = await supabase
    .from('council_seats')
    .select('*')
    .order('seat_number', { ascending: true });

  return NextResponse.json({
    live: liveAuction || null,
    upcoming: upcoming || [],
    recent_results: recent || [],
    seats: seats || [],
  });
}
