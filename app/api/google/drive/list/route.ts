import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDriveService } from '@/lib/google-drive';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let drive;
    
    try {
      // Try Service Account first
      drive = await getDriveService();
    } catch (err) {
      // Fallback to user tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('id', 2)
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json({ error: 'Google Drive não conectado' }, { status: 401 });
      }

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json({ error: 'Configuração do Google ausente' }, { status: 500 });
      }

      drive = await getDriveService({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expiry_date ? Number(tokenData.expiry_date) : undefined
      });
    }

    if (!drive) {
      return NextResponse.json({ error: 'Falha ao inicializar o Google Drive' }, { status: 500 });
    }

    // 2. Find the root folder "CBSL ERP Documents"
    const rootSearch = await drive.files.list({
      q: "name = 'CBSL ERP Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id)',
    });

    let rootFolderId = null;
    if (rootSearch.data.files && rootSearch.data.files.length > 0) {
      rootFolderId = rootSearch.data.files[0].id!;
    }

    let driveFiles = [];
    let subfolders = [];

    if (rootFolderId) {
      // 3. List all files in the selected root
      const subfoldersSearch = await drive.files.list({
        q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
      });

      subfolders = subfoldersSearch.data.files || [];
      const folderIds = [rootFolderId, ...subfolders.map(f => f.id!)];

      // Build query to find files in any of these folders (limit to first few folders to avoid too long query)
      const limitedFolderIds = folderIds.slice(0, 10);
      const folderQueries = limitedFolderIds.map(id => `'${id}' in parents`).join(' or ');
      
      const filesSearch = await drive.files.list({
        q: `(${folderQueries}) and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, parents)',
        pageSize: 50,
        orderBy: 'modifiedTime desc'
      });
      driveFiles = filesSearch.data.files || [];
    } else {
      // Fallback: Just list recent files if root folder not found
      const filesSearch = await drive.files.list({
        q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, parents)',
        pageSize: 50,
        orderBy: 'modifiedTime desc'
      });
      driveFiles = filesSearch.data.files || [];
    }

    // 4. Map Drive files to our Document format
    const mappedFiles = driveFiles.map(file => {
      // Find which subfolder it belongs to for category
      const parentId = file.parents?.[0];
      const categoryFolder = subfolders.find(f => f.id === parentId);
      const category = categoryFolder ? categoryFolder.name : 'Administrativos';

      return {
        id: `drive-${file.id}`,
        nome: file.name,
        Categoria: category,
        data: file.createdTime ? new Date(file.createdTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        tamanho_arquivo: file.size && !isNaN(parseInt(file.size)) ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : '-',
        tipo_arquivo: file.mimeType,
        drive_file_id: file.id,
        webViewLink: file.webViewLink,
        is_drive_only: true, // Flag to indicate it's only on Drive
        status: 'Vigente',
        Ano: file.createdTime ? new Date(file.createdTime).getFullYear().toString() : new Date().getFullYear().toString(),
        nome_icone: 'FileText',
        classe_cor: 'text-blue-400',
        classe_fundo: 'bg-blue-500/10'
      };
    });

    return NextResponse.json(mappedFiles);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error listing Drive files:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
