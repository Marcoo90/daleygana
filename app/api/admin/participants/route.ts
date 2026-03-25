import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  let sQuery = supabase.from('participants').select(`
    *,
    orders!left ( count ),
    tickets!left ( count )
  `);

  if (query) {
    sQuery = sQuery.or(`dni.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
  }

  const { data, error } = await sQuery.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
