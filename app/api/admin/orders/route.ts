import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

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

  return NextResponse.json(data || []);
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
