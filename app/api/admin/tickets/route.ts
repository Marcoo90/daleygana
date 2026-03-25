import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketCode = searchParams.get('ticketCode');

  if (!ticketCode) {
    return NextResponse.json({ error: 'Ticket Code required' }, { status: 400 });
  }

  // Buscar el ticket por su codigo unico y traigamos datos del participante
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
        id,
        ticket_code,
        status,
        participants (
            first_name,
            last_name,
            dni
        )
    `)
    .eq('ticket_code', ticketCode)
    .single();

  if (error || !ticket) {
      return NextResponse.json({ message: 'Ticket no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ data: ticket });
}
