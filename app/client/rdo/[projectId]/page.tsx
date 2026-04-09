'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Calendar, 
  FileText, 
  ChevronRight,
  Loader2,
  AlertCircle,
  LogOut,
  Sun,
  Cloud,
  Users,
  Camera
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RDO, Project } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientRDOPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [rdos, setRdos] = useState<RDO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdo, setSelectedRdo] = useState<RDO | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      fetchData(user.id);
    };

    const fetchData = async (userId: string) => {
      setLoading(true);
      try {
        // Fetch Project and verify ownership
        const { data: projectData, error: projectError } = await supabase
          .from('projetos')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (projectError) throw projectError;
        
        // Security check: ensure this project belongs to the client
        if (projectData.cliente_id !== userId) {
          throw new Error('Acesso negado. Este projeto não está vinculado à sua conta.');
        }

        setProject(projectData);

        // Fetch RDOs
        const { data: rdosData, error: rdosError } = await supabase
          .from('rdos')
          .select('*')
          .eq('projeto_id', projectId)
          .order('data', { ascending: false });
        
        if (rdosError) throw rdosError;
        setRdos(rdosData || []);
      } catch (error: unknown) {
        console.error('Error fetching RDOs:', error);
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados.';
        alert(message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [projectId, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#d4ff3f]" size={32} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h2 className="text-xl font-black text-white">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Você não tem permissão para visualizar este projeto.</p>
        <button onClick={handleLogout} className="mt-6 text-[#d4ff3f] font-bold uppercase tracking-widest text-xs">Sair</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Client Header */}
      <div className="bg-[#1a1a1a] border-b border-slate-800/50 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div>
          <h1 className="text-sm font-black text-white tracking-tight uppercase">Portal do <span className="text-[#d4ff3f]">Cliente</span></h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.nome}</p>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight italic">
            Relatórios <span className="text-[#d4ff3f]">Diários</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Acompanhe o progresso diário da sua obra</p>
        </div>

        {rdos.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-3xl border border-dashed border-slate-800 p-12 text-center">
            <FileText className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 font-bold">Nenhum relatório disponível ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rdos.map((rdo) => (
              <motion.button
                key={rdo.id}
                onClick={() => setSelectedRdo(rdo)}
                className="w-full text-left bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-5 hover:border-[#d4ff3f]/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#0a0a0a] text-[#d4ff3f] group-hover:bg-[#d4ff3f] group-hover:text-[#0a0a0a] transition-colors">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{new Date(rdo.data).toLocaleDateString('pt-BR')}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      Clima: {rdo.clima_manha} / {rdo.clima_tarde}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-700 group-hover:text-[#d4ff3f] transition-colors" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* RDO Detail Modal for Client */}
      <AnimatePresence>
        {selectedRdo && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRdo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border-t sm:border border-slate-800/50 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-[#0a0a0a]">
                <div>
                  <h3 className="text-lg font-black text-white">Relatório do Dia</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(selectedRdo.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => setSelectedRdo(null)} className="p-2 bg-[#1a1a1a] rounded-xl text-slate-500 hover:text-white">
                  Fechar
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Clima */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Manhã</p>
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Sun size={16} className="text-amber-400" />
                      {selectedRdo.clima_manha}
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tarde</p>
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Cloud size={16} className="text-slate-400" />
                      {selectedRdo.clima_tarde}
                    </div>
                  </div>
                </div>

                {/* Atividades */}
                <div>
                  <h4 className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={14} /> Atividades Realizadas
                  </h4>
                  <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-slate-800/50 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedRdo.atividades || 'Nenhuma atividade registrada.'}
                  </div>
                </div>

                {/* Ocorrências */}
                {selectedRdo.ocorrencias && (
                  <div>
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle size={14} /> Ocorrências / Observações
                    </h4>
                    <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedRdo.ocorrencias}
                    </div>
                  </div>
                )}

                {/* Mão de Obra (Resumo) */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={14} /> Equipe no Local
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRdo.mao_de_obra.map((m, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] rounded-xl border border-slate-800/50">
                        <span className="text-xs text-slate-400">{m.funcao}</span>
                        <span className="text-xs font-black text-white">{m.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fotos */}
                {selectedRdo.fotos && selectedRdo.fotos.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Camera size={14} /> Fotos da Obra
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRdo.fotos.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800">
                          {url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') ? (
                            <video src={url} className="w-full h-full object-cover" controls />
                          ) : (
                            <Image 
                              src={url} 
                              alt={`Foto ${i + 1}`} 
                              fill 
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
