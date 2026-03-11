import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const pastaId = searchParams.get('pasta_id');
  
  try {
    let query = supabase.from('documentos').select('*');
    
    if (pastaId) {
      if (pastaId === 'root') {
        query = query.is('pasta_id', null);
      } else {
        query = query.eq('pasta_id', pastaId);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { id, ...updates } = await req.json();
    const { data, error } = await supabase
      .from('documentos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    // 1. Get file path to delete from storage
    const { data: doc, error: fetchError } = await supabase
      .from('documentos')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Delete from storage
    if (doc?.file_path) {
      await supabase.storage.from('documentos').remove([doc.file_path]);
    }

    // 3. Delete from DB
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
