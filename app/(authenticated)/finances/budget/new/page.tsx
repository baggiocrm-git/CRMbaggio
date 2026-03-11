'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2, 
  Search, 
  Loader2, 
  Sparkles,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTCPOSearch, useOrcamento } from '@/hooks/useTCPOSearch';
import { Project } from '@/lib/types';
import { GoogleGenAI } from "@google/genai";

export default function NewBudgetPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [budgetDesc, setBudgetDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { query, setQuery, suggestions, loading: searchLoading, clearSuggestions } = useTCPOSearch({ limit: 8 });
  const { items, addItem, removeItem, updateItem, totals } = useOrcamento();

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projetos').select('*').order('nome');
      setProjects(data || []);
    };
    fetchProjects();
  }, []);

  const handleSave = async () => {
    if (!selectedProjectId || !budgetName || items.length === 0) {
      alert('Preencha os campos obrigatórios e adicione pelo menos um item.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create Budget
      const { data: budget, error: budgetError } = await supabase
        .from('orcamentos')
        .insert({
          projeto_id: selectedProjectId,
          nome: budgetName,
          descricao: budgetDesc,
          total_mo: totals.mo,
          total_mat: totals.mat,
          total_eq: totals.eq,
          total_geral: totals.total
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // 2. Create Budget Items
      const budgetItems = items.map((item, index) => ({
        orcamento_id: budget.id,
        tcpo_id: item.tcpo_id,
        descricao_personalizada: item.descricao_personalizada,
        quantidade: item.quantidade,
        unidade: item.unidade,
        custo_unit_mo: item.custo_unit_mo,
        custo_unit_mat: item.custo_unit_mat,
        custo_unit_eq: item.custo_unit_eq,
        bdi: item.bdi,
        ordem: index
      }));

      const { error: itemsError } = await supabase
        .from('orcamento_itens')
        .insert(budgetItems);

      if (itemsError) throw itemsError;

      router.push('/finances/budget');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Erro ao salvar orçamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!budgetDesc) {
      alert('Descreva a obra ou serviço para que a IA possa sugerir itens.');
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      
      // Fetch some TCPO items to give context to Gemini
      const { data: tcpoList } = await supabase.from('tcpo_itens').select('id, descricao, categoria').limit(50);

      const prompt = `
        Você é um engenheiro orçamentista especialista em TCPO (Pini).
        Com base na descrição da obra: "${budgetDesc}"
        Sugira os códigos TCPO mais relevantes desta lista de referência: ${JSON.stringify(tcpoList)}
        
        Retorne APENAS um JSON no formato: [{"id": "codigo", "motivo": "breve explicação"}]
        Seja preciso e sugira no máximo 8 itens essenciais.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const text = response.text;
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]) as { id: string; motivo: string }[];
        
        // Fetch full data for suggested items
        const ids = suggestions.map((s) => s.id);
        const { data: suggestedItems } = await supabase.from('tcpo_itens').select('*').in('id', ids);
        
        if (suggestedItems) {
          suggestedItems.forEach(item => addItem(item));
        }
      }
    } catch (error) {
      console.error('AI Suggestion error:', error);
      alert('Erro ao gerar sugestões com IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/finances/budget" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight italic">Novo <span className="text-[#d4ff3f]">Orçamento Detalhado</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Utilizando base de dados TCPO/PINI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-slate-800/50 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-2">
              <Calculator size={14} /> Informações Gerais
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obra / Projeto</label>
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30"
              >
                <option value="">Selecione uma obra...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Orçamento</label>
              <input 
                type="text" 
                placeholder="Ex: Orçamento Inicial - Fase 1"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição / Escopo</label>
              <textarea 
                rows={4}
                placeholder="Descreva o escopo da obra para sugestões de IA..."
                value={budgetDesc}
                onChange={(e) => setBudgetDesc(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 resize-none"
              />
              <button 
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#d4ff3f]/10 text-[#d4ff3f] text-[10px] font-black uppercase tracking-widest hover:bg-[#d4ff3f]/20 transition-all disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Sugerir Itens com IA
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-slate-800/50 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Resumo de Custos</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Mão de Obra</span>
                <span className="font-bold">{formatCurrency(totals.mo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Materiais</span>
                <span className="font-bold">{formatCurrency(totals.mat)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Equipamentos</span>
                <span className="font-bold">{formatCurrency(totals.eq)}</span>
              </div>
              <div className="pt-3 border-t border-slate-800/50 flex justify-between items-baseline">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Geral (com BDI)</span>
                <span className="text-2xl font-black text-[#d4ff3f]">{formatCurrency(totals.total)}</span>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#d4ff3f] text-[#0a0a0a] text-xs font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all shadow-lg shadow-[#d4ff3f]/10 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Orçamento
            </button>
          </div>
        </div>

        {/* Right Column: Items Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Autocomplete Search */}
          <div className="relative">
            <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
              <Search className="text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Comece a digitar para buscar serviços TCPO (ex: concreto, alvenaria...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-700 font-bold"
              />
              {searchLoading && <Loader2 size={18} className="text-[#d4ff3f] animate-spin" />}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {suggestions.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      addItem(item);
                      setQuery('');
                      clearSuggestions();
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors text-left border-b border-slate-800/50 last:border-none"
                  >
                    <div>
                      <p className="text-xs font-black text-[#d4ff3f] uppercase tracking-widest">{item.id} - {item.categoria}</p>
                      <p className="text-sm font-bold text-white mt-1">{item.descricao}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.unidade}</p>
                      <p className="text-xs font-black text-white mt-1">{formatCurrency(item.custo_mo + item.custo_mat + item.custo_eq)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                    <th className="px-6 py-4">Item / Serviço</th>
                    <th className="px-6 py-4 w-24">Qtd</th>
                    <th className="px-6 py-4 w-20">Un</th>
                    <th className="px-6 py-4 w-32">Custo Unit.</th>
                    <th className="px-6 py-4 w-20">BDI %</th>
                    <th className="px-6 py-4 w-32 text-right">Subtotal</th>
                    <th className="px-6 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="size-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus size={32} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm font-bold">Nenhum item adicionado ainda.</p>
                        <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest mt-1">Busque acima para começar seu orçamento</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const unitTotal = (item.custo_unit_mo || 0) + (item.custo_unit_mat || 0) + (item.custo_unit_eq || 0);
                      const subtotal = (unitTotal * (item.quantidade || 0)) * (1 + (item.bdi || 0) / 100);
                      
                      return (
                        <tr key={idx} className="hover:bg-[#0a0a0a] transition-colors">
                          <td className="px-6 py-4 min-w-[200px]">
                            <p className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">{item.tcpo_id}</p>
                            <input 
                              type="text" 
                              value={item.descricao_personalizada}
                              onChange={(e) => updateItem(idx, { descricao_personalizada: e.target.value })}
                              className="bg-transparent border-none p-0 text-sm font-bold text-white w-full focus:ring-0"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="number" 
                              value={item.quantidade}
                              onChange={(e) => updateItem(idx, { quantidade: Number(e.target.value) })}
                              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-2 py-1 text-sm text-white text-center outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-500 uppercase">{item.unidade}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-white">{formatCurrency(unitTotal)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="number" 
                              value={item.bdi}
                              onChange={(e) => updateItem(idx, { bdi: Number(e.target.value) })}
                              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-2 py-1 text-sm text-white text-center outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-black text-[#d4ff3f]">{formatCurrency(subtotal)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => removeItem(idx)}
                              className="p-1 text-slate-600 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
