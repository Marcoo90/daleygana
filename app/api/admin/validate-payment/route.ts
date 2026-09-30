import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

/**
 * POST /api/admin/validate-payment
 * Valida una orden y su pago:
 *   1. Marca pago como 'validated' y orden como 'validated'
 *   2. Si es REGISTRO BASE:
 *      - Crea/asegura campaign_registration
 *      - Otorga 1 PARTICIPACIÓN BASE en TODOS los sorteos/premios activos de la campaña
 *      - Genera ticket(s) base para visualización
 *   3. Si es AUMENTO DE CHANCES (Tickets adicionales por premio):
 *      - Lee los items de la orden (order_items)
 *      - Acumula additional_tickets en prize_participations por cada premio
 *      - Genera tickets individuales asociados a cada sorteo
 */
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Order ID es requerido' }, { status: 400 });

    // 1. Obtener orden con datos relacionados
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(*), campaigns(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
       return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // 2. Evitar duplicados si la orden ya está validada
    if (order.order_status === 'validated' || order.order_status === 'completed') {
       return NextResponse.json({ 
         success: true, 
         message: 'Esta orden ya fue validada previamente.',
         alreadyValidated: true 
       });
    }

    // 3. Marcar pago como validado
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'validated', validated_at: new Date().toISOString() })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      return NextResponse.json({ error: 'Error al actualizar pago: ' + paymentUpdateError.message }, { status: 500 });
    }

    // 4. Marcar orden como validada
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ order_status: 'validated' })
      .eq('id', orderId);
    
    if (orderUpdateError) {
      return NextResponse.json({ error: 'Error al actualizar orden: ' + orderUpdateError.message }, { status: 500 });
    }

    const campSlug = order.campaigns?.slug?.toUpperCase().slice(0, 3) 
      || order.campaigns?.name?.slice(0, 3).toUpperCase() 
      || 'DYG';

    const orderType = order.order_type || (order.products?.product_type === 'base_registration' ? 'base' : (order.products?.product_type === 'ticket_pack' ? 'pack' : 'base'));
    const isBase = orderType === 'base' || (!order.order_type && (!order.products || order.products.product_type === 'base_registration'));

    const generatedTickets: any[] = [];

    // =========================================================================
    // CASO A: REGISTRO BASE (S/ 10)
    // Otorga automáticamente 1 participación base en TODOS los premios activos
    // =========================================================================
    if (isBase) {
      // A.1. Asegurar registro formal en campaign_registrations
      try {
        await supabase
          .from('campaign_registrations')
          .upsert({
            participant_id: order.participant_id,
            campaign_id: order.campaign_id,
            status: 'active'
          }, { onConflict: 'campaign_id, participant_id' });
      } catch (regErr: any) {
        console.warn('campaign_registrations upsert warning:', regErr.message);
      }

      // A.2. Obtener todos los sorteos activos de la campaña
      const { data: activeRaffles } = await supabase
        .from('raffles')
        .select('id, prize_name')
        .eq('campaign_id', order.campaign_id)
        .eq('status', 'active');

      // A.3. Crear/actualizar prize_participations para cada sorteo
      if (activeRaffles && activeRaffles.length > 0) {
        for (const raffle of activeRaffles) {
          try {
            // Verificar si ya tiene fila de participación
            const { data: existingPart } = await supabase
              .from('prize_participations')
              .select('*')
              .eq('participant_id', order.participant_id)
              .eq('raffle_id', raffle.id)
              .maybeSingle();

            if (existingPart) {
              const baseCount = 1;
              const addCount = Number(existingPart.additional_tickets || 0);
              await supabase
                .from('prize_participations')
                .update({
                  base_participation: baseCount,
                  total_participations: baseCount + addCount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPart.id);
            } else {
              await supabase
                .from('prize_participations')
                .insert({
                  participant_id: order.participant_id,
                  raffle_id: raffle.id,
                  campaign_id: order.campaign_id,
                  base_participation: 1,
                  additional_tickets: 0,
                  total_participations: 1
                });
            }
          } catch (partErr: any) {
            console.warn('Error actualizando prize_participations base:', partErr.message);
          }
        }
      }

      // A.4. Generar tickets alfanuméricos para display (abreviado CH-BASE / CC)
      const ticketsCount = order.products?.tickets_count || 1;
      for (let i = 0; i < ticketsCount; i++) {
        const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        generatedTickets.push({
          campaign_id: order.campaign_id,
          participant_id: order.participant_id,
          order_id: order.id,
          ticket_code: `CH-BASE-${randomHex}-${randomNum}-${String(i + 1).padStart(2, '0')}`
        });
      }
    } 
    // =========================================================================
    // CASO B: TICKETS ADICIONALES (AUMENTO DE CHANCES POR PREMIO)
    // =========================================================================
    else {
      // B.1. Consultar order_items de esta orden
      let itemsList: any[] = [];
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('*, raffles(*)')
          .eq('order_id', order.id);
        if (items && items.length > 0) itemsList = items;
      } catch (err: any) {
        console.warn('Error leyendo order_items:', err.message);
      }

      // B.2. Si hay items por premio, actualizar participaciones para cada uno
      if (itemsList.length > 0) {
        for (const item of itemsList) {
          const raffleId = item.raffle_id;
          const qty = Number(item.quantity || 1);

          if (raffleId) {
            try {
              const { data: existingPart } = await supabase
                .from('prize_participations')
                .select('*')
                .eq('participant_id', order.participant_id)
                .eq('raffle_id', raffleId)
                .maybeSingle();

              if (existingPart) {
                const baseCount = Number(existingPart.base_participation || 1);
                const newAdditional = Number(existingPart.additional_tickets || 0) + qty;
                await supabase
                  .from('prize_participations')
                  .update({
                    additional_tickets: newAdditional,
                    total_participations: baseCount + newAdditional,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingPart.id);
              } else {
                await supabase
                  .from('prize_participations')
                  .insert({
                    participant_id: order.participant_id,
                    raffle_id: raffleId,
                    campaign_id: order.campaign_id,
                    base_participation: 1,
                    additional_tickets: qty,
                    total_participations: 1 + qty
                  });
              }
            } catch (partErr: any) {
              console.warn('Error actualizando prize_participations chances:', partErr.message);
            }

            // Generar códigos de tickets para este premio (abreviado CH)
            for (let i = 0; i < qty; i++) {
              const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
              const randomNum = Math.floor(1000 + Math.random() * 9000);
              generatedTickets.push({
                campaign_id: order.campaign_id,
                participant_id: order.participant_id,
                order_id: order.id,
                raffle_id: raffleId,
                ticket_code: `CH-${randomHex}-${randomNum}-${String(i + 1).padStart(2, '0')}`
              });
            }
          }
        }
      } else {
        // Fallback para packs legacy o sin items
        const ticketsCount = order.products?.tickets_count || 1;
        for (let i = 0; i < ticketsCount; i++) {
          const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          generatedTickets.push({
            campaign_id: order.campaign_id,
            participant_id: order.participant_id,
            order_id: order.id,
            ticket_code: `CH-PK-${randomHex}-${randomNum}-${String(i + 1).padStart(2, '0')}`
          });
        }
      }
    }

    // B.3. Insertar tickets generados en la tabla tickets
    if (generatedTickets.length > 0) {
      try {
        const { error: ticketError } = await supabase.from('tickets').insert(generatedTickets);
        if (ticketError) {
          console.error('Ticket insert error (se continúa):', ticketError.message);
        }
      } catch (tErr: any) {
        console.warn('Tickets insert exception:', tErr.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pago validado y participaciones actualizadas exitosamente.',
      ticketsGenerated: generatedTickets.length,
      ticketCodes: generatedTickets.map(t => t.ticket_code)
    });

  } catch (err: any) {
    console.error('validate-payment fatal error:', err);
    return NextResponse.json({ error: err.message || 'Error al validar pago' }, { status: 500 });
  }
}
