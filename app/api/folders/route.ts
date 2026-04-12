import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req);
  if (!authorization.ok) {
    return authorization.response;
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const FOLDERS_TO_REMOVE = [
      "Administrativo",
      "Comercial",
      "Financeiro",
      "Jurídico",
      "Operacional",
      "Recursos Humanos",
      "TI & Segurança"
    ];

    const { data, error } = await supabase
      .from('pastas')
      .select('*')
      .not('nome', 'in', `(${FOLDERS_TO_REMOVE.map(f => `"${f}"`).join(',')})`)
      .order('nome', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authorization = await authorizeRequest(req);
  if (!authorization.ok) {
    return authorization.response;
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }
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
