import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getMessageType(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação ausente.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase ausente no servidor.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado para upload.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bucketName = 'internal-chat';
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      return NextResponse.json({ error: 'Não foi possível validar o bucket do chat.' }, { status: 500 });
    }

    if (!buckets?.some((bucket) => bucket.name === bucketName)) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760,
      });

      if (createBucketError) {
        return NextResponse.json({ error: 'Não foi possível criar o bucket de anexos do chat.' }, { status: 500 });
      }
    }

    const filePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
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
      messageType: getMessageType(file.type || ''),
    });
  } catch (error) {
    console.error('Chat interno: erro no upload.', error);
    return NextResponse.json({ error: 'Falha ao enviar o anexo do chat.' }, { status: 500 });
  }
}
