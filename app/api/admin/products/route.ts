import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    let query = supabase.from('products').select('*');
    if (campaignId) query = query.eq('campaign_id', campaignId);

    const { data, error } = await query.order('product_type', { ascending: true }).order('price', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { data, error } = await supabase
        .from('products')
        .insert({
            campaign_id: body.campaign_id,
            name: body.name,
            slug: body.name.toLowerCase().replace(/ /g, '-'),
            description: body.description || '',
            product_type: body.product_type, // 'base_registration' o 'ticket_pack'
            price: body.price,
            tickets_count: body.tickets_count || 1,
            is_active: true,
            image_url: body.image_url || null
        })
        .select()
        .single();

    if (error) {
        console.error('Product Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
