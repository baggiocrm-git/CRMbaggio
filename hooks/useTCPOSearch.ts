import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TCPOItem, BudgetItem } from '@/lib/types';

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
      let q = supabase
        .from('tcpo_itens')
        .select('*')
        .ilike('descricao', `%${searchQuery}%`);

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

  const addItem = (tcpoItem: TCPOItem) => {
    const newItem: Partial<BudgetItem> = {
      tcpo_id: tcpoItem.id,
      descricao_personalizada: tcpoItem.descricao,
      quantidade: 1,
      unidade: tcpoItem.unidade,
      custo_unit_mo: tcpoItem.custo_mo,
      custo_unit_mat: tcpoItem.custo_mat,
      custo_unit_eq: tcpoItem.custo_eq,
      bdi: tcpoItem.bdi_padrao,
      ordem: items.length
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

  const totals = items.reduce((acc, item) => {
    const mo = (item.custo_unit_mo || 0) * (item.quantidade || 0);
    const mat = (item.custo_unit_mat || 0) * (item.quantidade || 0);
    const eq = (item.custo_unit_eq || 0) * (item.quantidade || 0);
    const subtotal = mo + mat + eq;
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
    totals
  };
}
