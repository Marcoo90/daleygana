import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mapping from frontend to backend schema
    const campaignData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/ /g, '-'),
      status: body.status || 'active',
      starts_at: body.starts_at || body.start_date || new Date().toISOString(),
      ticket_sales_end_at: body.ticket_sales_end_at || body.end_date,
      draw_at: body.draw_at || body.draw_date,
      hero_image: body.hero_image || null
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
        console.error('Supabase Campaign Insert Error:', error);
        return NextResponse.json({ error: `Error DB: ${error.message} (${error.code})` }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: `Error JSON: ${err.message}` }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'El ID de la campaña es requerido' }, { status: 400 });

    try {
      // 1. Obtener los IDs de sorteos/premios vinculados a la campaña
      const { data: raffles } = await supabase
        .from('raffles')
        .select('id')
        .eq('campaign_id', id);

      const raffleIds = (raffles || []).map(r => r.id);

      // 2. Eliminar ganadores vinculados a estos sorteos
      if (raffleIds.length > 0) {
        await supabase.from('winners').delete().in('raffle_id', raffleIds);
      }

      // 3. Eliminar tickets vinculados a la campaña
      await supabase.from('tickets').delete().eq('campaign_id', id);

      // 4. Obtener los IDs de órdenes de la campaña
      const { data: orders } = await supabase
        .from('orders')
        .select('id, participant_id')
        .eq('campaign_id', id);

      const orderIds = (orders || []).map(o => o.id);
      const participantIds = (orders || []).map(o => o.participant_id).filter(Boolean);

      // 5. Eliminar order_items y payments de esas órdenes
      if (orderIds.length > 0) {
        try {
          await supabase.from('order_items').delete().in('order_id', orderIds);
        } catch (_) {}
        try {
          await supabase.from('payments').delete().in('order_id', orderIds);
        } catch (_) {}
      }

      // 6. Eliminar órdenes de la campaña
      await supabase.from('orders').delete().eq('campaign_id', id);

      // 7. Eliminar participaciones y registros de campaña
      try {
        await supabase.from('prize_participations').delete().eq('campaign_id', id);
      } catch (_) {}

      try {
        await supabase.from('campaign_registrations').delete().eq('campaign_id', id);
      } catch (_) {}

      // 8. Eliminar sorteos/premios de la campaña
      await supabase.from('raffles').delete().eq('campaign_id', id);

      // 9. Eliminar packs y productos vinculados a la campaña
      try {
        await supabase.from('packs').delete().eq('campaign_id', id);
      } catch (_) {}

      try {
        await supabase.from('products').delete().eq('campaign_id', id);
      } catch (_) {}

      // 10. Eliminar la campaña
      const { error: campError } = await supabase.from('campaigns').delete().eq('id', id);
      if (campError) {
        console.error('Error deleting campaign:', campError);
        return NextResponse.json({ error: 'Error al eliminar campaña: ' + campError.message }, { status: 500 });
      }

      // 11. Limpieza de participantes huérfanos (que no tengan órdenes en otras campañas)
      if (participantIds.length > 0) {
        try {
          for (const pId of Array.from(new Set(participantIds))) {
            const { count } = await supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('participant_id', pId);

            if (!count || count === 0) {
              await supabase.from('participants').delete().eq('id', pId);
            }
          }
        } catch (pErr) {
          console.warn('Participant cleanup note:', pErr);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Campaña y todos sus registros asociados eliminados con éxito.' 
      });

    } catch (e: any) {
      console.error('Cascade Delete Campaign Error:', e);
      return NextResponse.json({ error: e.message || 'Error en la eliminación en cascada' }, { status: 500 });
    }
}
