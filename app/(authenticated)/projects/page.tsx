'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Filter, 
  LayoutGrid, 
  List, 
  Calendar, 
  Map, 
  MoreHorizontal,
  MapPin,
  Loader2,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Project {
  id: string;
  name: string;
  contract_id: string;
  status: 'Planejamento' | 'Em Andamento' | 'Atrasado' | 'Concluído';
  budget: number;
  spent: number;
  balance: number;
  liquidity: number;
  location: string;
  phase: string;
  created_at: string;
}

const columns = [
  { id: 'Planejamento', name: 'Planejamento', color: 'bg-slate-400' },
  { id: 'Em Andamento', name: 'Em Andamento', color: 'bg-blue-500' },
  { id: 'Atrasado', name: 'Atrasado', color: 'bg-rose-500' },
  { id: 'Concluído', name: 'Concluído', color: 'bg-emerald-500' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contract_id: '',
    status: 'Planejamento' as Project['status'],
    budget: 0,
    spent: 0,
    liquidity: 0,
    location: '',
    phase: '',
  });

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        contract_id: project.contract_id,
        status: project.status,
        budget: project.budget,
        spent: project.spent,
        liquidity: project.liquidity,
        location: project.location,
        phase: project.phase,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        contract_id: '',
        status: 'Planejamento',
        budget: 0,
        spent: 0,
        liquidity: 0,
        location: '',
        phase: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([formData]);
        if (error) throw error;
      }
      await fetchProjects();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      alert('Falha ao salvar projeto.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchProjects();
      } catch (error) {
        console.error('Erro ao excluir projeto:', error);
        alert('Falha ao excluir projeto.');
      }
    }
  };
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Gestão de Projetos de Construção" 
          subtitle="Gerencie canteiros de obras, cronogramas e documentação técnica em todas as regiões ativas."
          action={{ label: 'Novo Projeto', onClick: () => handleOpenModal() }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* View Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-8">
              <button className="flex items-center gap-2 border-b-2 border-blue-600 text-blue-600 pb-4 font-bold text-sm">
                <LayoutGrid size={16} />
                Quadro Kanban
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 pb-4 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <List size={16} />
                Visualização em Lista
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 pb-4 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Calendar size={16} />
                Cronograma (Gantt)
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 pb-4 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Map size={16} />
                Mapa do Local
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all mb-2">
              <Filter size={16} />
              Filtros
            </button>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            {isLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="text-blue-600 animate-spin" />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Carregando projetos...</p>
              </div>
            ) : (
              columns.map((col) => (
                <div key={col.id} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${col.color}`}></div>
                      <h3 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest">{col.name}</h3>
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-lg font-black">
                        {projects.filter(p => p.status === col.id).length}
                      </span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {projects.filter(p => p.status === col.id).map((project) => (
                      <motion.div 
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white dark:bg-slate-900 border ${project.status === 'Atrasado' ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer relative`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                            project.status === 'Planejamento' ? 'bg-slate-500/10 text-slate-600' :
                            project.status === 'Em Andamento' ? 'bg-blue-500/10 text-blue-600' :
                            project.status === 'Atrasado' ? 'bg-rose-500/10 text-rose-600' :
                            'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {project.phase}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(project); }} className="p-1 hover:text-blue-600 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="p-1 hover:text-rose-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-black text-slate-900 dark:text-white mb-1 tracking-tight">{project.name}</h4>
                        
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-4">
                          <MapPin size={12} />
                          {project.location}
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>Progresso</span>
                            <span className={project.status === 'Atrasado' ? 'text-rose-500' : 'text-blue-600'}>
                              {Math.round((project.spent / project.budget) * 100) || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${project.status === 'Atrasado' ? 'bg-rose-500' : 'bg-blue-600'}`} 
                              style={{ width: `${Math.min(100, (project.spent / project.budget) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Orçamento</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">R${project.budget.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Liquidez</span>
                            <span className={`text-xs font-black ${project.liquidity < 30 ? 'text-rose-500' : 'text-emerald-500'}`}>{project.liquidity}%</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome do Projeto</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Torre de Escritórios Skyline"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ID do Contrato</label>
                      <input 
                        required
                        type="text" 
                        value={formData.contract_id}
                        onChange={(e) => setFormData({...formData, contract_id: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="#299-A"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as Project['status']})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        {columns.map(col => (
                          <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Orçamento (R$)</label>
                      <input 
                        required
                        type="number" 
                        value={formData.budget}
                        onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gasto (R$)</label>
                      <input 
                        required
                        type="number" 
                        value={formData.spent}
                        onChange={(e) => setFormData({...formData, spent: Number(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Liquidez (%)</label>
                      <input 
                        required
                        type="number" 
                        min="0"
                        max="100"
                        value={formData.liquidity}
                        onChange={(e) => setFormData({...formData, liquidity: Number(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Fase</label>
                      <input 
                        required
                        type="text" 
                        value={formData.phase}
                        onChange={(e) => setFormData({...formData, phase: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Fase Estrutural"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Localização</label>
                      <input 
                        required
                        type="text" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: São Paulo, SP"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                    >
                      {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
