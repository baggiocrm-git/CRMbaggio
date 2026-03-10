import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { drive as googleDrive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;

    if (!file || !name || !category) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documentos')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (storageError) throw storageError;

    // 3. Save to Supabase DB
    const { data: dbData, error: dbError } = await supabase
      .from('documentos')
      .insert({
        nome: name,
        Categoria: category,
        data: date,
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

    if (dbError) throw dbError;

    // 4. Sync to Google Drive
    try {
      // Get tokens - using the most recent token
      const { data: tokenData } = await supabase
        .from('google_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (tokenData) {
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
