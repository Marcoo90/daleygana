import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string || 'public-assets';
        const folder = formData.get('folder') as string || 'general';

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            path: data.path 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
