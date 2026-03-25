import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // 1. Campaña activa
    const { data: camps } = await supabase
      .from('campaigns')
      .select('name')
      .eq('status', 'active')
      .limit(1);
    
    // 2. Órdenes totales y participantes
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('order_status', 'pending');

    const { count: totalParticipants } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    // 3. Pagos pendientes (si existe tabla payments)
    const { count: pendingPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 4. Tickets vendidos
    const { count: soldTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      activeCampaign: camps?.[0]?.name || 'Ninguna activa',
      pendingOrders: pendingOrders || 0,
      pendingPayments: pendingPayments || 0,
      soldTickets: soldTickets || 0,
      totalParticipants: totalParticipants || 0
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
