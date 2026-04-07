'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/types';
import CustomCurrencyInput from '@/components/CurrencyInput';
import { handleFixedDecimalValueChange, transformRawCurrencyValue } from '@/lib/currency';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  project?: Project | null; // If editing
}

export default function ProjectModal({ isOpen, onClose, onSuccess, project }: ProjectModalProps) {
  const [clients, setClients] = React.useState<{id: string, email: string, name: string}[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/admin/list-users', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (data.users) {
          const clientUsers = data.users
            .filter((u: { user_metadata?: { role?: string } }) => u.user_metadata?.role === 'Cliente')
            .map((u: { id: string, email: string, user_metadata?: { full_name?: string } }) => ({
              id: u.id,
              email: u.email,
              name: u.user_metadata?.full_name || u.email
            }));
          setClients(clientUsers);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };
    if (isOpen) fetchClients();
  }, [isOpen]);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<Partial<Project>>({
    defaultValues: {
      nome: '',
      id_contrato: '',
      status: 'Planejamento',
      orcamento: 0,
      gasto: 0,
      localizacao: '',
      fase: '',
      liquidez: 0,
      cliente_id: '',
    }
  });

  useEffect(() => {
    if (project) {
      reset({
        nome: project.nome,
        id_contrato: project.id_contrato || '',
        status: project.status,
        orcamento: project.orcamento,
        gasto: project.gasto,
        localizacao: project.localizacao || '',
        fase: project.fase || '',
        liquidez: project.liquidez,
        cliente_id: project.cliente_id || '',
      });
    } else {
      reset({
        nome: '',
        id_contrato: '',
        status: 'Planejamento',
        orcamento: 0,
        gasto: 0,
        localizacao: '',
        fase: '',
        liquidez: 0,
        cliente_id: '',
      });
    }
  }, [project, reset, isOpen]);

  const onSubmit = async (data: Partial<Project>) => {
    try {
      const payload = {
        ...data,
        orcamento: data.orcamento ? parseFloat(data.orcamento.toString().replace(',', '.')) : 0,
        gasto: data.gasto ? parseFloat(data.gasto.toString().replace(',', '.')) : 0,
        liquidez: data.liquidez ? parseInt(data.liquidez.toString()) : 0,
        cliente_id: data.cliente_id && data.cliente_id.trim() !== '' ? data.cliente_id : null,
      };

      if (project) {
        const { error } = await supabase
          .from('projetos')
          .update(payload)
          .eq('id', project.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projetos')
          .insert([payload]);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Erro desconhecido ao salvar projeto.';
      console.error('Error saving project:', errorMessage, error);
      alert(`Erro ao salvar projeto: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1a1a1a] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800/50"
        >
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-[#0a0a0a]">
            <h2 className="text-xl font-black text-white tracking-tight">
              {project ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-[#2a2a2a] rounded-xl transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Projeto *</label>
                <input 
                  {...register('nome', { required: true })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all placeholder:text-slate-700"
                  placeholder="Ex: Torre Skyline"
                />
                {errors.nome && <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest ml-1">Obrigatório</span>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID do Contrato</label>
                <input 
                  {...register('id_contrato')}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all placeholder:text-slate-700"
                  placeholder="Ex: #299-A"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  {...register('status')}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Planejamento">Planejamento</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fase</label>
                <input 
                  {...register('fase')}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all placeholder:text-slate-700"
                  placeholder="Ex: Fundação"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Orçamento (R$)</label>
                <Controller
                  name="orcamento"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomCurrencyInput
                      value={field.value}
                      onValueChange={(value) => handleFixedDecimalValueChange(value, field.onChange)}
                      transformRawValue={transformRawCurrencyValue}
                      decimalSeparator="," 
                      groupSeparator="."
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all placeholder:text-slate-700"
                      placeholder="R$ 0,00"
                    />
                  )}
                />
                {errors.orcamento && <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest ml-1">Obrigatório</span>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gasto Atual (R$)</label>
                <Controller
                  name="gasto"
                  control={control}
                  render={({ field }) => (
                    <CustomCurrencyInput
                      value={field.value}
                      onValueChange={(value) => handleFixedDecimalValueChange(value, field.onChange)}
                      transformRawValue={transformRawCurrencyValue}
                      decimalSeparator="," 
                      groupSeparator="."
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all placeholder:text-slate-700"
                      placeholder="R$ 0,00"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Liquidez (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  {...register('liquidez')}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cliente (Dono da Obra)</label>
                <select 
                  {...register('cliente_id')}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Nenhum Cliente Vinculado</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Localização</label>
                <input 
                  {...register('localizacao')}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all placeholder:text-slate-700"
                  placeholder="Ex: Centro"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#2a2a2a] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-3 active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (project ? 'Salvar Alterações' : 'Criar Projeto')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
