import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');

  if (!dni) {
    return NextResponse.json({ error: 'DNI es requerido' }, { status: 400 });
  }

  // 1. Usar la Vista que creaste en el SQL para una consulta mas eficiente
  // v_participant_campaign_tickets nos da el nombre y el conteo total
  const { data: summary, error: sError } = await supabase
    .from('v_participant_campaign_tickets')
    .select('*')
    .eq('dni', dni)
    .single();

  if (sError || !summary) {
    return NextResponse.json({ message: 'No se encuentran tickets registrados para este DNI' }, { status: 404 });
  }

  // 2. Usar la otra Vista para traer el desglose de los codigos de tickets
  const { data: ticketList, error: tError } = await supabase
    .from('v_ticket_list_by_participant')
    .select('ticket_code, status, campaign_name')
    .eq('dni', dni);

  if (tError) {
    return NextResponse.json({ error: tError.message }, { status: 500 });
  }

  return NextResponse.json({
    participant_name: `${summary.first_name} ${summary.last_name}`,
    campaign_name: summary.campaign_name,
    total_tickets: summary.total_tickets,
    tickets: ticketList || []
  });
}
