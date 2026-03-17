'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  FileText, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RDO, Project } from '@/lib/types';
import { motion } from 'motion/react';

export default function ProjectRDOPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [rdos, setRdos] = useState<RDO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Project
        const { data: projectData, error: projectError } = await supabase
          .from('projetos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (projectError) throw projectError;
        setProject(projectData);

        // Fetch RDOs
        const { data: rdosData, error: rdosError } = await supabase
          .from('rdos')
          .select('*')
          .eq('projeto_id', id)
          .order('data', { ascending: false });
        
        if (rdosError) throw rdosError;
        setRdos(rdosData || []);
      } catch (error) {
        console.error('Error fetching RDOs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#d4ff3f]" size={32} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
        <h2 className="text-xl font-black text-white">Projeto não encontrado</h2>
        <Link href="/projects" className="text-[#d4ff3f] hover:underline mt-4 inline-block">Voltar para Projetos</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight italic">
              Relatório Diário de <span className="text-[#d4ff3f]">Obra</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Projeto: {project.nome}</p>
          </div>
          <Link 
            href={`/projects/${id}/rdo/new`}
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Novo RDO
          </Link>
        </div>

        {rdos.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-3xl border border-dashed border-slate-800 p-12 text-center">
            <FileText className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 font-bold">Nenhum relatório diário encontrado para este projeto.</p>
            <p className="text-slate-600 text-xs mt-1">Comece criando o primeiro relatório do dia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rdos.map((rdo, index) => (
              <motion.div
                key={rdo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  href={`/projects/${id}/rdo/${rdo.id}`}
                  className="group block bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-6 hover:border-[#d4ff3f]/50 transition-all shadow-sm hover:shadow-xl hover:shadow-[#d4ff3f]/5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-[#0a0a0a] text-[#d4ff3f] group-hover:bg-[#d4ff3f] group-hover:text-[#0a0a0a] transition-colors">
                      <Calendar size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</p>
                      <p className="text-sm font-black text-white">{new Date(rdo.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Clima: {rdo.clima_manha || '-'} / {rdo.clima_tarde || '-'}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-800/50">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Atividades</p>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {rdo.atividades || 'Nenhuma atividade registrada.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest flex items-center gap-1">
                      Ver Detalhes <ChevronRight size={12} />
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold">
                      {new Date(rdo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
