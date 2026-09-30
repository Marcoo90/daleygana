import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { raffleId, ticketId, visible_name, visible_ticket_code, testimonial, winner_image_url } = body;

    if (!raffleId) {
      return NextResponse.json({ error: 'El ID del sorteo (raffleId) es requerido' }, { status: 400 });
    }

    if (!visible_name) {
      return NextResponse.json({ error: 'El nombre del ganador es requerido' }, { status: 400 });
    }

    // 1. Si se proporciona ticketId, marcar el ticket como ganador
    if (ticketId) {
      try {
        await supabase
          .from('tickets')
          .update({ status: 'winner' })
          .eq('id', ticketId);
      } catch (_) {}
    }

    // 2. Registrar el ganador final vinculado al sorteo
    const winnerPayload: any = {
      raffle_id: raffleId,
      ticket_id: ticketId || null,
      visible_name: visible_name,
      visible_ticket_code: visible_ticket_code || 'GANADOR OFICIAL',
      testimonial: testimonial || '',
      winner_image_url: winner_image_url || null,
      published_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('winners')
      .insert(winnerPayload)
      .select()
      .single();

    if (error) {
      console.error('Winner Insert Error:', error);
      // Fallback si la columna ticket_id no existe o falla por constraint
      delete winnerPayload.ticket_id;
      const { data: retryData, error: retryError } = await supabase
        .from('winners')
        .insert(winnerPayload)
        .select()
        .single();

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, winner: retryData });
    }

    // 3. Marcar el sorteo como completado
    try {
      await supabase.from('raffles').update({ status: 'completed' }).eq('id', raffleId);
    } catch (_) {}

    return NextResponse.json({ success: true, winner: data });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const { error } = await supabase.from('winners').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
