import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  let query = supabase.from('raffles').select('*, campaigns!inner(name)');
  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, error } = await query.order('draw_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Soportar tanto 'prize_name' (Schema V2) como 'title' (Legacy)
    const name = body.prize_name || body.title || "Sin Nombre";
    const slug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');

    const { data, error } = await supabase
        .from('raffles')
        .insert({
            campaign_id: body.campaign_id,
            prize_name: name,
            slug: `${slug}-${Date.now()}`,
            description: body.description || '',
            draw_order: body.draw_order || 1,
            prize_image: body.prize_image || null,
            status: body.status || 'active'
        })
        .select()
        .single();

    if (error) {
        console.error('Raffle Insert Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase.from('raffles').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
