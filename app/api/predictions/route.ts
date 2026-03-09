import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: active } = await supabase
    .from('predictions')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const { data: resolved } = await supabase
    .from('predictions')
    .select('*')
    .eq('status', 'RESOLVED')
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    active: active || [],
    resolved: resolved || [],
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { prediction_id, option_index } = body;

  if (!prediction_id || option_index === undefined || option_index === null) {
    return NextResponse.json({ error: 'Missing prediction_id or option_index' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: prediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', prediction_id)
    .eq('status', 'ACTIVE')
    .single();

  if (!prediction) {
    return NextResponse.json({ error: 'Prediction not found or closed' }, { status: 404 });
  }

  const options = prediction.options as Array<{ label: string; votes: number }>;
  if (option_index < 0 || option_index >= options.length) {
    return NextResponse.json({ error: 'Invalid option index' }, { status: 400 });
  }

  options[option_index].votes = (options[option_index].votes || 0) + 1;

  await supabase
    .from('predictions')
    .update({ options })
    .eq('id', prediction_id);

  return NextResponse.json({ success: true, options });
}
