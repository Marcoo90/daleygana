import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * Returns ALL orders with full relational data.
 * Includes a computed 'needs_validation' field.
 */
export async function GET() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      participants ( id, first_name, last_name, dni, whatsapp, department ),
      campaigns ( id, name, slug ),
      products ( id, name, price, product_type, tickets_count ),
      payments ( id, receipt_path, status, amount, created_at )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Orders Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = data || [];

  for (const order of orders) {
    if (order.payments) {
      // Normalize to array since Supabase returns an object for 1:1 relations and array for 1:N
      const paymentsArr = Array.isArray(order.payments) ? order.payments : [order.payments];
      
      for (const payment of paymentsArr) {
        if (payment.receipt_path) {
          const { data: signData } = await supabase.storage
            .from('receipts')
            .createSignedUrl(payment.receipt_path, 3600);
          
          if (signData?.signedUrl) {
            payment.receipt_url = signData.signedUrl;
          }
        }
      }
    }
  }

  return NextResponse.json(orders);
}

/**
 * PATCH /api/admin/orders?id=<orderId>
 * Update order status (e.g. to 'rejected')
 */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const { data, error } = await supabase
      .from('orders')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
