import { useState, useCallback, useEffect, useMemo } from 'react';
import { authFetch } from '@/lib/auth-fetch';

export interface Document {
  id: string;
  nome: string;
  Categoria: 'Geral' | 'Projetos' | 'Outros';
  area?: string;
  tipo_arquivo: string;
  status: 'Vigente' | 'Vencido' | 'Arquivado';
  Ano: string;
  data: string;
  tamanho_arquivo: string;
  file_path: string;
  pasta_id?: string | null;
  drive_file_id?: string | null;
  webViewLink?: string | null;
  is_drive_only?: boolean;
}

export interface Folder {
  id: string;
  nome: string;
  parent_id: string | null;
  created_at: string;
}

function getDriveDocumentId(doc: Partial<Document> & { id?: string | null; drive_file_id?: string | null }) {
  if (doc.drive_file_id) return doc.drive_file_id;
  if (doc.id?.startsWith('drive-')) return doc.id.slice('drive-'.length);
  return doc.id || null;
}

export function useDocuments(currentFolderId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allFolders, setAllFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      let allDocs: any[] = [];
      let driveFoldersData: any[] = [];
      let supabaseFoldersData: any[] = [];
      
      // 1. Fetch ALL Folders for the Sidebar Tree
      try {
        const [driveFoldersRes, supabaseFoldersRes] = await Promise.allSettled([
          authFetch('/api/google/drive/list?type=folders_only'),
          authFetch('/api/folders')
        ]);

        let df: any[] = [];
        let sf: any[] = [];

        if (driveFoldersRes.status === 'fulfilled' && driveFoldersRes.value.ok) {
          const driveData = await driveFoldersRes.value.json();
          df = (driveData.folders || [])
            .filter((f: any) => f.id && f.id !== '')
            .map((f: any) => ({ ...f, source: 'drive' }));
        }

        if (supabaseFoldersRes.status === 'fulfilled' && supabaseFoldersRes.value.ok) {
          const supabaseData = await supabaseFoldersRes.value.json();
          sf = (supabaseData || [])
            .filter((f: any) => f.id && f.id !== '')
            .map((f: any) => ({ ...f, source: 'supabase' }));
        }
        
        const combinedFolders = [...df, ...sf].sort((a, b) => 
          (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' })
        );
        setAllFolders(combinedFolders);
      } catch (err) {
        console.error('Error fetching all folders for tree:', err);
      }

      // 2. Fetch contents for the current view
      try {
        const driveUrl = currentFolderId && currentFolderId !== 'root' 
          ? `/api/google/drive/list?folderId=${currentFolderId}` 
          : '/api/google/drive/list';
        
        const driveResponse = await authFetch(driveUrl);
        if (driveResponse.ok) {
          const driveData = await driveResponse.json();
          if (!driveData.error) {
            driveFoldersData = (driveData.folders || [])
              .filter((f: any) => f.id && f.id !== '')
              .map((f: any) => ({ ...f, source: 'drive' }));
            allDocs = (driveData.files || [])
              .filter((f: any) => f.id && f.id !== '')
              .map((f: any) => ({ ...f, source: 'drive' }));
          }
        }
      } catch (driveErr) {
        console.error('Error fetching drive documents:', driveErr);
      }

      // 3. Fetch Folders from Supabase for current view
      try {
        const foldersResponse = await authFetch('/api/folders');
        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json();
          if (Array.isArray(foldersData)) {
            const currentSupabaseFolders = foldersData
              .filter((f: any) => {
                if (!f.id || f.id === '') return false;
                if (currentFolderId === 'root') return !f.parent_id || f.parent_id === 'root';
                return f.parent_id === currentFolderId;
              });
            supabaseFoldersData = currentSupabaseFolders.map((f: any) => ({ ...f, source: 'supabase' }));
          }
        }
      } catch (foldersErr) {
        console.error('Error fetching supabase folders:', foldersErr);
      }

      // 4. Fetch Documents from Supabase
      try {
        const localUrl = currentFolderId && currentFolderId !== 'root'
          ? `/api/documents?pasta_id=${currentFolderId}` 
          : '/api/documents?pasta_id=root';
        
        const localResponse = await authFetch(localUrl);
        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (!localData.error && Array.isArray(localData)) {
            const validLocalData = localData.filter((d: any) => d.id && d.id !== '');
            const localDocsMap = new Map(
              validLocalData
                .filter((d: any) => d.drive_file_id)
                .map((d: any) => [d.drive_file_id, d])
            );
             
            const mergedDriveDocs = allDocs.map((doc: any) => {
              const driveId = getDriveDocumentId(doc);
              if (driveId && localDocsMap.has(driveId)) {
                const localDoc = localDocsMap.get(driveId);
                return { ...doc, ...localDoc, is_drive_only: false, source: 'merged' };
              }
              return { ...doc, is_drive_only: true };
            });

            const driveFileIds = new Set(
              allDocs
                .map((d: any) => getDriveDocumentId(d))
                .filter(Boolean)
            );
            const localOnlyDocs = validLocalData
              .filter((d: any) => !d.drive_file_id)
              .map((d: any) => ({ ...d, source: 'supabase' }));

            const staleDriveRefs = validLocalData.filter(
              (d: any) => d.drive_file_id && !driveFileIds.has(d.drive_file_id)
            );

            if (staleDriveRefs.length > 0) {
              console.warn(
                'Ignoring stale document records without matching Drive files:',
                staleDriveRefs.map((doc: any) => ({ id: doc.id, nome: doc.nome, drive_file_id: doc.drive_file_id }))
              );
            }

            const dedupedDocs = new Map<string, any>();
            [...mergedDriveDocs, ...localOnlyDocs].forEach((doc: any) => {
              const identity = doc.drive_file_id || doc.file_path || doc.id;
              if (!identity) return;
              dedupedDocs.set(identity, doc);
            });

            allDocs = Array.from(dedupedDocs.values());
          }
        }
      } catch (localErr) {
        console.error('Error fetching local documents:', localErr);
      }

      const mergedFolders = [...driveFoldersData];
      supabaseFoldersData.forEach(sf => {
        if (!mergedFolders.find(mf => mf.id === sf.id)) {
          mergedFolders.push(sf);
        }
      });

      const sortedFolders = [...mergedFolders].sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' })
      );

      const sortedDocs = [...allDocs].sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' })
      );

      setFolders(sortedFolders);
      setDocuments(sortedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, currentFolderId]);

  const folderTree = useMemo(() => {
    const buildTree = (items: any[], parentId: string | null = null, visited = new Set<string>()): any[] => {
      const itemIds = new Set(items.map(i => i.id));
      return items
        .filter(item => {
          if (parentId === null) {
            return !item.parent_id || item.parent_id === 'root' || item.is_root_child || !itemIds.has(item.parent_id);
          }
          return item.parent_id === parentId;
        })
        .map(item => {
          if (visited.has(item.id)) return null;
          const newVisited = new Set(visited);
          newVisited.add(item.id);
          return {
            ...item,
            type: 'folder',
            children: buildTree(items, item.id, newVisited)
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' }));
    };
    return buildTree(allFolders, null);
  }, [allFolders]);

  return {
    documents,
    setDocuments,
    folders,
    setFolders,
    allFolders,
    setAllFolders,
    isLoading,
    setIsLoading,
    fetchDocuments,
    folderTree
  };
}
