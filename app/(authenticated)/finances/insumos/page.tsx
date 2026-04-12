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
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Insumo } from '@/lib/types';

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mo' | 'mat' | 'eq'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Insumo; direction: 'asc' | 'desc' | null }>({
    key: 'descricao',
    direction: 'asc'
  });
  const updateTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

  const handleSort = (key: keyof Insumo) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Insumo) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

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

  const handleUpdatePrice = (id: string, field: 'preco_unitario' | 'preco_sabado' | 'preco_domingo_feriado', newPrice: number) => {
    // Update local state immediately for responsive UI
    setInsumos(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: newPrice };
        // Apply formulas: Saturday = Normal + 50%, Sunday = Normal + 100%
        if (field === 'preco_unitario') {
          updated.preco_sabado = newPrice * 1.5;
          updated.preco_domingo_feriado = newPrice * 2.0;
        }
        return updated;
      }
      return i;
    }));

    // Debounce Supabase update to avoid "locking" the input during typing
    const timeoutKey = `${id}-${field}`;
    if (updateTimeouts.current[timeoutKey]) {
      clearTimeout(updateTimeouts.current[timeoutKey]);
    }

    updateTimeouts.current[timeoutKey] = setTimeout(async () => {
      try {
        const updates: Partial<Insumo> = { [field]: newPrice };
        if (field === 'preco_unitario') {
          updates.preco_sabado = newPrice * 1.5;
          updates.preco_domingo_feriado = newPrice * 2.0;
        }
        
        const { error } = await supabase
          .from('tcpo_insumos')
          .update(updates)
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error(`Error updating ${field}:`, err);
        setMessage({ text: 'Erro ao salvar preço no banco de dados.', type: 'error' });
      }
    }, 1000);
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

      const insumosMap = new Map<string, Insumo>(allInsumos.map(i => [i.id, i as Insumo]));
      const itemsMap = new Map<string, any>(allItems.map(i => [i.id, i]));

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
            custo_eq: totalEq,
            custo_sabado: (totalMO + totalMat + totalEq) * 1.5,
            custo_domingo_feriado: (totalMO + totalMat + totalEq) * 2
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
          custo_sabado: item.custo_sabado,
          custo_domingo_feriado: item.custo_domingo_feriado,
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
    preco_sabado: 0,
    preco_domingo_feriado: 0,
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

  const filteredInsumos = insumos
    .filter(i => {
      const matchesSearch = i.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || i.tipo === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Normal</label>
                  <input
                    type="text"
                    value={`R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(newInsumo.preco_unitario || 0)}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cents = parseInt(val || "0", 10);
                      const amount = cents / 100;
                      setNewInsumo({
                        ...newInsumo, 
                        preco_unitario: amount,
                        preco_sabado: amount * 1.5,
                        preco_domingo_feriado: amount * 2
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sábado</label>
                  <input
                    type="text"
                    value={`R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(newInsumo.preco_sabado || 0)}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cents = parseInt(val || "0", 10);
                      setNewInsumo({...newInsumo, preco_sabado: cents / 100});
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dom/Fer</label>
                  <input
                    type="text"
                    value={`R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(newInsumo.preco_domingo_feriado || 0)}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cents = parseInt(val || "0", 10);
                      setNewInsumo({...newInsumo, preco_domingo_feriado: cents / 100});
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  />
                </div>
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

        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[90px]" onClick={() => handleSort('id')}>
                  <div className="flex items-center">
                    Código {getSortIcon('id')}
                  </div>
                </th>
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('descricao')}>
                  <div className="flex items-center">
                    Descrição do Insumo {getSortIcon('descricao')}
                  </div>
                </th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white transition-colors w-[60px]" onClick={() => handleSort('unidade')}>
                  <div className="flex items-center justify-center">
                    Unid. {getSortIcon('unidade')}
                  </div>
                </th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white transition-colors w-[110px]" onClick={() => handleSort('tipo')}>
                  <div className="flex items-center justify-center">
                    Tipo {getSortIcon('tipo')}
                  </div>
                </th>
                <th className="px-2 py-2 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest w-[60px]">
                  Norm
                </th>
                <th className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors w-[100px]" onClick={() => handleSort('preco_unitario')}>
                  <div className="flex items-center justify-end">
                    Normal {getSortIcon('preco_unitario')}
                  </div>
                </th>
                <th className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors w-[100px]" onClick={() => handleSort('preco_sabado')}>
                  <div className="flex items-center justify-end">
                    Sábado {getSortIcon('preco_sabado')}
                  </div>
                </th>
                <th className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors w-[100px]" onClick={() => handleSort('preco_domingo_feriado')}>
                  <div className="flex items-center justify-end">
                    Dom/Fer {getSortIcon('preco_domingo_feriado')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando insumos...</p>
                  </td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 text-sm font-bold">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((insumo) => (
                  <tr key={insumo.id} className="hover:bg-[#0a0a0a] transition-colors group">
                    <td className="px-2 py-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{insumo.id}</p>
                    </td>
                    <td className="px-2 py-1.5 overflow-hidden">
                      <p className="text-sm font-bold text-white truncate" title={insumo.descricao}>{insumo.descricao}</p>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insumo.unidade}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getTypeColor(insumo.tipo)}`}>
                        {getTypeName(insumo.tipo)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[10px] font-black text-[#d4ff3f] inline-block min-w-[40px]">
                        {Math.floor(insumo.preco_unitario || 0)}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex justify-end">
                        <input
                          type="text"
                          value={`R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(insumo.preco_unitario || 0)}`}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const cents = parseInt(val || "0", 10);
                            handleUpdatePrice(insumo.id, 'preco_unitario', cents / 100);
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-24 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[10px] font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex justify-end">
                        <input
                          type="text"
                          value={`R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(insumo.preco_sabado || 0)}`}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const cents = parseInt(val || "0", 10);
                            handleUpdatePrice(insumo.id, 'preco_sabado', cents / 100);
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-24 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[10px] font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex justify-end">
                        <input
                          type="text"
                          value={`R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(insumo.preco_domingo_feriado || 0)}`}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const cents = parseInt(val || "0", 10);
                            handleUpdatePrice(insumo.id, 'preco_domingo_feriado', cents / 100);
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-24 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[10px] font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
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
