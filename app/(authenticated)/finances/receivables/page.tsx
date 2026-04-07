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
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
// import * as XLSX from 'xlsx';
import CurrencyInput from '@/components/CurrencyInput';
import { handleFixedDecimalValueChange, transformRawCurrencyValue } from '@/lib/currency';

interface Receivable {
  id: string;
  cliente: string;
  descricao: string;
  data_vencimento: string;
  data_recebimento: string | null;
  valor: number;
  valor_recebido: number;
  situacao: 'Aberto' | 'Recebido' | 'REC. PARCIAL';
  created_at?: string;
}

interface ReceivablePayer {
  id: string;
  nome: string;
}

interface ExcelRow {
  id?: string;
  cliente?: string;
  descricao?: string;
  data_vencimento?: string;
  data_recebimento?: string;
  valor?: number | string;
  valor_recebido?: number | string;
  situacao?: string;
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payerOptions, setPayerOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Receivable | null>(null);
  const [isCustomPayer, setIsCustomPayer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    situacao: 'Todas',
    dataInicio: '',
    dataFim: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Receivable | null, direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    cliente: '',
    descricao: '',
    data_vencimento: '',
    data_recebimento: '',
    valor: 0,
    valor_recebido: 0,
    situacao: 'Aberto' as Receivable['situacao']
  });

  const [error, setError] = useState<string | null>(null);
  const NEW_PAYER_OPTION = '__novo_pagador__';

  const normalizePayerName = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('pt-BR');

  const resolveReceivableSituation = (
    valor: number,
    valorRecebido: number,
    currentSituation: Receivable['situacao']
  ): Receivable['situacao'] => {
    if (valor > 0 && valorRecebido >= valor) return 'Recebido';
    if (valorRecebido > 0 && valorRecebido < valor) return 'REC. PARCIAL';
    return 'Aberto';
  };

  const generateNextId = async () => {
    const now = new Date();
    const prefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from('contas_receber')
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
      .from('contas_receber')
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

  const handleSort = (key: keyof Receivable) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const getSortIcon = (key: keyof Receivable) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

  const fetchReceivables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setError('A tabela "contas_receber" não foi encontrada. Por favor, configure o banco de dados nas configurações.');
        } else {
          setError(error.message);
        }
        console.error('Error fetching receivables:', error);
        return;
      }
      setReceivables(
        (data || []).map((item) => ({
          ...item,
          situacao: resolveReceivableSituation(item.valor, item.valor_recebido, item.situacao),
        }))
      );
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPayers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contas_receber_pagadores')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) {
        const { data: receivablesData, error: receivablesError } = await supabase
          .from('contas_receber')
          .select('cliente')
          .order('cliente', { ascending: true });

        if (receivablesError) throw receivablesError;

        const fallbackPayers = Array.from(
          new Set(
            ((receivablesData as Array<{ cliente: string | null }> | null) || [])
              .map((item) => (item.cliente || '').trim().replace(/\s+/g, ' '))
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

        setPayerOptions(fallbackPayers);
        return;
      }

      setPayerOptions(((data as ReceivablePayer[] | null) || []).map((payer) => payer.nome));
    } catch (err) {
      console.error('Error fetching payers:', err instanceof Error ? err.message : err);
      setPayerOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchReceivables();
    fetchPayers();
  }, [fetchReceivables, fetchPayers]);

  const handleOpenModal = (item?: Receivable) => {
    if (item) {
      setIsCustomPayer(!payerOptions.some((payer) => normalizePayerName(payer) === normalizePayerName(item.cliente)));
      setEditingItem(item);
      setFormData({
        cliente: item.cliente,
        descricao: item.descricao,
        data_vencimento: item.data_vencimento,
        data_recebimento: item.data_recebimento || '',
        valor: item.valor,
        valor_recebido: item.valor_recebido,
        situacao: item.situacao
      });
    } else {
      setIsCustomPayer(false);
      setEditingItem(null);
      setFormData({
        cliente: '',
        descricao: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        data_recebimento: '',
        valor: 0,
        valor_recebido: 0,
        situacao: 'Aberto'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCliente = formData.cliente.trim().replace(/\s+/g, ' ');
    const existingPayer = payerOptions.find(
      (payer) => normalizePayerName(payer) === normalizePayerName(cleanedCliente)
    );
    const finalCliente = existingPayer || cleanedCliente;
    const resolvedSituation = resolveReceivableSituation(
      formData.valor,
      formData.valor_recebido,
      formData.situacao
    );
    try {
      if (finalCliente) {
        const { error: payerError } = await supabase
          .from('contas_receber_pagadores')
          .upsert([{ nome: finalCliente }], { onConflict: 'nome' });

        if (payerError) {
          console.warn('Unable to persist payer option:', payerError);
        }
      }

      const payload = {
        ...formData,
        cliente: finalCliente,
        data_recebimento: formData.data_recebimento || null,
        situacao: resolvedSituation,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('contas_receber')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const nextId = await generateNextId();
        const { error } = await supabase
          .from('contas_receber')
          .insert([{ ...payload, id: nextId }]);
        if (error) throw error;
      }

      handleCloseModal();
      fetchReceivables();
      fetchPayers();
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Erro desconhecido ao salvar a conta a receber.';
      console.error('Error saving receivable:', errorMessage, err);
      alert(`Erro ao salvar conta a receber: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchReceivables();
    } catch (err) {
      console.error('Error deleting receivable:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCustomPayer(false);
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(receivables);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas a Receber");
    XLSX.writeFile(wb, "contas_a_receber.xlsx");
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
        let situacao: Receivable['situacao'] = 'Aberto';
        const rawSituacao = String(item.situacao || '').toUpperCase();
        if (rawSituacao === 'RECEBIDO' || rawSituacao === 'PAGO') situacao = 'Recebido';
        else if (rawSituacao === 'REC. PARCIAL' || rawSituacao === 'REC PARCIAL' || rawSituacao === 'PARCIAL') situacao = 'REC. PARCIAL';
        else situacao = 'Aberto';

        const valor = Number(item.valor) || 0;
        const valorRecebido = Number(item.valor_recebido) || 0;

        return {
          id: ids[index],
          cliente: item.cliente || 'Sem Identificação',
          descricao: item.descricao || '',
          data_vencimento: formatDate(item.data_vencimento) || new Date().toISOString().split('T')[0],
          data_recebimento: formatDate(item.data_recebimento),
          valor,
          valor_recebido: valorRecebido,
          situacao: resolveReceivableSituation(valor, valorRecebido, situacao)
        };
      });

      try {
        const { error } = await supabase.from('contas_receber').insert(mappedData);
        if (error) throw error;
        const importedPayers = Array.from(
          new Set(
            mappedData
              .map((item) => item.cliente.trim().replace(/\s+/g, ' '))
              .filter(Boolean)
          )
        ).map((nome) => ({ nome }));
        if (importedPayers.length > 0) {
          const { error: payerError } = await supabase
            .from('contas_receber_pagadores')
            .upsert(importedPayers, { onConflict: 'nome' });
          if (payerError) throw payerError;
        }
        fetchReceivables();
        fetchPayers();
        alert('Dados importados com sucesso!');
      } catch (err) {
        console.error('Error importing data:', err);
        alert('Erro ao importar dados. Verifique o formato da planilha.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = r.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSituacao = filters.situacao === 'Todas' || r.situacao === filters.situacao;
    
    const matchesDate = (!filters.dataInicio || r.data_vencimento >= filters.dataInicio) &&
      (!filters.dataFim || r.data_vencimento <= filters.dataFim);
      
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

  const totalValue = receivables.reduce((acc, curr) => acc + curr.valor, 0);
  const receivedValue = receivables.reduce((acc, curr) => acc + curr.valor_recebido, 0);
  const openValue = receivables.filter(r => r.situacao === 'Aberto').reduce((acc, curr) => acc + curr.valor, 0);
  const partialReceivables = receivables
    .filter((item) => item.valor_recebido > 0 && item.valor_recebido < item.valor)
    .map((item) => ({
      ...item,
      saldoDevedor: item.valor - item.valor_recebido,
    }))
    .sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'));
  const partialDebtValue = partialReceivables.reduce((acc, curr) => acc + curr.saldoDevedor, 0);

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
  const currentItems = filteredReceivables.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReceivables.length / itemsPerPage);

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black tracking-tight italic">
          Contas a <span className="text-[#d4ff3f]">receber</span>
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> CONTA A RECEBER
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
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
                      <option value="Recebido">Recebido</option>
                      <option value="REC. PARCIAL">REC. PARCIAL</option>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all text-slate-500"
          >
            <Download size={16} /> EXPORTAR
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all text-slate-500"
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
              className="px-4 py-2 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all"
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
          { label: 'Valor recebido', value: formatCurrency(receivedValue), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Valor em aberto', value: formatCurrency(openValue), icon: AlertCircle, color: 'text-orange-500' },
          { label: 'Saldo parcial', value: formatCurrency(partialDebtValue), icon: Building2, color: 'text-amber-400' },
        ].map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] p-6 rounded-2xl border border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-xl bg-[#0a0a0a]", card.color)}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-2xl font-black text-white">{card.value}</p>
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
              placeholder="Pesquisar cliente ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
            />
          </div>
        </div>

        <div className="">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[15%]" onClick={() => handleSort('cliente')}>
                  <div className="flex items-center gap-1">
                    Cliente {getSortIcon('cliente')}
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
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('data_recebimento')}>
                  <div className="flex items-center gap-1">
                    Receb. {getSortIcon('data_recebimento')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('valor')}>
                  <div className="flex items-center gap-1">
                    Valor {getSortIcon('valor')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('valor_recebido')}>
                  <div className="flex items-center gap-1">
                    Receb. {getSortIcon('valor_recebido')}
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
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Carregando dados...</p>
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
                    className="hover:bg-[#0a0a0a] transition-colors group text-sm cursor-pointer"
                  >
                    <td className="px-2 py-2">
                      <p className="font-bold text-white leading-tight truncate" title={item.cliente}>{item.cliente}</p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-slate-400 leading-tight truncate" title={item.descricao}>{item.descricao}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="text-slate-500">{formatDate(item.data_vencimento)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="text-slate-500">{formatDate(item.data_recebimento)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-black text-white">{formatCurrency(item.valor)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-bold text-emerald-500">{formatCurrency(item.valor_recebido)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        item.situacao === 'Recebido' ? "bg-emerald-500/10 text-emerald-500" : 
                        item.situacao === 'REC. PARCIAL' ? "bg-amber-500/10 text-amber-400" :
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
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredReceivables.length)} de {filteredReceivables.length}
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

      <div className="mt-8 bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight">Recebimentos Parciais</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
              Clientes com saldo devedor ainda não totalizado
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest">
            {partialReceivables.length} pendências
          </span>
        </div>

        {partialReceivables.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-bold text-slate-500">Nenhum recebimento parcial no momento.</p>
          </div>
        ) : (
          <div>
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#0a0a0a] text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800/50">
                  <th className="px-2 py-2 w-[20%]">Cliente</th>
                  <th className="px-2 py-2 w-[24%]">Descrição</th>
                  <th className="px-1 py-2 w-[14%]">Situação</th>
                  <th className="px-1 py-2 w-[14%]">Valor Total</th>
                  <th className="px-1 py-2 w-[14%]">Valor Pago</th>
                  <th className="px-1 py-2 w-[14%]">Saldo Devedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {partialReceivables.map((item) => (
                  <tr
                    key={`partial-${item.id}`}
                    onClick={() => handleOpenModal(item)}
                    className="hover:bg-[#0a0a0a] transition-colors group text-sm cursor-pointer"
                  >
                    <td className="px-2 py-2">
                      <p className="font-bold text-white leading-tight truncate" title={item.cliente}>{item.cliente}</p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-slate-400 leading-tight truncate" title={item.descricao}>{item.descricao}</p>
                    </td>
                    <td className="px-1 py-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400">
                        REC. PARCIAL
                      </span>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-black text-white">{formatCurrency(item.valor)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-bold text-emerald-500">{formatCurrency(item.valor_recebido)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-black text-amber-400">{formatCurrency(item.saldoDevedor)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
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
                  {editingItem ? 'Editar Conta' : 'Nova Conta a Receber'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Pagador</label>
                    <select
                      required={!isCustomPayer}
                      value={isCustomPayer ? NEW_PAYER_OPTION : formData.cliente}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === NEW_PAYER_OPTION) {
                          setIsCustomPayer(true);
                          setFormData({ ...formData, cliente: '' });
                          return;
                        }

                        setIsCustomPayer(false);
                        setFormData({ ...formData, cliente: value });
                      }}
                      className={cn(
                        "w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all",
                        isCustomPayer ? "text-[#d4ff3f]" : "text-white"
                      )}
                    >
                      <option value="" disabled>Selecione um pagador</option>
                      {payerOptions.map((payer) => (
                        <option key={`payer-${payer}`} value={payer}>
                          {payer}
                        </option>
                      ))}
                      <option value={NEW_PAYER_OPTION} className="text-[#d4ff3f]">Novo pagador</option>
                    </select>
                    {isCustomPayer && (
                      <input
                        required
                        type="text"
                        value={formData.cliente}
                        onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                        className="w-full mt-3 bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                        placeholder="Digite o nome do novo pagador"
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                    <input 
                      required
                      type="text" 
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="O que está sendo cobrado?"
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
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Recebimento</label>
                    <input 
                      type="date" 
                      value={formData.data_recebimento}
                      onChange={(e) => setFormData({...formData, data_recebimento: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor</label>
                    <CurrencyInput
                      required
                      prefix="R$ "
                      allowDecimals={false}
                      disableAbbreviations
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      fixedDecimalLength={2}
                      formatValueOnBlur={false}
                      transformRawValue={transformRawCurrencyValue}
                      value={formData.valor}
                      onValueChange={(value) => handleFixedDecimalValueChange(value, (v) => setFormData({...formData, valor: Number(v || 0)}))}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor Recebido</label>
                    <CurrencyInput
                      prefix="R$ "
                      allowDecimals={false}
                      disableAbbreviations
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      fixedDecimalLength={2}
                      formatValueOnBlur={false}
                      transformRawValue={transformRawCurrencyValue}
                      value={formData.valor_recebido}
                      onValueChange={(value) => handleFixedDecimalValueChange(value, (v) => setFormData({...formData, valor_recebido: Number(v || 0)}))}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Situação</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Aberto', 'Recebido', 'REC. PARCIAL'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, situacao: s as Receivable['situacao']})}
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
                      onClick={handleCloseModal}
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
                          handleCloseModal();
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
