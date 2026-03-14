'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Insumo, CompositionItem } from '@/lib/types';

interface CompositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (composition: CompositionItem[], totals: { mo: number; mat: number; eq: number }) => void;
  initialComposition?: CompositionItem[];
  itemName: string;
}

export default function CompositionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialComposition = [], 
  itemName 
}: CompositionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Insumo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [composition, setComposition] = useState<CompositionItem[]>(initialComposition);

  useEffect(() => {
    if (isOpen) {
      setComposition(initialComposition);
    }
  }, [isOpen, initialComposition]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('tcpo_insumos')
        .select('*')
        .ilike('descricao', `%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching insumos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addInsumo = (insumo: Insumo) => {
    const newItem: CompositionItem = {
      codigo: insumo.id,
      insumo: insumo.descricao,
      un: insumo.unidade,
      coef: 1,
      p_unit: insumo.preco_unitario,
      p_total: insumo.preco_unitario,
      tipo: insumo.tipo
    };
    setComposition([...composition, newItem]);
  };

  const removeInsumo = (index: number) => {
    setComposition(composition.filter((_, i) => i !== index));
  };

  const updateCoef = (index: number, coef: number) => {
    const newComp = [...composition];
    newComp[index].coef = coef;
    newComp[index].p_total = coef * newComp[index].p_unit;
    setComposition(newComp);
  };

  const updatePrice = async (index: number, price: number) => {
    const newComp = [...composition];
    newComp[index].p_unit = price;
    newComp[index].p_total = newComp[index].coef * price;
    setComposition(newComp);

    // Sincroniza com a tabela de insumos se houver código
    if (newComp[index].codigo) {
      try {
        await supabase
          .from('tcpo_insumos')
          .update({ preco_unitario: price })
          .eq('id', newComp[index].codigo);
      } catch (error) {
        console.error('Error updating insumo price:', error);
      }
    }
  };

  const clearComposition = () => {
    if (confirm('Deseja realmente limpar toda a composição?')) {
      setComposition([]);
    }
  };

  const calculateTotals = () => {
    return composition.reduce((acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + item.p_total;
      return acc;
    }, { mo: 0, mat: 0, eq: 0 });
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/50 bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[#d4ff3f]/10 text-[#d4ff3f]">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight italic">Definição de <span className="text-[#d4ff3f]">Composição</span></h2>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Item: {itemName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Search & Selection */}
          <div className="w-full lg:w-80 border-r border-slate-800/50 p-5 space-y-5 overflow-y-auto custom-scrollbar bg-[#0d0d0d]">
            <div className="space-y-3">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Buscar Insumos</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="text" 
                    placeholder="Ex: Pedreiro, Cimento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30"
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="p-2 rounded-xl bg-[#d4ff3f] text-[#0a0a0a] hover:bg-[#c4ef2f] transition-all disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {searchResults.map((insumo) => (
                <button 
                  key={insumo.id}
                  onClick={() => addInsumo(insumo)}
                  className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-slate-800/50 hover:border-[#d4ff3f]/50 transition-all text-left group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded ${
                        insumo.tipo === 'mo' ? 'bg-blue-500/10 text-blue-500' :
                        insumo.tipo === 'mat' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {insumo.tipo === 'mo' ? 'Mão de Obra' : insumo.tipo === 'mat' ? 'Material' : 'Equipamento'}
                      </span>
                      <p className="text-xs font-bold text-white mt-1 group-hover:text-[#d4ff3f] transition-colors line-clamp-2">{insumo.descricao}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{insumo.unidade}</p>
                    </div>
                    <Plus size={14} className="text-slate-700 group-hover:text-[#d4ff3f] shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Composition List */}
          <div className="flex-1 flex flex-col bg-[#0a0a0a]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
              <table className="w-full text-left border-collapse border-spacing-0">
                <thead>
                  <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-[#1a1a1a]">
                    <th className="py-1 px-2 border border-slate-800 w-20">Código</th>
                    <th className="py-1 px-2 border border-slate-800">Componentes</th>
                    <th className="py-1 px-2 border border-slate-800 w-10 text-center">Un</th>
                    <th className="py-1 px-2 border border-slate-800 w-20 text-center">Consumos</th>
                    <th className="py-1 px-2 border border-slate-800 w-24 text-center">P. Unit</th>
                    <th className="py-1 px-2 border border-slate-800 w-28 text-right">P. Total</th>
                    <th className="py-1 px-2 border border-slate-800 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {composition.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="py-0.5 px-2 border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.codigo || '-'}</p>
                      </td>
                      <td className="py-0.5 px-2 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-slate-200 leading-tight">{item.insumo}</p>
                          <span className="text-[6px] font-black uppercase text-slate-600 shrink-0">{item.tipo}</span>
                        </div>
                      </td>
                      <td className="py-0.5 px-2 border border-slate-800/50 text-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{item.un}</span>
                      </td>
                      <td className="py-0.5 px-2 border border-slate-800/50">
                        <input 
                          type="number" 
                          step="0.001"
                          value={item.coef}
                          onChange={(e) => updateCoef(idx, Number(e.target.value))}
                          className="w-full bg-transparent border-none p-0 text-[10px] text-white text-center outline-none focus:ring-0 font-bold"
                        />
                      </td>
                      <td className="py-0.5 px-2 border border-slate-800/50">
                        <div className="flex items-center justify-center gap-0.5">
                          <span className="text-[8px] text-slate-600 font-bold">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.p_unit}
                            onChange={(e) => updatePrice(idx, Number(e.target.value))}
                            className="w-full bg-transparent border-none p-0 text-[10px] text-white outline-none focus:ring-0 font-bold"
                          />
                        </div>
                      </td>
                      <td className="py-0.5 px-2 border border-slate-800/50 text-right">
                        <p className="text-[10px] font-black text-[#d4ff3f]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.p_total)}
                        </p>
                      </td>
                      <td className="py-0.5 px-2 border border-slate-800/50 text-center">
                        <button 
                          onClick={() => removeInsumo(idx)}
                          className="p-0.5 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {composition.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center border border-slate-800/50">
                        <p className="text-slate-600 text-[9px] italic uppercase font-black tracking-widest">Adicione insumos da lista lateral</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Actions */}
            <div className="p-6 bg-[#1a1a1a] border-t border-slate-800/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Mão de Obra</p>
                  <p className="text-sm font-black text-blue-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.mo)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Materiais</p>
                  <p className="text-sm font-black text-orange-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.mat)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Equipamentos</p>
                  <p className="text-sm font-black text-purple-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.eq)}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Custo Unitário Total</p>
                  <p className="text-xl font-black text-[#d4ff3f]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.mo + totals.mat + totals.eq)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={clearComposition}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                >
                  <RefreshCw size={14} /> Limpar
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => onSave(composition, totals)}
                    className="flex items-center gap-2 px-8 py-2 rounded-xl bg-[#d4ff3f] text-[#0a0a0a] text-[9px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all shadow-lg shadow-[#d4ff3f]/10"
                  >
                    <Save size={16} /> Aplicar Composição
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
