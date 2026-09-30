import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Intentamos con nombres singulares que son comunes en FKs directas
    const { data, error } = await supabase
      .from('winners')
      .select(`
        *,
        raffle:raffles ( prize_name, prize_image ),
        ticket:tickets ( 
            ticket_code, 
            participants ( first_name, last_name, department ) 
        )
      `)
      .order('published_at', { ascending: false });

    if (error) {
        console.error('Winners API Fetch Error:', error);
        // Fallback: Si fallan los joins, al menos traer la data plana
        const { data: flatData, error: flatError } = await supabase.from('winners').select('*').order('published_at', { ascending: false });
        if (flatError) {
             console.error('Winners API Fallback Error:', flatError);
             return NextResponse.json([], { status: 200 }); // Retornar array vacio para no romper el frontend
        }
        return NextResponse.json(flatData || []);
    }

    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('Winners API Crash:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
