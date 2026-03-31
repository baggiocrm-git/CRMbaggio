import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDriveService } from '@/lib/google-drive';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // 1. Get document details
    const { data: doc, error: fetchError } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !doc) throw new Error('Documento não encontrado');
    if (doc.drive_file_id) return NextResponse.json({ message: 'Documento já sincronizado', drive_file_id: doc.drive_file_id });

    // 2. Download from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documentos')
      .download(doc.file_path);

    if (downloadError || !fileData) throw new Error('Falha ao baixar arquivo do storage');

    const fileBuffer = await fileData.arrayBuffer();

    // 3. Sync to Google Drive
    let drive;
    try {
      // Try Service Account first
      drive = await getDriveService();
      console.log('Using Service Account for manual sync');
      // Test connection
      await drive.files.list({ pageSize: 1 });
    } catch (err) {
      console.log('Service Account failed or not available, trying user tokens...');
      // Fallback to user tokens
      const { data: tokenData, error: tokenError } = await supabase
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
        console.log('Using User tokens for manual sync');
      } else {
        console.warn('No valid Google tokens found for fallback');
      }
    }

    if (!drive) {
      throw new Error('Não foi possível inicializar o serviço do Google Drive. Verifique as credenciais.');
    }

    let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    
    if (!rootFolderId) {
      console.log('Searching for "CBSL" root folder...');
      const rootSearch = await drive.files.list({
        q: "(name = 'CBSL' or name = 'CBSL ERP Documents') and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      if (rootSearch.data.files && rootSearch.data.files.length > 0) {
        rootFolderId = rootSearch.data.files[0].id!;
        console.log('Found root folder:', rootSearch.data.files[0].name, 'ID:', rootFolderId);
      } else {
        console.log('Root folder not found, creating "CBSL"...');
        const rootFolder = await drive.files.create({
          requestBody: {
            name: 'CBSL',
            mimeType: 'application/vnd.google-apps.folder',
          },
          fields: 'id',
          supportsAllDrives: true,
        });
        rootFolderId = rootFolder.data.id!;
        console.log('Created new root folder with ID:', rootFolderId);
      }
    }

    // Determine parent folder
    let driveParentId = rootFolderId;
    let effectiveCategory = doc.categoria || 'Geral';
    let isSpecificDriveFolder = false;

    if (doc.pasta_id) {
      // Check if it's a Drive ID (not a UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.pasta_id);
      if (!isUUID) {
        driveParentId = doc.pasta_id;
        isSpecificDriveFolder = true;
        console.log('Using document pasta_id as Drive parent:', driveParentId);
      } else {
        console.log('Document pasta_id is a UUID, fetching folder name...');
        const { data: folderData } = await supabase
          .from('pastas')
          .select('nome')
          .eq('id', doc.pasta_id)
          .single();
        
        if (folderData) {
          effectiveCategory = folderData.nome;
          console.log('Using folder name as category:', effectiveCategory);
        }
      }
    }

    // If still root, use category folder
    // BUT ONLY if we haven't already picked a specific Drive folder
    // AND ONLY if we are using the default root
    const isDefaultRoot = !process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!isSpecificDriveFolder && isDefaultRoot && (driveParentId === rootFolderId || !driveParentId)) {
      console.log('Finding or creating category folder:', effectiveCategory, 'under root:', rootFolderId);
      const catSearch = await drive.files.list({
        q: `name = '${effectiveCategory}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (catSearch.data.files && catSearch.data.files.length > 0) {
        driveParentId = catSearch.data.files[0].id!;
        console.log('Found existing category folder:', driveParentId);
      } else {
        console.log('Creating new category folder:', effectiveCategory);
        const catFolder = await drive.files.create({
          requestBody: {
            name: effectiveCategory,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId!],
          },
          fields: 'id',
          supportsAllDrives: true,
        });
        driveParentId = catFolder.data.id!;
        console.log('Created new category folder with ID:', driveParentId);
      }
    }

    // Upload to Drive
    const extension = doc.file_path.split('.').pop();
    const driveFileName = doc.nome.includes('.') ? doc.nome : `${doc.nome}.${extension}`;

    const driveFile = await drive.files.create({
      requestBody: {
        name: driveFileName,
        parents: [driveParentId!],
      },
      media: {
        mimeType: fileData.type,
        body: Buffer.from(fileBuffer),
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });

    if (driveFile.data.id) {
      // Update DB
      await supabase
        .from('documentos')
        .update({ 
          drive_file_id: driveFile.data.id,
          webViewLink: driveFile.data.webViewLink
        })
        .eq('id', id);
      
      return NextResponse.json({ 
        success: true, 
        drive_file_id: driveFile.data.id,
        webViewLink: driveFile.data.webViewLink
      });
    }

    throw new Error('Falha ao criar arquivo no Drive');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Manual Sync Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
