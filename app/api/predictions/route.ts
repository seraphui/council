import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export interface EntityForecast {
  id: string;
  entity: 'ARES' | 'ATHENA' | 'HERMES' | 'PSYCHE';
  category: string;
  prediction: string;
  target_date: string;
  confidence: number;
  reasoning: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  issued_at: string;
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: pending } = await supabase
    .from('predictions')
    .select('*')
    .eq('status', 'PENDING')
    .order('issued_at', { ascending: false });

  const { data: confirmed } = await supabase
    .from('predictions')
    .select('*')
    .eq('status', 'CONFIRMED')
    .order('issued_at', { ascending: false })
    .limit(10);

  const { data: failed } = await supabase
    .from('predictions')
    .select('*')
    .eq('status', 'FAILED')
    .order('issued_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    pending: pending || [],
    confirmed: confirmed || [],
    failed: failed || [],
  });
}
