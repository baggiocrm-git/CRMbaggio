'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Calendar as CalendarIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  Archive,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

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
  name: string;
  category: DocumentCategory;
  area: string;
  type: string;
  status: DocumentStatus;
  year: number;
  date: string;
  size: string;
}

// Mock Data
const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'Contrato Social - Alteração 2024', category: 'Administrativos', area: 'Administrativo', type: 'Contrato', status: 'Vigente', year: 2024, date: '2024-03-15', size: '2.4 MB' },
  { id: '2', name: 'Alvará de Funcionamento 2025', category: 'Jurídicos e Legais', area: 'Jurídico', type: 'Licença', status: 'Vigente', year: 2025, date: '2025-01-10', size: '1.1 MB' },
  { id: '3', name: 'DRE - Q4 2024', category: 'Financeiros e Contábeis', area: 'Financeiro', type: 'Relatório', status: 'Arquivado', year: 2024, date: '2024-12-31', size: '850 KB' },
  { id: '4', name: 'Folha de Pagamento - Fev 2025', category: 'Recursos Humanos', area: 'RH', type: 'Holerite', status: 'Vigente', year: 2025, date: '2025-02-28', size: '4.2 MB' },
  { id: '5', name: 'Proposta Comercial - Cliente X', category: 'Comerciais e Marketing', area: 'Comercial', type: 'Proposta', status: 'Vigente', year: 2025, date: '2025-03-01', size: '1.5 MB' },
  { id: '6', name: 'Projeto Executivo - Obra Alpha', category: 'Operacionais e Técnicos', area: 'Operacional', type: 'Projeto', status: 'Vigente', year: 2025, date: '2025-02-15', size: '15.8 MB' },
  { id: '7', name: 'Certidão Negativa Municipal', category: 'Jurídicos e Legais', area: 'Jurídico', type: 'Certidão', status: 'Vencido', year: 2024, date: '2024-11-20', size: '450 KB' },
  { id: '8', name: 'Ata de Reunião de Sócios', category: 'Administrativos', area: 'Administrativo', type: 'Ata', status: 'Vigente', year: 2025, date: '2025-02-10', size: '320 KB' },
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

  const filteredDocuments = useMemo(() => {
    return MOCK_DOCUMENTS.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || doc.category === selectedCategory;
      const matchesArea = selectedArea === 'Todas' || doc.area === selectedArea;
      const matchesStatus = selectedStatus === 'Todos' || doc.status === selectedStatus;
      const matchesYear = selectedYear === 'Todos' || doc.year === selectedYear;
      
      return matchesSearch && matchesCategory && matchesArea && matchesStatus && matchesYear;
    });
  }, [searchQuery, selectedCategory, selectedArea, selectedStatus, selectedYear]);

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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const result = await response.json();
      console.log('Upload success:', result);
      setUploadProgress(100);

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
        // In a real app, you'd refresh the list here
        window.location.reload();
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
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Categorias</h3>
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedCategory('Todos')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                    selectedCategory === 'Todos' ? "bg-[#d4ff3f] text-[#0a0a0a]" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <FolderOpen size={16} />
                  Todos os Documentos
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                      selectedCategory === cat ? "bg-[#d4ff3f] text-[#0a0a0a]" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn("size-1.5 rounded-full", selectedCategory === cat ? "bg-[#0a0a0a]" : "bg-slate-700")} />
                    {cat}
                  </button>
                ))}
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
              <button className="p-2 rounded-xl bg-[#0a0a0a] text-[#d4ff3f] shadow-inner">
                <FileText size={18} />
              </button>
              <button className="p-2 rounded-xl text-slate-500 hover:text-white transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Documents Table */}
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
                                <p className="text-sm font-bold text-white line-clamp-1">{doc.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{doc.size}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Tag size={10} className="text-slate-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{doc.area}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-300">{doc.type}</p>
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
                                <span className="text-[10px] font-bold">{new Date(doc.date).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <p className="text-xs font-black text-white">{doc.year}</p>
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
              <p>Mostrando {filteredDocuments.length} de {MOCK_DOCUMENTS.length} documentos</p>
              <div className="flex items-center gap-4">
                <button className="hover:text-white transition-colors disabled:opacity-30" disabled>Anterior</button>
                <div className="flex items-center gap-2">
                  <span className="text-white bg-white/5 px-2 py-1 rounded">1</span>
                </div>
                <button className="hover:text-white transition-colors disabled:opacity-30" disabled>Próximo</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
