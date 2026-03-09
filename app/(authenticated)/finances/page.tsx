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
  Download,
  Plus,
  MoreHorizontal,
  Calendar,
  Bell,
  ArrowRight,
  Wallet,
  PieChart,
  Target,
  Layers,
  Percent,
  ClipboardList
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

const chartData = [
  { name: 'Out', receitas: 45000, despesas: 38000 },
  { name: 'Nov', receitas: 52000, despesas: 42000 },
  { name: 'Dez', receitas: 48000, despesas: 55000 },
  { name: 'Jan', receitas: 60000, despesas: 48000 },
  { name: 'Fev', receitas: 65000, despesas: 52000 },
  { name: 'Mar', receitas: 84320, despesas: 61150 },
];

export default function FinanceDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="p-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Painel <span className="text-[#d4ff3f]">Financeiro</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-1">Março 2026 · Atualizado há 12 minutos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#1a1a1a] p-1 rounded-lg">
            {['Sem', 'Mês', 'Tri', 'Ano'].map((t) => (
              <button 
                key={t} 
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${t === 'Mês' ? 'bg-[#2a2a2a] text-[#d4ff3f]' : 'text-slate-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#2a2a2a] transition-all">
            <Download size={14} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#d4ff3f] text-[#0a0a0a] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all">
            <Plus size={14} /> Lançamento
          </button>
        </div>
      </header>

      <div className="px-8 pb-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'RECEITA DO MÊS', value: 'R$ 84.320', change: '12,4%', trend: 'up', icon: TrendingUp, color: '#d4ff3f' },
            { label: 'DESPESAS DO MÊS', value: 'R$ 61.150', change: '4,1%', trend: 'up', icon: TrendingDown, color: '#ff4d4d' },
            { label: 'LUCRO LÍQUIDO', value: 'R$ 23.170', change: '27,8%', trend: 'up', icon: DollarSign, color: '#d4ff3f' },
            { label: 'SALDO EM CAIXA', value: 'R$ 142.800', change: '9,2%', trend: 'up', icon: Wallet, color: '#d4ff3f' },
          ].map((card, idx) => (
            <motion.div 
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1a1a1a] p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden group"
            >
              <div className="absolute right-4 top-4 size-12 bg-slate-800/30 rounded-full flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                <card.icon size={20} />
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{card.label}</p>
              <p className="text-3xl font-black tracking-tight mb-4">{card.value}</p>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg w-fit ${card.color === '#d4ff3f' ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'bg-[#ff4d4d]/10 text-[#ff4d4d]'}`}>
                {card.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {card.change} vs mês anterior
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black tracking-tight">Receitas vs Despesas</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1">
                Ver relatório <ArrowRight size={12} />
              </button>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                  />
                  <Bar dataKey="receitas" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-rec-${index}`} fill={index === chartData.length - 1 ? '#d4ff3f' : '#88ab00'} />
                    ))}
                  </Bar>
                  <Bar dataKey="despesas" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-des-${index}`} fill={index === chartData.length - 1 ? '#ff4d4d' : '#993333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-6">
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
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50 flex flex-col">
            <h3 className="text-lg font-black tracking-tight mb-8">Indicadores</h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { label: 'MARGEM BRUTA', value: '38,4%', color: 'text-[#d4ff3f]' },
                { label: 'MARGEM LÍQUIDA', value: '27,5%', color: 'text-[#d4ff3f]' },
                { label: 'LIQUIDEZ CORR.', value: '2,34', color: 'text-blue-400' },
                { label: 'INADIMPLÊNCIA', value: '4,2%', color: 'text-orange-400' },
              ].map((ind) => (
                <div key={ind.label} className="bg-[#0a0a0a] p-4 rounded-2xl border border-slate-800/30">
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-2">{ind.label}</p>
                  <p className={`text-2xl font-black ${ind.color}`}>{ind.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <div className="flex justify-between items-end mb-2">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">EBITDA MARGIN</p>
                <p className="text-xl font-black text-[#d4ff3f]">31%</p>
              </div>
              <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden relative">
                <div className="h-full bg-[#d4ff3f] rounded-full" style={{ width: '31%' }}></div>
                <div className="absolute top-0 left-[35%] h-full w-0.5 bg-slate-700"></div>
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Meta: 35% · Faltam 4 p.p.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contas a Receber */}
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black tracking-tight">Contas a Receber</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Tech Solutions Ltda.', desc: 'Venceu em 28/02 · 8 dias em atraso', amount: 'R$ 12.400', status: 'VENCIDA', color: 'bg-rose-500/10 text-rose-500' },
                { name: 'Grupo Ômega S.A.', desc: 'Vence em 10/03 · 2 dias', amount: 'R$ 8.750', status: 'PENDENTE', color: 'bg-orange-500/10 text-orange-500' },
                { name: 'Distribuidora Norte', desc: 'Vence em 15/03 · 7 dias', amount: 'R$ 5.200', status: 'PENDENTE', color: 'bg-orange-500/10 text-orange-500' },
                { name: 'Alfa Comércio ME', desc: 'Recebido em 05/03', amount: 'R$ 3.100', status: 'PAGO', color: 'bg-emerald-500/10 text-emerald-500' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`size-2 rounded-full ${item.status === 'VENCIDA' ? 'bg-rose-500' : item.status === 'PAGO' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-black ${item.status === 'VENCIDA' ? 'text-rose-500' : 'text-white'}`}>{item.amount}</p>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contas a Pagar */}
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black tracking-tight">Contas a Pagar</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Aluguel Comercial', desc: 'Vence em 10/03 · 2 dias', amount: 'R$ 7.500', status: 'PENDENTE', color: 'bg-orange-500/10 text-orange-500' },
                { name: 'Folha de Pagamento', desc: 'Vence em 05/03 — hoje', amount: 'R$ 28.600', status: 'PENDENTE', color: 'bg-orange-500/10 text-orange-500' },
                { name: 'Fornecedor Principal', desc: 'Pago em 03/03', amount: 'R$ 14.200', status: 'PAGO', color: 'bg-emerald-500/10 text-emerald-500' },
                { name: 'DARF / Impostos', desc: 'Vence em 20/03 · 12 dias', amount: 'R$ 4.830', status: 'PENDENTE', color: 'bg-orange-500/10 text-orange-500' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`size-2 rounded-full ${item.status === 'PAGO' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-black">{item.amount}</p>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DRE Resumido */}
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black tracking-tight">DRE Resumido — Março 2026</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1">
                Completo <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: '(+) Receita Bruta', value: 'R$ 84.320', color: 'text-[#d4ff3f]' },
                { label: '(-) Deduções e Impostos s/ Venda', value: '- R$ 11.800', color: 'text-rose-500' },
                { label: '(=) Receita Líquida', value: 'R$ 72.520', color: 'text-white', bold: true },
                { label: '(-) Custo dos Produtos/Serviços', value: '- R$ 31.700', color: 'text-rose-500' },
                { label: '(=) Lucro Bruto', value: 'R$ 40.820', color: 'text-[#d4ff3f]', bold: true },
                { label: '(-) Despesas Operacionais', value: '- R$ 17.650', color: 'text-rose-500' },
                { label: '(=) Lucro Líquido', value: 'R$ 23.170', color: 'text-[#d4ff3f]', bold: true },
              ].map((item) => (
                <div key={item.label} className={`flex justify-between items-center py-2 border-b border-slate-800/30 ${item.bold ? 'pt-4' : ''}`}>
                  <p className={`text-xs ${item.bold ? 'font-black text-white' : 'font-bold text-slate-400'}`}>{item.label}</p>
                  <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {/* Alertas */}
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
              <h3 className="text-lg font-black tracking-tight mb-6">Alertas</h3>
              <div className="space-y-4">
                {[
                  { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'Tech Solutions com R$ 12.400 em atraso há 8 dias. Acionar régua de cobrança.' },
                  { icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'Folha de pagamento de R$ 28.600 vence hoje. Confirme o saldo disponível.' },
                  { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'DARF de março vence em 20/03. Valor estimado: R$ 4.830.' },
                ].map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${alert.bg} ${alert.border} flex items-start gap-4`}>
                    <alert.icon size={18} className={`${alert.color} mt-0.5 flex-shrink-0`} />
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimas Transações */}
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black tracking-tight">Últimas Transações</h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1">
                  Ver extrato <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Recebimento — Alfa ME', desc: 'Vendas · 05/03', amount: '+ R$ 3.100', color: 'text-[#d4ff3f]', icon: Wallet },
                  { name: 'Fornecedor Principal', desc: 'Compras · 03/03', amount: '- R$ 14.200', color: 'text-rose-500', icon: ClipboardList },
                  { name: 'Transferência — Caixa Geral', desc: 'Interno · 01/03', amount: 'R$ 20.000', color: 'text-slate-400', icon: Layers },
                ].map((tx, idx) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
