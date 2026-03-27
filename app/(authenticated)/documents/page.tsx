'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Move,
  Edit2,
  ArrowUp,
  ArrowDown,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { FileTree, FileSystemItem } from '@/components/documents/FileTree';

// Types
type DocumentCategory = 
  | 'Administrativos' 
  | 'Jurídicos e Legais' 
  | 'Financeiros e Contábeis' 
  | 'Recursos Humanos' 
  | 'Comerciais e Marketing' 
  | 'Operacionais e Técnicos';

type DocumentStatus = 'Vigente' | 'Vencido' | 'Arquivado';

interface Document {
  id: string;
  nome: string;
  Categoria: DocumentCategory;
  area?: string;
  tipo_arquivo: string;
  status: DocumentStatus;
  Ano: string;
  data: string;
  tamanho_arquivo: string;
  file_path: string;
  pasta_id?: string | null;
  drive_file_id?: string | null;
  webViewLink?: string | null;
  caminho_local?: string | null;
}

interface Folder {
  id: string;
  nome: string;
  parent_id: string | null;
  created_at: string;
}

const CATEGORIES: DocumentCategory[] = [
  'Administrativos',
  'Jurídicos e Legais',
  'Financeiros e Contábeis',
  'Recursos Humanos',
  'Comerciais e Marketing',
  'Operacionais e Técnicos'
];

