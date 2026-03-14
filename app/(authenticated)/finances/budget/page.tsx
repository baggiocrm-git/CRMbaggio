'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  AlertCircle,
  FileText,
  Trash2,
  Edit2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Budget {
  id: string;
  projeto_id: string;
  nome: string;
  total_geral: number;
  created_at: string;
  projeto?: {
    nome: string;
  };
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      // We'll try to fetch from 'orcamentos' table. 
      // If it doesn't exist, we'll show a helpful message.
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          projeto:projetos(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setError('A tabela "orcamentos" não foi encontrada. Por favor, crie-a no seu banco de dados Supabase.');
        } else {
          setError(error.message);
        }
        console.error('Error fetching budgets:', error);
      } else {
        setBudgets(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar orçamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredBudgets = budgets.filter(b => 
    b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.projeto?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
    try {
      // Get budget info first to know which project to update
      const { data: budgetToDelete } = await supabase
        .from('orcamentos')
        .select('projeto_id')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('orcamentos').delete().eq('id', id);
      if (error) throw error;

      // If budget had a project, update project's budget value
      if (budgetToDelete?.projeto_id) {
        // Recalculate total of remaining budgets for this project
        const { data: remainingBudgets } = await supabase
          .from('orcamentos')
          .select('total_geral')
          .eq('projeto_id', budgetToDelete.projeto_id);
        
        const newTotal = (remainingBudgets || []).reduce((acc, curr) => acc + (curr.total_geral || 0), 0);

        await supabase
          .from('projetos')
          .update({ orcamento: newTotal })
          .eq('id', budgetToDelete.projeto_id);
      }

      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('Erro ao excluir orçamento.');
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Gestão de <span className="text-[#d4ff3f]">Orçamentos</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Planejamento financeiro detalhado por obra (TCPO/PINI)</p>
        </div>
        <Link 
          href="/finances/budget/new"
          className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> NOVO ORÇAMENTO
        </Link>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-rose-500" size={20} />
            <p className="text-xs font-bold text-rose-500 uppercase tracking-tight">{error}</p>
          </div>
          {error.includes('não foi encontrada') && (
            <div className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed max-w-md">
              Dica: Crie as tabelas &apos;orcamentos&apos; e &apos;orcamento_itens&apos; no Supabase para habilitar esta funcionalidade.
            </div>
          )}
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar orçamento ou obra..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-6 py-4">Orçamento</th>
                <th className="px-6 py-4">Obra / Projeto</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando orçamentos...</p>
                  </td>
                </tr>
              ) : filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm font-bold">
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-[#0a0a0a] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800/50 text-[#d4ff3f]">
                          <FileText size={16} />
                        </div>
                        <p className="text-sm font-bold text-white">{budget.nome}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-500" />
                        <p className="text-sm text-slate-400">{budget.projeto?.nome || 'Sem projeto'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-[#d4ff3f]">{formatCurrency(budget.total_geral)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/finances/budget/edit/${budget.id}`}
                          className="p-1 text-slate-500 hover:text-[#d4ff3f] transition-colors"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(budget.id)}
                          className="p-1 text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <Link 
                          href={`/finances/budget/view/${budget.id}`}
                          className="p-1 text-slate-500 hover:text-white transition-colors"
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </div>
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
