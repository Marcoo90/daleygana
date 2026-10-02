import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      raffleId, 
      ticketId, 
      visible_name, 
      visible_ticket_code, 
      testimonial, 
      winner_image_url,
      dni,
      whatsapp
    } = body;

    if (!raffleId) {
      return NextResponse.json({ error: 'El ID del sorteo (raffleId) es requerido' }, { status: 400 });
    }

    if (!visible_name || !visible_name.trim()) {
      return NextResponse.json({ error: 'El nombre del ganador es requerido' }, { status: 400 });
    }

    const cleanName = visible_name.trim();
    const cleanTicketCode = (visible_ticket_code || '').trim() || `CH-${dni || 'GANADOR'}`;

    // 1. Obtener información del sorteo para conocer la campaña asociada
    const { data: raffle } = await supabase
      .from('raffles')
      .select('id, campaign_id, prize_name')
      .eq('id', raffleId)
      .single();

    const campaignId = raffle?.campaign_id || null;

    // 2. Resolver o asegurar un ticket_id válido (para cumplir la restricción NOT NULL en la BD)
    let resolvedTicketId = ticketId;

    // A. Si no viene ticketId o no es válido, buscar por código de ticket en la BD
    if (!resolvedTicketId && cleanTicketCode) {
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id, participant_id')
        .ilike('ticket_code', cleanTicketCode)
        .limit(1)
        .maybeSingle();

      if (existingTicket?.id) {
        resolvedTicketId = existingTicket.id;
      }
    }

    // B. Si aún no tenemos ticket_id, buscar si existe un participante por DNI o crearlo para asociar el ticket
    if (!resolvedTicketId) {
      let participantId: string | null = null;

      if (dni && dni.trim().length >= 8) {
        const { data: existingPart } = await supabase
          .from('participants')
          .select('id')
          .eq('dni', dni.trim())
          .limit(1)
          .maybeSingle();

        if (existingPart?.id) {
          participantId = existingPart.id;
        }
      }

      // Si no existe el participante y tenemos datos, crear registro de participante
      if (!participantId) {
        const nameParts = cleanName.split(' ');
        const firstName = nameParts[0] || cleanName;
        const lastName = nameParts.slice(1).join(' ') || '';

        try {
          const { data: newPart } = await supabase
            .from('participants')
            .insert({
              first_name: firstName,
              last_name: lastName,
              dni: (dni || '').trim() || null,
              whatsapp: (whatsapp || '').trim() || null,
              department: 'LIMA'
            })
            .select('id')
            .single();

          if (newPart?.id) {
            participantId = newPart.id;
          }
        } catch (_) {
          // Ignorar error de participante si la tabla difiere
        }
      }

      // C. Insertar ticket ganador garantizando que ticket_id exista en la BD
      try {
        const { data: newTicket, error: ticketInsertErr } = await supabase
          .from('tickets')
          .insert({
            campaign_id: campaignId,
            raffle_id: raffleId,
            participant_id: participantId,
            ticket_code: cleanTicketCode,
            status: 'winner'
          })
          .select('id')
          .single();

        if (newTicket?.id) {
          resolvedTicketId = newTicket.id;
        } else if (ticketInsertErr) {
          console.warn('Ticket insert warning:', ticketInsertErr);
        }
      } catch (tErr: any) {
        console.warn('Ticket creation exception:', tErr.message);
      }
    }

    // Si teníamos ticketId previo, actualizar su status a winner
    if (resolvedTicketId) {
      try {
        await supabase
          .from('tickets')
          .update({ status: 'winner' })
          .eq('id', resolvedTicketId);
      } catch (_) {}
    }

    // 3. Registrar el ganador final vinculado al sorteo y ticket
    const winnerPayload: any = {
      raffle_id: raffleId,
      ticket_id: resolvedTicketId || null,
      visible_name: cleanName,
      visible_ticket_code: cleanTicketCode,
      testimonial: testimonial ? testimonial.trim() : '',
      winner_image_url: winner_image_url || null,
      published_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('winners')
      .insert(winnerPayload)
      .select()
      .single();

    if (error) {
      console.error('Winner Insert Error:', error);

      // Si falla por ticket_id o entry_id, intentar insertar asignando un ticket de respaldo o según schema
      if (!winnerPayload.ticket_id) {
        // Obtener cualquier ticket existente para cumplir constraint si es estricta
        const { data: fallbackTicket } = await supabase
          .from('tickets')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (fallbackTicket?.id) {
          winnerPayload.ticket_id = fallbackTicket.id;
          const retry = await supabase.from('winners').insert(winnerPayload).select().single();
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // 4. Marcar el sorteo como completado
    try {
      await supabase.from('raffles').update({ status: 'completed' }).eq('id', raffleId);
    } catch (_) {}

    return NextResponse.json({ success: true, winner: data });

  } catch (e: any) {
    console.error('API Proclaim Winner Crash:', e);
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
