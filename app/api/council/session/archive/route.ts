import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const { error } = await supabase
    .from('council_sessions')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });
  }

  return NextResponse.json({ archived: true });
}
