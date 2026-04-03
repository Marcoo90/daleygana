import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const campaignId = searchParams.get('campaignId');

    if (!dni || !campaignId) {
        return NextResponse.json({ error: 'Faltan parámetros (DNI y CampaignId)' }, { status: 400 });
    }

    try {
        // 1. Buscar participante por DNI
        const { data: participant, error: pError } = await supabase
            .from('participants')
            .select('id, first_name, last_name, whatsapp, department')
            .eq('dni', dni)
            .single();

        if (pError || !participant) {
            return NextResponse.json({ registered: false, message: 'Usuario no encontrado' });
        }

        // 2. Verificar registro en campaña
        const { data: reg, error: rError } = await supabase
            .from('campaign_registrations')
            .select('*')
            .eq('participant_id', participant.id)
            .eq('campaign_id', campaignId)
            .maybeSingle();

        if (reg) {
            return NextResponse.json({ registered: true, participant });
        }

        // 3. Fallback: Verificar si tiene alguna orden base validada aunque no esté en campaign_registrations
        const { data: order, error: oError } = await supabase
            .from('orders')
            .select('id')
            .eq('participant_id', participant.id)
            .eq('campaign_id', campaignId)
            .in('order_status', ['validated', 'completed'])
            .limit(1);
        
        if (order && order.length > 0) {
            return NextResponse.json({ registered: true, participant });
        }

        return NextResponse.json({ 
            registered: false, 
            message: 'No se encontró un Registro Base validado para este DNI en la campaña actual.' 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
