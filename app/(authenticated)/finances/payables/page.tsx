'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Plus, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
// import * as XLSX from 'xlsx';
import CurrencyInput from 'react-currency-input-field';
import { COST_CATEGORIES, CONSTRUCTION_STAGES } from '@/lib/constants';

interface Payable {
  id: string;
  fornecedor: string;
  descricao: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor: number;
  valor_pago: number;
  situacao: 'Aberto' | 'Pago' | 'Em andamento';
  projeto_id?: string;
  categoria_custo?: string;
  etapa_obra?: string;
  centro_custo_tipo?: 'Obra' | 'Administrativo' | 'Pessoal';
  socio_id?: string;
  created_at?: string;
}

interface TeamMember {
  id: string;
  nome: string;
}

interface Project {
  id: string;
  nome: string;
}

interface ExcelRow {
  id?: string;
  fornecedor?: string;
  descricao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  valor?: number | string;
  valor_pago?: number | string;
  situacao?: string;
}

export default function PayablesPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Payable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    situacao: 'Todas',
    dataInicio: '',
    dataFim: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Payable | null, direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fornecedor: '',
    descricao: '',
    data_vencimento: '',
    data_pagamento: '',
    valor: 0,
    valor_pago: 0,
    situacao: 'Aberto' as Payable['situacao'],
    projeto_id: '',
    categoria_custo: '',
    etapa_obra: '',
    centro_custo_tipo: 'Obra' as 'Obra' | 'Administrativo' | 'Pessoal',
    socio_id: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projetos').select('id, nome');
    if (data) setProjects(data);
  };

  const fetchTeamMembers = async () => {
    const { data } = await supabase.from('equipe').select('id, nome');
    if (data) setTeamMembers(data);
  };

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
  }, []);

  const generateNextId = async () => {
    const now = new Date();
    const prefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id')
      .like('id', `${prefix}-%`)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last ID:', error);
      return `${prefix}-0001`;
    }

    if (!data || data.length === 0) {
      return `${prefix}-0001`;
    }

    const lastId = data[0].id;
    const parts = lastId.split('-');
    if (parts.length < 2) return `${prefix}-0001`;
    
    const lastNumber = parseInt(parts[1]);
    if (isNaN(lastNumber)) return `${prefix}-0001`;
    
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  };

  const generateImportIds = async (count: number) => {
    const now = new Date();
    const prefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data } = await supabase
      .from('contas_pagar')
      .select('id')
      .like('id', `${prefix}-%`)
      .order('id', { ascending: false })
      .limit(1);

    let startNumber = 1;
    if (data && data.length > 0) {
      const parts = data[0].id.split('-');
      if (parts.length >= 2) {
        const lastNumber = parseInt(parts[1]);
        if (!isNaN(lastNumber)) {
          startNumber = lastNumber + 1;
        }
      }
    }

    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(`${prefix}-${(startNumber + i).toString().padStart(4, '0')}`);
    }
    return ids;
  };

  const handleSort = (key: keyof Payable) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Payable) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

  const fetchPayables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setError('A tabela "contas_pagar" não foi encontrada. Por favor, configure o banco de dados nas configurações.');
        } else {
          setError(error.message);
        }
        console.error('Error fetching payables:', error);
        return;
      }
      setPayables(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  const handleOpenModal = (item?: Payable) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        fornecedor: item.fornecedor,
        descricao: item.descricao,
        data_vencimento: item.data_vencimento,
        data_pagamento: item.data_pagamento || '',
        valor: item.valor,
        valor_pago: item.valor_pago,
        situacao: item.situacao,
        projeto_id: item.projeto_id || '',
        categoria_custo: item.categoria_custo || '',
        etapa_obra: item.etapa_obra || '',
        centro_custo_tipo: item.centro_custo_tipo || 'Obra',
        socio_id: item.socio_id || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        fornecedor: '',
        descricao: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        data_pagamento: '',
        valor: 0,
        valor_pago: 0,
        situacao: 'Aberto',
        projeto_id: '',
        categoria_custo: '',
        etapa_obra: '',
        centro_custo_tipo: 'Obra',
        socio_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, string | number | null> = {
        fornecedor: formData.fornecedor,
        descricao: formData.descricao,
        data_vencimento: formData.data_vencimento,
        data_pagamento: formData.data_pagamento || null,
        valor: formData.valor,
        valor_pago: formData.valor_pago,
        situacao: formData.situacao,
      };

      // Only include these if they have a value to avoid errors with older table schemas
      if (formData.projeto_id && formData.centro_custo_tipo === 'Obra') payload.projeto_id = formData.projeto_id;
      if (formData.categoria_custo) payload.categoria_custo = formData.categoria_custo;
      if (formData.etapa_obra) payload.etapa_obra = formData.etapa_obra;
      if (formData.centro_custo_tipo) payload.centro_custo_tipo = formData.centro_custo_tipo;
      if (formData.socio_id && formData.centro_custo_tipo === 'Pessoal') payload.socio_id = formData.socio_id;

      if (editingItem) {
        const { error } = await supabase
          .from('contas_pagar')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const nextId = await generateNextId();
        const { error } = await supabase
          .from('contas_pagar')
          .insert([{ ...payload, id: nextId }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchPayables();
    } catch (err) {
      console.error('Error saving payable:', err);
      alert('Erro ao salvar conta a pagar. Verifique se a tabela "contas_pagar" existe no Supabase.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchPayables();
    } catch (err) {
      console.error('Error deleting payable:', err);
    }
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(payables);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas a Pagar");
    XLSX.writeFile(wb, "contas_a_pagar.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const XLSX = await import('xlsx');
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);
      
      if (data.length === 0) {
        alert('A planilha está vazia.');
        return;
      }

      const ids = await generateImportIds(data.length);
      
      // Basic validation and mapping
      const mappedData = data.map((item: ExcelRow, index: number) => {
        const formatDate = (val: unknown) => {
          if (!val) return null;
          if (val instanceof Date) return val.toISOString().split('T')[0];
          return String(val);
        };

        // Normalize situacao
        let situacao: Payable['situacao'] = 'Aberto';
        const rawSituacao = String(item.situacao || '').toUpperCase();
        if (rawSituacao === 'PAGO' || rawSituacao === 'RECEBIDO') situacao = 'Pago';
        else if (rawSituacao === 'EM ANDAMENTO') situacao = 'Em andamento';
        else situacao = 'Aberto';

        return {
          id: ids[index],
          fornecedor: item.fornecedor || 'Sem Identificação',
          descricao: item.descricao || '',
          data_vencimento: formatDate(item.data_vencimento) || new Date().toISOString().split('T')[0],
          data_pagamento: formatDate(item.data_pagamento),
          valor: Number(item.valor) || 0,
          valor_pago: Number(item.valor_pago) || 0,
          situacao
        };
      });

      try {
        const { error } = await supabase.from('contas_pagar').insert(mappedData);
        if (error) throw error;
        fetchPayables();
        alert('Dados importados com sucesso!');
      } catch (err) {
        console.error('Error importing data:', err);
        alert('Erro ao importar dados. Verifique o formato da planilha.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredPayables = payables.filter(p => {
    const matchesSearch = p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSituacao = filters.situacao === 'Todas' || p.situacao === filters.situacao;
    
    const matchesDate = (!filters.dataInicio || p.data_vencimento >= filters.dataInicio) &&
      (!filters.dataFim || p.data_vencimento <= filters.dataFim);
      
    return matchesSearch && matchesSituacao && matchesDate;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalValue = payables.reduce((acc, curr) => acc + curr.valor, 0);
  const paidValue = payables.reduce((acc, curr) => acc + curr.valor_pago, 0);
  const openValue = payables.filter(p => p.situacao === 'Aberto').reduce((acc, curr) => acc + curr.valor, 0);
  const inProgressValue = payables.filter(p => p.situacao === 'Em andamento').reduce((acc, curr) => acc + curr.valor, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayables.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayables.length / itemsPerPage);

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black tracking-tight italic">
          Contas a <span className="text-[#d4ff3f]">pagar</span>
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> CONTA A PAGAR
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                isFilterOpen ? "bg-[#1a1a1a] border-[#d4ff3f] text-[#d4ff3f]" : "bg-[#1a1a1a] border-slate-800/50 text-slate-500 hover:text-white"
              )}
            >
              <Filter size={16} /> FILTROS
            </button>
            
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] rounded-2xl border border-slate-800/50 shadow-2xl z-30 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtros Avançados</h4>
                    <button 
                      onClick={() => setFilters({ situacao: 'Todas', dataInicio: '', dataFim: '' })}
                      className="text-[8px] font-black uppercase tracking-widest text-[#d4ff3f] hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Situação</label>
                    <select 
                      value={filters.situacao}
                      onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                    >
                      <option value="Todas">Todas as situações</option>
                      <option value="Aberto">Aberto</option>
                      <option value="Pago">Pago</option>
                      <option value="Em andamento">Em andamento</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Início</label>
                      <input 
                        type="date" 
                        value={filters.dataInicio}
                        onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fim</label>
                      <input 
                        type="date" 
                        value={filters.dataFim}
                        onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all text-slate-500"
          >
            <Download size={16} /> EXPORTAR
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all text-slate-500"
          >
            <Upload size={16} /> IMPORTAR
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
            accept=".xlsx, .xls"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-rose-500" size={20} />
            <p className="text-xs font-bold text-rose-500 uppercase tracking-tight">{error}</p>
          </div>
          {error.includes('configurações') && (
            <a 
              href="/settings" 
              className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all"
            >
              Ir para Configurações
            </a>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Valor', value: formatCurrency(totalValue), icon: TrendingUp, color: 'text-slate-500' },
          { label: 'Valor pago', value: formatCurrency(paidValue), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Valor em aberto', value: formatCurrency(openValue), icon: AlertCircle, color: 'text-orange-500' },
          { label: 'Valor em andamento', value: formatCurrency(inProgressValue), icon: Clock, color: 'text-blue-500' },
        ].map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] p-6 rounded-2xl border border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-xl bg-[#0a0a0a]", card.color)}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-xl font-black text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar fornecedor ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
            />
          </div>
        </div>

        <div className="">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[15%]" onClick={() => handleSort('fornecedor')}>
                  <div className="flex items-center gap-1">
                    Fornecedor {getSortIcon('fornecedor')}
                  </div>
                </th>
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[25%]" onClick={() => handleSort('descricao')}>
                  <div className="flex items-center gap-1">
                    Descrição {getSortIcon('descricao')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('data_vencimento')}>
                  <div className="flex items-center gap-1">
                    Venc. {getSortIcon('data_vencimento')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('data_pagamento')}>
                  <div className="flex items-center gap-1">
                    Pag. {getSortIcon('data_pagamento')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('valor')}>
                  <div className="flex items-center gap-1">
                    Valor {getSortIcon('valor')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('valor_pago')}>
                  <div className="flex items-center gap-1">
                    Pago {getSortIcon('valor_pago')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[12%]" onClick={() => handleSort('situacao')}>
                  <div className="flex items-center gap-1">
                    Situação {getSortIcon('situacao')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando dados...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm font-bold">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleOpenModal(item)}
                    className="hover:bg-[#0a0a0a] transition-colors group text-[10px] cursor-pointer"
                  >
                    <td className="px-2 py-2">
                      <p className="font-bold text-white leading-tight truncate" title={item.fornecedor}>{item.fornecedor}</p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-slate-400 leading-tight truncate" title={item.descricao}>{item.descricao}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="text-slate-500">{formatDate(item.data_vencimento)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="text-slate-500">{formatDate(item.data_pagamento)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-black text-white">{formatCurrency(item.valor)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-bold text-emerald-500">{formatCurrency(item.valor_pago)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        item.situacao === 'Pago' ? "bg-emerald-500/10 text-emerald-500" : 
                        item.situacao === 'Aberto' ? "bg-orange-500/10 text-orange-500" : 
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {item.situacao}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-[#0a0a0a] border-t border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Página</span>
              <select 
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2 py-1 text-[10px] font-black text-white outline-none"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibir</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2 py-1 text-[10px] font-black text-white outline-none"
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPayables.length)} de {filteredPayables.length}
            </span>
            <div className="flex gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl disabled:opacity-50 hover:text-white transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl disabled:opacity-50 hover:text-white transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden border border-slate-800/50"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight text-white">
                  {editingItem ? 'Editar Conta' : 'Nova Conta a Pagar'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Fornecedor</label>
                    <input 
                      required
                      type="text" 
                      value={formData.fornecedor}
                      onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                    <input 
                      required
                      type="text" 
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="O que está sendo pago?"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Vencimento</label>
                    <input 
                      required
                      type="date" 
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Pagamento</label>
                    <input 
                      type="date" 
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData({...formData, data_pagamento: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor</label>
                    <CurrencyInput
                      required
                      prefix="R$ "
                      decimalSeparator=","
                      groupSeparator="."
                      value={formData.valor}
                      onValueChange={(_, __, values) => setFormData({...formData, valor: values?.float || 0})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor Pago</label>
                    <CurrencyInput
                      prefix="R$ "
                      decimalSeparator=","
                      groupSeparator="."
                      value={formData.valor_pago}
                      onValueChange={(_, __, values) => setFormData({...formData, valor_pago: values?.float || 0})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tipo de Centro de Custo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Obra', 'Administrativo', 'Pessoal'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({...formData, centro_custo_tipo: t as 'Obra' | 'Administrativo' | 'Pessoal'})}
                          className={cn(
                            "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            formData.centro_custo_tipo === t 
                              ? "bg-[#d4ff3f] border-[#d4ff3f] text-black shadow-[0_0_20px_rgba(212,255,63,0.3)]"
                              : "bg-[#0a0a0a] border-slate-800/50 text-slate-400 hover:border-slate-700"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.centro_custo_tipo === 'Obra' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Obra / Projeto</label>
                      <select 
                        value={formData.projeto_id}
                        onChange={(e) => setFormData({...formData, projeto_id: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      >
                        <option value="">Nenhum</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.centro_custo_tipo === 'Pessoal' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Indivíduo / Sócio</label>
                      <select 
                        value={formData.socio_id}
                        onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      >
                        <option value="">Selecione um Sócio</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Categoria de Custo</label>
                    <select 
                      value={formData.categoria_custo}
                      onChange={(e) => setFormData({...formData, categoria_custo: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    >
                      <option value="">Nenhuma</option>
                      {COST_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Etapa da Obra</label>
                    <select 
                      value={formData.etapa_obra}
                      onChange={(e) => setFormData({...formData, etapa_obra: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    >
                      <option value="">Nenhuma</option>
                      {CONSTRUCTION_STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Situação</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Aberto', 'Pago', 'Em andamento'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, situacao: s as Payable['situacao']})}
                          className={cn(
                            "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            formData.situacao === s 
                              ? "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a]" 
                              : "bg-[#0a0a0a] border-slate-800/50 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#0a0a0a] transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-3 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all"
                    >
                      {editingItem ? 'Salvar Alterações' : 'Adicionar Conta'}
                    </button>
                  </div>
                  {editingItem && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
                          handleDelete(editingItem.id);
                          setIsModalOpen(false);
                        }
                      }}
                      className="w-full px-4 py-3 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Excluir Conta
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
