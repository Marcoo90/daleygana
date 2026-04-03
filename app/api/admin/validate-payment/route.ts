import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

/**
 * POST /api/admin/validate-payment
 * Validates an order:
 *   1. Marks payment as 'validated'
 *   2. Marks order as 'completed'
 *   3. Creates campaign_registration if base_registration type
 *   4. Generates N tickets (based on products.tickets_count, defaults to 1)
 */
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    // 1. Fetch order with ALL related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(*), campaigns(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
       return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // 2. EVITAR DUPLICADOS: Si la orden ya está validada, no hacer nada más
    if (order.order_status === 'validated' || order.order_status === 'completed') {
       return NextResponse.json({ 
         success: true, 
         message: 'Esta orden ya fue validada previamente.',
         ticketsAlreadyGenerated: true 
       });
    }

    // 3. Mark payment(s) as validated
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'validated', validated_at: new Date().toISOString() })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      return NextResponse.json({ error: 'Error al actualizar pago: ' + paymentUpdateError.message }, { status: 500 });
    }

    // 4. Mark order as validated
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ order_status: 'validated' })
      .eq('id', orderId);
    
    if (orderUpdateError) {
        return NextResponse.json({ error: 'Error al actualizar orden: ' + orderUpdateError.message }, { status: 500 });
    }

    // 5. If base_registration, create/ensure campaign_registration
    const productType = order.products?.product_type;
    const isBase = !productType || productType === 'base_registration';

    if (isBase) {
        const { error: regError } = await supabase
          .from('campaign_registrations')
          .upsert({
              participant_id: order.participant_id,
              campaign_id: order.campaign_id,
              status: 'active'
          }, { onConflict: 'campaign_id, participant_id' });

        if (regError) {
          console.error('Campaign registration critical error:', regError.message);
          // Opcional: podrías decidir si esto es fatal o no. Lo pondremos como advertencia por ahora pero idealmente debería funcionar.
        }
    }

    // 6. Generate TICKETS
    const ticketsToGenerate = order.products?.tickets_count || 1;
    
    const campSlug = order.campaigns?.slug?.toUpperCase().slice(0, 3) 
      || order.campaigns?.name?.slice(0, 3).toUpperCase()
      || 'DYG';

    const tickets = [];
    for (let i = 0; i < ticketsToGenerate; i++) {
        const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        tickets.push({
            campaign_id: order.campaign_id,
            participant_id: order.participant_id,
            order_id: order.id,
            ticket_code: `${campSlug}-${randomHex}-${randomNum}-${String(i + 1).padStart(2, '0')}`
        });
    }

    const { error: ticketError } = await supabase.from('tickets').insert(tickets);
    if (ticketError) {
        return NextResponse.json({ error: 'Pago validado pero error al generar tickets: ' + ticketError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      ticketsGenerated: ticketsToGenerate,
      ticketCodes: tickets.map(t => t.ticket_code)
    });

  } catch (err: any) {
    console.error('validate-payment fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
