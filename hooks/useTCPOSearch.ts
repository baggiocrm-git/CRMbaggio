import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TCPOItem, BudgetItem, CompositionItem } from '@/lib/types';
// import { PRICE_CORRECTION_FACTOR_2026 } from '@/lib/constants';

interface SearchOptions {
  categoria?: string;
  limit?: number;
}

export function useTCPOSearch(options: SearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TCPOItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchSuggestions = async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const isCode = /^\d/.test(query);
        let q = supabase.from('tcpo_itens').select('*');

        // Usamos ilike para garantir que a busca funcione caractere por caractere (partial matching)
        // Isso evita o comportamento errático do textSearch em buscas curtas/incompletas
        if (isCode) {
          q = q.ilike('id', `%${query}%`);
        } else {
          // Busca por descrição ou ID
          q = q.or(`id.ilike.%${query}%,descricao.ilike.%${query}%`);
        }

        if (options.categoria) {
          q = q.eq('categoria', options.categoria);
        }

        const { data, error } = await q.limit(options.limit || 10);

        if (error) throw error;
        
        if (active) {
          setSuggestions(data || []);
        }
      } catch (error) {
        if (active) {
          console.error('Error searching TCPO:', error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, options.categoria, options.limit]);

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
  const [variacaoAnual, setVariacaoAnual] = useState<number>(0);

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
      // BDI padrão removido (solicitação do usuário para entrar manualmente)
      bdi: 0,
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

  const totals = items.reduce((acc, item) => {
    const factor = 1 + (variacaoAnual / 100);
    // Aplicamos a variação apenas em MO e MAT, conforme lógica de negócio
    const mo = (item.custo_unit_mo || 0) * (item.quantidade || 0) * factor;
    const mat = (item.custo_unit_mat || 0) * (item.quantidade || 0) * factor;
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

  // Retornamos os itens com os preços já ajustados pela variação para facilitar a exibição
  const adjustedItems = items.map(item => {
    const factor = 1 + (variacaoAnual / 100);
    return {
      ...item,
      custo_unit_mo_adj: (item.custo_unit_mo || 0) * factor,
      custo_unit_mat_adj: (item.custo_unit_mat || 0) * factor,
      custo_unit_eq_adj: item.custo_unit_eq || 0,
    };
  });

  return {
    items,
    adjustedItems,
    setItems,
    variacaoAnual,
    setVariacaoAnual,
    addItem,
    removeItem,
    updateItem,
    updateItemComposition,
    updateCompositionItem,
    totals
  };
}
