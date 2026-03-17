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
      const [projectsRes, rdosRes] = await Promise.all([
        supabase.from('projetos').select('*').order('created_at', { ascending: false }),
        supabase.from('rdos').select('projeto_id')
      ]);
      
      if (projectsRes.error) throw projectsRes.error;
      if (rdosRes.error) throw rdosRes.error;

      const rdoProjectIds = new Set(rdosRes.data.map(r => r.projeto_id));
      
      const projectsWithRdoStatus = (projectsRes.data || []).map(p => ({
        ...p,
        has_rdo: rdoProjectIds.has(p.id)
      }));

      setProjects(projectsWithRdoStatus);
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
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="Projetos" 
        subtitle="Gerencie e acompanhe o progresso de todas as obras em tempo real."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        action={{ label: 'Novo Projeto', onClick: handleCreate }}
      />

      <div className="p-8">
        {/* View Switcher & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-xl p-1 flex items-center shadow-sm w-fit">
            <button 
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 px-4 ${view === 'kanban' ? 'bg-[#2a2a2a] text-[#d4ff3f] shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <LayoutGrid size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Kanban</span>
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 px-4 ${view === 'list' ? 'bg-[#2a2a2a] text-[#d4ff3f] shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <List size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Lista</span>
            </button>
          </div>
          
          <button className="bg-[#1a1a1a] border border-slate-800/50 px-6 py-2.5 rounded-xl text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#2a2a2a] transition-all shadow-sm text-[10px]">
            <Filter size={16} />
            Filtros Avançados
          </button>
        </div>

        {/* Content */}
        {loading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-[#d4ff3f] animate-spin mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Projetos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-dashed border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-black mb-2">Nenhum projeto encontrado</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm font-bold">Tente ajustar sua busca ou crie um novo projeto para começar a gerenciar suas obras.</p>
          </div>
        ) : view === 'kanban' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-6">
              {COLUMNS.map((status) => (
                <div key={status} className="flex flex-col min-w-[300px]">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{status}</h2>
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {projectsByStatus[status].length}
                      </span>
                    </div>
                  </div>
                  
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[500px] rounded-3xl p-3 transition-colors ${snapshot.isDraggingOver ? 'bg-[#d4ff3f]/5 ring-2 ring-[#d4ff3f]/20 ring-inset' : 'bg-[#1a1a1a]/50 border border-slate-800/30'}`}
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
    </div>
  );
}
