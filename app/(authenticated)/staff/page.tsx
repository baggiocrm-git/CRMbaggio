'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  FileText, 
  CheckCircle2,
  ChevronDown,
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

interface StaffDepartment {
  id: string;
  nome: string;
}

interface StaffMember {
  id: string;
  nome: string;
  id_funcionario: string;
  cargo: string;
  funcao?: string | null;
  unidade_obra?: string | null;
  departamento: string;
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Em Licença';
  url_imagem: string;
  data_admissao?: string | null;
  data_demissao?: string | null;
  tipo_contrato?: string | null;
  regime_trabalho?: string | null;
  ctps?: string | null;
  pis?: string | null;
  cbo?: string | null;
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  endereco?: string | null;
  contato?: string | null;
  salario_base?: string | null;
  adicional_insalubridade?: string | null;
  adicional_periculosidade?: string | null;
  conta_bancaria?: string | null;
  motivo_demissao?: string | null;
  tipo_desligamento?: string | null;
  cursos?: Curso[];
  documentos_anexos?: DocumentoAnexo[];
  created_at: string;
}

type AccordionSection =
  | 'cargo'
  | 'vinculo'
  | 'pessoais'
  | 'remuneracao'
  | 'cursos'
  | 'documentos'
  | 'desligamento';

const predefinedDepartments = ['Administrativo', 'Externo'] as const;

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([...predefinedDepartments]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);
  const [openSections, setOpenSections] = useState<Record<AccordionSection, boolean>>({
    cargo: false,
    vinculo: false,
    pessoais: false,
    remuneracao: false,
    cursos: false,
    documentos: false,
    desligamento: false,
  });
  const [formData, setFormData] = useState({
    nome: '',
    id_funcionario: '',
    cargo: '',
    funcao: '',
    unidade_obra: '',
    departamento: '',
    status: 'Ativo' as StaffMember['status'],
    url_imagem: '',
    data_admissao: '',
    data_demissao: '',
    tipo_contrato: '',
    regime_trabalho: '',
    ctps: '',
    pis: '',
    cbo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    estado_civil: '',
    endereco: '',
    contato: '',
    salario_base: '',
    adicional_insalubridade: '',
    adicional_periculosidade: '',
    conta_bancaria: '',
    motivo_demissao: '',
    tipo_desligamento: '',
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

  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipe_departamentos')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;

      const names = (data as StaffDepartment[] | null)?.map((department) => department.nome).filter(Boolean) || [];
      const merged = Array.from(new Set([...predefinedDepartments, ...names]));
      setDepartmentOptions(merged);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error instanceof Error ? error.message : String(error));
      setDepartmentOptions([...predefinedDepartments]);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
    fetchDepartments();
  }, [fetchData, fetchDepartments]);

  if (!isMounted) return null;

  const stats = [
    { label: 'Total de Equipe Ativa', value: staffList.filter(s => s.status === 'Ativo').length.toString(), change: '+4 este mês', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Contratos Pendentes', value: '12', change: 'Revisão necessária', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Certificações de Segurança', value: '89%', change: '8 expirando', icon: CheckCircle2, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const handleOpenModal = (member?: StaffMember) => {
    setOpenSections({
      cargo: false,
      vinculo: false,
      pessoais: false,
      remuneracao: false,
      cursos: false,
      documentos: false,
      desligamento: false,
    });

    if (member) {
      setIsCustomDepartment(!departmentOptions.includes(member.departamento));
      setEditingMember(member);
      setFormData({
        nome: member.nome,
        id_funcionario: member.id_funcionario,
        cargo: member.cargo,
        funcao: member.funcao || '',
        unidade_obra: member.unidade_obra || '',
        departamento: member.departamento,
        status: member.status,
        url_imagem: member.url_imagem || '',
        data_admissao: member.data_admissao || '',
        data_demissao: member.data_demissao || '',
        tipo_contrato: member.tipo_contrato || '',
        regime_trabalho: member.regime_trabalho || '',
        ctps: member.ctps || '',
        pis: member.pis || '',
        cbo: member.cbo || '',
        cpf: member.cpf || '',
        rg: member.rg || '',
        data_nascimento: member.data_nascimento || '',
        estado_civil: member.estado_civil || '',
        endereco: member.endereco || '',
        contato: member.contato || '',
        salario_base: member.salario_base || '',
        adicional_insalubridade: member.adicional_insalubridade || '',
        adicional_periculosidade: member.adicional_periculosidade || '',
        conta_bancaria: member.conta_bancaria || '',
        motivo_demissao: member.motivo_demissao || '',
        tipo_desligamento: member.tipo_desligamento || '',
        cursos: member.cursos || [],
        documentos_anexos: member.documentos_anexos || [],
      });
    } else {
      setIsCustomDepartment(false);
      setEditingMember(null);
      setFormData({
        nome: '',
        id_funcionario: '',
        cargo: '',
        funcao: '',
        unidade_obra: '',
        departamento: '',
        status: 'Ativo',
        url_imagem: '',
        data_admissao: '',
        data_demissao: '',
        tipo_contrato: '',
        regime_trabalho: '',
        ctps: '',
        pis: '',
        cbo: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        estado_civil: '',
        endereco: '',
        contato: '',
        salario_base: '',
        adicional_insalubridade: '',
        adicional_periculosidade: '',
        conta_bancaria: '',
        motivo_demissao: '',
        tipo_desligamento: '',
        cursos: [],
        documentos_anexos: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setIsCustomDepartment(false);
    setOpenSections({
      cargo: false,
      vinculo: false,
      pessoais: false,
      remuneracao: false,
      cursos: false,
      documentos: false,
      desligamento: false,
    });
  };

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const buildStaffPayload = () => {
    const nullableFields = [
      'id_funcionario',
      'cargo',
      'funcao',
      'unidade_obra',
      'departamento',
      'url_imagem',
      'data_admissao',
      'data_demissao',
      'tipo_contrato',
      'regime_trabalho',
      'ctps',
      'pis',
      'cbo',
      'cpf',
      'rg',
      'data_nascimento',
      'estado_civil',
      'endereco',
      'contato',
      'salario_base',
      'adicional_insalubridade',
      'adicional_periculosidade',
      'conta_bancaria',
      'motivo_demissao',
      'tipo_desligamento',
    ] as const;

    const payload: Record<string, unknown> = {
      ...formData,
      nome: formData.nome.trim(),
      cursos: formData.cursos,
      documentos_anexos: formData.documentos_anexos,
    };

    nullableFields.forEach((field) => {
      const value = payload[field];

      if (typeof value === 'string') {
        const trimmed = value.trim();
        payload[field] = trimmed === '' ? null : trimmed;
      }
    });

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildStaffPayload();

    try {
      if (payload.departamento && typeof payload.departamento === 'string') {
        const normalizedDepartment = payload.departamento.trim();

        if (normalizedDepartment !== '') {
          const { error: departmentError } = await supabase
            .from('equipe_departamentos')
            .upsert(
              [{ nome: normalizedDepartment }],
              { onConflict: 'nome', ignoreDuplicates: false }
            );

          if (departmentError) throw departmentError;
        }
      }

      if (editingMember) {
        const { error } = await supabase
          .from('equipe')
          .update(payload)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipe')
          .insert([payload]);
        if (error) throw error;
      }
      await Promise.all([fetchData(), fetchDepartments()]);
      handleCloseModal();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao salvar membro da equipe:', error);
      alert(`Falha ao salvar membro da equipe: ${errorMessage}`);
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

  const getStaffCategory = (person: StaffMember) => {
    const department = (person.departamento || '').trim();

    if (department) return department;

    const base = `${person.departamento || ''} ${person.cargo || ''} ${person.funcao || ''}`.toLowerCase();

    if (base.includes('terceir')) return 'Terceirizado';
    if (
      base.includes('produ') ||
      base.includes('obra') ||
      base.includes('operac') ||
      base.includes('campo') ||
      base.includes('manuten')
    ) {
      return 'De Produção';
    }

    return 'Administrativo';
  };

  const categoryOrder = ['Administrativo', 'De Produção', 'Terceirizado'];
  const categoryMap = new Map<string, StaffMember[]>();

  staffList.forEach((person) => {
    const category = getStaffCategory(person);
    const existingItems = categoryMap.get(category) || [];
    existingItems.push(person);
    categoryMap.set(category, existingItems);
  });

  categoryMap.forEach((items, label) => {
    categoryMap.set(
      label,
      [...items].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    );
  });

  const categorizedStaff = [
    ...categoryOrder
      .filter((label) => categoryMap.has(label))
      .map((label) => ({ label, items: categoryMap.get(label) || [] })),
    { label: 'De Produção', items: [] as StaffMember[] },
    { label: 'Terceirizado', items: [] as StaffMember[] },
  ];

  const normalizedCategorizedStaff = [
    ...categorizedStaff.filter((group) => group.items.length > 0),
    ...Array.from(categoryMap.entries())
      .filter(([label]) => !categoryOrder.includes(label))
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([label, items]) => ({ label, items })),
  ];

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
                      normalizedCategorizedStaff.flatMap((group) => {
                        const groupRows: React.ReactNode[] = [
                          <tr key={`group-${group.label}`} className="bg-[#111111]">
                            <td colSpan={4} className="px-6 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">{group.label}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.items.length} funcionário(s)</span>
                              </div>
                            </td>
                          </tr>,
                        ];

                        if (group.items.length === 0) {
                          groupRows.push(
                            <tr key={`empty-${group.label}`}>
                              <td colSpan={4} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                Nenhum funcionário nesta categoria
                              </td>
                            </tr>
                          );
                          return groupRows;
                        }

                        return groupRows.concat(
                          group.items.map((person) => {
                            const courseStatus = getCourseStatus(person.cursos);
                            return (
                              <tr
                                key={person.id}
                                onClick={() => handleOpenModal(person)}
                                className="hover:bg-[#2a2a2a]/30 transition-colors group cursor-pointer"
                              >
                                <td className="px-6 py-4">
                                  <div className="space-y-0">
                                    <p className="font-black text-sm leading-tight">{person.nome}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-black tracking-tight leading-tight">{person.cargo}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 flex-wrap">
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
                                <td className="px-6 py-4">
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
              className="relative w-full max-w-3xl bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden"
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

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: Roberto Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffMember['status'] })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Afastado">Afastado</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Admissão</label>
                    <input
                      type="date"
                      value={formData.data_admissao}
                      onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleSection('cargo')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Cargo e lotação</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cargo, função, departamento e unidade</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.cargo ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.cargo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cargo</label>
                        <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Pedreiro" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Função</label>
                        <input type="text" value={formData.funcao} onChange={(e) => setFormData({ ...formData, funcao: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Mestre de Obras" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Departamento</label>
                        <div className="space-y-2">
                          <select
                            value={isCustomDepartment ? '__novo__' : formData.departamento}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              if (nextValue === '__novo__') {
                                setIsCustomDepartment(true);
                                setFormData({
                                  ...formData,
                                  departamento: departmentOptions.includes(formData.departamento) ? '' : formData.departamento,
                                });
                                return;
                              }

                              setIsCustomDepartment(false);
                              setFormData({
                                ...formData,
                                departamento: nextValue,
                              });
                            }}
                            className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                          >
                            <option value="">Selecione</option>
                            {departmentOptions.map((department) => (
                              <option key={department} value={department}>
                                {department}
                              </option>
                            ))}
                            <option value="__novo__">Novo Departamento</option>
                          </select>
                          {isCustomDepartment && (
                            <input
                              type="text"
                              value={formData.departamento}
                              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                              placeholder="Digite o novo departamento"
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Unidade/Obra</label>
                        <input type="text" value={formData.unidade_obra} onChange={(e) => setFormData({ ...formData, unidade_obra: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Obra Centro" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('vinculo')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Vínculo contratual</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato, regime, CTPS, PIS e CBO</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.vinculo ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.vinculo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Contrato</label>
                        <select value={formData.tipo_contrato} onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all">
                          <option value="">Selecione</option>
                          <option value="CLT">CLT</option>
                          <option value="PJ">PJ</option>
                          <option value="Estagiário">Estagiário</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Regime</label>
                        <select value={formData.regime_trabalho} onChange={(e) => setFormData({ ...formData, regime_trabalho: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all">
                          <option value="">Selecione</option>
                          <option value="Horista">Horista</option>
                          <option value="Mensalista">Mensalista</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">CTPS</label>
                        <input type="text" value={formData.ctps} onChange={(e) => setFormData({ ...formData, ctps: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">PIS</label>
                        <input type="text" value={formData.pis} onChange={(e) => setFormData({ ...formData, pis: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">CBO</label>
                        <input type="text" value={formData.cbo} onChange={(e) => setFormData({ ...formData, cbo: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('pessoais')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Dados pessoais</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CPF, RG, nascimento, estado civil, endereço e contato</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.pessoais ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.pessoais && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">CPF</label>
                        <input type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">RG</label>
                        <input type="text" value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Nascimento</label>
                        <input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Estado Civil</label>
                        <input type="text" value={formData.estado_civil} onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Endereço</label>
                        <input type="text" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Contato</label>
                        <input type="text" value={formData.contato} onChange={(e) => setFormData({ ...formData, contato: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('remuneracao')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Remuneração</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Salário base, adicionais e conta bancária</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.remuneracao ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.remuneracao && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Salário Base</label>
                        <input type="text" value={formData.salario_base} onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: R$ 2.500,00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Conta Bancária</label>
                        <input type="text" value={formData.conta_bancaria} onChange={(e) => setFormData({ ...formData, conta_bancaria: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Insalubridade (%)</label>
                        <input type="text" value={formData.adicional_insalubridade} onChange={(e) => setFormData({ ...formData, adicional_insalubridade: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Periculosidade (%)</label>
                        <input type="text" value={formData.adicional_periculosidade} onChange={(e) => setFormData({ ...formData, adicional_periculosidade: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('cursos')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Cursos e treinamentos</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lista com validade e botão de inclusão</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.cursos ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.cursos && (
                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
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
                          + Adicionar
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="md:col-span-2">
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
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('documentos')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Documentos anexos</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cadastro de anexos com categoria</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.documentos ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.documentos && (
                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">Documentos Anexos</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newDoc: DocumentoAnexo = { id: Math.random().toString(36).substr(2, 9), nome: '', url: '', tipo: 'Documento pessoal' };
                            setFormData({ ...formData, documentos_anexos: [...formData.documentos_anexos, newDoc] });
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-all"
                        >
                          + Anexar
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.documentos_anexos.map((doc, idx) => (
                          <div key={doc.id} className="p-4 bg-[#0a0a0a] border border-slate-800 rounded-2xl flex items-start gap-4 relative group/doc">
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
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={doc.nome}
                                onChange={(e) => {
                                  const newDocs = [...formData.documentos_anexos];
                                  newDocs[idx].nome = e.target.value;
                                  setFormData({ ...formData, documentos_anexos: newDocs });
                                }}
                                className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                placeholder="Nome do documento"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <select
                                  value={doc.tipo}
                                  onChange={(e) => {
                                    const newDocs = [...formData.documentos_anexos];
                                    newDocs[idx].tipo = e.target.value;
                                    setFormData({ ...formData, documentos_anexos: newDocs });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                >
                                  <option value="Documento pessoal">Documento pessoal</option>
                                  <option value="Contrato">Contrato</option>
                                  <option value="Treinamento">Treinamento</option>
                                  <option value="Exame">Exame</option>
                                  <option value="Outro">Outro</option>
                                </select>
                                <input
                                  type="text"
                                  value={doc.url}
                                  onChange={(e) => {
                                    const newDocs = [...formData.documentos_anexos];
                                    newDocs[idx].url = e.target.value;
                                    setFormData({ ...formData, documentos_anexos: newDocs });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                  placeholder="URL do arquivo"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.status === 'Inativo' && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleSection('desligamento')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                      >
                        <div>
                          <p className="text-sm font-black tracking-tight">Desligamento</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data, motivo e tipo</p>
                        </div>
                        <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.desligamento ? 'rotate-180' : ''}`} />
                      </button>
                      {openSections.desligamento && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Demissão</label>
                            <input type="date" value={formData.data_demissao} onChange={(e) => setFormData({ ...formData, data_demissao: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo</label>
                            <input type="text" value={formData.tipo_desligamento} onChange={(e) => setFormData({ ...formData, tipo_desligamento: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Sem justa causa" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Motivo</label>
                            <textarea value={formData.motivo_demissao} onChange={(e) => setFormData({ ...formData, motivo_demissao: e.target.value })} rows={3} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none" placeholder="Descreva o motivo do desligamento" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
