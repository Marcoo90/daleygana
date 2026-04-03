import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni || dni.length !== 8) {
      return NextResponse.json({ error: 'El DNI debe tener 8 dígitos' }, { status: 400 });
    }

    const token = process.env.RENIEC_API_KEY;
    
    // Si no hay token configurado, forzamos fallback manual
    if (!token) {
      return NextResponse.json({ 
        error: 'API Key no configurada, proceda de forma manual' 
      }, { status: 503 });
    }

    const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      // Timeout corto (3 seg) para que no se quede colgado
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
       return NextResponse.json({ error: 'No se encontraron datos para este DNI' }, { status: res.status });
    }

    const data = await res.json();
    
    return NextResponse.json({
        first_name: data.nombres,
        last_name: `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
    });

  } catch (error) {
    console.error('DNI API Error:', error);
    return NextResponse.json({ error: 'Error al consultar API externa' }, { status: 500 });
  }
}
