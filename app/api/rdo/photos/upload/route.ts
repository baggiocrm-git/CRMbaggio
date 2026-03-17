import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    let file: File | { name: string, type: string, buffer: Buffer } | null = null;
    let projetoId: string | null = null;
    let rdoId: string | null = null;

    // Try to parse as JSON first (base64)
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body.fileBase64) {
        const buffer = Buffer.from(body.fileBase64, 'base64');
        file = {
          name: body.fileName || 'upload.jpg',
          type: body.fileType || 'image/jpeg',
          buffer: buffer
        };
        projetoId = body.projeto_id;
        rdoId = body.rdo_id;
      }
    } else {
      // Fallback to FormData
      const formData = await req.formData().catch(err => {
        console.error('Error parsing form data:', err);
        throw new Error('Falha ao processar dados do formulário');
      });
      
      const formFile = formData.get('file') as File;
      if (formFile) {
        const buffer = Buffer.from(await formFile.arrayBuffer());
        file = {
          name: formFile.name,
          type: formFile.type,
          buffer: buffer
        };
      }
      projetoId = formData.get('projeto_id') as string;
      rdoId = formData.get('rdo_id') as string;
    }

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }
    if (!projetoId) {
      return NextResponse.json({ error: 'ID do projeto não fornecido' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase env vars missing');
      return NextResponse.json({ error: 'Configuração do servidor incompleta (Supabase)' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    // 1. Ensure bucket exists
    const bucketName = 'rdos';
    try {
      const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);
      
      if (getError || !bucket) {
        console.log('Bucket rdos not found, attempting to create...');
        await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*'],
          fileSizeLimit: 10485760 // 10MB
        });
      }
    } catch (bucketErr) {
      console.error('Bucket management error:', bucketErr);
    }

    // 2. Upload to Supabase Storage
    const fileBuffer = 'buffer' in file ? file.buffer : Buffer.from(await (file as File).arrayBuffer());
    const fileName = 'name' in file ? file.name : (file as File).name;
    const fileType = 'type' in file ? file.type : (file as File).type;

    const sanitizedOriginalName = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
      
    const timestamp = Date.now();
    const path = `projetos/${projetoId}/rdos/${rdoId || 'temp'}/${timestamp}-${sanitizedOriginalName}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from(bucketName)
      .upload(path, fileBuffer, {
        contentType: fileType,
        upsert: true
      });

    if (storageError) throw storageError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storageData.path);

    return NextResponse.json({ success: true, url: publicUrl, path: storageData.path });
  } catch (error: unknown) {
    console.error('RDO Photo Upload error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
