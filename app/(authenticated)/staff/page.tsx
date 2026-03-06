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
  name: string;
  emp_id: string;
  role: string;
  department: string;
  status: 'Ativo' | 'Em Licença' | 'Inativo';
  img_url: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: string;
  icon_name: string;
  color_class: string;
  bg_class: string;
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
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    emp_id: '',
    role: '',
    department: '',
    status: 'Ativo' as StaffMember['status'],
    img_url: '',
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
      console.error('Erro ao buscar dados da equipe:', error);
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
        name: member.name,
        emp_id: member.emp_id,
        role: member.role,
        department: member.department,
        status: member.status,
        img_url: member.img_url || '',
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        emp_id: '',
        role: '',
        department: '',
        status: 'Ativo',
        img_url: '',
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
          .update({
            nome: formData.name,
            id_funcionario: formData.emp_id,
            cargo: formData.role,
            departamento: formData.department,
            status: formData.status,
            url_imagem: formData.img_url
          })
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipe')
          .insert([{
            nome: formData.name,
            id_funcionario: formData.emp_id,
            cargo: formData.role,
            departamento: formData.department,
            status: formData.status,
            url_imagem: formData.img_url
          }]);
        if (error) throw error;
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar membro da equipe:', error);
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
        console.error('Erro ao excluir membro da equipe:', error);
        alert('Falha ao excluir membro da equipe.');
      }
    }
  };
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Gestão de Equipe e Documentos" 
          subtitle="Controle centralizado para pessoal de engenharia e registros de conformidade."
          action={{ label: 'Novo Membro', onClick: () => handleOpenModal() }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Staff Directory */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Diretório de Equipe</h3>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Filtrar</button>
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Exportar</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Funcionário</th>
                        <th className="px-6 py-4">Cargo e Departamento</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Docs</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 size={24} className="text-blue-600 animate-spin" />
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando equipe...</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        staffList.map((person) => (
                          <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm relative">
                                  <Image src={person.img_url || `https://picsum.photos/seed/${person.id}/100/100`} alt={person.name} fill className="object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <p className="font-black text-sm text-slate-900 dark:text-white">{person.name}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Func #{person.emp_id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{person.role}</p>
                              <p className="text-xs text-slate-500 font-medium">{person.department}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                person.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                              }`}>
                                {person.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex gap-1.5">
                                {[true, true, false].map((done, i) => (
                                  done 
                                    ? <CheckCircle2 key={i} size={16} className="text-blue-600" />
                                    : <Circle key={i} size={16} className="text-slate-200 dark:text-slate-700" />
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(person)} className="p-1 hover:text-blue-600 transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(person.id)} className="p-1 hover:text-rose-600 transition-colors">
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
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibindo {staffList.length > 0 ? 3 : 0} de {staffList.length} funcionários</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Anterior</button>
                    <button className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest">Próximo</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Vault Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Cofre de Documentos Digitais</h3>
                </div>
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 size={20} className="text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    documents.map((doc) => {
                      const Icon = iconMap[doc.icon_name] || FileText;
                      return (
                        <div key={doc.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:border-blue-600/50 transition-all cursor-pointer group">
                          <div className={`size-10 ${doc.bg_class} ${doc.color_class} rounded-xl flex items-center justify-center`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              {doc.file_type} • {doc.file_size} • Atualizado {isMounted ? new Date(doc.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                          <Download size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                  <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                    Ver Todos os Documentos
                  </button>
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <Info size={24} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-sm text-blue-600 uppercase tracking-widest mb-2">Próximas Renovações</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Existem 8 certificações profissionais e 2 licenças de obra prestes a expirar nos próximos 30 dias. Por favor, inicie o processo de renovação.
                    </p>
                    <button className="text-[10px] font-black uppercase tracking-widest underline text-blue-600 mt-4">Ver Itens Expirando</button>
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {editingMember ? 'Editar Membro da Equipe' : 'Novo Membro da Equipe'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Roberto Silva"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ID do Funcionário</label>
                      <input 
                        required
                        type="text" 
                        value={formData.emp_id}
                        onChange={(e) => setFormData({...formData, emp_id: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="E294"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as StaffMember['status']})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
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
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Eng. Civil Sênior"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Departamento</label>
                      <input 
                        required
                        type="text" 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Divisão Estrutural"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">URL da Imagem (Opcional)</label>
                      <input 
                        type="text" 
                        value={formData.img_url}
                        onChange={(e) => setFormData({...formData, img_url: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="https://picsum.photos/..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                    >
                      {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
