'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  AlertCircle, 
  FileText, 
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  X,
  Trash2,
  Edit2,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceRecord {
  id: string;
  title: string;
  status: 'Pendente' | 'Crítico' | 'Agendado' | 'Concluído';
  amount: number;
  due_date: string;
  type: 'Receita' | 'Despesa';
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  contract_id: string;
  status: string;
  budget: number;
  spent: number;
  balance: number;
  liquidity: number;
}

export default function FinancesPage() {
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState('TODAS AS OPERAÇÕES');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    title: '',
    status: 'Pendente' as FinanceRecord['status'],
    amount: 0,
    due_date: '',
    type: 'Despesa' as FinanceRecord['type'],
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [finRes, projRes] = await Promise.all([
        supabase.from('financas').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('projetos').select('*').order('created_at', { ascending: false })
      ]);

      if (finRes.error) throw finRes.error;
      if (projRes.error) throw projRes.error;

      // Map column names if necessary, but here we assume the select * returns the new names
      // We need to map them back to the interface if they differ
      const mappedFinances = (finRes.data || []).map((f: Record<string, unknown>) => ({
        id: f.id as string,
        title: f.titulo as string,
        status: f.status as FinanceRecord['status'],
        amount: Number(f.valor),
        due_date: f.data_vencimento as string,
        type: f.tipo as FinanceRecord['type'],
        created_at: f.created_at as string
      }));

      const mappedProjects = (projRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.nome as string,
        contract_id: p.id_contrato as string,
        status: p.status as string,
        budget: Number(p.orcamento),
        spent: Number(p.gasto),
        balance: Number(p.saldo),
        liquidity: p.liquidez as number
      }));

      setFinances(mappedFinances);
      setProjects(mappedProjects);
      
      // Initialize date only on client side to avoid hydration mismatch
      setFormData(prev => ({
        ...prev,
        due_date: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [fetchData]);

  const totalInflow = finances.filter(f => f.type === 'Receita').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutflow = finances.filter(f => f.type === 'Despesa').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalInflow - totalOutflow;

  const filteredFinances = finances.filter(record => {
    const matchesTab = 
      activeTab === 'TODAS AS OPERAÇÕES' || 
      (activeTab === 'RECEITAS' && record.type === 'Receita') ||
      (activeTab === 'DESPESAS' && record.type === 'Despesa') ||
      (activeTab === 'PENDENTES' && record.status !== 'Concluído') ||
      (activeTab === 'CONCLUÍDOS' && record.status === 'Concluído');

    const matchesStatus = statusFilter === 'TODOS' || record.status.toUpperCase() === statusFilter;
    const matchesType = typeFilter === 'TODOS' || record.type.toUpperCase() === typeFilter;
    
    const matchesSearch = 
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.amount.toString().includes(searchQuery);

    return matchesTab && matchesStatus && matchesType && matchesSearch;
  });

  const paginatedFinances = filteredFinances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredFinances.length / itemsPerPage);

  const handleDownload = () => {
    const headers = ['Título', 'Tipo', 'Status', 'Valor', 'Data de Vencimento'];
    const csvContent = [
      headers.join(','),
      ...filteredFinances.map(f => [
        `"${f.title}"`,
        `"${f.type}"`,
        `"${f.status}"`,
        `"${f.amount}"`,
        `"${f.due_date}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_financeiro.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { label: 'Saldo Mensal Líquido', value: `R$${isMounted ? netBalance.toLocaleString() : '...' }`, change: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Contas a Pagar', value: `R$${isMounted ? totalOutflow.toLocaleString() : '...' }`, change: `${finances.filter(f => f.type === 'Despesa' && f.status !== 'Concluído').length} Contas a Vencer`, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Contas a Receber', value: `R$${isMounted ? totalInflow.toLocaleString() : '...' }`, change: `${finances.filter(f => f.type === 'Receita' && f.status !== 'Concluído').length} Pendentes`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const handleOpenModal = (record?: FinanceRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        title: record.title,
        status: record.status,
        amount: record.amount,
        due_date: new Date(record.due_date).toISOString().split('T')[0],
        type: record.type,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        title: '',
        status: 'Pendente',
        amount: 0,
        due_date: new Date().toISOString().split('T')[0],
        type: 'Despesa',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        titulo: formData.title,
        status: formData.status,
        valor: formData.amount,
        data_vencimento: formData.due_date,
        tipo: formData.type,
        nome_icone: formData.type === 'Receita' ? 'TrendingUp' : 'TrendingDown',
        classe_cor: formData.type === 'Receita' ? 'text-emerald-500' : 'text-rose-500',
        classe_fundo: formData.type === 'Receita' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('financas')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financas')
          .insert([payload]);
        if (error) throw error;
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar registro financeiro:', error instanceof Error ? error.message : String(error));
      alert('Falha ao salvar registro financeiro.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const { error } = await supabase
          .from('financas')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir registro financeiro:', error instanceof Error ? error.message : String(error));
        alert('Falha ao excluir registro financeiro.');
      }
    }
  };
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Fluxo de Caixa Financeiro" 
          subtitle="Gerencie a liquidez dos projetos de construção, folha de pagamento e faturas de materiais."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          action={{ label: 'Nova Transação', onClick: () => handleOpenModal() }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon size={80} />
                </div>
                <div className="flex flex-col gap-1 relative z-10">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 relative z-10">
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.change.startsWith('+') ? <ArrowUpRight size={12} /> : <AlertCircle size={12} />}
                    {stat.change}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">vs mês passado</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-8 overflow-x-auto">
            {['TODAS AS OPERAÇÕES', 'RECEITAS', 'DESPESAS', 'PENDENTES', 'CONCLUÍDOS'].map((tab) => (
              <button 
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`pb-4 border-b-2 font-black text-sm uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filters & Download */}
          <div className="flex flex-wrap gap-3 items-center">
            <button 
              onClick={() => setStatusFilter(statusFilter === 'PENDENTE' ? 'TODOS' : 'PENDENTE')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Status: {statusFilter}
            </button>
            <button 
              onClick={() => setTypeFilter(typeFilter === 'RECEITA' ? 'DESPESA' : typeFilter === 'DESPESA' ? 'TODOS' : 'RECEITA')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Tipo: {typeFilter}
            </button>
            <div className="ml-auto flex items-center gap-4">
              <button 
                onClick={handleDownload}
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                title="Baixar Relatório"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cash Flow Chart */}
            <div className="lg:col-span-2 flex flex-col gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Tendências de Fluxo de Caixa</h3>
                  <p className="text-xs text-slate-500 font-medium">Receita operacional mensal vs despesas</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">6 Meses</button>
                  <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500">1 Ano</button>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Jan', inflow: 120000, outflow: 80000 },
                    { name: 'Fev', inflow: 150000, outflow: 90000 },
                    { name: 'Mar', inflow: 130000, outflow: 100000 },
                    { name: 'Abr', inflow: 180000, outflow: 110000 },
                    { name: 'Mai', inflow: 210000, outflow: 120000 },
                    { name: 'Jun', inflow: totalInflow, outflow: totalOutflow },
                  ]}>
                    <defs>
                      <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#136dec" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#136dec" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="inflow" stroke="#136dec" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-blue-600"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entrada Total</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">R${isMounted ? totalInflow.toLocaleString() : '...'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-rose-500/50"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saída Total</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">R${isMounted ? totalOutflow.toLocaleString() : '...'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Operations */}
            <div className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Operações Financeiras</h3>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={32} className="text-blue-600 animate-spin" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando operações...</p>
                  </div>
                ) : filteredFinances.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhuma operação encontrada</p>
                  </div>
                ) : (
                  paginatedFinances.map((op) => {
                    const Icon = op.status === 'Concluído' ? CheckCircle2 : op.status === 'Crítico' ? AlertCircle : op.status === 'Agendado' ? TrendingDown : FileText;
                    return (
                      <div key={op.id} className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer relative">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-xl ${
                            op.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' : 
                            op.status === 'Crítico' ? 'bg-rose-500/10 text-rose-500' : 
                            'bg-blue-500/10 text-blue-500'
                          } flex items-center justify-center`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{op.title}</p>
                            <p className={`text-[10px] font-bold ${op.status === 'Crítico' ? 'text-rose-500' : 'text-slate-500'} uppercase tracking-tighter`}>
                              {op.type} • Vencimento {isMounted ? new Date(op.due_date).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className={`text-sm font-black ${op.type === 'Receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {op.type === 'Receita' ? '+' : '-'} R${isMounted ? op.amount.toLocaleString() : '...'}
                            </p>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              op.status === 'Concluído' ? 'text-emerald-500' : 
                              op.status === 'Crítico' ? 'text-rose-500' : 'text-amber-500'
                            }`}>{op.status}</span>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(op); }} className="p-1 hover:text-blue-600 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(op.id); }} className="p-1 hover:text-rose-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Página {currentPage} de {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profitability Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Visão Geral da Lucratividade do Projeto</h3>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-[10px] uppercase font-black tracking-widest text-slate-500">
                    <th className="px-6 py-4">Nome do Projeto</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Orçamento</th>
                    <th className="px-6 py-4">Gasto</th>
                    <th className="px-6 py-4">Saldo</th>
                    <th className="px-6 py-4 text-right">Pontuação de Liquidez</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={24} className="text-blue-600 animate-spin" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando projetos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Contrato {p.contract_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            p.status === 'Ativo' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            <span className={`size-1.5 rounded-full ${p.status === 'Ativo' ? 'bg-blue-600 animate-pulse' : 'bg-amber-500'}`}></span>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">R${isMounted ? p.budget.toLocaleString() : '...'}</td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-500">R${isMounted ? p.spent.toLocaleString() : '...'}</td>
                        <td className={`px-6 py-5 text-sm font-black ${p.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>R${isMounted ? p.balance.toLocaleString() : '...'}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${p.liquidity < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${p.liquidity}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white">{p.liquidity}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                onClick={handleCloseModal}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {editingRecord ? 'Editar Transação' : 'Nova Transação'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Título</label>
                      <input 
                        required
                        type="text" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Fornecimento de Concreto - #204"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as FinanceRecord['type']})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Despesa">Despesa</option>
                        <option value="Receita">Receita</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as FinanceRecord['status']})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Crítico">Crítico</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                      <input 
                        required
                        type="number" 
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Vencimento</label>
                      <input 
                        required
                        type="date" 
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                    >
                      {editingRecord ? 'Salvar Alterações' : 'Criar Transação'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
