import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('POST /api/documents/upload - Request received');
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr) {
      console.error('Error parsing form data:', formErr);
      return NextResponse.json({ error: 'Falha ao processar os dados do formulário. O arquivo pode ser muito grande ou o formato é inválido.' }, { status: 400 });
    }
    
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = (formData.get('category') as string) || 'Geral';
    const pastaId = formData.get('pasta_id') as string;
    const caminhoLocal = formData.get('caminho_local') as string;
    const date = new Date().toISOString().split('T')[0]; // Automatic date

    console.log('Upload details:', { name, category, date, pastaId, caminhoLocal, fileSize: file?.size, fileType: file?.type });

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

    // 1. Ensure bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      const bucketExists = buckets?.some(b => b.name === 'documentos');
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket('documentos', {
          public: true,
        });
        if (createError) {
          console.error('Error creating bucket:', createError);
          throw new Error(`O bucket 'documentos' não existe e não pôde ser criado automaticamente. Por favor, crie-o no painel do Supabase.`);
        }
      }
    }

    // 2. Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const fileBuffer = await file.arrayBuffer();
    
    // Sanitize filename for Supabase Storage
    const sanitizedOriginalName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscore
      
    const fileName = `${Date.now()}-${sanitizedOriginalName}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documentos')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }
    console.log('Storage upload success:', storageData.path);

    const categoryToArea: Record<string, string> = {
      'Geral': 'Outros',
      'Projetos': 'Engenharia',
      'Outros': 'Outros'
    };

    // 3. Save to Supabase DB
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
        caminho_local: caminhoLocal || null,
        tamanho_arquivo: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        tipo_arquivo: file.type,
        status: 'Vigente',
        Ano: new Date(date).getFullYear().toString(),
        nome_icone: 'FileText',
        classe_cor: 'text-slate-400',
        classe_fundo: 'bg-[#0a0a0a]'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
    console.log('Database save success:', dbData.id);

    // 4. Sync to Google Drive
    try {
      console.log('Starting Google Drive sync...');
      const { getDriveService } = await import('@/lib/google-drive');
      
      // Try Service Account first for automatic access
      let drive;
      try {
        drive = await getDriveService();
        console.log('Using Service Account for Drive sync');
      } catch (err) {
        console.warn('Service Account not available, trying user tokens:', err);
        // Fallback to user tokens if Service Account fails
        const { data: tokenData } = await supabase
          .from('google_tokens')
          .select('*')
          .eq('id', 2)
          .single();

        if (tokenData && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
          drive = await getDriveService({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expiry_date: tokenData.expiry_date ? Number(tokenData.expiry_date) : undefined
          });
        }
      }

      if (drive) {
        // Use specific folder ID if provided, otherwise default to 'CBSL'
        let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        
        if (!rootFolderId) {
          console.log('GOOGLE_DRIVE_ROOT_FOLDER_ID not set, searching for "CBSL"');
          const rootSearch = await drive.files.list({
            q: "name = 'CBSL' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id)',
          });

          if (rootSearch.data.files && rootSearch.data.files.length > 0) {
            rootFolderId = rootSearch.data.files[0].id!;
          } else {
            const rootFolder = await drive.files.create({
              requestBody: {
                name: 'CBSL',
                mimeType: 'application/vnd.google-apps.folder',
              },
              fields: 'id',
            });
            rootFolderId = rootFolder.data.id!;
          }
        }

        // Find or create category folder
        let categoryFolderId = '';
        const catSearch = await drive.files.list({
          q: `name = '${category}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id)',
        });

        if (catSearch.data.files && catSearch.data.files.length > 0) {
          categoryFolderId = catSearch.data.files[0].id!;
        } else {
          const catFolder = await drive.files.create({
            requestBody: {
              name: category,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [rootFolderId!],
            },
            fields: 'id',
          });
          categoryFolderId = catFolder.data.id!;
        }

        // Upload file to Drive
        const driveFile = await drive.files.create({
          requestBody: {
            name: file.name,
            parents: [categoryFolderId],
          },
          media: {
            mimeType: file.type,
            body: Buffer.from(fileBuffer),
          },
          fields: 'id, webViewLink',
        });

        // Update DB with Drive ID and Link
        await supabase
          .from('documentos')
          .update({ 
            drive_file_id: driveFile.data.id,
            webViewLink: driveFile.data.webViewLink
          })
          .eq('id', dbData.id);
        
        console.log('Google Drive sync successful:', driveFile.data.id);
      }
    } catch (driveErr) {
      console.error('Google Drive Sync Error:', driveErr);
      // Don't fail the whole request if Drive sync fails
    }

    return NextResponse.json({ success: true, data: dbData });
  } catch (error) {
    const err = error as Error;
    console.error('Upload error:', error);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
