'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  Printer, 
  Download, 
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Budget {
  id: string;
  projeto_id: string;
  nome: string;
  valor_total: number;
  created_at: string;
  projeto?: {
    nome: string;
    localizacao?: string;
  };
}

interface BudgetItem {
  id: string;
  etapa: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
}

export default function ViewBudgetPage() {
  const params = useParams();
  const id = params.id as string;
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: budgetData, error: bError } = await supabase
          .from('orcamentos')
          .select(`
            *,
            projeto:projetos(nome, localizacao)
          `)
          .eq('id', id)
          .single();
        
        if (bError) throw bError;
        setBudget(budgetData);

        const { data: itemsData, error: iError } = await supabase
          .from('orcamento_itens')
          .select('*')
          .eq('orcamento_id', id)
          .order('created_at', { ascending: true });
        
        if (iError) throw iError;
        setItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching budget:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="text-[#d4ff3f] animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Orçamento...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex-1 bg-[#0a0a0a] p-8">
        <p className="text-white">Orçamento não encontrado.</p>
      </div>
    );
  }

  const stages = Array.from(new Set(items.map(item => item.etapa)));

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/finances/budget"
            className="p-2 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-slate-500 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tight italic">
              Visualizar <span className="text-[#d4ff3f]">Orçamento</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{budget.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all text-slate-500"
          >
            <Printer size={16} /> IMPRIMIR
          </button>
          <button 
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all text-slate-500"
          >
            <Download size={16} /> EXPORTAR PDF
          </button>
        </div>
      </div>

      <div className="bg-white text-black p-12 rounded-3xl shadow-2xl print:p-0 print:shadow-none print:rounded-none">
        {/* Header PINI Style */}
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Orçamento Analítico</h2>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Base TCPO / PINI</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Data de Emissão</p>
            <p className="text-lg font-black">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Obra / Projeto</p>
              <p className="text-xl font-black uppercase">{budget.projeto?.nome || 'Não especificado'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Localização</p>
              <p className="text-sm font-bold text-gray-600">{budget.projeto?.localizacao || 'Não especificada'}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Valor Total Estimado</p>
            <p className="text-4xl font-black text-black">{formatCurrency(budget.valor_total)}</p>
          </div>
        </div>

        {/* Stages and Items */}
        <div className="space-y-12">
          {stages.map((stage, stageIdx) => {
            const stageItems = items.filter(item => item.etapa === stage);
            const stageTotal = stageItems.reduce((acc, curr) => acc + curr.total, 0);

            return (
              <div key={stage} className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-gray-300">{(stageIdx + 1).toString().padStart(2, '0')}</span>
                    <h3 className="text-lg font-black uppercase tracking-widest">{stage}</h3>
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest">Subtotal: {formatCurrency(stageTotal)}</p>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      <th className="py-3 w-1/2">Descrição do Serviço / Material</th>
                      <th className="py-3 text-center">Unid.</th>
                      <th className="py-3 text-center">Quant.</th>
                      <th className="py-3 text-right">Unitário</th>
                      <th className="py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stageItems.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-4 font-bold text-gray-800">{item.descricao}</td>
                        <td className="py-4 text-center font-bold text-gray-500">{item.unidade}</td>
                        <td className="py-4 text-center font-black">{item.quantidade}</td>
                        <td className="py-4 text-right font-bold text-gray-600">{formatCurrency(item.preco_unitario)}</td>
                        <td className="py-4 text-right font-black">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="mt-20 pt-8 border-t-4 border-black flex justify-between items-end">
          <div className="space-y-4">
            <div className="w-64 h-px bg-gray-300 mb-8" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assinatura do Responsável Técnico</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Valor Total do Orçamento</p>
            <p className="text-5xl font-black tracking-tighter">{formatCurrency(budget.valor_total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
