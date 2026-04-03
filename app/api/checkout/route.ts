import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. Extraer datos
    const dni = formData.get('dni') as string;
    const firstName = formData.get('nombres') as string;
    const lastName = formData.get('apellidos') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const department = formData.get('department') as string;
    const campaignId = formData.get('campaignId') as string;
    const packId = formData.get('packId') as string;
    const type = formData.get('type') as string; // 'base' o 'pack'
    const receiptFile = formData.get('receipt') as File;
    const dniVerified = formData.get('dni_verified') as string;

    if (!dni || !campaignId || !receiptFile) {
        return NextResponse.json({ error: 'Faltan datos críticos (DNI, Campaña o Voucher)' }, { status: 400 });
    }

    // 2. Upsert Participant (Siempre actualizamos datos de contacto)
    const { data: participant, error: pError } = await supabase
      .from('participants')
      .upsert({ 
        dni, 
        first_name: firstName || '', 
        last_name: lastName || '', 
        whatsapp: whatsapp || '', 
        department: department || ''
      }, { onConflict: 'dni' })
      .select()
      .single();

    if (pError) throw pError;

    // 3. Regla de Negocio: Si es un PACK, verificar registro previo
    if (type === 'pack' || (packId && packId !== 'null')) {
        // A. Primero revisamos si ya tiene un registro formal en la campaña
        const { data: reg } = await supabase
            .from('campaign_registrations')
            .select('*')
            .eq('participant_id', participant.id)
            .eq('campaign_id', campaignId)
            .maybeSingle();

        // B. Si no existe el registro formal, buscamos un fallback en sus órdenes validadas
        if (!reg) {
            const { data: validOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('participant_id', participant.id)
                .eq('campaign_id', campaignId)
                .in('order_status', ['validated', 'completed'])
                .limit(1);
            
            if (!validOrder || validOrder.length === 0) {
                return NextResponse.json({ 
                    error: 'Debes tener un Registro Base validado antes de comprar packs adicionales.' 
                }, { status: 403 });
            }
        }
    }

    // 4. Determinar Producto y Monto
    let productId = null;
    let finalAmount = 0;
    let productName = '';

    if (type === 'base') {
        const { data: baseProd } = await supabase
            .from('products')
            .select('id, price, name')
            .eq('campaign_id', campaignId)
            .eq('product_type', 'base_registration')
            .single();
        
        productId = baseProd?.id || null;
        finalAmount = baseProd?.price || 40.00;
        productName = baseProd?.name || 'Registro Base';
    } else {
        const { data: packProd } = await supabase
            .from('products')
            .select('id, price, name')
            .eq('id', packId)
            .single();
        
        productId = packProd?.id;
        finalAmount = packProd?.price || 0;
        productName = packProd?.name || 'Ticket Pack';
    }

    // --- FIX CONSTRAINT ERROR ---
    // The orders table requires pack_id (legacy foreign key). 
    // We synchronize the products row into packs to satisfy it safely.
    if (productId) {
        await supabase.from('packs').upsert({
            id: productId,
            campaign_id: campaignId,
            name: productName,
            slug: productId, // unique fallback slug
            price: finalAmount,
            ticket_quantity: 1,
            is_active: true
        });
    }

    // 5. Upload Comprobante (Privado: bucket receipts)
    const fileExt = receiptFile.name.split('.').pop() || 'jpg';
    const fileName = `payments/${dni}_${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uError } = await supabase.storage
      .from('receipts')
      .upload(fileName, receiptFile);

    if (uError) throw uError;

    // 6. Crear Orden (Pending)
    const orderCode = `DYG-${dni.slice(-4)}-${Math.floor(Math.random() * 10000)}`;
    const { data: order, error: oError } = await supabase
      .from('orders')
      .insert({
        participant_id: participant.id,
        campaign_id: campaignId,
        product_id: productId,
        pack_id: productId,
        order_code: orderCode,
        total_amount: finalAmount,
        order_status: 'pending'
      })
      .select()
      .single();

    if (oError) throw oError;

    // 7. Crear Pago (Pending)
    const { error: pyError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: finalAmount,
        receipt_path: uploadData.path,
        status: 'pending'
      });

    if (pyError) throw pyError;

    return NextResponse.json({ 
        success: true, 
        message: 'Pago enviado a revisión.',
        order_code: orderCode
    });

  } catch (err: any) {
    console.error('Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
