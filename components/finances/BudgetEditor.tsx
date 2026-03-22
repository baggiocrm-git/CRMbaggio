'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Calculator,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CONSTRUCTION_STAGES } from '@/lib/constants';
import CurrencyInput from 'react-currency-input-field';
import { handleFixedDecimalValueChange } from '@/lib/currency';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  nome: string;
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

interface BudgetEditorProps {
  budgetId?: string;
}

// Common TCPO-like services for suggestions
const TCPO_SUGGESTIONS: Record<string, { desc: string, unit: string }[]> = {
  'SERVIÇOS PRELIMINARES E ADMINISTRATIVOS': [
    { desc: 'Instalação de canteiro de obras', unit: 'un' },
    { desc: 'Locação da obra com gabarito', unit: 'm2' },
    { desc: 'Limpeza do terreno', unit: 'm2' },
    { desc: 'Placa de obra em chapa galvanizada', unit: 'm2' }
  ],
  'FUNDAÇÕES': [
    { desc: 'Escavação manual de valas', unit: 'm3' },
    { desc: 'Concreto para fundação (sapata)', unit: 'm3' },
    { desc: 'Armação de aço CA-50', unit: 'kg' },
    { desc: 'Forma de madeira para fundação', unit: 'm2' }
  ],
  'SUPERESTRUTURA': [
    { desc: 'Concreto armado para pilares e vigas', unit: 'm3' },
    { desc: 'Laje pré-moldada treliçada', unit: 'm2' },
    { desc: 'Armação de aço CA-50/60', unit: 'kg' },
    { desc: 'Forma de madeira plastificada', unit: 'm2' }
  ],
  'SISTEMAS DE VEDAÇÃO VERTICAL': [
    { desc: 'Alvenaria de bloco cerâmico 9x19x19', unit: 'm2' },
    { desc: 'Chapisco em paredes internas/externas', unit: 'm2' },
    { desc: 'Emboço/Reboco paulista', unit: 'm2' }
  ],
  'INSTALAÇÃO ELÉTRICA': [
    { desc: 'Eletroduto flexível corrugado 3/4"', unit: 'm' },
    { desc: 'Cabo flexível 2,5mm2', unit: 'm' },
    { desc: 'Quadro de distribuição para 12 disjuntores', unit: 'un' },
    { desc: 'Ponto de luz e força', unit: 'pt' }
  ]
};

