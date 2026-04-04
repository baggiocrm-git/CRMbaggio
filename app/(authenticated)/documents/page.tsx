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
  Upload,
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
import { DocumentModals } from '@/components/documents/DocumentModals';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { DocumentSidebar } from '@/components/documents/DocumentSidebar';

import { useDocuments, Document, Folder } from '@/hooks/useDocuments';

// Types
type DocumentCategory = 
  | 'Geral' 
  | 'Projetos' 
  | 'Outros';

type DocumentStatus = 'Vigente' | 'Vencido' | 'Arquivado';

const CATEGORIES: DocumentCategory[] = [
  'Geral',
  'Projetos',
  'Outros'
];

const AREAS = ['Todas', 'Engenharia', 'Obras', 'Outros'];
const STATUSES = ['Todos', 'Vigente', 'Vencido', 'Arquivado'];
const YEARS = [2026, 2025, 2024, 2023];

export default function DocumentManagementPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>('Todos');
  const [currentPath, setCurrentPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Todos os Documentos'}]);
  const currentFolderId = currentPath[currentPath.length - 1].id;
  
  const { 
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
  } = useDocuments(currentFolderId);

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
  
  // Multi-select State
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

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
    file: null as File | null
  });
  const [uploadFolderHistory, setUploadFolderHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Raiz'}]);
  const currentUploadFolderId = uploadFolderHistory[uploadFolderHistory.length - 1].id;

  const uploadFolders = useMemo(() => {
    const source = allFolders.length > 0 ? allFolders : folders;
    return source.filter(f => {
      if (currentUploadFolderId === 'root') return !f.parent_id || f.parent_id === 'root';
      return f.parent_id === currentUploadFolderId;
    });
  }, [allFolders, folders, currentUploadFolderId]);

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

  useEffect(() => {
    if (isModalOpen) {
      setUploadFolderHistory(currentPath);
      setNewDoc(prev => ({ ...prev, pasta_id: currentFolderId }));
    }
  }, [isModalOpen, currentPath, currentFolderId]);

  const fetchFolders = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
      formData.append('name', newDoc.name || newDoc.file.name.split('.').slice(0, -1).join('.'));
      if (newDoc.pasta_id !== 'root') {
        formData.append('pasta_id', newDoc.pasta_id);
      }

      setUploadProgress(30);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const result = await response.json();
      setUploadProgress(100);

      if (result.driveError) {
        showNotification(`Documento salvo no Supabase, mas erro no Google Drive: ${result.driveError}`, 'error');
      } else {
        showNotification('Documento enviado com sucesso');
      }
      
      fetchDocuments();

      setNewDoc({
        name: '',
        pasta_id: currentFolderId,
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

  const handleSyncToDrive = async (doc: Document) => {
    try {
      showNotification('Sincronizando com Drive...', 'info');
      const response = await fetch('/api/documents/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao sincronizar');
      }

      const result = await response.json();
      showNotification('Sincronizado com sucesso', 'success');
      fetchDocuments(); // Refresh to show the Drive icon
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification(message, 'error');
    }
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

  const handleDeleteSelected = async () => {
    if (selectedDocs.size === 0 && selectedFolders.size === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Selecionados',
      message: `Deseja realmente excluir ${selectedDocs.size} documentos e ${selectedFolders.size} pastas selecionados?`,
      onConfirm: async () => {
        try {
          // Delete Documents
          for (const docId of selectedDocs) {
            await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
          }
          // Delete Folders
          for (const folderId of selectedFolders) {
            await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
          }
          
          setSelectedDocs(new Set());
          setSelectedFolders(new Set());
          fetchDocuments();
          showNotification('Itens excluídos com sucesso');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          showNotification(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Documentos</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Repositório Central de Arquivos</p>
          </div>

          {/* Google Drive Connection Status - Moved Here */}
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-3 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-all",
                connectedAccount ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800/50 text-slate-500"
              )}>
                <Image 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  width={16} 
                  height={16} 
                  className={cn("rounded-full", !connectedAccount && "grayscale opacity-50")}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronização Google Drive</h4>
                <p className="text-[10px] font-bold text-white">
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
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border",
                  connectedAccount 
                    ? "bg-white/5 border-slate-800/50 text-slate-400 hover:text-white hover:bg-white/10" 
                    : "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a] hover:bg-[#c4ef2f]"
                )}
              >
                {connectedAccount ? 'Alterar' : 'Conectar'}
              </button>
            )}
            {isServiceAccount && (
              <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ativa</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(selectedDocs.size > 0 || selectedFolders.size > 0) && (
            <button 
              onClick={handleDeleteSelected}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-rose-500/10 active:scale-95"
            >
              <Trash2 size={18} />
              Excluir ({selectedDocs.size + selectedFolders.size})
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-[#d4ff3f]/10 active:scale-95"
          >
            <Upload size={18} />
            Upload para Drive
          </button>
        </div>
      </div>

      <DocumentModals 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        newDoc={newDoc}
        setNewDoc={setNewDoc}
        handleUpload={handleUpload}
        uploadFolderHistory={uploadFolderHistory}
        setUploadFolderHistory={setUploadFolderHistory}
        uploadFolders={uploadFolders}
        isDocRenameModalOpen={isDocRenameModalOpen}
        setIsDocRenameModalOpen={setIsDocRenameModalOpen}
        docRenameForm={docRenameForm}
        setDocRenameForm={setDocRenameForm}
        handleRenameDocument={handleRenameDocument}
        isMoveModalOpen={isMoveModalOpen}
        setIsMoveModalOpen={setIsMoveModalOpen}
        docToMove={docToMove}
        targetFolderId={targetFolderId}
        setTargetFolderId={setTargetFolderId}
        allFolders={allFolders}
        folders={folders}
        handleMoveDocument={handleMoveDocument}
        isFolderModalOpen={isFolderModalOpen}
        setIsFolderModalOpen={setIsFolderModalOpen}
        folderForm={folderForm}
        setFolderForm={setFolderForm}
        handleFolderSubmit={handleFolderSubmit}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
      />




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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <DocumentSidebar 
          folderTree={folderTree}
          currentFolderId={currentFolderId}
          setCurrentPath={setCurrentPath}
          allFolders={allFolders}
          folders={folders}
          setFolderForm={setFolderForm}
          setIsFolderModalOpen={setIsFolderModalOpen}
          handleDeleteFolder={handleDeleteFolder}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          connectedAccount={connectedAccount}
          documentsCount={documents.length}
          foldersCount={folders.length}
          AREAS={AREAS}
          STATUSES={STATUSES}
          YEARS={YEARS}
        />

        {/* Document List Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Google Drive Connection Status - MOVED UP */}

          {/* Search and View Options */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {currentPath.map((crumb, index) => (
                <React.Fragment key={crumb.id ? `crumb-${crumb.id}-${index}` : `crumb-idx-${index}`}>
                  <button
                    onClick={() => {
                      if (index < currentPath.length - 1) {
                        setCurrentPath(prev => prev.slice(0, index + 1));
                      }
                    }}
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
            <DocumentList 
              currentFolders={currentFolders}
              filteredDocuments={filteredDocuments}
              currentFolderId={currentFolderId}
              folders={folders}
              sortConfig={sortConfig}
              toggleSort={toggleSort}
              getSortIcon={getSortIcon}
              handleViewDocument={handleViewDocument}
              getFileExtension={getFileExtension}
              getFileUrl={getFileUrl}
              activeDocMenu={activeDocMenu}
              setActiveDocMenu={setActiveDocMenu}
              handleSyncToDrive={handleSyncToDrive}
              setDocRenameForm={setDocRenameForm}
              setIsDocRenameModalOpen={setIsDocRenameModalOpen}
              setDocToMove={setDocToMove}
              setTargetFolderId={setTargetFolderId}
              setIsMoveModalOpen={setIsMoveModalOpen}
              handleDeleteDocument={handleDeleteDocument}
              setCurrentPath={setCurrentPath}
              setSearchQuery={setSearchQuery}
              setSelectedArea={setSelectedArea}
              setSelectedStatus={setSelectedStatus}
              setSelectedYear={setSelectedYear}
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
              selectedFolders={selectedFolders}
              setSelectedFolders={setSelectedFolders}
            />
          ) : (
            <DocumentGrid 
              folders={folders}
              filteredDocuments={filteredDocuments}
              currentFolderId={currentFolderId}
              handleViewDocument={handleViewDocument}
              getFileExtension={getFileExtension}
              getFileUrl={getFileUrl}
              activeDocMenu={activeDocMenu}
              setActiveDocMenu={setActiveDocMenu}
              handleSyncToDrive={handleSyncToDrive}
              setDocRenameForm={setDocRenameForm}
              setIsDocRenameModalOpen={setIsDocRenameModalOpen}
              setDocToMove={setDocToMove}
              setTargetFolderId={setTargetFolderId}
              setIsMoveModalOpen={setIsMoveModalOpen}
              handleDeleteDocument={handleDeleteDocument}
              setCurrentPath={setCurrentPath}
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
              selectedFolders={selectedFolders}
              setSelectedFolders={setSelectedFolders}
            />
          )}
        </div>
      </div>
    </div>
  );
}
