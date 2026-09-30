import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raffleId = searchParams.get('raffleId');
    const action = searchParams.get('action'); // 'export' | 'draw' | 'stats'

    if (!raffleId) {
      return NextResponse.json({ error: 'raffleId es requerido' }, { status: 400 });
    }

    // 1. Obtener detalles del sorteo
    const { data: raffle, error: rError } = await supabase
      .from('raffles')
      .select('*, campaigns(*)')
      .eq('id', raffleId)
      .single();

    if (rError || !raffle) {
      return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
    }

    // 2. Obtener todas las participaciones de este sorteo
    let participations: any[] = [];
    try {
      const { data: parts } = await supabase
        .from('prize_participations')
        .select('*, participants(id, dni, first_name, last_name, whatsapp, department)')
        .eq('raffle_id', raffleId)
        .order('created_at', { ascending: true });

      if (parts) participations = parts;
    } catch (pErr: any) {
      console.warn('Error al consultar prize_participations:', pErr.message);
    }

    // Si no hay filas aún en prize_participations, obtener participantes con orden base validada
    if (participations.length === 0) {
      const { data: baseOrders } = await supabase
        .from('orders')
        .select('participant_id, participants(id, dni, first_name, last_name, whatsapp, department)')
        .eq('campaign_id', raffle.campaign_id)
        .in('order_status', ['validated', 'completed']);

      if (baseOrders && baseOrders.length > 0) {
        // Eliminar duplicados de participante
        const uniqueParticipants = new Map();
        baseOrders.forEach(o => {
          if (o.participants && !uniqueParticipants.has(o.participant_id)) {
            uniqueParticipants.set(o.participant_id, o.participants);
          }
        });

        participations = Array.from(uniqueParticipants.values()).map(p => ({
          participant_id: p.id,
          participants: p,
          base_participation: 1,
          additional_tickets: 0,
          total_participations: 1
        }));
      }
    }

    // 3. Construir lista ponderada para auditoría y sorteo
    let currentPosition = 1;
    const weightedList = participations.map(p => {
      const base = Number(p.base_participation ?? 1);
      const additional = Number(p.additional_tickets ?? 0);
      const total = Number(p.total_participations ?? (base + additional));
      
      const startRange = currentPosition;
      const endRange = currentPosition + total - 1;
      currentPosition = endRange + 1;

      return {
        participant_id: p.participant_id,
        dni: p.participants?.dni || '',
        full_name: `${p.participants?.first_name || ''} ${p.participants?.last_name || ''}`.trim(),
        whatsapp: p.participants?.whatsapp || '',
        department: p.participants?.department || '',
        base_participation: base,
        additional_tickets: additional,
        total_participations: total,
        range_start: startRange,
        range_end: endRange
      };
    });

    const totalPool = currentPosition - 1;

    // 4. Si la acción es 'draw' (realizar sorteo ponderado aleatorio)
    if (action === 'draw') {
      if (totalPool === 0) {
        return NextResponse.json({ error: 'No hay participantes con participaciones válidas para este sorteo.' }, { status: 400 });
      }

      // Generar número aleatorio criptográfico entre 1 y totalPool
      const winningNumber = Math.floor(Math.random() * totalPool) + 1;
      const winningEntry = weightedList.find(entry => winningNumber >= entry.range_start && winningNumber <= entry.range_end);

      return NextResponse.json({
        success: true,
        winning_number: winningNumber,
        total_pool: totalPool,
        winner: winningEntry,
        raffle
      });
    }

    return NextResponse.json({
      raffle,
      total_participants: weightedList.length,
      total_pool: totalPool,
      base_participations: weightedList.reduce((acc, p) => acc + p.base_participation, 0),
      additional_tickets: weightedList.reduce((acc, p) => acc + p.additional_tickets, 0),
      participants: weightedList
    });

  } catch (err: any) {
    console.error('Stats / Draw API error:', err);
    return NextResponse.json({ error: err.message || 'Error en endpoint de sorteo' }, { status: 500 });
  }
}