export default function BudgetEditor({ budgetId }: BudgetEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedStages, setExpandedStages] = useState<string[]>([CONSTRUCTION_STAGES[0]]);
  
  const [budgetData, setBudgetData] = useState({
    nome: '',
    projeto_id: '',
    valor_total: 0
  });

  const [items, setItems] = useState<BudgetItem[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projetos').select('id, nome');
      if (data) setProjects(data);
    };

    const fetchBudgetData = async () => {
      if (!budgetId) return;
      setLoading(true);
      try {
        const { data: budget, error: bError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id', budgetId)
          .single();
        
        if (bError) throw bError;
        setBudgetData({
          nome: budget.nome,
          projeto_id: budget.projeto_id,
          valor_total: budget.valor_total
        });

        const { data: bItems, error: iError } = await supabase
          .from('orcamento_itens')
          .select('*')
          .eq('orcamento_id', budgetId)
          .order('created_at', { ascending: true });
        
        if (iError) throw iError;
        setItems(bItems || []);
      } catch (error) {
        console.error('Error fetching budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    fetchBudgetData();
  }, [budgetId]);

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const addItem = (stage: string, suggestion?: { desc: string, unit: string }) => {
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      etapa: stage,
      descricao: suggestion?.desc || '',
      unidade: suggestion?.unit || 'un',
      quantidade: 1,
      preco_unitario: 0,
      total: 0
    };
    setItems([...items, newItem]);
    if (!expandedStages.includes(stage)) {
      setExpandedStages([...expandedStages, stage]);
    }
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value } as BudgetItem;
        if (field === 'quantidade' || field === 'preco_unitario') {
          updated.total = (updated.quantidade || 0) * (updated.preco_unitario || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const totalValue = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.total, 0);
  }, [items]);

  const handleSave = async () => {
    if (!budgetData.nome || !budgetData.projeto_id) {
      alert('Por favor, preencha o nome do orçamento e selecione um projeto.');
      return;
    }

    setSaving(true);
    try {
      let currentBudgetId = budgetId;

      if (budgetId) {
        // Update existing budget
        const { error: bError } = await supabase
          .from('orcamentos')
          .update({
            nome: budgetData.nome,
            projeto_id: budgetData.projeto_id,
            valor_total: totalValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', budgetId);
        
        if (bError) throw bError;

        // Delete old items and insert new ones (simplest way for sync)
        await supabase.from('orcamento_itens').delete().eq('orcamento_id', budgetId);
      } else {
        // Create new budget
        const { data: newBudget, error: bError } = await supabase
          .from('orcamentos')
          .insert([{
            nome: budgetData.nome,
            projeto_id: budgetData.projeto_id,
            valor_total: totalValue
          }])
          .select()
          .single();
        
        if (bError) throw bError;
        currentBudgetId = newBudget.id;
      }

      // Insert items
      const itemsToInsert = items.map(item => ({
        orcamento_id: currentBudgetId,
        etapa: item.etapa,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        total: item.total
      }));

      const { error: iError } = await supabase.from('orcamento_itens').insert(itemsToInsert);
      if (iError) throw iError;

      // Also update the project's budget value
      await supabase
        .from('projetos')
        .update({ orcamento: totalValue })
        .eq('id', budgetData.projeto_id);

      alert('Orçamento salvo com sucesso!');
      router.push('/finances/budget');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Erro ao salvar orçamento. Verifique se as tabelas orcamentos e orcamento_itens existem.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrencyValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="text-[#d4ff3f] animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Orçamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome do Orçamento</label>
              <input 
                type="text" 
                value={budgetData.nome}
                onChange={(e) => setBudgetData({ ...budgetData, nome: e.target.value })}
                placeholder="Ex: Orçamento Executivo - Casa de Campo"
                className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">OBRA / PROJETO</label>
              <select 
                value={budgetData.projeto_id}
                onChange={(e) => setBudgetData({ ...budgetData, projeto_id: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
              >
                <option value="">Selecione uma obra</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-[#0a0a0a] rounded-2xl p-8 border border-slate-800/30 flex flex-col justify-center items-center text-center">
            <Calculator className="text-[#d4ff3f] mb-3" size={32} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Valor Total do Orçamento</p>
            <p className="text-4xl font-black text-white">{formatCurrencyValue(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Construction Stages */}
      <div className="space-y-4">
        {CONSTRUCTION_STAGES.map((stage, stageIdx) => {
          const stageItems = items.filter(item => item.etapa === stage);
          const stageTotal = stageItems.reduce((acc, curr) => acc + curr.total, 0);
          const isExpanded = expandedStages.includes(stage);

          return (
            <div key={stage} className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm transition-all hover:border-slate-700/50">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between"
                onClick={() => toggleStage(stage)}
              >
                <div className="flex items-center gap-4">
                  <div className="size-8 rounded-xl bg-[#0a0a0a] text-[#d4ff3f] flex items-center justify-center font-black text-xs">
                    {(stageIdx + 1).toString().padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{stage}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                      {stageItems.length} itens • Subtotal: {formatCurrencyValue(stageTotal)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem(stage);
                    }}
                    className="p-2 bg-[#0a0a0a] border border-slate-800/50 rounded-xl text-[#d4ff3f] hover:bg-[#d4ff3f] hover:text-[#0a0a0a] transition-all"
                  >
                    <Plus size={16} />
                  </button>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-800/50"
                  >
                    <div className="p-6 space-y-4">
                      {/* Suggestions */}
                      {TCPO_SUGGESTIONS[stage] && stageItems.length === 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <p className="w-full text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Sugestões TCPO:</p>
                          {TCPO_SUGGESTIONS[stage].map((s, idx) => (
                            <button 
                              key={idx}
                              onClick={() => addItem(stage, s)}
                              className="px-3 py-1.5 bg-[#0a0a0a] border border-slate-800/50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest hover:border-[#d4ff3f] hover:text-[#d4ff3f] transition-all"
                            >
                              + {s.desc}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="space-y-2">
                        {stageItems.map((item) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-[#0a0a0a] p-3 rounded-2xl border border-slate-800/30 group">
                            <div className="col-span-7">
                              <input 
                                type="text" 
                                value={item.descricao}
                                onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                                placeholder="Descrição do serviço ou material"
                                className="w-full bg-transparent border-none text-xs font-bold text-white outline-none placeholder:text-slate-700"
                              />
                            </div>
                            <div className="col-span-1">
                              <input 
                                type="text" 
                                value={item.unidade}
                                onChange={(e) => updateItem(item.id, 'unidade', e.target.value)}
                                placeholder="Un"
                                className="w-full bg-transparent border-none text-xs font-bold text-slate-400 text-center outline-none"
                              />
                            </div>
                            <div className="col-span-1">
                              <input 
                                type="number" 
                                value={item.quantidade}
                                onChange={(e) => updateItem(item.id, 'quantidade', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border-none text-xs font-black text-white text-center outline-none"
                              />
                            </div>
                            <div className="col-span-1">
                              <CurrencyInput
                                prefix="R$ "
                                decimalSeparator=","
                                groupSeparator="."
                                value={item.preco_unitario}
                                onValueChange={(value) => handleFixedDecimalValueChange(value, (v) => updateItem(item.id, 'preco_unitario', Number(v || 0)))}
                                className="w-full bg-transparent border-none text-xs font-black text-[#d4ff3f] text-right outline-none"
                              />
                            </div>
                            <div className="col-span-1 text-right">
                              <p className="text-xs font-black text-white">{formatCurrencyValue(item.total)}</p>
                            </div>
                            <div className="col-span-1 text-right">
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="p-1 text-slate-800 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {stageItems.length === 0 && (
                          <div className="py-8 text-center border border-dashed border-slate-800/50 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nenhum item nesta etapa</p>
                            <button 
                              onClick={() => addItem(stage)}
                              className="mt-2 text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest hover:underline"
                            >
                              + Adicionar Item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 pt-8 border-t border-slate-800/50">
        <button 
          onClick={() => router.push('/finances/budget')}
          className="px-8 py-3 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-12 py-3 bg-[#d4ff3f] text-[#0a0a0a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          SALVAR ORÇAMENTO
        </button>
      </div>
    </div>
  );
}
