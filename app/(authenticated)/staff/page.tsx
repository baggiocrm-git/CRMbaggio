'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Download, 
  CheckCircle2,
  Circle,
  Info,
  HardHat,
  Loader2,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffMember {
  id: string;
  nome: string;
  id_funcionario: string;
  cargo: string;
  departamento: string;
  status: 'Ativo' | 'Em Licença' | 'Inativo';
  url_imagem: string;
  created_at: string;
}

interface Document {
  id: string;
  nome: string;
  tipo_arquivo: string;
  tamanho_arquivo: string;
  nome_icone: string;
  classe_cor: string;
  classe_fundo: string;
  created_at: string;
}

const iconMap: Record<string, React.ElementType> = {
  FileText,
  ShieldCheck,
  HardHat,
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    id_funcionario: '',
    cargo: '',
    departamento: '',
    status: 'Ativo' as StaffMember['status'],
    url_imagem: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [staffRes, docsRes] = await Promise.all([
        supabase.from('equipe').select('*').order('created_at', { ascending: false }),
        supabase.from('documentos').select('*').order('created_at', { ascending: false })
      ]);

      if (staffRes.error) throw staffRes.error;
      if (docsRes.error) throw docsRes.error;

      setStaffList(staffRes.data || []);
      setDocuments(docsRes.data || []);
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

  const stats = [
    { label: 'Total de Equipe Ativa', value: staffList.filter(s => s.status === 'Ativo').length.toString(), change: '+4 este mês', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Contratos Pendentes', value: '12', change: 'Revisão necessária', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Certificações de Segurança', value: '89%', change: '8 expirando', icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-500/10' },
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
  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="Gestão de Equipe e Documentos" 
        subtitle="Controle centralizado para pessoal de engenharia e registros de conformidade."
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staff Directory */}
          <div className="lg:col-span-2 space-y-6">
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
                      <th className="px-6 py-4">Cargo e Departamento</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Docs</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 size={24} className="text-[#d4ff3f] animate-spin" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando equipe...</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffList.map((person) => (
                        <tr key={person.id} className="hover:bg-[#2a2a2a]/30 transition-colors group">
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
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              person.status === 'Ativo' ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {person.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-1.5">
                              {[true, true, false].map((done, i) => (
                                done 
                                  ? <CheckCircle2 key={i} size={16} className="text-[#d4ff3f]" />
                                  : <Circle key={i} size={16} className="text-slate-700" />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenModal(person)} className="p-1 hover:text-[#d4ff3f] transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(person.id)} className="p-1 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-[#0a0a0a] border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibindo {staffList.length > 0 ? 3 : 0} de {staffList.length} funcionários</span>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#2a2a2a] transition-all">Anterior</button>
                  <button className="px-4 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a2a2a] transition-all">Próximo</button>
                </div>
              </div>
            </div>
          </div>

          {/* Document Vault Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-800/50">
                <h3 className="font-black text-lg tracking-tight">Cofre de Documentos</h3>
              </div>
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 size={20} className="text-[#d4ff3f] animate-spin" />
                  </div>
                ) : (
                  documents.map((doc) => {
                    const Icon = iconMap[doc.nome_icone] || FileText;
                    return (
                      <div key={doc.id} className="p-4 border border-slate-800/30 rounded-2xl flex items-center gap-4 hover:border-[#d4ff3f]/30 transition-all cursor-pointer group bg-[#0a0a0a]">
                        <div className={`size-10 bg-slate-800/50 text-slate-400 rounded-xl flex items-center justify-center group-hover:text-[#d4ff3f] transition-colors`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black tracking-tight truncate">{doc.nome}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {doc.tipo_arquivo} • {doc.tamanho_arquivo}
                          </p>
                        </div>
                        <Download size={16} className="text-slate-500 group-hover:text-[#d4ff3f] transition-colors" />
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t border-slate-800/50">
                <button className="w-full py-3 bg-[#0a0a0a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#2a2a2a] transition-all border border-slate-800/50">
                  Ver Todos os Documentos
                </button>
              </div>
            </div>

            <div className="bg-[#d4ff3f]/5 border border-[#d4ff3f]/20 p-6 rounded-3xl">
              <div className="flex items-start gap-4">
                <Info size={24} className="text-[#d4ff3f] flex-shrink-0" />
                <div>
                  <h4 className="font-black text-[10px] text-[#d4ff3f] uppercase tracking-widest mb-2">Próximas Renovações</h4>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">
                    Existem 8 certificações profissionais e 2 licenças de obra prestes a expirar nos próximos 30 dias.
                  </p>
                  <button className="text-[10px] font-black uppercase tracking-widest underline text-[#d4ff3f] mt-4">Ver Itens Expirando</button>
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
                  {editingMember ? 'Editar Membro' : 'Novo Membro'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">URL da Imagem</label>
                    <input 
                      type="text" 
                      value={formData.url_imagem}
                      onChange={(e) => setFormData({...formData, url_imagem: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="https://picsum.photos/..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#2a2a2a] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all"
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
