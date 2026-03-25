import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

/**
 * POST /api/admin/validate-payment
 * Validates an order:
 *   1. Marks payment as 'validated'
 *   2. Marks order as 'completed'
 *   3. Creates campaign_registration if base_registration type
 *   4. Generates N tickets (based on products.tickets_count, defaults to 1)
 *
 * Handles the case where product_id is NULL (legacy or direct orders).
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
       return NextResponse.json({ error: 'Orden no encontrada: ' + orderError?.message }, { status: 404 });
    }

    // 2. Mark payment(s) as validated
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'validated', validated_at: new Date().toISOString() })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      console.warn('Payment update warning:', paymentUpdateError.message);
      // Non-fatal: continue even if no payment row exists
    }

    // 3. Mark order as completed
    await supabase
      .from('orders')
      .update({ order_status: 'completed' })
      .eq('id', orderId);

    // 4. If base_registration product (or no product = assume base), create campaign_registration
    const productType = order.products?.product_type;
    const isBaseOrUnknown = !productType || productType === 'base_registration';

    if (isBaseOrUnknown) {
        const { error: regError } = await supabase
          .from('campaign_registrations')
          .upsert({
              participant_id: order.participant_id,
              campaign_id: order.campaign_id,
              status: 'active'
          }, { onConflict: 'campaign_id, participant_id' });

        if (regError) {
          console.warn('Campaign registration warning:', regError.message);
        }
    }

    // 5. Generate TICKETS
    const ticketsToGenerate = order.products?.tickets_count || 1;
    
    // Get campaign slug for ticket code prefix
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
        console.error('Ticket Gen Error:', ticketError);
        return NextResponse.json({ 
          error: 'Tickets no generados: ' + ticketError.message 
        }, { status: 500 });
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
