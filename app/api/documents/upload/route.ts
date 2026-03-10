import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

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

    // 1. Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (storageError) throw storageError;

    // 2. Save to Supabase DB
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        name,
        category,
        date,
        file_path: storageData.path,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'Vigente',
        year: new Date(date).getFullYear()
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Sync to Google Drive
    try {
      // Get tokens
      const { data: tokenData } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('id', 'default_user')
        .single();

      if (tokenData) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.APP_URL}/api/auth/google/callback`
        );

        oauth2Client.setCredentials({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expiry_date: tokenData.expiry_date
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

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
          .from('documents')
          .update({ google_drive_id: driveFile.data.id })
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
