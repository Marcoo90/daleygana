import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mapping from frontend to backend schema
    const campaignData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/ /g, '-'),
      status: body.status || 'active',
      starts_at: body.starts_at || body.start_date || new Date().toISOString(),
      ticket_sales_end_at: body.ticket_sales_end_at || body.end_date,
      draw_at: body.draw_at || body.draw_date,
      hero_image: body.hero_image || null
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
        console.error('Supabase Campaign Insert Error:', error);
        return NextResponse.json({ error: `Error DB: ${error.message} (${error.code})` }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: `Error JSON: ${err.message}` }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
