'use client';

import React, { useState, useMemo } from 'react';
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
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

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
}

// Mock Tree Data
const INITIAL_TREE_DATA: FileSystemItem[] = [
  {
    id: 'folder-admin',
    nome: 'Administrativos',
    type: 'folder',
    isOpen: true,
    children: [
      { id: '1', nome: 'Contrato Social - Alteração 2024', type: 'file' },
      { id: '8', nome: 'Ata de Reunião de Sócios', type: 'file' },
      {
        id: 'folder-contracts',
        nome: 'Contratos Antigos',
        type: 'folder',
        children: [
          { id: 'sub-1', nome: 'Contrato 2022.pdf', type: 'file' },
          { id: 'sub-2', nome: 'Contrato 2021.pdf', type: 'file' },
        ]
      }
    ]
  },
  {
    id: 'folder-legal',
    nome: 'Jurídicos e Legais',
    type: 'folder',
    children: [
      { id: '2', nome: 'Alvará de Funcionamento 2025', type: 'file' },
      { id: '7', nome: 'Certidão Negativa Municipal', type: 'file' },
    ]
  },
  {
    id: 'folder-finance',
    nome: 'Financeiros e Contábeis',
    type: 'folder',
    children: [
      { id: '3', nome: 'DRE - Q4 2024', type: 'file' },
    ]
  },
  {
    id: 'folder-rh',
    nome: 'Recursos Humanos',
    type: 'folder',
    children: [
      { id: '4', nome: 'Folha de Pagamento - Fev 2025', type: 'file' },
    ]
  },
  {
    id: 'folder-marketing',
    nome: 'Comerciais e Marketing',
    type: 'folder',
    children: [
      { id: '5', nome: 'Proposta Comercial - Cliente X', type: 'file' },
    ]
  },
  {
    id: 'folder-ops',
    nome: 'Operacionais e Técnicos',
    type: 'folder',
    children: [
      { id: '6', nome: 'Projeto Executivo - Obra Alpha', type: 'file' },
    ]
  }
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'Todos'>('Todos');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>('Todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form State
  const [newDoc, setNewDoc] = useState({
    name: '',
    category: 'Administrativos' as DocumentCategory,
    date: new Date().toISOString().split('T')[0],
    file: null as File | null
  });

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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
      formData.append('date', newDoc.date);

      setUploadProgress(30);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          throw new Error(`Erro do servidor (${response.status}): ${response.statusText}. O servidor retornou HTML em vez de JSON.`);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('Upload success:', result);
        setUploadProgress(100);
      } else {
        const text = await response.text();
        console.error('Unexpected non-JSON success response:', text);
        throw new Error('O servidor retornou uma resposta inesperada (não-JSON).');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
        setNewDoc({
          name: '',
          category: 'Administrativos',
          date: new Date().toISOString().split('T')[0],
          file: null
        });
        // Refresh the list
        fetchDocuments();
      }, 500);
    } catch (error) {
      const err = error as Error;
      console.error('Upload error:', error);
      alert(err.message);
      setIsUploading(false);
    }
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
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                    <input 
                      type="date" 
                      required
                      value={newDoc.date}
                      onChange={e => setNewDoc({...newDoc, date: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arquivo</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      required
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
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Explorador de Arquivos</h3>
              <div className="bg-[#0a0a0a] rounded-2xl p-2 border border-slate-800/30">
                <FileTree 
                  initialData={INITIAL_TREE_DATA} 
                  onItemClick={(item) => {
                    if (item.type === 'file') {
                      setSearchQuery(item.nome);
                    }
                  }}
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
                        filteredDocuments.map((doc) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={doc.id} 
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
                                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" title="Visualizar">
                                  <Eye size={16} />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" title="Download">
                                  <Download size={16} />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all" title="Excluir">
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
                  filteredDocuments.map((doc) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={doc.id}
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
                          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                            <Download size={16} />
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
