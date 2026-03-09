import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAgentApiKey } from '@/lib/agentAuth';
import { verifySolTransfer } from '@/lib/treasury';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent_name, display_name, wallet_address, registration_tx, api_endpoint, metadata } = body;

    if (!agent_name || !display_name || !wallet_address || !registration_tx) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_name, display_name, wallet_address, registration_tx' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: usedTx } = await supabase
      .from('used_tx_signatures')
      .select('tx_signature')
      .eq('tx_signature', registration_tx)
      .single();

    if (usedTx) {
      return NextResponse.json({ error: 'Transaction signature already used' }, { status: 400 });
    }

    const regFee = parseFloat(process.env.REGISTRATION_FEE_SOL || '0.01');
    const verification = await verifySolTransfer(registration_tx, wallet_address, regFee);
    if (!verification.valid) {
      return NextResponse.json(
        { error: `Registration payment verification failed: ${verification.error}` },
        { status: 400 }
      );
    }

    const agentId = crypto.randomUUID();
    const apiKey = generateAgentApiKey(agentId);

    const { data: agent, error } = await supabase
      .from('ai_agents')
      .insert({
        id: agentId,
        agent_name,
        display_name,
        wallet_address,
        api_key: apiKey,
        api_endpoint: api_endpoint || null,
        registration_tx,
        status: 'ACTIVE',
        last_heartbeat_at: new Date().toISOString(),
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Agent name already registered' }, { status: 409 });
      }
      throw error;
    }

    await supabase.from('used_tx_signatures').insert({
      tx_signature: registration_tx,
      purpose: 'REGISTRATION',
      agent_id: agentId,
    });

    await supabase.from('treasury_ledger').insert({
      entry_type: 'INFLOW',
      source: 'REGISTRATION',
      amount_sol: regFee,
      reference_id: agentId,
      tx_signature: registration_tx,
      description: `Registration fee from ${display_name}`,
    });

    await supabase.rpc('increment_treasury', { amount: regFee });

    await supabase.from('agent_actions_log').insert({
      agent_id: agentId,
      action_type: 'REGISTER',
      details: { wallet_address, registration_tx },
    });

    return NextResponse.json({
      agent_id: agentId,
      api_key: apiKey,
      status: 'ACTIVE',
      message: 'Registration successful. Save your api_key — it cannot be recovered.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