const AREAS = ['Todas', 'RH', 'Financeiro', 'Jurídico', 'Administrativo', 'Comercial', 'Operacional'];
const STATUSES = ['Todos', 'Vigente', 'Vencido', 'Arquivado'];
const YEARS = [2026, 2025, 2024, 2023];

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allFolders, setAllFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>('Todos');
  const [currentPath, setCurrentPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Drive Root'}]);
  const currentFolderId = currentPath[currentPath.length - 1].id;
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [isServiceAccount, setIsServiceAccount] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Document | 'folder';
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState(false);
  const [docRenameForm, setDocRenameForm] = useState({ id: '', nome: '' });
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [docToMove, setDocToMove] = useState<Document | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | 'root'>('root');
  const [activeDocMenu, setActiveDocMenu] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Notification State
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };
  
  // Form State
  const [newDoc, setNewDoc] = useState({
    name: '',
    pasta_id: 'root' as string | 'root',
    caminho_local: '',
    file: null as File | null
  });

  const [folderForm, setFolderForm] = useState({
    id: '',
    nome: '',
    parent_id: null as string | null,
    mode: 'create' as 'create' | 'edit'
  });

  useEffect(() => {
    if (newDoc.file && !newDoc.name) {
      setNewDoc(prev => ({ ...prev, name: prev.file?.name?.split('.')[0] || '' }));
    }
  }, [newDoc.file, newDoc.name]);

  const fetchDocuments = useCallback(async () => {
    console.log('fetchDocuments: Iniciando busca...', { currentFolderId });
    setIsLoading(true);
    try {
      let allDocs: any[] = [];
      let driveFoldersData: any[] = [];
      let supabaseFoldersData: any[] = [];
      
      // 1. Fetch ALL Folders for the Sidebar Tree (if not already fetched or periodically)
      try {
        const [driveFoldersRes, supabaseFoldersRes] = await Promise.all([
          fetch('/api/google/drive/list?type=folders_only'),
          fetch('/api/folders')
        ]);

        if (driveFoldersRes.ok && supabaseFoldersRes.ok) {
          const driveData = await driveFoldersRes.json();
          const supabaseData = await supabaseFoldersRes.json();
          
          const df = (driveData.folders || []).map((f: any) => ({ ...f, source: 'drive' }));
          const sf = (supabaseData || []).map((f: any) => ({ ...f, source: 'supabase' }));
          
          setAllFolders([...df, ...sf]);
        }
      } catch (err) {
        console.error('Error fetching all folders for tree:', err);
      }

      // 2. Fetch contents for the current view
      try {
        const driveUrl = currentFolderId && currentFolderId !== 'root' 
          ? `/api/google/drive/list?folderId=${currentFolderId}` 
          : '/api/google/drive/list';
        
        console.log('fetchDocuments: Buscando Drive em:', driveUrl);
        const driveResponse = await fetch(driveUrl);
        if (driveResponse.ok) {
          const driveData = await driveResponse.json();
          console.log('fetchDocuments: Resposta Drive:', driveData);
          if (!driveData.error) {
            driveFoldersData = (driveData.folders || []).map((f: any) => ({ ...f, source: 'drive' }));
            allDocs = (driveData.files || []).map((f: any) => ({ ...f, source: 'drive' }));
          }
        }
      } catch (driveErr) {
        console.error('Error fetching drive documents:', driveErr);
      }

      // 3. Fetch Folders from Supabase for current view
      try {
        const foldersResponse = await fetch('/api/folders');
        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json();
          if (Array.isArray(foldersData)) {
            const currentSupabaseFolders = foldersData.filter((f: any) => {
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
        
        const localResponse = await fetch(localUrl);
        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (!localData.error && Array.isArray(localData)) {
            const localDocsMap = new Map(localData.map((d: any) => [d.drive_file_id, d]));
            
            const mergedDriveDocs = allDocs.map((doc: any) => {
              if (doc.drive_file_id && localDocsMap.has(doc.drive_file_id)) {
                const localDoc = localDocsMap.get(doc.drive_file_id);
                return { ...doc, ...localDoc, is_drive_only: false, source: 'merged' };
              }
              return doc;
            });

            const driveFileIds = new Set(allDocs.map(d => d.drive_file_id));
            const localOnlyDocs = localData
              .filter((d: any) => !d.drive_file_id || !driveFileIds.has(d.drive_file_id))
              .map((d: any) => ({ ...d, source: 'supabase' }));

            allDocs = [...mergedDriveDocs, ...localOnlyDocs];
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

      setFolders(mergedFolders);
      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showNotification('Erro ao carregar documentos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId]);

  const fetchFolders = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const folderTree = useMemo(() => {
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => {
          // If it's a drive folder, its parent might be the root folder ID
          // We need to identify which folders are top-level in our view
          if (parentId === null) {
            return !item.parent_id || item.parent_id === 'root' || item.is_root_child;
          }
          return item.parent_id === parentId;
        })
        .map(item => ({
          ...item,
          type: 'folder',
          children: buildTree(items, item.id)
        }));
    };
    return buildTree(allFolders.length > 0 ? allFolders : folders, null);
  }, [allFolders, folders]);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      const data = await response.json();
      if (data.connected) {
        setConnectedAccount(data.email);
        setIsServiceAccount(data.isServiceAccount || false);
      } else {
        setConnectedAccount(null);
        setIsServiceAccount(false);
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        showNotification('Google Drive conectado com sucesso!', 'success');
        fetchAuthStatus();
        fetchDocuments();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        showNotification(`Erro ao conectar: ${event.data.message}`, 'error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchAuthStatus, fetchDocuments]);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, currentFolderId]);

  const currentFolders = useMemo(() => {
    return folders;
  }, [folders]);

  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      const matchesSearch = doc.nome.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArea = selectedArea === 'Todas' || doc.area === selectedArea;
      const matchesStatus = selectedStatus === 'Todos' || doc.status === selectedStatus;
      const matchesYear = selectedYear === 'Todos' || Number(doc.Ano) === selectedYear;
      
      return matchesSearch && matchesArea && matchesStatus && matchesYear;
    });

    return [...filtered].sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      if (sortConfig.key === 'folder') {
        aValue = folders.find(f => f.id === a.pasta_id)?.nome || 'Raiz';
        bValue = folders.find(f => f.id === b.pasta_id)?.nome || 'Raiz';
      } else {
        aValue = a[sortConfig.key as keyof Document];
        bValue = b[sortConfig.key as keyof Document];
      }

      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, searchQuery, selectedArea, selectedStatus, selectedYear, sortConfig, folders]);

  const toggleSort = (key: keyof Document | 'folder') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Document | 'folder') => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={10} className="ml-1" /> : <ArrowDown size={10} className="ml-1" />;
  };

  const getFileExtension = (doc: Document) => {
    if (doc?.nome) {
      const nameParts = String(doc.nome).split('.');
      if (nameParts.length > 1) {
        return `.${nameParts.pop()?.toLowerCase()}`;
      }
    }
    
    if (doc?.file_path) {
      const pathParts = String(doc.file_path).split('.');
      if (pathParts.length > 1) {
        return `.${pathParts.pop()?.toLowerCase()}`;
      }
    }

    if (doc?.tipo_arquivo) {
      const tipo = String(doc.tipo_arquivo);
      if (tipo.includes('pdf')) return '.pdf';
      if (tipo.includes('word') || tipo.includes('officedocument.wordprocessingml')) return '.docx';
      if (tipo.includes('excel') || tipo.includes('officedocument.spreadsheetml')) return '.xlsx';
      if (tipo.includes('image/jpeg')) return '.jpg';
      if (tipo.includes('image/png')) return '.png';
      if (tipo.includes('text/plain')) return '.txt';
    }
    
    return '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', newDoc.file);
      formData.append('name', newDoc.name);
      formData.append('caminho_local', newDoc.caminho_local);
      if (newDoc.pasta_id !== 'root') {
        formData.append('pasta_id', newDoc.pasta_id);
      }

      setUploadProgress(30);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      setUploadProgress(100);
      showNotification('Documento enviado com sucesso');
      fetchDocuments();

      setNewDoc({
        name: '',
        pasta_id: currentFolderId,
        caminho_local: '',
        file: null
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Upload error:', error);
      showNotification(message, 'error');
      setIsUploading(false);
    }
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = folderForm.mode === 'create' ? '/api/folders' : `/api/folders/${folderForm.id}`;
      const method = folderForm.mode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: folderForm.nome,
          parent_id: folderForm.parent_id
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar pasta');
      
      setIsFolderModalOpen(false);
      fetchFolders();
      showNotification(folderForm.id ? 'Pasta atualizada com sucesso' : 'Pasta criada com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification(message, 'error');
    }
  };

  const handleDeleteFolder = async (folder: FileSystemItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Pasta',
      message: `Deseja realmente excluir a pasta "${folder.nome}"? Isso não excluirá os arquivos dentro dela, mas eles ficarão sem pasta.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Erro ao excluir pasta');
          fetchFolders();
          if (currentFolderId === folder.id) setCurrentPath([{id: 'root', name: 'Drive Root'}]);
          showNotification('Pasta excluída com sucesso');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          showNotification(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRenameDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docRenameForm.id, nome: docRenameForm.nome }),
      });

      if (!response.ok) throw new Error('Falha ao renomear documento');

      setDocuments(docs => docs.map(d => d.id === docRenameForm.id ? { ...d, nome: docRenameForm.nome } : d));
      setIsDocRenameModalOpen(false);
      showNotification('Documento renomeado com sucesso');
    } catch (error) {
      console.error('Error renaming document:', error);
      showNotification('Erro ao renomear documento', 'error');
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Documento',
      message: `Deseja realmente excluir o documento "${doc.nome}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Erro ao excluir documento');
          fetchDocuments();
          showNotification('Documento excluído com sucesso');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          showNotification(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleMoveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToMove || !targetFolderId) return;

    try {
      const response = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: docToMove.id, 
          pasta_id: targetFolderId === 'root' ? null : targetFolderId 
        }),
      });

      if (!response.ok) throw new Error('Falha ao mover documento');

      setIsMoveModalOpen(false);
      showNotification('Documento movido com sucesso');
      fetchDocuments();
    } catch (error) {
      console.error('Error moving document:', error);
      showNotification('Erro ao mover documento', 'error');
    }
  };

  const handleViewDocument = (doc: Document) => {
    if (doc.webViewLink) {
      window.open(doc.webViewLink, '_blank');
    } else {
      const url = getFileUrl(doc.file_path);
      window.open(url, '_blank');
    }
  };

  const handleOpenLocal = (doc: Document) => {
    if (doc.caminho_local) {
      navigator.clipboard.writeText(doc.caminho_local);
      showNotification('Caminho local copiado para a área de transferência');
      
      // Try to open via Office URI scheme if it's an office file
      const ext = getFileExtension(doc);
      if (['.docx', '.xlsx', '.pptx'].includes(ext)) {
        const protocol = ext === '.docx' ? 'ms-word' : ext === '.xlsx' ? 'ms-excel' : 'ms-powerpoint';
        // This only works if we have a public URL, but we can try with the Supabase URL
        const url = getFileUrl(doc.file_path);
        if (url !== '#') {
          window.location.href = `${protocol}:ofe|u|${url}`;
        }
      }
    } else {
      showNotification('Caminho local não definido para este documento', 'error');
    }
  };

  const getFileUrl = (path?: string) => {
    if (!path) return '#';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/documentos/${path}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Documentos</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Repositório Central de Arquivos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-[#d4ff3f]/10 active:scale-95"
        >
          <Plus size={18} />
          Novo Documento
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Novo Documento</h2>
              
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Documento</label>
                  <input 
                    type="text" 
                    required
                    value={newDoc.name}
                    onChange={e => setNewDoc({...newDoc, name: e.target.value})}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pasta Destino</label>
                  <select 
                    value={newDoc.pasta_id}
                    onChange={e => setNewDoc({...newDoc, pasta_id: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                  >
                    <option value="root">Raiz (Sem Pasta)</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Caminho Local (PC)</label>
                  <input 
                    type="text" 
                    value={newDoc.caminho_local}
                    onChange={e => setNewDoc({...newDoc, caminho_local: e.target.value})}
                    placeholder="Ex: G:\Meu Drive\Documentos\arquivo.docx"
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                  />
                  <p className="text-[9px] text-slate-600 ml-1 italic">Dica: Use o caminho do Google Drive for Desktop para sincronização automática.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arquivo</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      required
                      key={isModalOpen ? 'open' : 'closed'}
                      onChange={e => setNewDoc({...newDoc, file: e.target.files?.[0] || null})}
                      className="hidden" 
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-[#0a0a0a] border-2 border-dashed border-slate-800/50 rounded-2xl cursor-pointer hover:border-[#d4ff3f]/50 transition-all group"
                    >
                      {newDoc.file ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="text-[#d4ff3f]" size={32} />
                          <span className="text-xs font-bold text-white">{newDoc.file.name}</span>
                          <span className="text-[10px] text-slate-500">{(newDoc.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Plus className="text-slate-600 group-hover:text-[#d4ff3f] transition-colors" size={32} />
                          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Clique para selecionar arquivo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Fazendo upload...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-[#d4ff3f]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploading || !newDoc.file}
                    className="flex-1 bg-[#d4ff3f] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                  >
                    {isUploading ? 'Processando...' : 'Salvar Documento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Document Rename Modal */}
        {isDocRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDocRenameModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">
                Renomear Documento
              </h2>
              
              <form onSubmit={handleRenameDocument} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Documento</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={docRenameForm.nome}
                    onChange={e => setDocRenameForm({...docRenameForm, nome: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsDocRenameModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Move Document Modal */}
        {isMoveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoveModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                Mover Documento
              </h2>
              <p className="text-xs text-slate-500 mb-6">Selecione a pasta de destino para o documento <strong>{docToMove?.nome}</strong></p>
              
              <form onSubmit={handleMoveDocument} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pasta de Destino</label>
                  <select 
                    value={targetFolderId}
                    onChange={e => setTargetFolderId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                  >
                    <option value="root">Todos os Documentos (Raiz)</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsMoveModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                  >
                    Mover
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Folder Modal */}
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFolderModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">
                {folderForm.mode === 'create' ? 'Nova Pasta' : 'Renomear Pasta'}
              </h2>
              
              <form onSubmit={handleFolderSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Pasta</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={folderForm.nome}
                    onChange={e => setFolderForm({...folderForm, nome: e.target.value})}
                    placeholder="Ex: Contratos 2025"
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="size-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">{confirmModal.title}</h2>
              <p className="text-slate-400 text-sm font-bold mb-8">{confirmModal.message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Notification Toast */}
        <AnimatePresence>
          {notification.show && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={cn(
                "fixed bottom-8 left-1/2 z-[70] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]",
                notification.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}
            >
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Navegação</h3>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <FileTree 
                  data={folderTree}
                  selectedId={currentFolderId}
                  onItemClick={(item) => {
                    if (item.id === 'root') {
                      setCurrentPath([{id: 'root', name: 'Drive Root'}]);
                    } else {
                      const folder = allFolders.find(f => f.id === item.id) || folders.find(f => f.id === item.id);
                      if (folder) {
                        // Build path by traversing parents if possible, or just jump to it
                        // For simplicity, we'll jump to it but we could improve this
                        setCurrentPath([{id: 'root', name: 'Drive Root'}, {id: folder.id, name: folder.nome}]);
                      }
                    }
                  }}
                  onNewFolder={(parentId) => {
                    setFolderForm({ id: '', nome: '', parent_id: parentId, mode: 'create' });
                    setIsFolderModalOpen(true);
                  }}
                  onRename={(item) => {
                    setFolderForm({ id: item.id, nome: item.nome, parent_id: item.parent_id || null, mode: 'edit' });
                    setIsFolderModalOpen(true);
                  }}
                  onDelete={(item) => handleDeleteFolder(item)}
                />
              </div>
            </div>

            <div className="h-px bg-slate-800/50" />

            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Status da Conexão</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Supabase:</span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase">Ativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Google Drive:</span>
                  <span className={cn(
                    "text-[8px] font-bold uppercase",
                    connectedAccount ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {connectedAccount ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Arquivos:</span>
                  <span className="text-[8px] font-bold text-white uppercase">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Pastas:</span>
                  <span className="text-[8px] font-bold text-white uppercase">{folders.length}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-800/50" />

            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Filtros Avançados</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Área</label>
                  <select 
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                  >
                    {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                  >
                    {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Pasta</label>
                  <select 
                    value={currentFolderId}
                    onChange={(e) => {
                      if (e.target.value === 'root') {
                        setCurrentPath([{id: 'root', name: 'Drive Root'}]);
                      } else {
                        const folder = folders.find(f => f.id === e.target.value);
                        if (folder) setCurrentPath(prev => [...prev, {id: folder.id, name: folder.nome}]);
                      }
                    }}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                  >
                    <option value="root">Todos os Documentos</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Ano</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                  >
                    <option value="Todos">Todos</option>
                    {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document List Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Google Drive Connection Status */}
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center transition-all",
                connectedAccount ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800/50 text-slate-500"
              )}>
                <Image 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  width={20} 
                  height={20} 
                  className={cn("rounded-full", !connectedAccount && "grayscale opacity-50")}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronização Google Drive</h4>
                <p className="text-xs font-bold text-white">
                  {connectedAccount ? connectedAccount : 'Não configurado'}
                </p>
              </div>
            </div>
            {!isServiceAccount && (
              <button 
                onClick={async () => {
                  const res = await fetch('/api/auth/google/url');
                  const { url } = await res.json();
                  window.open(url, 'google_auth', 'width=600,height=700');
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  connectedAccount 
                    ? "bg-white/5 border-slate-800/50 text-slate-400 hover:text-white hover:bg-white/10" 
                    : "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a] hover:bg-[#c4ef2f]"
                )}
              >
                {connectedAccount ? 'Alterar Conta' : 'Conectar Agora'}
              </button>
            )}
            {isServiceAccount && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronização Automática Ativa</span>
              </div>
            )}
          </div>

          {/* Search and View Options */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {currentPath.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <button
                    onClick={() => setCurrentPath(prev => prev.slice(0, index + 1))}
                    className={cn(
                      "text-xs font-bold whitespace-nowrap transition-colors",
                      index === currentPath.length - 1 ? "text-white" : "text-slate-500 hover:text-[#d4ff3f]"
                    )}
                  >
                    {crumb.name}
                  </button>
                  {index < currentPath.length - 1 && (
                    <span className="text-slate-700">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar documentos por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-2xl py-3 pl-12 pr-4 text-white font-bold text-sm focus:ring-2 focus:ring-[#d4ff3f]/20 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-1">
                <select 
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-');
                    setSortConfig({ 
                      key: key as keyof Document | 'folder', 
                      direction: direction as 'asc' | 'desc' 
                    });
                  }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 outline-none cursor-pointer hover:text-white transition-colors"
                >
                  <option value="nome-asc">Nome (A-Z)</option>
                  <option value="nome-desc">Nome (Z-A)</option>
                  <option value="created_at-desc">Data (Mais Recente)</option>
                  <option value="created_at-asc">Data (Mais Antigo)</option>
                  {currentFolderId === 'root' && <option value="folder-asc">Pasta</option>}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    viewMode === 'list' ? "bg-[#0a0a0a] text-[#d4ff3f] shadow-inner" : "text-slate-500 hover:text-white"
                  )}
                  title="Visualização em Lista"
                >
                  <ListIcon size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    viewMode === 'grid' ? "bg-[#0a0a0a] text-[#d4ff3f] shadow-inner" : "text-slate-500 hover:text-white"
                  )}
                  title="Visualização em Grade"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Documents View */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-slate-800/50 rounded-3xl">
              <div className="size-12 border-4 border-[#d4ff3f]/20 border-t-[#d4ff3f] rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Carregando Documentos...</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden">
              <div className="overflow-x-hidden overflow-y-auto max-h-[800px] min-h-[280px]">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th 
                        className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors w-1/2"
                        onClick={() => toggleSort('nome')}
                      >
                        <div className="flex items-center">
                          Documento
                          {getSortIcon('nome')}
                        </div>
                      </th>
                      {currentFolderId === 'root' && (
                        <th 
                          className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                          onClick={() => toggleSort('folder')}
                        >
                          <div className="flex items-center">
                            Pasta
                            {getSortIcon('folder')}
                          </div>
                        </th>
                      )}
                      <th 
                        className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('Categoria')}
                      >
                        <div className="flex items-center">
                          Tipo
                          {getSortIcon('Categoria')}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    <AnimatePresence mode='popLayout'>
                      {currentFolders.map(folder => (
                        <motion.tr
                          key={folder.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setCurrentPath(prev => [...prev, { id: folder.id, name: folder.nome }])}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                                <FolderOpen size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-1">{folder.nome}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pasta</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4"><p className="text-xs font-bold text-slate-400 uppercase">-</p></td>
                          {currentFolderId === 'root' && <td className="px-4 py-4"><p className="text-xs font-bold text-slate-400 uppercase">-</p></td>}
                          <td className="px-4 py-4"><p className="text-xs font-bold text-slate-400 uppercase">-</p></td>
                          <td className="px-4 py-4"></td>
                        </motion.tr>
                      ))}
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc, index) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={doc.id || `doc-list-${index}`} 
                            className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-[#0a0a0a] border border-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-[#d4ff3f] transition-colors">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#d4ff3f] transition-colors">{doc.nome}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{doc.tamanho_arquivo}</p>
                                </div>
                              </div>
                            </td>
                            {currentFolderId === 'root' && (
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5">
                                  <FolderOpen size={10} className="text-slate-500" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1">
                                    {folders.find(f => f.id === doc.pasta_id)?.nome || 'Raiz'}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="px-4 py-4">
                              <p className="text-xs font-bold text-slate-300 uppercase">{getFileExtension(doc)}</p>
                            </td>
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLocal(doc);
                                  }}
                                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#d4ff3f] transition-all" 
                                  title="Abrir no PC (Copia Caminho)"
                                >
                                  <Move size={16} />
                                </button>
                                {doc.webViewLink && (
                                  <a 
                                    href={doc.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#d4ff3f] transition-all" 
                                    title="Ver no Google Drive"
                                  >
                                    <Image 
                                      src="https://www.google.com/favicon.ico" 
                                      alt="Drive" 
                                      width={16} 
                                      height={16} 
                                      className="rounded-full opacity-50 group-hover:opacity-100"
                                      referrerPolicy="no-referrer"
                                    />
                                  </a>
                                )}
                                <button 
                                  onClick={() => handleViewDocument(doc)}
                                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                                  title="Visualizar"
                                >
                                  <Eye size={16} />
                                </button>
                                {!doc.is_drive_only && (
                                  <a 
                                    href={getFileUrl(doc.file_path)}
                                    download={doc.nome}
                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                                    title="Download"
                                  >
                                    <Download size={16} />
                                  </a>
                                )}
                                
                                <div className="relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDocMenu(activeDocMenu === doc.id ? null : doc.id);
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                                    title="Mais opções"
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  <AnimatePresence>
                                    {activeDocMenu === doc.id && (
                                      <motion.div 
                                        key="backdrop"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-10" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDocMenu(null);
                                        }} 
                                      />
                                    )}
                                    {activeDocMenu === doc.id && (
                                      <motion.div
                                        key="menu"
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-full mt-1 z-50 w-48 bg-[#1a1a1a] border border-slate-800 rounded-2xl shadow-2xl p-1"
                                      >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDocMenu(null);
                                              setDocRenameForm({ id: doc.id, nome: doc.nome });
                                              setIsDocRenameModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                          >
                                            <Edit2 size={12} />
                                            Renomear
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDocMenu(null);
                                              setDocToMove(doc);
                                              setTargetFolderId(doc.pasta_id || 'root');
                                              setIsMoveModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                          >
                                            <Move size={12} />
                                            Mover
                                          </button>
                                          <div className="h-px bg-slate-800 my-1" />
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDocMenu(null);
                                              handleDeleteDocument(doc);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                          >
                                            <Trash2 size={12} />
                                            Excluir
                                          </button>
                                          </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : folders.length === 0 ? (
                        <tr>
                          <td colSpan={currentFolderId === 'root' ? 4 : 3} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-600">
                              <Search size={40} strokeWidth={1} />
                              <p className="text-sm font-bold">Nenhum documento encontrado com estes filtros.</p>
                              <button 
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedArea('Todas');
                                  setSelectedStatus('Todos');
                                  setSelectedYear('Todos');
                                  setCurrentPath([{id: 'root', name: 'Drive Root'}]);
                                }}
                                className="text-[#d4ff3f] text-xs font-black uppercase tracking-widest hover:underline"
                              >
                                Limpar Filtros
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Footer / Pagination Info */}
              <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#1a1a1a] sticky bottom-0 z-10">
                <p>Mostrando {filteredDocuments.length} de {documents.length} documentos</p>
                <div className="flex items-center gap-4">
                  <button className="hover:text-white transition-colors disabled:opacity-30" disabled>Anterior</button>
                  <div className="flex items-center gap-2">
                    <span className="text-white bg-white/5 px-2 py-1 rounded">1</span>
                  </div>
                  <button className="hover:text-white transition-colors disabled:opacity-30" disabled>Próximo</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode='popLayout'>
                  {folders.map(folder => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={folder.id}
                      onClick={() => setCurrentPath(prev => [...prev, { id: folder.id, name: folder.nome }])}
                      className="group bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-6 hover:border-yellow-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="size-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:text-yellow-400 transition-colors">
                          <FolderOpen size={24} />
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">{folder.nome}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pasta</p>
                    </motion.div>
                  ))}
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={doc.id || `doc-grid-${index}`}
                      className="group bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-6 hover:border-[#d4ff3f]/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="size-12 rounded-2xl bg-[#0a0a0a] border border-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-[#d4ff3f] transition-colors cursor-pointer"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <FileText size={24} />
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-6 cursor-pointer" onClick={() => handleViewDocument(doc)}>
                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#d4ff3f] transition-colors">{doc.nome}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span>{doc.tamanho_arquivo}</span>
                          <span className="size-1 rounded-full bg-slate-800" />
                          <span className="uppercase">{getFileExtension(doc)}</span>
                        </div>
                        {currentFolderId === 'root' && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <FolderOpen size={10} className="text-slate-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              {folders.find(f => f.id === doc.pasta_id)?.nome || 'Raiz'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/30">
                        <div className="flex items-center gap-1.5 text-white">
                          <CalendarIcon size={12} className="text-slate-500" />
                          <span className="text-xs font-black">{doc.Ano}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLocal(doc);
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#d4ff3f] transition-all" 
                            title="Abrir no PC (Copia Caminho)"
                          >
                            <Move size={16} />
                          </button>
                          {doc.webViewLink && (
                            <a 
                              href={doc.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#d4ff3f] transition-all" 
                              title="Ver no Google Drive"
                            >
                              <Image 
                                src="https://www.google.com/favicon.ico" 
                                alt="Drive" 
                                width={16} 
                                height={16} 
                                className="rounded-full opacity-50 group-hover:opacity-100"
                                referrerPolicy="no-referrer"
                              />
                            </a>
                          )}
                          <button 
                            onClick={() => handleViewDocument(doc)}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>
                          {!doc.is_drive_only && (
                            <a 
                              href={getFileUrl(doc.file_path)}
                              download={doc.nome}
                              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                          )}

                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDocMenu(activeDocMenu === doc.id ? null : doc.id);
                              }}
                              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                              title="Mais opções"
                            >
                              <MoreVertical size={16} />
                            </button>

                            <AnimatePresence>
                              {activeDocMenu === doc.id && (
                                <motion.div 
                                  key="backdrop"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDocMenu(null);
                                  }} 
                                />
                              )}
                              {activeDocMenu === doc.id && (
                                <motion.div
                                  key="menu"
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 bottom-full mb-1 z-50 w-48 bg-[#1a1a1a] border border-slate-800 rounded-2xl shadow-2xl p-1"
                                >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDocMenu(null);
                                        setDocRenameForm({ id: doc.id, nome: doc.nome });
                                        setIsDocRenameModalOpen(true);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                    >
                                      <Edit2 size={12} />
                                      Renomear
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDocMenu(null);
                                        setDocToMove(doc);
                                        setTargetFolderId(doc.pasta_id || 'root');
                                        setIsMoveModalOpen(true);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                    >
                                      <Move size={12} />
                                      Mover
                                    </button>
                                    <div className="h-px bg-slate-800 my-1" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDocMenu(null);
                                        handleDeleteDocument(doc);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                      <Trash2 size={12} />
                                      Excluir
                                    </button>
                                    </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : folders.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Search size={40} strokeWidth={1} />
                      <p className="text-sm font-bold">Nenhum documento encontrado.</p>
                    </div>
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
