import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('POST /api/documents/upload - Request received');
  try {
    // Dynamic imports for heavy libraries
    const { drive: googleDrive } = await import('@googleapis/drive');
    const { OAuth2Client } = await import('google-auth-library');

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr) {
      console.error('Error parsing form data:', formErr);
      return NextResponse.json({ error: 'Falha ao processar os dados do formulário. O arquivo pode ser muito grande ou o formato é inválido.' }, { status: 400 });
    }
    
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const pastaId = formData.get('pasta_id') as string;
    const date = new Date().toISOString().split('T')[0]; // Automatic date

    console.log('Upload details:', { name, category, date, pastaId, fileSize: file?.size, fileType: file?.type });

    if (!file || !name || !category) {
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
      'Administrativos': 'Administrativo',
      'Jurídicos e Legais': 'Jurídico',
      'Financeiros e Contábeis': 'Financeiro',
      'Recursos Humanos': 'RH',
      'Comerciais e Marketing': 'Comercial',
      'Operacionais e Técnicos': 'Operacional'
    };

    // 3. Save to Supabase DB
    console.log('Saving to Supabase DB...');
    const { data: dbData, error: dbError } = await supabase
      .from('documentos')
      .insert({
        nome: name,
        Categoria: category,
        area: categoryToArea[category] || 'Administrativo',
        data: date,
        pasta_id: pastaId || null,
        file_path: storageData.path,
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
      console.log('Checking for Google Drive tokens...');
      // Get tokens - using the most recent token
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenError) {
        console.warn('Error fetching google_tokens (table might not exist yet):', tokenError);
      } else if (tokenData && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        console.log('Found Google tokens, starting Drive sync...');
        const oauth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.APP_URL}/api/auth/google/callback`
        );

        oauth2Client.setCredentials({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : undefined
        });

        const drive = googleDrive({ version: 'v3', auth: oauth2Client });

        // Find or create root folder
        let rootFolderId = '';
        const rootSearch = await drive.files.list({
          q: "name = 'CBSL ERP Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
          fields: 'files(id)',
        });

        if (rootSearch.data.files && rootSearch.data.files.length > 0) {
          rootFolderId = rootSearch.data.files[0].id!;
        } else {
          const rootFolder = await drive.files.create({
            requestBody: {
              name: 'CBSL ERP Documents',
              mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
          });
          rootFolderId = rootFolder.data.id!;
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
              parents: [rootFolderId],
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
        });

        // Update DB with Drive ID
        await supabase
          .from('documentos')
          .update({ Google_Drive_id: driveFile.data.id })
          .eq('id', dbData.id);
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
