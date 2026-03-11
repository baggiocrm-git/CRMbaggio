import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = await params;
  
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('pastas')
      .update(body)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = await params;
  
  try {
    // Note: In a real app, you might want to handle recursive deletion or moving children
    const { error } = await supabase
      .from('pastas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
