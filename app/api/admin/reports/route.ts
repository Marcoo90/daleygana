import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const campaignId = searchParams.get('campaignId');
  const raffleId = searchParams.get('raffleId');

  try {
    // =========================================================================
    // 1. REPORTE ESPECÍFICO POR PREMIO (PARA SORTEO EXTERNO)
    // =========================================================================
    if (type === 'raffle_participants' || (type === 'raffle' && raffleId)) {
      if (!raffleId) {
        return NextResponse.json({ error: 'El ID del premio (raffleId) es requerido' }, { status: 400 });
      }

      // 1.1 Obtener datos del premio
      const { data: raffle, error: rErr } = await supabase
        .from('raffles')
        .select('*, campaigns(*)')
        .eq('id', raffleId)
        .single();

      if (rErr || !raffle) {
        return NextResponse.json({ error: 'Premio no encontrado' }, { status: 404 });
      }

      // 1.2 Obtener registros base de la campaña (campaign_registrations)
      const { data: baseRegs } = await supabase
        .from('campaign_registrations')
        .select('*, participants(*)')
        .eq('campaign_id', raffle.campaign_id);

      // 1.3 Obtener participaciones registradas en prize_participations
      const { data: prizeParts } = await supabase
        .from('prize_participations')
        .select('*, participants(*)')
        .eq('raffle_id', raffleId);

      // 1.4 Obtener todos los tickets de la campaña y del premio
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*, participants(*)')
        .eq('campaign_id', raffle.campaign_id);

      const allTickets = tickets || [];
      const baseTickets = allTickets.filter((t: any) => !t.raffle_id);
      const raffleChanceTickets = allTickets.filter((t: any) => t.raffle_id === raffleId);

      // 1.5 Consolidar lista de participantes únicos
      const participantMap = new Map<string, any>();

      // A. Agregar a todos los que tienen registro base activo
      (baseRegs || []).forEach((reg: any) => {
        if (reg.participants) {
          const p = reg.participants;
          participantMap.set(p.id, {
            participant_id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            full_name: `${p.first_name} ${p.last_name}`.trim(),
            dni: p.dni,
            whatsapp: p.whatsapp,
            department: p.department || 'LIMA',
            base_participation: 1,
            additional_tickets: 0,
            total_participations: 1,
            ticket_codes: []
          });
        }
      });

      // B. Incorporar/actualizar datos de prize_participations
      (prizeParts || []).forEach((pp: any) => {
        if (pp.participants) {
          const p = pp.participants;
          const existing = participantMap.get(p.id);
          const baseCount = Number(pp.base_participation ?? (existing ? 1 : 1));
          const addCount = Number(pp.additional_tickets ?? 0);

          if (existing) {
            existing.base_participation = baseCount;
            existing.additional_tickets = addCount;
            existing.total_participations = baseCount + addCount;
          } else {
            participantMap.set(p.id, {
              participant_id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              full_name: `${p.first_name} ${p.last_name}`.trim(),
              dni: p.dni,
              whatsapp: p.whatsapp,
              department: p.department || 'LIMA',
              base_participation: baseCount,
              additional_tickets: addCount,
              total_participations: baseCount + addCount,
              ticket_codes: []
            });
          }
        }
      });

      // C. Asignar códigos de tickets generados
      participantMap.forEach((entry, pId) => {
        const userBaseTkts = baseTickets.filter((t: any) => t.participant_id === pId).map((t: any) => t.ticket_code);
        const userChanceTkts = raffleChanceTickets.filter((t: any) => t.participant_id === pId).map((t: any) => t.ticket_code);
        
        // Si hay tickets de chance en la tabla tickets pero no en prize_participations, asegurar la suma
        if (userChanceTkts.length > entry.additional_tickets) {
          entry.additional_tickets = userChanceTkts.length;
          entry.total_participations = entry.base_participation + entry.additional_tickets;
        }

        entry.ticket_codes = [...userBaseTkts, ...userChanceTkts];
      });

      const participantsList = Array.from(participantMap.values());
      const totalPool = participantsList.reduce((acc, p) => acc + p.total_participations, 0);

      return NextResponse.json({
        raffle: {
          id: raffle.id,
          prize_name: raffle.prize_name,
          description: raffle.description,
          ticket_price: raffle.ticket_price || 1.00,
          draw_order: raffle.draw_order,
          campaign_name: raffle.campaigns?.name
        },
        total_participants: participantsList.length,
        total_pool: totalPool,
        participants: participantsList
      });
    }

    // =========================================================================
    // 2. REPORTES TRADICIONALES (PARTICIPANTES, GANADORES, ÓRDENES)
    // =========================================================================
    if (type === 'participants') {
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
        query = query.eq('orders.campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
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
