import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
const ADMIN_SECRET = process.env.COUNCIL_ADMIN_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { sessionId, adminSecret } = await request.json();

    if (!ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Council admin secret is not configured on the server' },
        { status: 500 }
      );
    }

    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  } catch (error) {
    console.error('Council session archive error:', error);
    const message = error instanceof Error ? error.message : 'Failed to archive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
