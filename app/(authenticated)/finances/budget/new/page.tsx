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
import CompositionModal from '@/components/CompositionModal';

export default function NewBudgetPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [budgetDesc, setBudgetDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Composition Modal State (Legacy, keeping for now but user wants inline)
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  // Inline Expansion State
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const { query, setQuery, suggestions, loading: searchLoading, clearSuggestions } = useTCPOSearch({ limit: 8 });
  const { items, addItem, removeItem, updateItem, updateItemComposition, updateCompositionItem, totals } = useOrcamento();

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

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
        ordem: index,
        composicao: item.composicao
      }));

      const { error: itemsError } = await supabase
        .from('orcamento_itens')
        .insert(budgetItems);

      if (itemsError) throw itemsError;

      // 3. Update Project Budget Value (Sum of all budgets for this project)
      const { data: allBudgets } = await supabase
        .from('orcamentos')
        .select('total_geral')
        .eq('projeto_id', selectedProjectId);
      
      const newTotal = (allBudgets || []).reduce((acc, curr) => acc + (curr.total_geral || 0), 0);

      const { error: projectUpdateError } = await supabase
        .from('projetos')
        .update({ orcamento: newTotal })
        .eq('id', selectedProjectId);

      if (projectUpdateError) throw projectUpdateError;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/finances/budget" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Novo <span className="text-[#d4ff3f]">Orçamento Detalhado</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Utilizando base de dados TCPO/PINI</p>
          </div>
        </div>

        {/* Inline General Info */}
        <div className="flex flex-wrap items-center gap-4 bg-[#1a1a1a] p-3 rounded-2xl border border-slate-800/50 shadow-sm">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calculator size={8} className="text-[#d4ff3f]" /> Obra
            </label>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
            >
              <option value="">Selecione...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nome</label>
            <input 
              type="text" 
              placeholder="Nome do orçamento"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Escopo / IA</label>
            <div className="flex gap-1">
              <input 
                type="text"
                placeholder="Descreva para IA..."
                value={budgetDesc}
                onChange={(e) => setBudgetDesc(e.target.value)}
                className="flex-1 bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
              />
              <button 
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                className="p-1 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f] hover:bg-[#d4ff3f]/20 transition-all disabled:opacity-50"
                title="Sugerir com IA"
              >
                {isAiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Items Table Section */}
        <div className="space-y-6">
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
                    <th className="px-4 py-4 w-20">Código</th>
                    <th className="px-4 py-4">Discriminação dos Serviços</th>
                    <th className="px-2 py-4 w-16 text-center">Unid.</th>
                    <th className="px-2 py-4 w-20 text-center">Quant.</th>
                    <th className="px-2 py-4 w-28 text-right">Preço Unit.</th>
                    <th className="px-2 py-4 w-28 text-right">Subtotal</th>
                    <th className="px-4 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
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
                      const isExpanded = expandedItems.has(idx);
                      
                      return (
                        <React.Fragment key={idx}>
                          <tr 
                            className={`hover:bg-[#0a0a0a] transition-colors group cursor-pointer ${isExpanded ? 'bg-[#0a0a0a]' : ''}`}
                            onClick={() => toggleExpand(idx)}
                          >
                            <td className="px-4 py-4">
                              <p className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">{item.tcpo_id}</p>
                            </td>
                            <td className="px-4 py-4 min-w-[200px]">
                              <input 
                                type="text" 
                                value={item.descricao_personalizada}
                                onChange={(e) => updateItem(idx, { descricao_personalizada: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent border-none p-0 text-sm font-bold text-white w-full focus:ring-0"
                              />
                            </td>
                            <td className="px-2 py-4 text-center">
                              <span className="text-xs font-bold text-slate-500 uppercase">{item.unidade}</span>
                            </td>
                            <td className="px-2 py-4">
                              <input 
                                type="number" 
                                value={item.quantidade}
                                onChange={(e) => updateItem(idx, { quantidade: Number(e.target.value) })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-2 py-1 text-sm text-white text-center outline-none"
                              />
                            </td>
                            <td className="px-2 py-4 text-right">
                              <p className="text-xs font-bold text-white">{formatCurrency(unitTotal * (1 + (item.bdi || 0) / 100))}</p>
                            </td>
                            <td className="px-2 py-4 text-right">
                              <p className="text-sm font-black text-[#d4ff3f]">{formatCurrency(subtotal)}</p>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveItemIndex(idx);
                                    setIsCompModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-[#d4ff3f] transition-all"
                                  title="Editar Composição (Modal)"
                                >
                                  <Calculator size={14} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(idx);
                                  }}
                                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-500 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {isExpanded && item.composicao && item.composicao.length > 0 && (
                            <tr className="bg-[#0d0d0d]">
                              <td colSpan={7} className="px-6 py-0">
                                <div className="py-2 pl-12 pr-6">
                                  <table className="w-full text-left border-collapse border-spacing-0">
                                    <thead>
                                      <tr className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-[#1a1a1a]">
                                        <th className="py-1 px-2 border border-slate-800 w-20">Código</th>
                                        <th className="py-1 px-2 border border-slate-800">Insumo</th>
                                        <th className="py-1 px-2 border border-slate-800 w-10 text-center">Un</th>
                                        <th className="py-1 px-2 border border-slate-800 w-20 text-center">Consumo</th>
                                        <th className="py-1 px-2 border border-slate-800 w-24 text-center">P. Unit</th>
                                        <th className="py-1 px-2 border border-slate-800 w-28 text-right">P. Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.composicao.map((comp, cIdx) => (
                                        <tr key={cIdx} className="hover:bg-white/5 transition-colors group">
                                          <td className="py-0.5 px-2 border border-slate-800/50">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{comp.codigo || '-'}</p>
                                          </td>
                                          <td className="py-0.5 px-2 border border-slate-800/50">
                                            <div className="flex items-center gap-2">
                                              <p className="text-[10px] font-bold text-slate-300 leading-tight">{comp.insumo}</p>
                                              <span className="text-[6px] font-black uppercase text-slate-600 shrink-0">{comp.tipo}</span>
                                            </div>
                                          </td>
                                          <td className="py-0.5 px-2 border border-slate-800/50 text-center">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{comp.un}</span>
                                          </td>
                                          <td className="py-0.5 px-2 border border-slate-800/50">
                                            <input 
                                              type="number" 
                                              step="0.001"
                                              value={comp.coef}
                                              onChange={(e) => updateCompositionItem(idx, cIdx, { coef: Number(e.target.value) })}
                                              className="w-full bg-transparent border-none p-0 text-[10px] text-white text-center outline-none focus:ring-0 font-bold"
                                            />
                                          </td>
                                          <td className="py-0.5 px-2 border border-slate-800/50">
                                            <div className="flex items-center justify-center gap-0.5">
                                              <span className="text-[8px] text-slate-600 font-bold">R$</span>
                                              <input 
                                                type="number" 
                                                step="0.01"
                                                value={comp.p_unit}
                                                onChange={(e) => updateCompositionItem(idx, cIdx, { p_unit: Number(e.target.value) })}
                                                className="w-full bg-transparent border-none p-0 text-[10px] text-white outline-none focus:ring-0 font-bold"
                                              />
                                            </div>
                                          </td>
                                          <td className="py-0.5 px-2 border border-slate-800/50 text-right">
                                            <p className="text-[10px] font-black text-[#d4ff3f]">
                                              {formatCurrency(comp.p_total)}
                                            </p>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-slate-800/50 shadow-lg mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-wrap gap-8 items-center">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mão de Obra</p>
                <p className="text-lg font-black text-blue-500">{formatCurrency(totals.mo)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Materiais</p>
                <p className="text-lg font-black text-orange-500">{formatCurrency(totals.mat)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Equipamentos</p>
                <p className="text-lg font-black text-purple-500">{formatCurrency(totals.eq)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 bg-[#0a0a0a] p-4 rounded-2xl border border-slate-800/50 flex-1 md:flex-none">
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Geral (com BDI)</p>
                <p className="text-2xl font-black text-[#d4ff3f]">{formatCurrency(totals.total)}</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all shadow-lg shadow-[#d4ff3f]/10 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar Orçamento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Composition Modal */}
      {activeItemIndex !== null && (
        <CompositionModal 
          isOpen={isCompModalOpen}
          onClose={() => {
            setIsCompModalOpen(false);
            setActiveItemIndex(null);
          }}
          onSave={(composition, totals) => {
            updateItemComposition(activeItemIndex, composition, totals);
            setIsCompModalOpen(false);
            setActiveItemIndex(null);
          }}
          initialComposition={items[activeItemIndex]?.composicao || []}
          itemName={items[activeItemIndex]?.descricao_personalizada || ''}
        />
      )}
    </div>
  );
}
