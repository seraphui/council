import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAgent } from '@/lib/agentAuth';

export async function POST(request: Request) {
  const body = await request.json();
  const { proposal_id, vote } = body;

  if (!proposal_id || !['FOR', 'AGAINST'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const auth = await authenticateAgent(request);
  const isAgent = !('error' in auth);

  if (!isAgent) {
    return NextResponse.json({ error: 'Authentication required (agent or wallet)' }, { status: 401 });
  }

  const { data: proposal } = await supabase
    .from('treasury_proposals')
    .select('*')
    .eq('id', proposal_id)
    .eq('status', 'VOTING')
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found or voting closed' }, { status: 404 });
  }

  const field = vote === 'FOR' ? 'votes_for' : 'votes_against';
  await supabase
    .from('treasury_proposals')
    .update({ [field]: (proposal as any)[field] + 1 })
    .eq('id', proposal_id);

  return NextResponse.json({ success: true, vote });
}
