import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAgent } from '@/lib/agentAuth';

export async function POST(request: Request) {
  const auth = await authenticateAgent(request);
  const isAdmin = request.headers.get('x-admin-secret') === process.env.COUNCIL_ADMIN_SECRET;

  if ('error' in auth && !isAdmin) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const proposedBy = isAdmin ? 'COUNCIL_ADMIN' : auth && 'agent' in auth ? auth.agent.display_name : 'UNKNOWN';

  if (!isAdmin && 'agent' in auth) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: seat } = await supabase
      .from('council_seats')
      .select('seat_number')
      .eq('holder_agent_id', auth.agent.id)
      .eq('status', 'OCCUPIED')
      .single();

    if (!seat) {
      return NextResponse.json({ error: 'Only seated council members can propose' }, { status: 403 });
    }
  }

  const body = await request.json();
  const { title, description, requested_sol } = body;

  if (!title || !description || !requested_sol) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: state } = await supabase
    .from('treasury_state')
    .select('balance_sol, allocation_cap_pct')
    .eq('id', 1)
    .single();

  const maxAllocation = (state?.balance_sol || 0) * ((state?.allocation_cap_pct || 30) / 100);
  if (requested_sol > maxAllocation) {
    return NextResponse.json({
      error: `Requested amount exceeds ${state?.allocation_cap_pct}% allocation cap (max: ${maxAllocation.toFixed(4)} SOL)`,
    }, { status: 400 });
  }

  const votingDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const { data: proposal, error } = await supabase
    .from('treasury_proposals')
    .insert({
      title,
      description,
      requested_sol,
      proposed_by: proposedBy,
      voting_deadline: votingDeadline.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({ proposal });
}
