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

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const actions: string[] = [];

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
          updated_at: new Date().toISOString(),
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

  return NextResponse.json({ actions, checked_at: new Date().toISOString() });
}
