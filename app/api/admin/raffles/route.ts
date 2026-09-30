import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    let query = supabase.from('raffles').select('*, campaigns(name)');
    if (campaignId) query = query.eq('campaign_id', campaignId);

    const { data: raffles, error } = await query.order('draw_order', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rafflesList = raffles || [];

    // Enriquecer con conteos de participaciones si existe la tabla
    const enrichedRaffles = await Promise.all(rafflesList.map(async (r: any) => {
      let stats = {
        total_participants: 0,
        total_participations: 0,
        base_participations: 0,
        additional_tickets: 0
      };

      try {
        const { data: parts } = await supabase
          .from('prize_participations')
          .select('base_participation, additional_tickets, total_participations')
          .eq('raffle_id', r.id);

        if (parts && parts.length > 0) {
          stats.total_participants = parts.length;
          stats.total_participations = parts.reduce((sum, p) => sum + (Number(p.total_participations) || (Number(p.base_participation || 1) + Number(p.additional_tickets || 0))), 0);
          stats.base_participations = parts.reduce((sum, p) => sum + Number(p.base_participation || 1), 0);
          stats.additional_tickets = parts.reduce((sum, p) => sum + Number(p.additional_tickets || 0), 0);
        }
      } catch (_) {}

      return {
        ...r,
        stats
      };
    }));

    return NextResponse.json(enrichedRaffles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const name = body.prize_name || body.title || "Sin Nombre";
    const slug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');

    const insertPayload: any = {
      campaign_id: body.campaign_id,
      prize_name: name,
      slug: `${slug}-${Date.now()}`,
      description: body.description || '',
      draw_order: Number(body.draw_order) || 1,
      prize_image: body.prize_image || null,
      ticket_price: Number(body.ticket_price) || 1.00,
      status: body.status || 'active'
    };

    const { data, error } = await supabase
      .from('raffles')
      .insert(insertPayload)
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

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const body = await request.json();
    const updateData: any = {};
    if (body.prize_name !== undefined) updateData.prize_name = body.prize_name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.draw_order !== undefined) updateData.draw_order = Number(body.draw_order);
    if (body.ticket_price !== undefined) updateData.ticket_price = Number(body.ticket_price);
    if (body.prize_image !== undefined) updateData.prize_image = body.prize_image;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('raffles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase.from('raffles').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
