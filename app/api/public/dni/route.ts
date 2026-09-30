import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni')?.trim();

    if (!dni || dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      return NextResponse.json({ error: 'El DNI debe tener 8 dígitos numéricos' }, { status: 400 });
    }

    // 1. Primero revisar si el participante ya existe en la base de datos local
    try {
      const { data: localParticipant } = await supabase
        .from('participants')
        .select('first_name, last_name, whatsapp, department')
        .eq('dni', dni)
        .maybeSingle();

      if (localParticipant && (localParticipant.first_name || localParticipant.last_name)) {
        return NextResponse.json({
          first_name: localParticipant.first_name || '',
          last_name: localParticipant.last_name || '',
          full_name: `${localParticipant.first_name || ''} ${localParticipant.last_name || ''}`.trim(),
          whatsapp: localParticipant.whatsapp || '',
          department: localParticipant.department || '',
          source: 'local_database'
        });
      }
    } catch (dbErr) {
      console.warn('Local participant lookup error:', dbErr);
    }

    // 2. Consultar RENIEC a través de apis.net.pe v1 (funciona sin token)
    let fetchedData: any = null;

    try {
      const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const text = await res.text();
        // Verificar que sea JSON válido (no HTML de error)
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const data = JSON.parse(text);
          // Verificar que tenga datos de nombre (no solo DNI no encontrado)
          if (data.nombres || data.nombre) {
            fetchedData = data;
          }
        }
      }
    } catch (err: any) {
      console.warn('Error en apis.net.pe v1:', err.message);
    }

    // 3. Fallback: apis.net.pe v2 con token si está configurado como Bearer token
    if (!fetchedData) {
      const rawKey = process.env.RENIEC_API_KEY?.trim() || '';
      const isToken = rawKey && !rawKey.startsWith('http') && rawKey.length > 10;

      if (isToken) {
        try {
          const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
            headers: {
              'Authorization': `Bearer ${rawKey}`,
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const text = await res.text();
            if (text.trim().startsWith('{')) {
              fetchedData = JSON.parse(text);
            }
          }
        } catch (err: any) {
          console.warn('Error en apis.net.pe v2:', err.message);
        }
      }
    }

    // 4. Fallback: decolecta.com con token si RENIEC_API_KEY es URL de decolecta
    if (!fetchedData) {
      const rawKey = process.env.RENIEC_API_KEY?.trim() || '';
      if (rawKey.startsWith('http') && rawKey.includes('decolecta')) {
        // Extraer token si está embebido, o intentar con la URL base
        try {
          const baseUrl = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;
          const res = await fetch(baseUrl, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const text = await res.text();
            if (text.trim().startsWith('{')) {
              fetchedData = JSON.parse(text);
            }
          }
        } catch (_) {}
      }
    }

    if (!fetchedData) {
      return NextResponse.json({
        error: 'No se encontraron datos para este DNI.',
        manual: true
      }, { status: 404 });
    }

    // 5. Normalizar respuesta — compatible con apis.net.pe v1 y v2
    const d = fetchedData.data || fetchedData.result || fetchedData;

    // apis.net.pe v1 devuelve: { nombres: "JUAN", apellidoPaterno: "GARCIA", apellidoMaterno: "LOPEZ" }
    // apis.net.pe v2 devuelve: { nombres: "JUAN", apellidoPaterno: "GARCIA", apellidoMaterno: "LOPEZ" }
    // Decolecta devuelve campos similares
    const firstName =
      d.nombres ||
      d.first_name ||
      d.name ||
      '';

    let lastName = '';
    if (d.apellidoPaterno || d.apellidoMaterno) {
      lastName = `${d.apellidoPaterno || ''} ${d.apellidoMaterno || ''}`.trim();
    } else if (d.apellido_paterno || d.apellido_materno) {
      lastName = `${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim();
    } else if (d.apellidos || d.last_name) {
      lastName = (d.apellidos || d.last_name || '').trim();
    } else if (d.nombre) {
      // Si solo tiene "nombre" completo, es apellidos + nombres juntos
      // apis.net.pe v1 a veces devuelve "nombre" con todo junto: "GARCIA LOPEZ JUAN"
      const parts = (d.nombre as string).trim().split(/\s+/);
      if (parts.length >= 3) {
        lastName = parts.slice(0, 2).join(' ');
        // firstName ya viene en d.nombres si existe
      }
    }

    const fullName = d.nombre_completo || d.full_name || `${firstName} ${lastName}`.trim();

    if (!firstName && !lastName && !fullName) {
      return NextResponse.json({
        error: 'DNI no encontrado en el registro.',
        manual: true
      }, { status: 404 });
    }

    return NextResponse.json({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullName.trim(),
      dni: dni,
      source: 'reniec_api'
    });

  } catch (error: any) {
    console.error('DNI API Exception:', error);
    return NextResponse.json({ error: error.message || 'Error al consultar DNI', manual: true }, { status: 500 });
  }
}
