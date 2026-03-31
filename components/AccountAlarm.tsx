'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

interface DueAccount {
  id: string;
  type: 'receivable' | 'payable';
  title: string;
  description: string;
  value: number;
  dueDate: string;
}

export default function AccountAlarm() {
  const [dueAccounts, setDueAccounts] = useState<DueAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasClosedToday, setHasClosedToday] = useState(false);

  const checkAlarms = useCallback(async () => {
    // Check if it's after 9:00 AM
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 9) {
      console.log('AccountAlarm: Ainda não são 9:00 AM');
      return;
    }

    // Check if already closed today
    const todayStr = now.toISOString().split('T')[0];
    const closedDate = localStorage.getItem('account_alarm_closed_date');
    if (closedDate === todayStr) {
      console.log('AccountAlarm: Alarme já foi fechado hoje');
      setHasClosedToday(true);
      return;
    }

    try {
      console.log('AccountAlarm: Verificando contas vencendo hoje...');
      const today = new Date().toISOString().split('T')[0];

      const [receivablesRes, payablesRes] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('*')
          .eq('data_vencimento', today)
          .in('situacao', ['Aberto', 'Em andamento']),
        supabase
          .from('contas_pagar')
          .select('*')
          .eq('data_vencimento', today)
          .in('situacao', ['Aberto', 'Em andamento'])
      ]);

      const accounts: DueAccount[] = [];

      if (receivablesRes.data) {
        receivablesRes.data.forEach(r => {
          accounts.push({
            id: r.id,
            type: 'receivable',
            title: r.cliente,
            description: r.descricao,
            value: r.valor,
            dueDate: r.data_vencimento
          });
        });
      }

      if (payablesRes.data) {
        payablesRes.data.forEach(p => {
          accounts.push({
            id: p.id,
            type: 'payable',
            title: p.fornecedor,
            description: p.descricao,
            value: p.valor,
            dueDate: p.data_vencimento
          });
        });
      }

      if (accounts.length > 0) {
        console.log(`AccountAlarm: Encontradas ${accounts.length} contas vencendo hoje`);
        setDueAccounts(accounts);
        setIsOpen(true);
        
        // Play sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.warn('Erro ao reproduzir som do alarme:', e));
      } else {
        console.log('AccountAlarm: Nenhuma conta vencendo hoje');
      }
    } catch (error) {
      console.error('Erro ao verificar alarmes de contas:', error);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkAlarms();
    
    // Check every 15 minutes
    const interval = setInterval(checkAlarms, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAlarms]);

  const handleClose = () => {
    setIsOpen(false);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('account_alarm_closed_date', todayStr);
    setHasClosedToday(true);
  };

  if (!isOpen || hasClosedToday) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1a1a] rounded-[32px] border border-[#d4ff3f]/20 shadow-2xl shadow-[#d4ff3f]/5 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-[#d4ff3f]/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-[#d4ff3f] text-black flex items-center justify-center shadow-lg shadow-[#d4ff3f]/20 animate-pulse">
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white italic">Alarme de <span className="text-[#d4ff3f]">Vencimento</span></h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contas vencendo hoje</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="size-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              {dueAccounts.map((account) => (
                <div 
                  key={`${account.type}-${account.id}`}
                  className="p-6 rounded-2xl bg-[#0a0a0a] border border-slate-800/50 hover:border-[#d4ff3f]/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${account.type === 'receivable' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {account.type === 'receivable' ? <TrendingUp size={16} /> : <DollarSign size={16} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {account.type === 'receivable' ? 'A Receber' : 'A Pagar'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Vence Hoje</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-black tracking-tight text-white mb-1 group-hover:text-[#d4ff3f] transition-colors">
                    {account.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mb-4">{account.description}</p>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{formatCurrency(account.value)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-[#0a0a0a]/50 border-t border-slate-800/50">
              <button 
                onClick={handleClose}
                className="w-full py-4 bg-[#d4ff3f] text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#c4ef2f] transition-all shadow-lg shadow-[#d4ff3f]/10"
              >
                Entendido, fechar alarme
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
