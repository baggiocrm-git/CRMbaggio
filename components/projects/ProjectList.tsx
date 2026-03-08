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
    'Planejamento': 'bg-slate-100 text-slate-600 border-slate-200',
    'Em Andamento': 'bg-blue-100 text-blue-600 border-blue-200',
    'Atrasado': 'bg-rose-100 text-rose-600 border-rose-200',
    'Concluído': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  };

  return (
    <div className="bg-white dark:bg-[#1a2430] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Projeto</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Orçamento</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Progresso</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Localização</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {projects.map((project, index) => (
              <motion.tr 
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{project.nome}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{project.id_contrato || 'S/ID'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(project.orcamento)}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Gasto: {formatCurrency(project.gasto)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 w-32">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${project.liquidez > 80 ? 'bg-emerald-500' : project.liquidez > 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${project.liquidez}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{project.liquidez}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} />
                    <span className="text-xs font-semibold">{project.localizacao || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(project)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-xl transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(project.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-xl transition-colors"
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
