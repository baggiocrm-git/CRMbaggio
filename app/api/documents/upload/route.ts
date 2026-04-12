import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import { authorizeRequest } from '@/lib/server-auth';

// ─── Mapa de pastas do Google Drive ───────────────────────────────────────────
// Cada chave corresponde a uma variável de ambiente com o ID da pasta no Drive.
// Para adicionar novas pastas: inclua no .env.local e adicione aqui.
const DRIVE_FOLDERS: Record<string, string | undefined> = {
  uploads:           process.env.GOOGLE_DRIVE_FOLDER_CBSL,           // pasta raiz / fallback
  custos:            process.env.GOOGLE_DRIVE_FOLDER_CUSTOS,
  escritorio_cbsl:   process.env.GOOGLE_DRIVE_FOLDER_ESCRITORIO_CBSL,
  nfe_marketup:      process.env.GOOGLE_DRIVE_FOLDER_NFE_MARKETUP,
  nfse_pmpg:         process.env.GOOGLE_DRIVE_FOLDER_NFSE_PMPG,
  obras_realizadas:  process.env.GOOGLE_DRIVE_FOLDER_OBRAS_REALIZADAS,
  ordem_de_compra:   process.env.GOOGLE_DRIVE_FOLDER_ORDEM_DE_COMPRA,
  relatorios_kadu:   process.env.GOOGLE_DRIVE_FOLDER_RELATORIOS_KADU,
  setor_pessoal:     process.env.GOOGLE_DRIVE_FOLDER_SETOR_PESSOAL,
  transponta:        process.env.GOOGLE_DRIVE_FOLDER_TRANSPONTA,
  // documentos_castro_alves: process.env.GOOGLE_DRIVE_FOLDER_DOCUMENTOS_CASTRO_ALVES,
};

/**
 * Resolve o ID da pasta do Drive a partir de:
 * 1. drive_folder_key enviado pelo frontend (ex: "custos")
 * 2. pastaId UUID do Supabase → busca nome → tenta mapear pela chave normalizada
 * 3. pastaId que já é um ID do Drive diretamente (não-UUID)
 * 4. Fallback: GOOGLE_DRIVE_FOLDER_UPLOADS → GOOGLE_DRIVE_ROOT_FOLDER_ID → 'root'
 */
function normalizeFolderKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function resolveDriveFolderFromKey(key: string): string | undefined {
  const normalized = normalizeFolderKey(key);
  return DRIVE_FOLDERS[normalized];
}

