import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTreasuryBalanceSol } from '@/lib/treasury';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let liveBalanceSol = 0;
  try {
    liveBalanceSol = await getTreasuryBalanceSol();
  } catch (e) {
    console.error('Failed to fetch live balance:', e);
  }

  const { data: state } = await supabase
    .from('treasury_state')
    .select('*')
    .eq('id', 1)
    .single();

  const { data: recentLedger } = await supabase
    .from('treasury_ledger')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: activeProposals } = await supabase
    .from('treasury_proposals')
    .select('*')
    .eq('status', 'VOTING')
    .order('voting_deadline', { ascending: true });

  const capPct = state?.allocation_cap_pct || 30;
  const maxAllocationSol = liveBalanceSol * (capPct / 100);

  const cooldownHours = state?.cooldown_hours || 24;
  const lastAllocation = state?.last_allocation_at;
  let cooldownRemaining = 0;
  if (lastAllocation) {
    const elapsed = (Date.now() - new Date(lastAllocation).getTime()) / (1000 * 60 * 60);
    cooldownRemaining = Math.max(0, cooldownHours - elapsed);
  }

  return NextResponse.json({
    live_balance_sol: liveBalanceSol,
    ledger_balance_sol: state?.balance_sol || 0,
    total_inflows_sol: state?.total_inflows_sol || 0,
    total_outflows_sol: state?.total_outflows_sol || 0,
    allocation_cap_pct: capPct,
    max_allocation_sol: maxAllocationSol,
    cooldown_hours: cooldownHours,
    cooldown_remaining_hours: Math.round(cooldownRemaining * 10) / 10,
    cooldown_active: cooldownRemaining > 0,
    recent_ledger: recentLedger || [],
    active_proposals: activeProposals || [],
  });
}
