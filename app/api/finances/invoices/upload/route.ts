import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server-auth';

function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeRequest(request);
    if (!authorization.ok) {
      return authorization.response;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const mode = String(formData.get('mode') || 'general');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase ausente no servidor.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const bucketName = 'finance-invoices';

    const { data: buckets, error: bucketListError } = await supabaseAdmin.storage.listBuckets();
    if (bucketListError) {
      return NextResponse.json({ error: 'Não foi possível validar o bucket de notas fiscais.' }, { status: 500 });
    }

    if (!buckets?.some((bucket) => bucket.name === bucketName)) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 20971520,
      });

      if (createBucketError) {
        return NextResponse.json({ error: 'Não foi possível criar o bucket de notas fiscais.' }, { status: 500 });
      }
    }

    const userId = authorization.context?.user.id || 'unknown';
    const filePath = `${userId}/${mode}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);

    return NextResponse.json({
      name: file.name,
      path: filePath,
      url: publicUrlData.publicUrl,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    });
  } catch (error) {
    console.error('Finance invoices upload: unexpected error', error);
    return NextResponse.json({ error: 'Falha ao enviar o anexo da nota fiscal.' }, { status: 500 });
  }
}
