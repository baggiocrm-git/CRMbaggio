'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  AlertCircle, 
  ArrowDownRight,
  Calendar,
  ArrowRight,
  Wallet,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { supabase } from '@/lib/supabase';

interface Receivable {
  id: string;
  cliente: string;
  descricao: string;
  data_vencimento: string;
  data_recebimento: string | null;
  valor: number;
  valor_recebido: number;
  situacao: 'Aberto' | 'Recebido' | 'Em andamento';
}

interface Payable {
  id: string;
  fornecedor: string;
  descricao: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor: number;
  valor_pago: number;
  situacao: 'Aberto' | 'Pago' | 'Em andamento';
}

export default function FinanceDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('FinanceDashboard: Iniciando busca de dados...');
      const [recRes, payRes] = await Promise.all([
        supabase.from('contas_receber').select('*'),
        supabase.from('contas_pagar').select('*')
      ]);

      if (recRes.error) {
        console.error('FinanceDashboard: Erro ao buscar contas_receber:', recRes.error);
      }
      if (payRes.error) {
        console.error('FinanceDashboard: Erro ao buscar contas_pagar:', payRes.error);
      }

      if (recRes.data) {
        console.log('FinanceDashboard: Contas a receber carregadas:', recRes.data.length);
        setReceivables(recRes.data);
      }
      if (payRes.data) {
        console.log('FinanceDashboard: Contas a pagar carregadas:', payRes.data.length);
        setPayables(payRes.data);
      }
    } catch (error) {
      console.error('FinanceDashboard: Erro fatal no fetchData:', error);
    }
  };

  if (!isMounted) return null;

  // Data processing
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthReceivables = receivables.filter(r => {
    const date = new Date(r.data_vencimento);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const currentMonthPayables = payables.filter(p => {
    const date = new Date(p.data_vencimento);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyRevenue = currentMonthReceivables.reduce((acc, curr) => acc + curr.valor, 0);
  const monthlyExpenses = currentMonthPayables.reduce((acc, curr) => acc + curr.valor, 0);
  const netProfit = monthlyRevenue - monthlyExpenses;
  
  const totalReceived = receivables.reduce((acc, curr) => acc + curr.valor_recebido, 0);
  const totalPaid = payables.reduce((acc, curr) => acc + curr.valor_pago, 0);
  const cashBalance = totalReceived - totalPaid;

  // Chart data processing (last 6 months)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    
    const monthRec = receivables.filter(r => {
      const rd = new Date(r.data_vencimento);
      return rd.getMonth() === m && rd.getFullYear() === y;
    }).reduce((acc, curr) => acc + curr.valor, 0);

    const monthPay = payables.filter(p => {
      const pd = new Date(p.data_vencimento);
      return pd.getMonth() === m && pd.getFullYear() === y;
    }).reduce((acc, curr) => acc + curr.valor, 0);

    last6Months.push({
      name: months[m],
      receitas: monthRec,
      despesas: monthPay
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const overdueReceivables = receivables.filter(r => 
    r.situacao !== 'Recebido' && new Date(r.data_vencimento) < new Date()
  ).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

  const latestTransactions = [
    ...receivables.filter(r => {
      if (!r.data_recebimento) return false;
      const d = new Date(r.data_recebimento);
      return !isNaN(d.getTime());
    }).map(r => ({
      name: `Recebimento - ${r.cliente}`,
      desc: `Vendas · ${new Date(r.data_recebimento!).toLocaleDateString('pt-BR')}`,
      amount: `+ ${formatCurrency(r.valor_recebido)}`,
      color: 'text-[#d4ff3f]',
      icon: Wallet,
      date: new Date(r.data_recebimento!).getTime()
    })),
    ...payables.filter(p => {
      if (!p.data_pagamento) return false;
      const d = new Date(p.data_pagamento);
      return !isNaN(d.getTime());
    }).map(p => ({
      name: `Pagamento - ${p.fornecedor}`,
      desc: `Despesa · ${new Date(p.data_pagamento!).toLocaleDateString('pt-BR')}`,
      amount: `- ${formatCurrency(p.valor_pago)}`,
      color: 'text-rose-500',
      icon: ClipboardList,
      date: new Date(p.data_pagamento!).getTime()
    }))
  ].sort((a, b) => b.date - a.date).slice(0, 5);

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="p-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Dashboard <span className="text-[#d4ff3f]">Financeiro</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-1">
            {months[currentMonth]} {currentYear} · Atualizado agora
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#2a2a2a] transition-all"
          >
            <Calendar size={14} /> Sincronizar
          </button>
          
        </div>
      </header>

      <div className="px-8 pb-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'RECEITA DO MÊS', value: formatCurrency(monthlyRevenue), change: 'Real', trend: 'up', icon: TrendingUp, color: '#d4ff3f' },
            { label: 'DESPESAS DO MÊS', value: formatCurrency(monthlyExpenses), change: 'Real', trend: 'down', icon: TrendingDown, color: '#ff4d4d' },
            { label: 'LUCRO LÍQUIDO', value: formatCurrency(netProfit), change: 'Real', trend: 'up', icon: DollarSign, color: '#d4ff3f' },
            { label: 'SALDO EM CAIXA', value: formatCurrency(cashBalance), change: 'Total', trend: 'up', icon: Wallet, color: '#d4ff3f' },
          ].map((card, idx) => (
            <motion.div 
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800/50 relative overflow-hidden group"
            >
              <div className="absolute right-3 top-3 size-9 bg-slate-800/30 rounded-full flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                <card.icon size={16} />
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5">{card.label}</p>
              <p className="text-xl font-black tracking-tight leading-none mb-3">{card.value}</p>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg w-fit ${card.trend === 'up' ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'bg-[#ff4d4d]/10 text-[#ff4d4d]'}`}>
                {card.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {card.change}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black tracking-tight">Receitas vs Despesas</h3>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6Months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #334155', borderRadius: '12px' }}
                    formatter={(value: any) => formatCurrency(Number(value || 0))} // eslint-disable-line @typescript-eslint/no-explicit-any
                  />
                  <Bar dataKey="receitas" radius={[4, 4, 0, 0]} barSize={28}>
                    {last6Months.map((entry, index) => (
                      <Cell key={`cell-rec-${index}`} fill={index === last6Months.length - 1 ? '#d4ff3f' : '#88ab00'} />
                    ))}
                  </Bar>
                  <Bar dataKey="despesas" radius={[4, 4, 0, 0]} barSize={28}>
                    {last6Months.map((entry, index) => (
                      <Cell key={`cell-des-${index}`} fill={index === last6Months.length - 1 ? '#ff4d4d' : '#993333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 mt-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-sm bg-[#d4ff3f]"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-sm bg-[#ff4d4d]"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Despesas</span>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-slate-800/50 flex flex-col">
            <h3 className="text-lg font-black tracking-tight mb-5">Indicadores</h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {[
                { label: 'MARGEM BRUTA', value: monthlyRevenue > 0 ? `${((netProfit / monthlyRevenue) * 100).toFixed(1)}%` : '0%', color: 'text-[#d4ff3f]' },
                { label: 'RECEBIDO/TOTAL', value: monthlyRevenue > 0 ? `${((currentMonthReceivables.reduce((a, c) => a + c.valor_recebido, 0) / monthlyRevenue) * 100).toFixed(1)}%` : '0%', color: 'text-[#d4ff3f]' },
                { label: 'PAGO/TOTAL', value: monthlyExpenses > 0 ? `${((currentMonthPayables.reduce((a, c) => a + c.valor_pago, 0) / monthlyExpenses) * 100).toFixed(1)}%` : '0%', color: 'text-blue-400' },
                { label: 'INADIMPLÊNCIA', value: overdueReceivables.length > 0 ? `${overdueReceivables.length}` : '0', color: 'text-orange-400' },
              ].map((ind) => (
                <div key={ind.label} className="bg-[#0a0a0a] p-3 rounded-2xl border border-slate-800/30">
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1.5">{ind.label}</p>
                  <p className={`text-lg font-black leading-none ${ind.color}`}>{ind.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contas a Receber Próximas */}
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black tracking-tight">Próximos Recebimentos</h3>
              <button 
                onClick={() => window.location.href = '/finances/receivables'}
                className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1"
              >
                Ver todas <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {receivables.filter(r => r.situacao !== 'Recebido').slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`size-2 rounded-full ${new Date(item.data_vencimento) < new Date() ? 'bg-rose-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{item.cliente}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Vence em {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-black">{formatCurrency(item.valor)}</p>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.situacao === 'Aberto' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {item.situacao}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contas a Pagar Próximas */}
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black tracking-tight">Próximos Pagamentos</h3>
              <button 
                onClick={() => window.location.href = '/finances/payables'}
                className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1"
              >
                Ver todas <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {payables.filter(p => p.situacao !== 'Pago').slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`size-2 rounded-full ${new Date(item.data_vencimento) < new Date() ? 'bg-rose-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{item.fornecedor}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Vence em {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-black">{formatCurrency(item.valor)}</p>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.situacao === 'Aberto' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {item.situacao}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
            {/* Alertas Reais */}
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
              <h3 className="text-lg font-black tracking-tight mb-6">Alertas</h3>
              <div className="space-y-4">
                {overdueReceivables.length > 0 ? (
                  <div className="p-4 rounded-2xl border bg-rose-500/5 border-rose-500/20 flex items-start gap-4">
                    <AlertCircle size={18} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">
                      Existem {overdueReceivables.length} contas a receber em atraso. A maior é de {overdueReceivables[0].cliente} ({formatCurrency(overdueReceivables[0].valor)}).
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 flex items-start gap-4">
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">Não há contas a receber em atraso no momento.</p>
                  </div>
                )}
                
                {payables.filter(p => p.situacao !== 'Pago' && p.data_vencimento === now.toISOString().split('T')[0]).map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border bg-orange-500/5 border-orange-500/20 flex items-start gap-4">
                    <Calendar size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">
                      Atenção: A conta &quot;{p.descricao}&quot; de {formatCurrency(p.valor)} vence hoje.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimas Transações Reais */}
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black tracking-tight">Últimas Transações</h3>
              </div>
              <div className="space-y-4">
                {latestTransactions.length > 0 ? latestTransactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/30">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400">
                        <tx.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{tx.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{tx.desc}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black ${tx.color}`}>{tx.amount}</p>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 font-bold uppercase text-center py-4">Nenhuma transação recente.</p>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

