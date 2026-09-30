import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. Extraer datos del formulario
    const dni = (formData.get('dni') as string)?.trim();
    const firstName = (formData.get('nombres') as string)?.trim() || '';
    const lastName = (formData.get('apellidos') as string)?.trim() || '';
    const whatsapp = (formData.get('whatsapp') as string)?.trim() || '';
    const department = (formData.get('department') as string)?.trim() || '';
    const campaignId = (formData.get('campaignId') as string)?.trim();
    const type = (formData.get('type') as string)?.trim() || 'base'; // 'base' | 'chances' | 'pack'
    const packId = formData.get('packId') as string;
    const itemsRaw = formData.get('items') as string; // JSON con los items del carrito de chances
    const receiptFile = formData.get('receipt') as File;

    if (!dni || !campaignId || !receiptFile) {
      return NextResponse.json({ error: 'Faltan datos críticos (DNI, Campaña o Comprobante de pago)' }, { status: 400 });
    }

    // 2. Upsert Participant (Siempre actualizamos/aseguramos datos de contacto)
    const { data: participant, error: pError } = await supabase
      .from('participants')
      .upsert({ 
        dni, 
        first_name: firstName, 
        last_name: lastName, 
        whatsapp: whatsapp, 
        department: department
      }, { onConflict: 'dni' })
      .select()
      .single();

    if (pError) throw pError;

    // 3. Reglas de Negocio para Registro Base vs Chances
    if (type === 'base') {
      // Verificar si ya tiene un registro validado en la campaña activa
      const { data: existingReg } = await supabase
        .from('campaign_registrations')
        .select('id')
        .eq('participant_id', participant.id)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      const { data: existingBaseOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('participant_id', participant.id)
        .eq('campaign_id', campaignId)
        .in('order_status', ['validated', 'completed'])
        .limit(1);

      if (existingReg || (existingBaseOrder && existingBaseOrder.length > 0)) {
        return NextResponse.json({
          error: '¡Ya cuentas con un Registro Base validado en esta campaña! No necesitas volver a pagar los S/ 10. Ahora puedes aumentar tus chances comprando tickets para los premios que prefieras.',
          already_registered: true
        }, { status: 400 });
      }
    } else if (type === 'chances' || type === 'pack' || (packId && packId !== 'null')) {
      // Para CHANCES o PACKS, verificar que el usuario tenga Registro Base VALIDADO
      const { data: reg } = await supabase
        .from('campaign_registrations')
        .select('*')
        .eq('participant_id', participant.id)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (!reg) {
        // Fallback: verificar si tiene alguna orden base validada en la campaña
        const { data: validOrders } = await supabase
          .from('orders')
          .select('id, order_status')
          .eq('participant_id', participant.id)
          .eq('campaign_id', campaignId)
          .in('order_status', ['validated', 'completed'])
          .limit(1);

        if (!validOrders || validOrders.length === 0) {
          return NextResponse.json({ 
            error: 'Debes tener un Registro Base (S/ 10) validado antes de comprar tickets adicionales para aumentar tus chances.' 
          }, { status: 403 });
        }
      }
    }

    // 4. Determinar Producto, Items y Monto Total
    let parsedItems: Array<{ raffleId: string; raffleName?: string; quantity: number; unitPrice: number; subtotal: number }> = [];
    let finalAmount = 0;
    let productId = null;
    let fallbackPackId = packId && packId !== 'null' ? packId : null;

    // Obtener producto base de la campaña para fallback de pack_id / product_id
    const { data: baseProd } = await supabase
      .from('products')
      .select('id, price, name')
      .eq('campaign_id', campaignId)
      .eq('product_type', 'base_registration')
      .maybeSingle();

    const baseProductId = baseProd?.id || null;
    const basePrice = baseProd?.price || 10.00;

    if (type === 'base') {
      productId = baseProductId;
      fallbackPackId = baseProductId;
      finalAmount = basePrice;
    } else if (type === 'chances') {
      if (itemsRaw) {
        try {
          parsedItems = JSON.parse(itemsRaw);
        } catch (e) {
          console.error('Error parseando items del carrito:', e);
        }
      }

      if (!parsedItems || parsedItems.length === 0) {
        return NextResponse.json({ error: 'El carrito de chances está vacío o no es válido' }, { status: 400 });
      }

      // Calcular total a partir de los items
      finalAmount = parsedItems.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 1.00)), 0);
      productId = baseProductId;
      fallbackPackId = baseProductId;
    } else {
      // Legacy Pack
      const { data: packProd } = await supabase
        .from('products')
        .select('id, price, name')
        .eq('id', packId)
        .maybeSingle();

      productId = packProd?.id || baseProductId;
      fallbackPackId = packProd?.id || baseProductId;
      finalAmount = packProd?.price || 10.00;
    }

    // Asegurar que pack_id tenga un registro válido en 'packs' para evitar violación de FK legacy
    if (fallbackPackId) {
      try {
        await supabase
          .from('packs')
          .upsert({
            id: fallbackPackId,
            campaign_id: campaignId,
            name: type === 'base' ? 'Registro Base' : (type === 'chances' ? 'Aumento de Chances' : 'Pack de Tickets'),
            slug: `prod-${fallbackPackId}`,
            price: finalAmount,
            ticket_quantity: 1,
            is_active: true
          }, { onConflict: 'id' });
      } catch (packErr) {
        console.warn('Pack upsert warning:', packErr);
      }
    }

    // 5. Upload Comprobante a Storage
    const fileExt = receiptFile.name.split('.').pop() || 'jpg';
    const fileName = `payments/${dni}_${Date.now()}.${fileExt}`;
    
    let uploadPath = fileName;
    const { data: uploadData, error: uError } = await supabase.storage
      .from('receipts')
      .upload(fileName, receiptFile);

    if (uError) {
      // Intentar en bucket alternativo 'comprobantes'
      const { data: uploadData2, error: uError2 } = await supabase.storage
        .from('comprobantes')
        .upload(fileName, receiptFile);
      if (uError2) {
        console.error('Storage upload error:', uError, uError2);
        throw new Error('No se pudo subir el comprobante de pago. Por favor intenta de nuevo.');
      }
      uploadPath = uploadData2?.path || fileName;
    } else {
      uploadPath = uploadData?.path || fileName;
    }

    // 6. Crear Orden en estado Pending
    const orderCode = `DYG-${dni.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderPayload: any = {
      participant_id: participant.id,
      campaign_id: campaignId,
      product_id: productId,
      pack_id: fallbackPackId,
      order_code: orderCode,
      total_amount: finalAmount,
      order_status: 'pending'
    };

    // Agregar order_type si la columna está disponible
    try {
      orderPayload.order_type = type;
    } catch (_) {}

    const { data: order, error: oError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (oError) {
      // Si falló por order_type que no existe, reintentar sin order_type
      delete orderPayload.order_type;
      const { data: retryOrder, error: retryErr } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();
      if (retryErr) throw retryErr;
      orderPayload.id = retryOrder.id;
    }

    const createdOrderId = order?.id || orderPayload.id;

    // 7. Guardar items en order_items si es compra de chances
    if (type === 'chances' && parsedItems.length > 0 && createdOrderId) {
      const orderItemsToInsert = parsedItems.map(it => ({
        order_id: createdOrderId,
        raffle_id: it.raffleId || null,
        product_id: productId,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unitPrice || 1.00),
        subtotal: Number(it.quantity || 1) * Number(it.unitPrice || 1.00)
      }));

      try {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);
        if (itemsError) {
          console.warn('order_items insert warning (se continuará):', itemsError.message);
        }
      } catch (itemErr: any) {
        console.warn('order_items table not available yet:', itemErr.message);
      }
    }

    // 8. Crear Pago en estado Pending
    const { error: pyError } = await supabase
      .from('payments')
      .insert({
        order_id: createdOrderId,
        amount: finalAmount,
        receipt_path: uploadPath,
        status: 'pending'
      });

    if (pyError) throw pyError;

    return NextResponse.json({ 
      success: true, 
      message: '¡Comprobante recibido con éxito! Tu pago está en proceso de validación.',
      order_code: orderCode,
      type: type,
      total_amount: finalAmount
    });

  } catch (err: any) {
    console.error('Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar la orden' }, { status: 500 });
  }
}
