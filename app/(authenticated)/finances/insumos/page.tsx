'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Save, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Insumo } from '@/lib/types';
import CurrencyInput from 'react-currency-input-field';

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mo' | 'mat' | 'eq'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcpo_insumos')
        .select('*')
        .order('descricao');
      
      if (error) throw error;
      setInsumos(data || []);
    } catch (err) {
      console.error('Error fetching insumos:', err);
      setMessage({ text: 'Erro ao carregar insumos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('tcpo_insumos')
        .update({ preco_unitario: newPrice })
        .eq('id', id);
      
      if (error) throw error;
      
      setInsumos(prev => prev.map(i => i.id === id ? { ...i, preco_unitario: newPrice } : i));
    } catch (err) {
      console.error('Error updating price:', err);
      setMessage({ text: 'Erro ao atualizar preço.', type: 'error' });
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setMessage(null);
    try {
      // We'll call a function to recalculate all TCPO items based on current insumos
      // For now, we'll implement the logic here or call a server-side function if we had one.
      // Since we are client-side, we'll do it here.
      
      // 1. Get all insumos and items
      const { data: allInsumos } = await supabase.from('tcpo_insumos').select('*');
      const { data: allItems } = await supabase.from('tcpo_itens').select('*');
      
      if (!allInsumos || !allItems) throw new Error('Falha ao buscar dados para recalcular.');

      const insumosMap = new Map(allInsumos.map(i => [i.id, i]));
      const itemsMap = new Map(allItems.map(i => [i.id, i]));

      // 2. Perform recalculation (3 passes to handle nesting)
      const updatedItems = [...allItems];
      
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < updatedItems.length; i++) {
          const item = updatedItems[i];
          if (!item.composicao || !Array.isArray(item.composicao)) continue;

          let totalMO = 0;
          let totalMat = 0;
          let totalEq = 0;

          const newComposicao = item.composicao.map((comp: { codigo?: string; p_unit: number; coef: number; tipo: string }) => {
            let p_unit = comp.p_unit;
            
            if (comp.codigo && insumosMap.has(comp.codigo)) {
              p_unit = insumosMap.get(comp.codigo)!.preco_unitario;
            } else if (comp.codigo && itemsMap.has(comp.codigo)) {
              const subItem = itemsMap.get(comp.codigo)!;
              p_unit = (subItem.custo_mo || 0) + (subItem.custo_mat || 0) + (subItem.custo_eq || 0);
            }

            const p_total = p_unit * (comp.coef || 0);
            
            if (comp.tipo === 'mo') totalMO += p_total;
            else if (comp.tipo === 'mat') totalMat += p_total;
            else if (comp.tipo === 'eq') totalEq += p_total;

            return { ...comp, p_unit, p_total };
          });

          updatedItems[i] = {
            ...item,
            composicao: newComposicao,
            custo_mo: totalMO,
            custo_mat: totalMat,
            custo_eq: totalEq
          };
          itemsMap.set(item.id, updatedItems[i]);
        }
      }

      // 3. Save updates
      // To avoid massive individual calls, we could use a RPC or just loop (limited for demo)
      for (const item of updatedItems) {
        await supabase.from('tcpo_itens').update({
          custo_mo: item.custo_mo,
          custo_mat: item.custo_mat,
          custo_eq: item.custo_eq,
          composicao: item.composicao,
          updated_at: new Date().toISOString()
        }).eq('id', item.id);
      }

      setMessage({ text: 'Todos os serviços foram recalculados com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error recalculating:', err);
      setMessage({ text: 'Erro ao recalcular serviços.', type: 'error' });
    } finally {
      setIsRecalculating(false);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInsumo, setNewInsumo] = useState<Partial<Insumo>>({
    id: '',
    descricao: '',
    unidade: 'un',
    preco_unitario: 0,
    tipo: 'mat'
  });

  const handleAddInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsumo.id || !newInsumo.descricao) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tcpo_insumos')
        .insert([newInsumo]);
      
      if (error) throw error;
      
      setInsumos(prev => [...prev, newInsumo as Insumo].sort((a, b) => a.descricao.localeCompare(b.descricao)));
      setIsAddModalOpen(false);
      setNewInsumo({ id: '', descricao: '', unidade: 'un', preco_unitario: 0, tipo: 'mat' });
      setMessage({ text: 'Insumo adicionado com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error adding insumo:', err);
      setMessage({ text: 'Erro ao adicionar insumo. Verifique se o código já existe.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInsumo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este insumo?')) return;

    try {
      const { error } = await supabase
        .from('tcpo_insumos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setInsumos(prev => prev.filter(i => i.id !== id));
      setMessage({ text: 'Insumo excluído com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error deleting insumo:', err);
      setMessage({ text: 'Erro ao excluir insumo. Ele pode estar sendo usado em composições.', type: 'error' });
    }
  };

  const filteredInsumos = insumos.filter(i => {
    const matchesSearch = i.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || i.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeName = (type: string) => {
    switch (type) {
      case 'mo': return 'Mão de Obra';
      case 'mat': return 'Material';
      case 'eq': return 'Equipamento';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mo': return 'text-blue-500 bg-blue-500/10';
      case 'mat': return 'text-orange-500 bg-orange-500/10';
      case 'eq': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Gestão de <span className="text-[#d4ff3f]">Insumos</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cadastro e precificação base para composições</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isRecalculating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Recalcular Serviços
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> NOVO INSUMO
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-black italic uppercase tracking-tight">Novo <span className="text-[#d4ff3f]">Insumo</span></h2>
            </div>
            <form onSubmit={handleAddInsumo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código</label>
                <input 
                  type="text" 
                  required
                  value={newInsumo.id}
                  onChange={e => setNewInsumo({...newInsumo, id: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  placeholder="Ex: 01.01.001"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={newInsumo.descricao}
                  onChange={e => setNewInsumo({...newInsumo, descricao: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  placeholder="Nome do insumo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                  <input 
                    type="text" 
                    required
                    value={newInsumo.unidade}
                    onChange={e => setNewInsumo({...newInsumo, unidade: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                    placeholder="Ex: h, m2, kg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                  <select 
                    value={newInsumo.tipo}
                    onChange={e => setNewInsumo({...newInsumo, tipo: e.target.value as 'mo' | 'mat' | 'eq'})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  >
                    <option value="mat">Material</option>
                    <option value="mo">Mão de Obra</option>
                    <option value="eq">Equipamento</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço Unitário</label>
                <CurrencyInput
                  prefix="R$ "
                  decimalSeparator=","
                  groupSeparator="."
                  value={newInsumo.preco_unitario}
                  onValueChange={(_, __, values) => setNewInsumo({...newInsumo, preco_unitario: values?.float || 0})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-xs font-bold uppercase tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar insumo por nome ou código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'all' ? 'bg-[#d4ff3f] text-[#0a0a0a]' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('mo')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'mo' ? 'bg-blue-500 text-white' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Mão de Obra
            </button>
            <button 
              onClick={() => setFilterType('mat')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'mat' ? 'bg-orange-500 text-white' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Materiais
            </button>
            <button 
              onClick={() => setFilterType('eq')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'eq' ? 'bg-purple-500 text-white' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Equipamentos
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-6 py-2">Código</th>
                <th className="px-6 py-2">Descrição do Insumo</th>
                <th className="px-6 py-2 text-center">Unid.</th>
                <th className="px-6 py-2 text-center">Tipo</th>
                <th className="px-6 py-2 text-right">Preço Unitário</th>
                <th className="px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando insumos...</p>
                  </td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm font-bold">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((insumo) => (
                  <tr key={insumo.id} className="hover:bg-[#0a0a0a] transition-colors group">
                    <td className="px-6 py-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{insumo.id}</p>
                    </td>
                    <td className="px-6 py-1.5">
                      <p className="text-sm font-bold text-white">{insumo.descricao}</p>
                    </td>
                    <td className="px-6 py-1.5 text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insumo.unidade}</span>
                    </td>
                    <td className="px-6 py-1.5 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getTypeColor(insumo.tipo)}`}>
                        {getTypeName(insumo.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <div className="flex justify-end">
                        <CurrencyInput
                          prefix="R$ "
                          decimalSeparator=","
                          groupSeparator="."
                          value={insumo.preco_unitario}
                          onValueChange={(_, __, values) => handleUpdatePrice(insumo.id, values?.float || 0)}
                          className="w-32 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-1 text-xs font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <button 
                        onClick={() => handleDeleteInsumo(insumo.id)}
                        className="p-1 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
