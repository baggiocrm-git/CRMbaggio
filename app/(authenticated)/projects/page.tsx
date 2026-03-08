'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  List, 
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectList from '@/components/projects/ProjectList';
import ProjectModal from '@/components/projects/ProjectModal';
import Header from '@/components/Header';
import { Project, ProjectStatus } from '@/lib/types';

const COLUMNS: ProjectStatus[] = ['Planejamento', 'Em Andamento', 'Atrasado', 'Concluído'];

export default function ProjectsPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id_contrato && p.id_contrato.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [projects, searchQuery]);

  const projectsByStatus = useMemo(() => {
    const grouped: Record<ProjectStatus, Project[]> = {
      'Planejamento': [],
      'Em Andamento': [],
      'Atrasado': [],
      'Concluído': []
    };
    filteredProjects.forEach(p => {
      if (grouped[p.status]) {
        grouped[p.status].push(p);
      }
    });
    return grouped;
  }, [filteredProjects]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ProjectStatus;
    
    // Optimistic update
    const updatedProjects = projects.map(p => 
      p.id === draggableId ? { ...p, status: newStatus } : p
    );
    setProjects(updatedProjects);

    // Persist to database
    const { error } = await supabase
      .from('projetos')
      .update({ status: newStatus })
      .eq('id', draggableId);

    if (error) {
      console.error('Error updating project status:', error);
      fetchProjects(); // Rollback on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

    const { error } = await supabase
      .from('projetos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      alert('Erro ao excluir projeto.');
    } else {
      fetchProjects();
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <Header 
        title="Projetos" 
        subtitle="Gerencie e acompanhe o progresso de todas as obras em tempo real."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        action={{ label: 'Novo Projeto', onClick: handleCreate }}
      />

      <div className="p-8 flex-1 overflow-y-auto">
        {/* View Switcher & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="bg-white dark:bg-[#1a2430] border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex items-center shadow-sm w-fit">
            <button 
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 px-3 ${view === 'kanban' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutGrid size={18} />
              <span className="text-xs font-bold">Kanban</span>
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 px-3 ${view === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <List size={18} />
              <span className="text-xs font-bold">Lista</span>
            </button>
          </div>
          
          <button className="bg-white dark:bg-[#1a2430] border border-slate-200 dark:border-slate-800 px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-sm">
            <Filter size={18} />
            Filtros Avançados
          </button>
        </div>

        {/* Content */}
        {loading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Projetos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2430] border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Nenhum projeto encontrado</h3>
            <p className="text-slate-500 max-w-md mx-auto">Tente ajustar sua busca ou crie um novo projeto para começar a gerenciar suas obras.</p>
          </div>
        ) : view === 'kanban' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-6">
              {COLUMNS.map((status) => (
                <div key={status} className="flex flex-col min-w-[300px]">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">{status}</h2>
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {projectsByStatus[status].length}
                      </span>
                    </div>
                  </div>
                  
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[500px] rounded-2xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-600/20 ring-inset' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}
                      >
                        {projectsByStatus[status].map((project: Project, index: number) => (
                          <ProjectCard 
                            key={project.id} 
                            project={project} 
                            index={index} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <ProjectList 
            projects={filteredProjects} 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        project={selectedProject}
      />
    </>
  );
}
