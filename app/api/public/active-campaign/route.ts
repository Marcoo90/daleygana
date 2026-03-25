import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const revalidate = 60; // Revalidar cada minuto

export async function GET() {
  try {
    // 1. Obtener campaña activa (la más reciente marcada como active)
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('starts_at', { ascending: false })
      .limit(1)
      .single();

    if (cError || !campaign) {
      // Si no hay activa, intentar con cualquier draft o la más reciente
      const { data: fallback } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (!fallback) return NextResponse.json({ error: 'No current campaign' }, { status: 404 });
      
      const raffles = await fetchRaffles(fallback.id);
      const products = await fetchProducts(fallback.id);
      return NextResponse.json({ campaign: fallback, raffles, products });
    }

    const [raffles, products] = await Promise.all([
        fetchRaffles(campaign.id),
        fetchProducts(campaign.id)
    ]);

    return NextResponse.json({
      campaign,
      raffles,
      products
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function fetchRaffles(campaignId: string) {
    const { data } = await supabase
        .from('raffles')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('draw_order', { ascending: true });
    return data || [];
}

async function fetchProducts(campaignId: string) {
    const { data } = await supabase
        .from('products')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_active', true)
        .order('price', { ascending: true });
    return data || [];
}
