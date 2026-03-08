'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: Project | null; // If editing
}

export default function ProjectModal({ isOpen, onClose, onSuccess, project }: ProjectModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Partial<Project>>({
    defaultValues: {
      nome: '',
      id_contrato: '',
      status: 'Planejamento',
      orcamento: 0,
      gasto: 0,
      localizacao: '',
      fase: '',
      liquidez: 0,
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
      });
    }
  }, [project, reset, isOpen]);

  const onSubmit = async (data: Partial<Project>) => {
    try {
      const payload = {
        ...data,
        orcamento: parseFloat(data.orcamento as unknown as string),
        gasto: parseFloat(data.gasto as unknown as string),
        liquidez: parseInt(data.liquidez as unknown as string),
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
      console.error('Error saving project:', error);
      alert('Erro ao salvar projeto. Verifique o console.');
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
          className="bg-white dark:bg-[#1a2430] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {project ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Projeto *</label>
                <input 
                  {...register('nome', { required: true })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="Ex: Torre Skyline"
                />
                {errors.nome && <span className="text-red-500 text-[10px] font-bold uppercase">Obrigatório</span>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ID do Contrato</label>
                <input 
                  {...register('id_contrato')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="Ex: #299-A"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</label>
                <select 
                  {...register('status')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none"
                >
                  <option value="Planejamento">Planejamento</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fase</label>
                <input 
                  {...register('fase')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="Ex: Fundação"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Orçamento (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  {...register('orcamento', { required: true })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gasto Atual (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  {...register('gasto')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Liquidez (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  {...register('liquidez')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Localização</label>
                <input 
                  {...register('localizacao')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="Ex: Centro"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
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
