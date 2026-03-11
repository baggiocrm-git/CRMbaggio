'use client';

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
  Tag,
  CheckCircle2,
  AlertCircle,
  Archive,
  LayoutGrid,
  List as ListIcon
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
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'Todos'>('Todos');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>('Todos');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'root'>('root');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docRenameForm, setDocRenameForm] = useState({ id: '', nome: '' });
  
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
    category: 'Administrativos' as DocumentCategory,
    pasta_id: 'root' as string | 'root',
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
      setNewDoc(prev => ({ ...prev, name: prev.file?.name.split('.')[0] || '' }));
    }
  }, [newDoc.file, newDoc.name]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/documents', window.location.origin);
      if (selectedFolderId) {
        url.searchParams.append('pasta_id', selectedFolderId);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedFolderId, fetchDocuments]);

  const folderTreeData = useMemo(() => {
    const buildTree = (parentId: string | null): FileSystemItem[] => {
      return folders
        .filter(f => f.parent_id === parentId)
        .map(f => ({
          id: f.id,
          nome: f.nome,
          type: 'folder',
          parent_id: f.parent_id,
          children: buildTree(f.id)
        }));
    };
    return buildTree(null);
  }, [folders]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.nome.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || doc.Categoria === selectedCategory;
      const matchesArea = selectedArea === 'Todas' || doc.area === selectedArea;
      const matchesStatus = selectedStatus === 'Todos' || doc.status === selectedStatus;
      const matchesYear = selectedYear === 'Todos' || Number(doc.Ano) === selectedYear;
      
      return matchesSearch && matchesCategory && matchesArea && matchesStatus && matchesYear;
    });
  }, [documents, searchQuery, selectedCategory, selectedArea, selectedStatus, selectedYear]);

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'Vigente': return 'text-emerald-500 bg-emerald-500/10';
      case 'Vencido': return 'text-rose-500 bg-rose-500/10';
      case 'Arquivado': return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'Vigente': return <CheckCircle2 size={12} />;
      case 'Vencido': return <AlertCircle size={12} />;
      case 'Arquivado': return <Archive size={12} />;
    }
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
      formData.append('category', newDoc.category);
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
        category: 'Administrativos',
        pasta_id: selectedFolderId,
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
          if (selectedFolderId === folder.id) setSelectedFolderId('root');
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

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  const getFileUrl = (path: string) => {
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                    <select 
                      value={newDoc.category}
                      onChange={e => setNewDoc({...newDoc, category: e.target.value as DocumentCategory})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
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

        {/* Document Viewer Modal */}
        {isViewerOpen && selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewerOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl h-[85vh] bg-[#1a1a1a] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#0a0a0a]/50">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-[#1a1a1a] border border-slate-800 flex items-center justify-center text-[#d4ff3f]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">{selectedDoc.nome}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedDoc.Categoria} • {selectedDoc.tamanho_arquivo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={getFileUrl(selectedDoc.file_path)} 
                    download={selectedDoc.nome}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                    title="Download"
                  >
                    <Download size={18} />
                  </a>
                  <button 
                    onClick={() => setIsViewerOpen(false)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-white/5 relative">
                {selectedDoc.tipo_arquivo.includes('image') ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img 
                      src={getFileUrl(selectedDoc.file_path)} 
                      alt={selectedDoc.nome}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                ) : selectedDoc.tipo_arquivo.includes('pdf') ? (
                  <iframe 
                    src={`${getFileUrl(selectedDoc.file_path)}#toolbar=0`}
                    className="w-full h-full border-none"
                    title={selectedDoc.nome}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
                    <AlertCircle size={48} strokeWidth={1} />
                    <p className="text-sm font-bold">Visualização não disponível para este tipo de arquivo.</p>
                    <a 
                      href={getFileUrl(selectedDoc.file_path)} 
                      download
                      className="text-[#d4ff3f] text-xs font-black uppercase tracking-widest hover:underline"
                    >
                      Baixar para visualizar
                    </a>
                  </div>
                )}
              </div>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Explorador de Arquivos</h3>
                <button 
                  onClick={() => {
                    setFolderForm({ id: '', nome: '', parent_id: null, mode: 'create' });
                    setIsFolderModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-[#d4ff3f] transition-all"
                  title="Nova Pasta Raiz"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="bg-[#0a0a0a] rounded-2xl p-2 border border-slate-800/30">
                <FileTree 
                  data={folderTreeData}
                  selectedId={selectedFolderId}
                  onItemClick={(item) => setSelectedFolderId(item.id)}
                  onNewFolder={(parentId) => {
                    setFolderForm({ id: '', nome: '', parent_id: parentId, mode: 'create' });
                    setIsFolderModalOpen(true);
                  }}
                  onRename={(item) => {
                    setFolderForm({ id: item.id, nome: item.nome, parent_id: item.parent_id || null, mode: 'edit' });
                    setIsFolderModalOpen(true);
                  }}
                  onDelete={handleDeleteFolder}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/50">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sincronização</h3>
              <button 
                onClick={async () => {
                  const res = await fetch('/api/auth/google/url');
                  const { url } = await res.json();
                  window.open(url, 'google_auth', 'width=600,height=700');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-slate-800/50"
              >
                <Image 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  width={16} 
                  height={16} 
                  className="rounded-full"
                  referrerPolicy="no-referrer"
                />
                Conectar Google Drive
              </button>
              <p className="text-[9px] text-slate-600 mt-2 text-center">Necessário para backup automático</p>
            </div>

            <div className="pt-6 border-t border-slate-800/50">
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
          {/* Search and View Options */}
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

          {/* Documents View */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-slate-800/50 rounded-3xl">
              <div className="size-12 border-4 border-[#d4ff3f]/20 border-t-[#d4ff3f] rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Carregando Documentos...</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Área / Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data / Ano</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    <AnimatePresence mode='popLayout'>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc, index) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={doc.id || `doc-list-${index}`} 
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-[#0a0a0a] border border-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-[#d4ff3f] transition-colors">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white line-clamp-1">{doc.nome}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{doc.tamanho_arquivo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <Tag size={10} className="text-slate-500" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{doc.area || 'N/A'}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-300">{doc.tipo_arquivo}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                getStatusColor(doc.status)
                              )}>
                                {getStatusIcon(doc.status)}
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <CalendarIcon size={10} />
                                  <span className="text-[10px] font-bold">{new Date(doc.data).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <p className="text-xs font-black text-white">{doc.Ano}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setDocRenameForm({ id: doc.id, nome: doc.nome });
                                    setIsDocRenameModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                                  title="Renomear"
                                >
                                  <Plus size={16} className="rotate-45" />
                                </button>
                                <button 
                                  onClick={() => handleViewDocument(doc)}
                                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                                  title="Visualizar"
                                >
                                  <Eye size={16} />
                                </button>
                                <a 
                                  href={getFileUrl(doc.file_path)}
                                  download={doc.nome}
                                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                                  title="Download"
                                >
                                  <Download size={16} />
                                </a>
                                <button 
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all" 
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-600">
                              <Search size={40} strokeWidth={1} />
                              <p className="text-sm font-bold">Nenhum documento encontrado com estes filtros.</p>
                              <button 
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedCategory('Todos');
                                  setSelectedArea('Todas');
                                  setSelectedStatus('Todos');
                                  setSelectedYear('Todos');
                                }}
                                className="text-[#d4ff3f] text-xs font-black uppercase tracking-widest hover:underline"
                              >
                                Limpar Filtros
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Footer / Pagination Info */}
              <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode='popLayout'>
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
                        <div className="size-12 rounded-2xl bg-[#0a0a0a] border border-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-[#d4ff3f] transition-colors">
                          <FileText size={24} />
                        </div>
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          getStatusColor(doc.status)
                        )}>
                          {doc.status}
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-6">
                        <h3 className="text-sm font-bold text-white line-clamp-1">{doc.nome}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span>{doc.tamanho_arquivo}</span>
                          <span className="size-1 rounded-full bg-slate-800" />
                          <span>{doc.tipo_arquivo}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/30">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <CalendarIcon size={12} />
                          <span className="text-[10px] font-bold">{new Date(doc.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setDocRenameForm({ id: doc.id, nome: doc.nome });
                              setIsDocRenameModalOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
                            title="Renomear"
                          >
                            <Plus size={16} className="rotate-45" />
                          </button>
                          <button 
                            onClick={() => handleViewDocument(doc)}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                          >
                            <Eye size={16} />
                          </button>
                          <a 
                            href={getFileUrl(doc.file_path)}
                            download={doc.nome}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                          >
                            <Download size={16} />
                          </a>
                          <button 
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all" 
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Search size={40} strokeWidth={1} />
                      <p className="text-sm font-bold">Nenhum documento encontrado.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
