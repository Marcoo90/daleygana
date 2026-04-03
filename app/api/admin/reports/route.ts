import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const campaignId = searchParams.get('campaignId');

  try {
    if (type === 'participants') {
      // Un row por ticket, incluyendo datos del participante
      let query = supabase
        .from('tickets')
        .select(`
          id,
          ticket_code,
          status,
          created_at,
          participants (
            dni,
            first_name,
            last_name,
            whatsapp,
            department
          ),
          orders (
            campaign_id
          )
        `);
      
      if (campaignId) {
        // Filtrar tickets que pertenecen a órdenes de esa campaña
        query = query.eq('orders.campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrar nulls si la campaña no coincide (debido a la forma en que supabase hace joins externos)
      const filtered = campaignId ? data.filter((t: any) => t.orders?.campaign_id === campaignId) : data;
      
      return NextResponse.json(filtered);
    }

    if (type === 'winners') {
      const { data, error } = await supabase
        .from('winners')
        .select(`
          *,
          raffles ( prize_name, campaign_id ),
          tickets ( 
            ticket_code, 
            participants ( first_name, last_name, dni, whatsapp ) 
          )
        `);
      
      if (error) throw error;
      
      const filtered = campaignId ? data.filter((w: any) => w.raffles?.campaign_id === campaignId) : data;
      return NextResponse.json(filtered);
    }

    if (type === 'orders') {
      let query = supabase
        .from('orders')
        .select(`
          *,
          participants ( dni, first_name, last_name, whatsapp ),
          products ( name, price )
        `)
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });

  } catch (e: any) {
    console.error('Reports API Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