export async function POST(req: NextRequest) {
  console.log('POST /api/documents/upload - Request received');
  try {
    const authorization = await authorizeRequest(req);
    if (!authorization.ok) {
      return authorization.response;
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr) {
      console.error('Error parsing form data:', formErr);
      return NextResponse.json(
        { error: 'Falha ao processar os dados do formulário. O arquivo pode ser muito grande ou o formato é inválido.' },
        { status: 400 }
      );
    }

    const category     = (formData.get('category') as string) || (formData.get('categoria') as string) || 'Geral';
    const pastaId      = formData.get('pasta_id') as string;
    const driveFolderKey = formData.get('drive_folder_key') as string | null; // ex: "custos"
    const file         = formData.get('file') as File;
    const name         = formData.get('name') as string;
    const date         = new Date().toISOString().split('T')[0];

    console.log('Upload details:', { name, category, date, pastaId, driveFolderKey, fileSize: file?.size, fileType: file?.type });

    if (!file || !name) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing');
      return NextResponse.json({ error: 'Configuração do Supabase ausente no servidor' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Garantir que o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      const bucketExists = buckets?.some(b => b.name === 'documentos');
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket('documentos', { public: true });
        if (createError) {
          console.error('Error creating bucket:', createError);
          throw new Error(`O bucket 'documentos' não existe e não pôde ser criado automaticamente.`);
        }
      }
    }

    // 2. Upload para o Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const fileBuffer = await file.arrayBuffer();

    const sanitizedOriginalName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');

    const fileName = `${Date.now()}-${sanitizedOriginalName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('documentos')
      .upload(fileName, fileBuffer, { contentType: file.type, upsert: true });

    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }
    console.log('Storage upload success:', storageData.path);

    const categoryToArea: Record<string, string> = {
      'Geral': 'Outros',
      'Projetos': 'Engenharia',
      'Outros': 'Outros',
    };

    // 3. Salvar no banco Supabase
    console.log('Saving to Supabase DB...');
    const { data: dbData, error: dbError } = await supabase
      .from('documentos')
      .insert({
        nome: name,
        Categoria: category,
        area: categoryToArea[category] || 'Outros',
        data: date,
        pasta_id: pastaId || null,
        file_path: storageData.path,
        tamanho_arquivo: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        tipo_arquivo: file.type,
        status: 'Vigente',
        Ano: new Date(date).getFullYear().toString(),
        nome_icone: 'FileText',
        classe_cor: 'text-slate-400',
        classe_fundo: 'bg-[#0a0a0a]',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
    console.log('Database save success:', dbData.id);

    // 4. Sincronizar com Google Drive via OAuth do usuário
    try {
      console.log('Starting Google Drive sync via user OAuth...');
      const { getDriveService } = await import('@/lib/google-drive');

      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('id', 2)
        .single();

      if (tokenError || !tokenData) {
        console.warn('No user OAuth tokens found, skipping Drive sync');
        return NextResponse.json({
          success: true,
          data: dbData,
          driveError: 'Tokens OAuth não encontrados. Conecte o Google Drive nas configurações.',
        });
      }

      console.log('User OAuth tokens found, initializing Drive service...');
      const drive = await getDriveService({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expiry_date ? Number(tokenData.expiry_date) : undefined,
      });

      // ─── Resolução da pasta de destino no Drive ──────────────────────────────
      //
      // Prioridade:
      //   1. drive_folder_key enviado pelo frontend → mapa DRIVE_FOLDERS
      //   2. pastaId = ID direto do Drive (não-UUID)
      //   3. pastaId = UUID do Supabase → busca nome → tenta normalizar no mapa
      //   4. Fallback: UPLOADS → ROOT → 'root'
      //
      const fallbackFolderId =
        DRIVE_FOLDERS['uploads'] ||
        process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
        'root';

      let driveParentId: string = fallbackFolderId;

      if (driveFolderKey) {
        // Caso 1: frontend enviou a chave explícita
        const resolved = resolveDriveFolderFromKey(driveFolderKey);
        if (resolved) {
          driveParentId = resolved;
          console.log(`Drive folder resolved from key "${driveFolderKey}":`, driveParentId);
        } else {
          console.warn(`drive_folder_key "${driveFolderKey}" não encontrado no mapa, usando fallback.`);
        }
      } else if (pastaId && pastaId !== 'root') {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pastaId);

        if (!isUUID) {
          // Caso 2: ID direto do Drive
          driveParentId = pastaId;
          console.log('Using direct Drive folder ID from pastaId:', driveParentId);
        } else {
          // Caso 3: UUID do Supabase → busca nome → normaliza → mapa
          console.log('pastaId is UUID, fetching folder name from Supabase...');
          const { data: folderData } = await supabase
            .from('pastas')
            .select('nome')
            .eq('id', pastaId)
            .single();

          if (folderData?.nome) {
            const resolved = resolveDriveFolderFromKey(folderData.nome);
            if (resolved) {
              driveParentId = resolved;
              console.log(`Drive folder resolved from Supabase name "${folderData.nome}":`, driveParentId);
            } else {
              console.warn(`Pasta "${folderData.nome}" não tem mapeamento no Drive, usando fallback.`);
            }
          }
        }
      }

      console.log('Final driveParentId:', driveParentId);

      // ─── Upload para o Drive ─────────────────────────────────────────────────
      const driveBuffer = Buffer.from(await file.arrayBuffer());
      const readableStream = Readable.from(driveBuffer);

      const extension = file.name.split('.').pop();
      const driveFileName = name.includes('.') ? name : `${name}.${extension}`;
      console.log('Uploading to Drive:', driveFileName, '→', driveParentId);

      try {
        const driveFile = await drive.files.create({
          requestBody: {
            name: driveFileName,
            parents: [driveParentId],
          },
          media: {
            mimeType: file.type,
            body: readableStream,
          },
          fields: 'id, webViewLink',
        });

        console.log('Drive upload response:', driveFile.data);

        if (driveFile.data.id) {
          const { error: updateError } = await supabase
            .from('documentos')
            .update({
              drive_file_id: driveFile.data.id,
              webViewLink: driveFile.data.webViewLink,
            })
            .eq('id', dbData.id);

          if (updateError) {
            console.error('Error updating DB with Drive info:', updateError);
          } else {
            console.log('Google Drive sync successful, Drive ID:', driveFile.data.id);
          }
        }
      } catch (apiErr: unknown) {
        const err = apiErr as { message?: string; response?: { data: unknown } };
        console.error('Google Drive API Create Error:', err.message, err.response?.data || apiErr);
        return NextResponse.json({
          success: true,
          data: dbData,
          driveError: err.message || 'Erro ao fazer upload para o Google Drive',
        });
      }
    } catch (driveErr: unknown) {
      const err = driveErr as { message?: string };
      console.error('General Google Drive Sync Error:', driveErr);
      return NextResponse.json({
        success: true,
        data: dbData,
        driveError: err.message || 'Erro na sincronização com Google Drive',
      });
    }

    return NextResponse.json({ success: true, data: dbData });
  } catch (error) {
    const err = error as Error;
    console.error('Upload error:', error);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
