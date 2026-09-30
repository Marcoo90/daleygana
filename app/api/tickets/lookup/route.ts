import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni')?.trim();

    if (!dni) {
      return NextResponse.json({ error: 'El número de DNI es requerido' }, { status: 400 });
    }

    // 1. Buscar participante por DNI
    const { data: participant, error: pError } = await supabase
      .from('participants')
      .select('*')
      .eq('dni', dni)
      .maybeSingle();

    if (pError || !participant) {
      return NextResponse.json({ message: 'No se encontraron registros ni compras con este DNI.' }, { status: 404 });
    }

    // 2. Obtener Campaña Activa
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const activeCampaign = campaign || (await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(1).single()).data;

    if (!activeCampaign) {
      return NextResponse.json({ message: 'No hay ninguna campaña activa en este momento.' }, { status: 404 });
    }

    // 3. Verificar si el usuario tiene registro base validado en esta campaña
    const { data: reg } = await supabase
      .from('campaign_registrations')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('campaign_id', activeCampaign.id)
      .maybeSingle();

    const { data: validBaseOrders } = await supabase
      .from('orders')
      .select('id, total_amount')
      .eq('participant_id', participant.id)
      .eq('campaign_id', activeCampaign.id)
      .in('order_status', ['validated', 'completed'])
      .limit(1);

    const isBaseValidated = Boolean(reg || (validBaseOrders && validBaseOrders.length > 0));

    // 4. Obtener todos los sorteos/premios activos de la campaña
    const { data: raffles } = await supabase
      .from('raffles')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('draw_order', { ascending: true });

    const rafflesList = raffles || [];

    // 5. Consultar participaciones registradas en prize_participations
    let participationsData: any[] = [];
    try {
      const { data: parts } = await supabase
        .from('prize_participations')
        .select('*')
        .eq('participant_id', participant.id)
        .eq('campaign_id', activeCampaign.id);
      if (parts) participationsData = parts;
    } catch (partErr: any) {
      console.warn('Could not query prize_participations table:', partErr.message);
    }

    // 6. Consultar todos los tickets del participante para esta campaña
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('campaign_id', activeCampaign.id)
      .order('created_at', { ascending: true });

    const ticketList = tickets || [];

    // Tickets base (aplican a todos los premios)
    const baseTickets = ticketList.filter((t: any) => !t.raffle_id);

    // 7. Estructurar el desglose por premio
    const participationsByPrize = rafflesList.map((raffle: any) => {
      const pRecord = participationsData.find((p: any) => p.raffle_id === raffle.id);
      
      // Tickets específicos de este raffle en la tabla tickets
      const raffleAdditionalTickets = ticketList.filter((t: any) => t.raffle_id === raffle.id);

      // Si el usuario tiene base validada, base_participation es 1
      const basePart = isBaseValidated ? 1 : 0;
      
      // additional_tickets se toma del registro de prize_participations o de los tickets generados
      const addTickets = Math.max(
        pRecord ? Number(pRecord.additional_tickets || 0) : 0,
        raffleAdditionalTickets.length
      );
      
      const totalPart = basePart + addTickets;

      return {
        raffle_id: raffle.id,
        prize_name: raffle.prize_name,
        prize_image: raffle.prize_image || raffle.prize_image_url,
        description: raffle.description,
        ticket_price: raffle.ticket_price || 1.00,
        draw_order: raffle.draw_order,
        base_participation: basePart,
        additional_tickets: addTickets,
        total_participations: totalPart,
        base_tickets: baseTickets.map((t: any) => t.ticket_code),
        additional_ticket_codes: raffleAdditionalTickets.map((t: any) => t.ticket_code)
      };
    });

    const totalParticipationsAllPrizes = participationsByPrize.reduce((acc, p) => acc + p.total_participations, 0);

    return NextResponse.json({
      participant_name: `${participant.first_name} ${participant.last_name}`.trim(),
      dni: participant.dni,
      whatsapp: participant.whatsapp,
      department: participant.department,
      campaign_name: activeCampaign.name,
      campaign_id: activeCampaign.id,
      draw_at: activeCampaign.draw_at,
      is_base_validated: isBaseValidated,
      total_participations: totalParticipationsAllPrizes,
      participations_by_prize: participationsByPrize,
      tickets: ticketList.map((t: any) => ({
        ticket_code: t.ticket_code,
        status: t.status,
        created_at: t.created_at
      }))
    });

  } catch (err: any) {
    console.error('Error in tickets lookup API:', err);
    return NextResponse.json({ error: err.message || 'Error al consultar participaciones' }, { status: 500 });
  }
}
