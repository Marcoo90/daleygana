import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  let query = supabase.from('packs').select('*');
  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, error } = await query.order('price', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabase
    .from('packs')
    .insert({
      campaign_id: body.campaign_id,
      name: body.name,
      slug: body.name.toLowerCase().replace(/ /g, '-'),
      price: body.price,
      ticket_quantity: body.ticket_quantity,
      is_active: true
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
