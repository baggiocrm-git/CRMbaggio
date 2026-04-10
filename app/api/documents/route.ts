import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AlignmentType, Document as DocxDocument, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const categoryToArea: Record<string, string> = {
  Geral: 'Outros',
  Projetos: 'Engenharia',
  Outros: 'Outros',
};
const typePrompts: Record<string, string> = {
  livre: 'Gere um documento empresarial claro, profissional e objetivo em portugues do Brasil.',
  oficio: 'Gere um oficio formal empresarial em portugues do Brasil, com linguagem objetiva e institucional.',
  comunicado: 'Gere um comunicado interno ou externo claro, profissional e direto em portugues do Brasil.',
  ata: 'Gere uma ata profissional, com estrutura organizada e linguagem formal em portugues do Brasil.',
  relatorio: 'Gere um relatorio profissional com secoes claras, linguagem objetiva e foco executivo em portugues do Brasil.',
  contrato: 'Gere uma minuta contratual simples e profissional em portugues do Brasil, deixando pontos variaveis claramente identificados quando necessario.',
};

type OpenRouterSuccessPayload = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OpenRouterErrorPayload = {
  error?: {
    message?: string;
    code?: string;
    metadata?: unknown;
  } | string;
};

export async function GET(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const pastaId = searchParams.get('pasta_id');
  
  try {
    let query = supabase.from('documentos').select('*');
    
    if (pastaId === 'root' || pastaId === 'null' || pastaId === 'undefined') {
      query = query.is('pasta_id', null);
    } else if (pastaId) {
      query = query.eq('pasta_id', pastaId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  const missingEnv = [
    !baseUrl ? 'OPENAI_BASE_URL' : null,
    !apiKey ? 'OPENAI_API_KEY' : null,
    !model ? 'OPENAI_MODEL' : null,
  ].filter(Boolean);

  if (missingEnv.length > 0) {
    return NextResponse.json(
      { error: `Configuracao da IA ausente no servidor: ${missingEnv.join(', ')}.` },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const configuredFallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  try {
    const body = await req.json();
    const { name, prompt, category = 'Geral', pasta_id = null, format = 'markdown', documentType = 'livre' } = body as {
      name?: string;
      prompt?: string;
      category?: 'Geral' | 'Projetos' | 'Outros';
      pasta_id?: string | null;
      format?: 'markdown' | 'text' | 'docx';
      documentType?: string;
    };

    if (!name?.trim() || !prompt?.trim()) {
      return NextResponse.json({ error: 'Nome do arquivo e instrucoes sao obrigatorios.' }, { status: 400 });
    }

    const systemPrompt = `${typePrompts[documentType] || typePrompts.livre}

Regras:
- Responda somente com o conteudo do documento.
- Nao use cercas de codigo.
- Mantenha tom profissional.
- Use portugues do Brasil.
`;

    const candidateModels = Array.from(
      new Set(
        [
          model,
          ...(model.includes(':free') ? ['openrouter/free'] : []),
          ...configuredFallbacks,
        ].filter(Boolean)
      )
    );

    let content = '';
    let lastStatus = 500;
    const attemptErrors: string[] = [];

    for (const candidateModel of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const aiResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': appUrl,
            'X-Title': 'Baggio CRM',
          },
          body: JSON.stringify({
            model: candidateModel,
            temperature: 0.4,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt.trim() },
            ],
          }),
        });

        lastStatus = aiResponse.status || 500;
        const aiPayload = (await aiResponse.json()) as OpenRouterSuccessPayload & OpenRouterErrorPayload;

        if (aiResponse.ok) {
          const candidateContent = aiPayload?.choices?.[0]?.message?.content?.trim();
          if (candidateContent) {
            content = candidateContent;
            break;
          }

          attemptErrors.push(`${candidateModel} (tentativa ${attempt}): resposta vazia do provider`);
        } else {
          const providerMessage =
            typeof aiPayload?.error === 'string'
              ? aiPayload.error
              : aiPayload?.error?.message || 'Provider returned error';
          attemptErrors.push(`${candidateModel} (tentativa ${attempt}): ${providerMessage}`);
        }
      }

      if (content) break;
    }

    if (!content) {
      return NextResponse.json(
        {
          error: attemptErrors.length
            ? `Falha ao gerar com os modelos testados: ${attemptErrors.join(' | ')}`
            : 'A IA nao retornou conteudo para o documento.',
        },
        { status: lastStatus || 500 }
      );
    }

    const extension = format === 'text' ? 'txt' : format === 'docx' ? 'docx' : 'md';
    const mimeType =
      format === 'text'
        ? 'text/plain; charset=utf-8'
        : format === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/markdown; charset=utf-8';
    const sanitizedName = name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}.${extension}`;
    const documentTitle = name.trim();
    const documentSubtitle =
      documentType === 'livre'
        ? 'Documento gerado por IA'
        : `${documentType.charAt(0).toUpperCase()}${documentType.slice(1)} gerado por IA`;
    const companyName = 'Construtora Baggio Silveira Ltda.';
    const docxParagraphs = content
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .map((line) => {
        if (line.length === 0) {
          return new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } });
        }

        if (/^#{1,3}\s+/.test(line)) {
          const cleanLine = line.replace(/^#{1,3}\s+/, '');
          return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 120 },
            children: [new TextRun({ text: cleanLine, bold: true, size: 24 })],
          });
        }

        if (/^[-*]\s+/.test(line)) {
          return new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: line.replace(/^[-*]\s+/, ''), size: 22 })],
          });
        }

        return new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: line, size: 22 })],
        });
      });

    const contentBuffer =
      format === 'docx'
        ? Buffer.from(
            await Packer.toBuffer(
              new DocxDocument({
                sections: [
                  {
                    properties: {},
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 60 },
                        children: [new TextRun({ text: companyName, bold: true, size: 20 })],
                      }),
                      new Paragraph({
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 80 },
                        children: [new TextRun({ text: documentTitle, bold: true, size: 34 })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 280 },
                        children: [new TextRun({ text: documentSubtitle, italics: true, size: 20 })],
                      }),
                      ...docxParagraphs,
                    ],
                  },
                ],
              })
            )
          )
        : Buffer.from(content, 'utf8');

    const { data: storageData, error: storageError } = await supabase.storage
      .from('documentos')
      .upload(fileName, contentBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (storageError) throw storageError;

    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome: `${name.trim()}.${extension}`,
        Categoria: category,
        area: categoryToArea[category] || 'Outros',
        data: isoDate,
        pasta_id: pasta_id && pasta_id !== 'root' ? pasta_id : null,
        file_path: storageData.path,
        tamanho_arquivo: `${(contentBuffer.byteLength / 1024).toFixed(2)} KB`,
        tipo_arquivo: mimeType,
        status: 'Vigente',
        Ano: String(today.getFullYear()),
        nome_icone: 'FileText',
        classe_cor: 'text-slate-400',
        classe_fundo: 'bg-[#0a0a0a]',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, document: data, content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao gerar documento com IA.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }
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
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }
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
