'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Loader2, 
  Building2, 
  Calendar,
  FileText,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Budget } from '@/lib/types';

interface AnalyticalItem {
  id: string;
  tcpo_id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  custo_unit_mo: number;
  custo_unit_mat: number;
  custo_unit_eq: number;
  custo_unit_total: number;
  bdi: number;
  preco_unit_com_bdi: number;
  subtotal_custo: number;
  subtotal_preco: number;
  ordem: number;
}

export default function ViewBudgetPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<AnalyticalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Budget Info
        const { data: budgetData } = await supabase
          .from('orcamentos')
          .select('*, projeto:projetos(nome)')
          .eq('id', id)
          .single();
        
        setBudget(budgetData);

        // Fetch Items from the Analytical View
        const { data: itemsData } = await supabase
          .from('vw_orcamento_analitico')
          .select('*')
          .eq('orcamento_id', id)
          .order('ordem');
        
        setItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching budget details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[#d4ff3f] animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Detalhes do Orçamento...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-black text-white mb-4">Orçamento não encontrado</h2>
        <Link href="/finances/budget" className="text-[#d4ff3f] font-bold underline">Voltar para a lista</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8 print:p-0 print:bg-white print:text-black">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/finances/budget" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Visualizar <span className="text-[#d4ff3f]">Orçamento</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Relatório Analítico TCPO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Printer size={18} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-8 mb-8 shadow-sm print:border-none print:shadow-none print:bg-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orçamento</p>
            <p className="text-lg font-black text-white print:text-black">{budget.nome}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obra / Projeto</p>
            <div className="flex items-center gap-2 text-white print:text-black">
              <Building2 size={16} className="text-[#d4ff3f] print:text-black" />
              <p className="font-bold">{(budget as Budget & { projeto?: { nome: string } }).projeto?.nome || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão</p>
            <div className="flex items-center gap-2 text-white print:text-black">
              <Calendar size={16} className="text-[#d4ff3f] print:text-black" />
              <p className="font-bold">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Geral</p>
            <p className="text-2xl font-black text-[#d4ff3f] print:text-black">{formatCurrency(budget.total_geral)}</p>
          </div>
        </div>
        
        {budget.descricao && (
          <div className="mt-8 pt-6 border-t border-slate-800/50 print:border-black/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição / Escopo</p>
            <p className="text-sm text-slate-400 print:text-black leading-relaxed">{budget.descricao}</p>
          </div>
        )}
      </div>

      {/* Summary Cards - Hidden on Print */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
        <div className="bg-[#1a1a1a] border border-slate-800/50 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mão de Obra</p>
            <p className="text-xl font-black">{formatCurrency(budget.total_mo)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-slate-800/50 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Materiais</p>
            <p className="text-xl font-black">{formatCurrency(budget.total_mat)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-slate-800/50 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
            <Download size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipamentos</p>
            <p className="text-xl font-black">{formatCurrency(budget.total_eq)}</p>
          </div>
        </div>
      </div>

      {/* Analytical Table */}
      <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm print:border-none print:shadow-none print:bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50 print:bg-gray-100 print:text-black print:border-black">
                <th className="px-6 py-4">Código / Descrição</th>
                <th className="px-6 py-4 w-20">Un</th>
                <th className="px-6 py-4 w-24">Qtd</th>
                <th className="px-6 py-4 w-32">Custo Unit.</th>
                <th className="px-6 py-4 w-20">BDI %</th>
                <th className="px-6 py-4 w-32">Preço Unit.</th>
                <th className="px-6 py-4 w-32 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 print:divide-black/10">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#0a0a0a] transition-colors print:text-black">
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest print:text-black">{item.tcpo_id}</p>
                    <p className="text-sm font-bold text-white print:text-black mt-1">{item.descricao}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500 uppercase print:text-black">{item.unidade}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold print:text-black">{item.quantidade}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 print:text-black">{formatCurrency(item.custo_unit_total)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 print:text-black">{item.bdi}%</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold print:text-black">{formatCurrency(item.preco_unit_com_bdi)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-[#d4ff3f] print:text-black">{formatCurrency(item.subtotal_preco)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0a0a0a] print:bg-gray-50">
                <td colSpan={6} className="px-6 py-6 text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Total do Orçamento</p>
                </td>
                <td className="px-6 py-6 text-right">
                  <p className="text-2xl font-black text-[#d4ff3f] print:text-black">{formatCurrency(budget.total_geral)}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer - Only on Print */}
      <div className="hidden print:block mt-20 pt-10 border-t border-black/20 text-center">
        <div className="flex justify-around">
          <div className="w-64 border-t border-black pt-2">
            <p className="text-xs font-bold uppercase">Responsável Técnico</p>
          </div>
          <div className="w-64 border-t border-black pt-2">
            <p className="text-xs font-bold uppercase">Cliente / Aprovação</p>
          </div>
        </div>
        <p className="text-[8px] text-gray-500 mt-10 italic">Gerado por CBSL Gestão de Engenharia em {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}
