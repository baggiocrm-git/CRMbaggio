'use client';

import React from 'react';
import { 
  MapPin, 
  DollarSign, 
  TrendingUp,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Draggable } from '@hello-pangea/dnd';
import { Project, ProjectStatus } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, index, onEdit, onDelete }: ProjectCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const statusColors: Record<ProjectStatus, string> = {
    'Planejamento': 'bg-slate-100 text-slate-600 border-slate-200',
    'Em Andamento': 'bg-blue-100 text-blue-600 border-blue-200',
    'Atrasado': 'bg-rose-100 text-rose-600 border-rose-200',
    'Concluído': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  };

  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-[#1a2430] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-600/20' : ''}`}
          >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}>
                  {project.status}
                </span>
                {project.id_contrato && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {project.id_contrato}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">
                {project.nome}
              </h3>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(project)}
                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => onDelete(project.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                <DollarSign size={12} />
                <span className="font-semibold">Orçamento</span>
              </div>
              <span className="font-black text-slate-900 dark:text-white">{formatCurrency(project.orcamento)}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Progresso / Liquidez</span>
                <span>{project.liquidez}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.liquidez}%` }}
                  className={`h-full rounded-full ${project.liquidez > 80 ? 'bg-emerald-500' : project.liquidez > 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="text-[10px] font-semibold truncate">{project.localizacao || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                <TrendingUp size={12} className="flex-shrink-0" />
                <span className="text-[10px] font-semibold truncate">{project.fase || 'N/A'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </Draggable>
  );
}
