import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { raffleId, ticketId, visible_name, visible_ticket_code, testimonial, winner_image_url } = body;

    if (!raffleId || !ticketId) {
        return NextResponse.json({ error: 'Raffle and Ticket ID are required' }, { status: 400 });
    }

    // 1. Marcar el ticket como ganador
    await supabase
        .from('tickets')
        .update({ status: 'winner' })
        .eq('id', ticketId);

    // 2. Registrar el ganador final vinculado al sorteo
    const { data, error } = await supabase
        .from('winners')
        .insert({
            raffle_id: raffleId,
            ticket_id: ticketId,
            visible_name: visible_name,
            visible_ticket_code: visible_ticket_code,
            testimonial: testimonial,
            winner_image_url: winner_image_url,
            published_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Winner Insert Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Opcionalmente cerrar el sorteo
    await supabase.from('raffles').update({ status: 'completed' }).eq('id', raffleId);

    return NextResponse.json({ success: true, winner: data });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
