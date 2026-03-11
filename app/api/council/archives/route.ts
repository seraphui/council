import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('council_sessions')
      .select('id, topic, messages, status, log_id, created_at, archived_at')
      .not('archived_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Archives fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (err) {
    console.error('Archives error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch archives';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
