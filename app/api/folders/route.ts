import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase
      .from('pastas')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { nome, parent_id } = await req.json();
    
    const { data, error } = await supabase
      .from('pastas')
      .insert({ nome, parent_id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
