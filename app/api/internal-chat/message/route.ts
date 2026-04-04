import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getStoragePathFromPublicUrl(url: string) {
  const marker = '/storage/v1/object/public/internal-chat/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticacao ausente.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuracao do Supabase ausente no servidor.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuario nao autenticado.' }, { status: 401 });
    }

    const { messageId } = (await request.json()) as { messageId?: string };
    if (!messageId) {
      return NextResponse.json({ error: 'messageId obrigatorio.' }, { status: 400 });
    }

    const { data: message, error: fetchError } = await supabaseAdmin
      .from('internal_chat_messages')
      .select('id,user_id,attachment_url')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Mensagem nao encontrada.' }, { status: 404 });
    }

    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Voce so pode apagar as proprias mensagens.' }, { status: 403 });
    }

    if (message.attachment_url) {
      const storagePath = getStoragePathFromPublicUrl(message.attachment_url);
      if (storagePath) {
        await supabaseAdmin.storage.from('internal-chat').remove([storagePath]);
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('internal_chat_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat interno: erro ao apagar mensagem.', error);
    return NextResponse.json({ error: 'Falha ao apagar a mensagem.' }, { status: 500 });
  }
}
