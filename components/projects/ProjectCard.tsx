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

import Link from 'next/link';

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
    'Planejamento': 'bg-slate-800 text-slate-400 border-slate-700',
    'Em Andamento': 'bg-[#d4ff3f]/10 text-[#d4ff3f] border-[#d4ff3f]/20',
    'Atrasado': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    'Concluído': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
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
            className={`bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-[#d4ff3f]/20' : ''}`}
          >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${statusColors[project.status]}`}>
                  {project.status}
                </span>
                {project.id_contrato && (
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    {project.id_contrato}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white truncate tracking-tight">
                {project.nome}
              </h3>
            </div>
            
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(project)}
                className="p-1.5 hover:bg-[#2a2a2a] text-slate-500 hover:text-[#d4ff3f] rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => onDelete(project.id)}
                className="p-1.5 hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                <DollarSign size={12} />
                <span className="font-bold uppercase tracking-widest text-[9px]">Orçamento</span>
              </div>
              <span className="font-black text-white">{formatCurrency(project.orcamento)}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>Progresso / Liquidez</span>
                <span className="text-white">{project.liquidez}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden border border-slate-800/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.liquidez}%` }}
                  className={`h-full rounded-full ${project.liquidez > 80 ? 'bg-emerald-500' : project.liquidez > 40 ? 'bg-[#d4ff3f]' : 'bg-amber-500'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/50 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span className="text-[10px] font-bold truncate">{project.localizacao || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                  <TrendingUp size={12} className="flex-shrink-0" />
                  <span className="text-[10px] font-bold truncate">{project.fase || 'N/A'}</span>
                </div>
              </div>
              
              <Link 
                href={`/projects/${project.id}/rdo`}
                className={`w-full mt-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  project.has_rdo 
                    ? 'bg-[#d4ff3f]/10 border-[#d4ff3f]/30 text-[#d4ff3f] hover:bg-[#d4ff3f]/20' 
                    : 'bg-[#0a0a0a] border-slate-800/50 text-slate-400 hover:text-[#d4ff3f] hover:border-[#d4ff3f]/30'
                }`}
              >
                Relatório Diário (RDO)
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </Draggable>
  );
}
