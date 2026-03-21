import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TCPOItem, BudgetItem, CompositionItem } from '@/lib/types';
import { PRICE_CORRECTION_FACTOR_2026 } from '@/lib/constants';

interface SearchOptions {
  categoria?: string;
  limit?: number;
}

export function useTCPOSearch(options: SearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TCPOItem[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Se a busca parecer um código (começa com número) ou for muito curta, usamos ilike
      // Caso contrário, usamos o textSearch que é mais potente para descrições longas
      const isCode = /^\d/.test(searchQuery);
      
      let q = supabase.from('tcpo_itens').select('*');

      if (isCode || searchQuery.length < 4) {
        // Busca por ID (código) ou parte da descrição
        q = q.or(`id.ilike.%${searchQuery}%,descricao.ilike.%${searchQuery}%`);
      } else {
        // Busca textual avançada
        q = q.textSearch('descricao', searchQuery, { 
          config: 'portuguese', 
          type: 'websearch' 
        });
      }

      if (options.categoria) {
        q = q.eq('categoria', options.categoria);
      }

      const { data, error } = await q.limit(options.limit || 10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error searching TCPO:', error);
    } finally {
      setLoading(false);
    }
  }, [options.categoria, options.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    clearSuggestions: () => setSuggestions([])
  };
}

export function useOrcamento() {
  const [items, setItems] = useState<Partial<BudgetItem>[]>([]);

  const addItem = async (tcpoItem: TCPOItem) => {
    // Busca os preços atualizados dos insumos da composição
    let updatedComposition = [...(tcpoItem.composicao || [])];
    
    if (updatedComposition.length > 0) {
      const codigos = updatedComposition.map(c => c.codigo).filter(Boolean);
      if (codigos.length > 0) {
        const { data: insumos } = await supabase
          .from('tcpo_insumos')
          .select('id, preco_unitario')
          .in('id', codigos);

        if (insumos) {
          const priceMap = new Map(insumos.map(i => [i.id, i.preco_unitario]));
          updatedComposition = updatedComposition.map(c => {
            const p_unit = priceMap.get(c.codigo) || c.p_unit || 0;
            return {
              ...c,
              p_unit,
              p_total: (c.coef || 0) * p_unit
            };
          });
        }
      }
    }

    // Recalcula totais baseados na composição atualizada
    const totals = updatedComposition.reduce((acc, comp) => {
      if (comp.tipo === 'mo') acc.mo += comp.p_total;
      else if (comp.tipo === 'mat') acc.mat += comp.p_total;
      else if (comp.tipo === 'eq') acc.eq += comp.p_total;
      return acc;
    }, { mo: 0, mat: 0, eq: 0 });

    const newItem: Partial<BudgetItem> = {
      tcpo_id: tcpoItem.id,
      descricao_personalizada: tcpoItem.descricao,
      quantidade: 1,
      unidade: tcpoItem.unidade,
      custo_unit_mo: totals.mo || tcpoItem.custo_mo,
      custo_unit_mat: totals.mat || tcpoItem.custo_mat,
      custo_unit_eq: totals.eq || tcpoItem.custo_eq,
      // BDI padrão já vem em porcentagem (ex: 25)
      bdi: tcpoItem.bdi_padrao || 0,
      ordem: items.length,
      composicao: updatedComposition
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<BudgetItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const updateItemComposition = (index: number, composition: CompositionItem[], totals: { mo: number; mat: number; eq: number }) => {
    const newItems = [...items];
    newItems[index] = { 
      ...newItems[index], 
      composicao: composition,
      custo_unit_mo: totals.mo,
      custo_unit_mat: totals.mat,
      custo_unit_eq: totals.eq
    };
    setItems(newItems);
  };

  const updateCompositionItem = async (itemIndex: number, compIndex: number, updates: Partial<CompositionItem>) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    if (!item.composicao) return;

    const newComposition = [...item.composicao];
    newComposition[compIndex] = { ...newComposition[compIndex], ...updates };
    
    // Recalcula p_total do item da composição
    newComposition[compIndex].p_total = (newComposition[compIndex].coef || 0) * (newComposition[compIndex].p_unit || 0);

    // Recalcula totais da composição (mo, mat, eq)
    const newTotals = newComposition.reduce((acc, comp) => {
      if (comp.tipo === 'mo') acc.mo += comp.p_total;
      else if (comp.tipo === 'mat') acc.mat += comp.p_total;
      else if (comp.tipo === 'eq') acc.eq += comp.p_total;
      return acc;
    }, { mo: 0, mat: 0, eq: 0 });

    newItems[itemIndex] = {
      ...item,
      composicao: newComposition,
      custo_unit_mo: newTotals.mo,
      custo_unit_mat: newTotals.mat,
      custo_unit_eq: newTotals.eq
    };

    setItems(newItems);

    // Sincroniza com tcpo_insumos se p_unit foi alterado
    if (updates.p_unit !== undefined && newComposition[compIndex].codigo) {
      try {
        await supabase
          .from('tcpo_insumos')
          .update({ preco_unitario: updates.p_unit })
          .eq('id', newComposition[compIndex].codigo);
      } catch (error) {
        console.error('Error updating insumo price:', error);
      }
    }
  };

  const applyCorrectionFactor = (itemIndex: number) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    if (!item.composicao) return;

    const newComposition = item.composicao.map(c => ({
      ...c,
      p_unit: (c.p_unit || 0) * PRICE_CORRECTION_FACTOR_2026,
      p_total: (c.coef || 0) * (c.p_unit || 0) * PRICE_CORRECTION_FACTOR_2026
    }));

    const newTotals = newComposition.reduce((acc, comp) => {
      if (comp.tipo === 'mo') acc.mo += comp.p_total;
      else if (comp.tipo === 'mat') acc.mat += comp.p_total;
      else if (comp.tipo === 'eq') acc.eq += comp.p_total;
      return acc;
    }, { mo: 0, mat: 0, eq: 0 });

    newItems[itemIndex] = {
      ...item,
      composicao: newComposition,
      custo_unit_mo: newTotals.mo,
      custo_unit_mat: newTotals.mat,
      custo_unit_eq: newTotals.eq
    };

    setItems(newItems);
  };

  const totals = items.reduce((acc, item) => {
    const mo = (item.custo_unit_mo || 0) * (item.quantidade || 0);
    const mat = (item.custo_unit_mat || 0) * (item.quantidade || 0);
    const eq = (item.custo_unit_eq || 0) * (item.quantidade || 0);
    const subtotal = mo + mat + eq;
    // BDI é tratado como porcentagem (ex: 30)
    const total = subtotal * (1 + (item.bdi || 0) / 100);

    return {
      mo: acc.mo + mo,
      mat: acc.mat + mat,
      eq: acc.eq + eq,
      subtotal: acc.subtotal + subtotal,
      total: acc.total + total
    };
  }, { mo: 0, mat: 0, eq: 0, subtotal: 0, total: 0 });

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    updateItemComposition,
    updateCompositionItem,
    applyCorrectionFactor,
    totals
  };
}
