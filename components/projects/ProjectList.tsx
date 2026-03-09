'use client';

import React from 'react';
import { 
  Edit2, 
  Trash2, 
  MapPin, 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, ProjectStatus } from '@/lib/types';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export default function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
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
    <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0a0a0a] border-b border-slate-800/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Projeto</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Orçamento</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Progresso</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Localização</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {projects.map((project, index) => (
              <motion.tr 
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-[#2a2a2a]/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white tracking-tight">{project.nome}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{project.id_contrato || 'S/ID'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">{formatCurrency(project.orcamento)}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Gasto: {formatCurrency(project.gasto)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 w-32">
                    <div className="flex-1 h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden border border-slate-800/50">
                      <div 
                        className={`h-full rounded-full ${project.liquidez > 80 ? 'bg-emerald-500' : project.liquidez > 40 ? 'bg-[#d4ff3f]' : 'bg-amber-500'}`}
                        style={{ width: `${project.liquidez}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{project.liquidez}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} />
                    <span className="text-xs font-bold">{project.localizacao || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(project)}
                      className="p-2 hover:bg-[#2a2a2a] text-slate-500 hover:text-[#d4ff3f] rounded-xl transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(project.id)}
                      className="p-2 hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
