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
  const { searchParams } = new URL(req.url);
  const folderIdParam = searchParams.get('folderId');

  try {
    let drive;
    
    try {
      // Try Service Account first
      console.log('Trying Service Account...');
      const saDrive = await getDriveService();
      // Test the service account with a simple call
      await saDrive.files.list({ pageSize: 1 });
      drive = saDrive;
      console.log('Service Account success');
    } catch (err) {
      console.log('Service Account failed or not available, trying user tokens...', err);
      // Fallback to user tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('id', 2) // Assuming ID 2 is the user's token
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json({ error: 'Google Drive não conectado', details: tokenError }, { status: 401 });
      }

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json({ error: 'Configuração do Google ausente' }, { status: 500 });
      }

      drive = await getDriveService({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expiry_date ? Number(tokenData.expiry_date) : undefined
      });
      console.log('User tokens success');
    }

    if (!drive) {
      return NextResponse.json({ error: 'Falha ao inicializar o Google Drive' }, { status: 500 });
    }

    const typeParam = searchParams.get('type');

    let targetFolderId = (folderIdParam === 'null' || folderIdParam === 'undefined') ? null : folderIdParam;

    if (typeParam === 'folders_only') {
      // Find all possible root folders named "CBSL" or "CBSL ERP Documents"
      const rootSearch = await drive.files.list({
        q: "(name = 'CBSL' or name = 'CBSL ERP Documents') and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });
      
      const rootIds = new Set((rootSearch.data.files || []).map(f => f.id));

      let allFolders: any[] = [];
      let pageToken: string | undefined = undefined;

      do {
        const response: any = await drive.files.list({
          q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
          fields: 'nextPageToken, files(id, name, parents)',
          pageSize: 1000,
          pageToken: pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: 'allDrives',
        });
        
        if (response.data.files) {
          allFolders = [...allFolders, ...response.data.files];
        }
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      
      const folders = allFolders
        .filter(f => {
          // Hide the root folders themselves from the tree (they are represented by "Todos os Documentos")
          if (rootIds.has(f.id)) return false;
          return true;
        })
        .map(f => {
          const parentId = f.parents && f.parents.length > 0 ? f.parents[0] : 'root';
          // If the parent is one of our root folders, mark it as top-level
          const isTopLevel = rootIds.has(parentId) || parentId === 'root';
          
          return {
            id: f.id,
            nome: f.name,
            parent_id: isTopLevel ? 'root' : parentId,
            type: 'folder'
          };
        });

      return NextResponse.json({ folders });
    }

    if (!targetFolderId || targetFolderId === 'root') {
      // Find the root folder "CBSL"
      console.log('Searching for root folder...');
      const rootSearch = await drive.files.list({
        q: "(name = 'CBSL' or name = 'CBSL ERP Documents') and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });
      console.log('Root search result:', rootSearch.data.files);

      if (rootSearch.data.files && rootSearch.data.files.length > 0) {
        targetFolderId = rootSearch.data.files[0].id!;
      } else {
        // If not found, use the actual Drive root
        targetFolderId = 'root';
      }
    }

    // List contents of targetFolderId
    console.log('Listing contents of folder:', targetFolderId);
    let items: any[] = [];
    try {
      const contentsSearch = await drive.files.list({
        q: `'${targetFolderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, parents)',
        pageSize: 1000,
        orderBy: 'folder, name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      console.log('Contents search result:', contentsSearch.data.files?.length, 'items');

      items = contentsSearch.data.files || [];
    } catch (listErr: any) {
      console.error('Error in drive.files.list:', listErr.message, listErr.response?.data);
      throw listErr;
    }

    const folders = items
      .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
      .map(f => ({
        id: f.id,
        nome: f.name,
        parent_id: (targetFolderId === 'root' || folderIdParam === 'root' || !folderIdParam) ? 'root' : targetFolderId,
        type: 'folder'
      }));

    const files = items
      .filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
      .map(file => ({
        id: `drive-${file.id}`,
        nome: file.name,
        Categoria: 'Drive',
        data: file.createdTime ? new Date(file.createdTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        tamanho_arquivo: file.size && !isNaN(parseInt(file.size)) ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : '-',
        tipo_arquivo: file.mimeType,
        drive_file_id: file.id,
        webViewLink: file.webViewLink,
        is_drive_only: true,
        status: 'Vigente',
        Ano: file.createdTime ? new Date(file.createdTime).getFullYear().toString() : new Date().getFullYear().toString(),
        nome_icone: 'FileText',
        classe_cor: 'text-blue-400',
        classe_fundo: 'bg-blue-500/10',
        pasta_id: (targetFolderId === 'root' || folderIdParam === 'root' || !folderIdParam) ? 'root' : targetFolderId
      }));

    return NextResponse.json({ folders, files });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error listing Drive files:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
