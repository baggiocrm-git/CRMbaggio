'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Users, 
  FileText, 
  CheckCircle2,
  Circle,
  Loader2,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Curso {
  id: string;
  nome: string;
  duracao: string;
  validade: string;
}

interface DocumentoAnexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

interface StaffMember {
  id: string;
  nome: string;
  id_funcionario: string;
  cargo: string;
  departamento: string;
  status: 'Ativo' | 'Em Licença' | 'Inativo';
  url_imagem: string;
  cursos?: Curso[];
  documentos_anexos?: DocumentoAnexo[];
  created_at: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    id_funcionario: '',
    cargo: '',
    departamento: '',
    status: 'Ativo' as StaffMember['status'],
    url_imagem: '',
    cursos: [] as Curso[],
    documentos_anexos: [] as DocumentoAnexo[],
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: staffData, error: staffError } = await supabase
        .from('equipe')
        .select('*')
        .order('created_at', { ascending: false });

      if (staffError) throw staffError;
      setStaffList(staffData || []);
    } catch (error) {
      console.error('Erro ao buscar dados da equipe:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [fetchData]);

  if (!isMounted) return null;

  const stats = [
    { label: 'Total de Equipe Ativa', value: staffList.filter(s => s.status === 'Ativo').length.toString(), change: '+4 este mês', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Contratos Pendentes', value: '12', change: 'Revisão necessária', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Certificações de Segurança', value: '89%', change: '8 expirando', icon: CheckCircle2, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        nome: member.nome,
        id_funcionario: member.id_funcionario,
        cargo: member.cargo,
        departamento: member.departamento,
        status: member.status,
        url_imagem: member.url_imagem || '',
        cursos: member.cursos || [],
        documentos_anexos: member.documentos_anexos || [],
      });
    } else {
      setEditingMember(null);
      setFormData({
        nome: '',
        id_funcionario: '',
        cargo: '',
        departamento: '',
        status: 'Ativo',
        url_imagem: '',
        cursos: [],
        documentos_anexos: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('equipe')
          .update(formData)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipe')
          .insert([formData]);
        if (error) throw error;
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar membro da equipe:', error instanceof Error ? error.message : String(error));
      alert('Falha ao salvar membro da equipe.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro da equipe?')) {
      try {
        const { error } = await supabase
          .from('equipe')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir membro da equipe:', error instanceof Error ? error.message : String(error));
        alert('Falha ao excluir membro da equipe.');
      }
    }
  };
  const getCourseStatus = (cursos?: Curso[]) => {
    if (!cursos || cursos.length === 0) return { label: 'Sem Cursos', color: 'text-slate-500', bg: 'bg-slate-500/10' };
    
    const now = new Date();
    let mostUrgentDays = Infinity;
    
    cursos.forEach(curso => {
      const expiry = new Date(curso.validade);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < mostUrgentDays) mostUrgentDays = diffDays;
    });

    if (mostUrgentDays <= 5) return { label: 'Vencimento Crítico (5d)', color: 'text-red-600', bg: 'bg-red-600/10' };
    if (mostUrgentDays <= 15) return { label: 'Vencimento Próximo (15d)', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (mostUrgentDays <= 30) return { label: 'Atenção (30d)', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (mostUrgentDays <= 45) return { label: 'Aviso (45d)', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    
    return { label: 'Cursos em Dia', color: 'text-[#d4ff3f]', bg: 'bg-[#d4ff3f]/10' };
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="R.H." 
        subtitle="Gestão centralizada de pessoal, cursos e conformidade."
        action={{ label: 'Novo Membro', onClick: () => handleOpenModal() }}
      />

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1a1a1a] p-6 rounded-2xl border border-slate-800/50 shadow-sm group hover:border-[#d4ff3f]/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl bg-slate-800/50 text-slate-400 group-hover:text-[#d4ff3f] transition-colors`}>
                  <stat.icon size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Staff Directory */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="font-black text-lg tracking-tight">Diretório de Equipe</h3>
                <div className="flex gap-2">
                  <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-800/50 hover:bg-[#2a2a2a] transition-all">Filtrar</button>
                  <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-800/50 hover:bg-[#2a2a2a] transition-all">Exportar</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Funcionário</th>
                      <th className="px-6 py-4">Cargo</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Docs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 size={24} className="text-[#d4ff3f] animate-spin" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando equipe...</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffList.map((person) => {
                        const courseStatus = getCourseStatus(person.cursos);
                        return (
                          <tr 
                            key={person.id} 
                            onClick={() => handleOpenModal(person)}
                            className="hover:bg-[#2a2a2a]/30 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700 shadow-sm relative">
                                  <Image src={person.url_imagem || `https://picsum.photos/seed/${person.id}/100/100`} alt={person.nome} fill className="object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <p className="font-black text-sm">{person.nome}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Func #{person.id_funcionario}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-black tracking-tight">{person.cargo}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{person.departamento}</p>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${
                                  person.status === 'Ativo' ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'bg-orange-500/10 text-orange-500'
                                }`}>
                                  {person.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${courseStatus.bg} ${courseStatus.color}`}>
                                  {courseStatus.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex gap-1.5">
                                {(person.documentos_anexos || []).length > 0 ? (
                                  <CheckCircle2 size={16} className="text-[#d4ff3f]" />
                                ) : (
                                  <Circle size={16} className="text-slate-700" />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-[#0a0a0a] border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibindo {staffList.length} funcionários</span>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#2a2a2a] transition-all">Anterior</button>
                  <button className="px-4 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a2a2a] transition-all">Próximo</button>
                </div>
              </div>
            </div>
          </div>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight">
                  {editingMember ? 'Ficha do Funcionário' : 'Novo Membro'}
                </h3>
                <div className="flex items-center gap-2">
                  {editingMember && (
                    <button 
                      type="button"
                      onClick={() => handleDelete(editingMember.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Excluir Funcionário"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: Roberto Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ID do Funcionário</label>
                    <input 
                      required
                      type="text" 
                      value={formData.id_funcionario}
                      onChange={(e) => setFormData({...formData, id_funcionario: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="E294"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as StaffMember['status']})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Em Licença">Em Licença</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cargo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: Eng. Civil Sênior"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Departamento</label>
                    <input 
                      required
                      type="text" 
                      value={formData.departamento}
                      onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: Divisão Estrutural"
                    />
                  </div>
                </div>

                {/* Cursos Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">Cursos e Treinamentos</h4>
                    <button 
                      type="button"
                      onClick={() => {
                        const newCurso: Curso = { id: Math.random().toString(36).substr(2, 9), nome: '', duracao: '', validade: '' };
                        setFormData({ ...formData, cursos: [...formData.cursos, newCurso] });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-all"
                    >
                      + Adicionar Curso
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.cursos.map((curso, idx) => (
                      <div key={curso.id} className="p-4 bg-[#0a0a0a] border border-slate-800 rounded-2xl space-y-3 relative group/curso">
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, cursos: formData.cursos.filter(c => c.id !== curso.id) })}
                          className="absolute top-2 right-2 p-1 text-slate-600 hover:text-rose-500 opacity-0 group-hover/curso:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Nome do Curso</label>
                            <input 
                              type="text"
                              value={curso.nome}
                              onChange={(e) => {
                                const newCursos = [...formData.cursos];
                                newCursos[idx].nome = e.target.value;
                                setFormData({ ...formData, cursos: newCursos });
                              }}
                              className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                              placeholder="ex: NR-35 Trabalho em Altura"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Duração</label>
                            <input 
                              type="text"
                              value={curso.duracao}
                              onChange={(e) => {
                                const newCursos = [...formData.cursos];
                                newCursos[idx].duracao = e.target.value;
                                setFormData({ ...formData, cursos: newCursos });
                              }}
                              className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                              placeholder="ex: 8h"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Validade</label>
                            <input 
                              type="date"
                              value={curso.validade}
                              onChange={(e) => {
                                const newCursos = [...formData.cursos];
                                newCursos[idx].validade = e.target.value;
                                setFormData({ ...formData, cursos: newCursos });
                              }}
                              className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documentos Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">Documentos Anexos</h4>
                    <button 
                      type="button"
                      onClick={() => {
                        const newDoc: DocumentoAnexo = { id: Math.random().toString(36).substr(2, 9), nome: '', url: '', tipo: 'PDF' };
                        setFormData({ ...formData, documentos_anexos: [...formData.documentos_anexos, newDoc] });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-all"
                    >
                      + Anexar Documento
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.documentos_anexos.map((doc, idx) => (
                      <div key={doc.id} className="p-4 bg-[#0a0a0a] border border-slate-800 rounded-2xl flex items-center gap-4 relative group/doc">
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, documentos_anexos: formData.documentos_anexos.filter(d => d.id !== doc.id) })}
                          className="absolute top-2 right-2 p-1 text-slate-600 hover:text-rose-500 opacity-0 group-hover/doc:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                        <div className="size-10 bg-slate-800/50 text-slate-400 rounded-xl flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text"
                            value={doc.nome}
                            onChange={(e) => {
                              const newDocs = [...formData.documentos_anexos];
                              newDocs[idx].nome = e.target.value;
                              setFormData({ ...formData, documentos_anexos: newDocs });
                            }}
                            className="w-full bg-transparent border-b border-slate-800 text-xs text-white outline-none focus:border-[#d4ff3f] py-1"
                            placeholder="Nome do documento (ex: RG, CPF, Diploma)"
                          />
                          <input 
                            type="text"
                            value={doc.url}
                            onChange={(e) => {
                              const newDocs = [...formData.documentos_anexos];
                              newDocs[idx].url = e.target.value;
                              setFormData({ ...formData, documentos_anexos: newDocs });
                            }}
                            className="w-full bg-transparent border-b border-slate-800 text-[10px] text-slate-500 outline-none focus:border-[#d4ff3f] py-1"
                            placeholder="URL do arquivo"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#2a2a2a] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all"
                  >
                    {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
