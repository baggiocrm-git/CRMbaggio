'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  PieChart as PieChartIcon, 
  ChevronDown,
  ChevronUp,
  Loader2,
  Layers,
  User,
  ShieldAlert,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { COST_CATEGORIES, CONSTRUCTION_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  nome: string;
  orcamento: number;
  gasto: number;
  status: string;
}

interface TeamMember {
  id: string;
  nome: string;
}

interface Payable {
  id: string;
  projeto_id: string | null;
  socio_id: string | null;
  categoria_custo: string;
  etapa_obra: string;
  centro_custo_tipo: string;
  valor: number;
  valor_pago: number;
  situacao: string;
}

export default function CostCentersPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Obra' | 'Administrativo' | 'Pessoal'>('Obra');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, teamRes, payablesRes, userRes] = await Promise.all([
        supabase.from('projetos').select('*'),
        supabase.from('equipe').select('id, nome'),
        supabase.from('contas_pagar').select('id, projeto_id, socio_id, categoria_custo, etapa_obra, centro_custo_tipo, valor, valor_pago, situacao'),
        supabase.auth.getUser()
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
      if (payablesRes.data) setPayables(payablesRes.data);
      if (userRes.data.user) {
        setUserRole(userRes.data.user.user_metadata?.role || null);
        setUserEmail(userRes.data.user.email || null);
      }
    } catch (error) {
      console.error('Error fetching cost center data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasAccessToPersonal = useMemo(() => {
    if (!userRole && !userEmail) return false;
    const allowedRoles = ['Administrador Master', 'Administrador Financeiro', 'Administrador'];
    return allowedRoles.includes(userRole || '') || userEmail === 'lucabaggio28@gmail.com';
  }, [userRole, userEmail]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectPayables = payables.filter(p => p.projeto_id === project.id && (p.centro_custo_tipo === 'Obra' || !p.centro_custo_tipo));
      
      const totalSpent = projectPayables.reduce((acc, curr) => acc + curr.valor_pago, 0);
      const totalCommitted = projectPayables.reduce((acc, curr) => acc + curr.valor, 0);
      
      const categoryBreakdown = COST_CATEGORIES.map(category => ({
        name: category,
        value: projectPayables
          .filter(p => p.categoria_custo === category)
          .reduce((acc, curr) => acc + curr.valor_pago, 0)
      })).filter(c => c.value > 0);

      const stageBreakdown = CONSTRUCTION_STAGES.map(stage => ({
        name: stage,
        value: projectPayables
          .filter(p => p.etapa_obra === stage)
          .reduce((acc, curr) => acc + curr.valor_pago, 0)
      })).filter(s => s.value > 0);

      const budgetPercent = project.orcamento > 0 ? (totalSpent / project.orcamento) * 100 : 0;

      return {
        ...project,
        totalSpent,
        totalCommitted,
        categoryBreakdown,
        stageBreakdown,
        budgetPercent
      };
    });
  }, [projects, payables]);

  const adminStats = useMemo(() => {
    const adminPayables = payables.filter(p => p.centro_custo_tipo === 'Administrativo');
    const totalSpent = adminPayables.reduce((acc, curr) => acc + curr.valor_pago, 0);
    const totalCommitted = adminPayables.reduce((acc, curr) => acc + curr.valor, 0);

    const categoryBreakdown = COST_CATEGORIES.map(category => ({
      name: category,
      value: adminPayables
        .filter(p => p.categoria_custo === category)
        .reduce((acc, curr) => acc + curr.valor_pago, 0)
    })).filter(c => c.value > 0);

    return {
      totalSpent,
      totalCommitted,
      categoryBreakdown,
      payables: adminPayables
    };
  }, [payables]);

  const personalStats = useMemo(() => {
    return teamMembers.map(member => {
      const memberPayables = payables.filter(p => p.socio_id === member.id && p.centro_custo_tipo === 'Pessoal');
      const totalSpent = memberPayables.reduce((acc, curr) => acc + curr.valor_pago, 0);
      const totalCommitted = memberPayables.reduce((acc, curr) => acc + curr.valor, 0);

      const categoryBreakdown = COST_CATEGORIES.map(category => ({
        name: category,
        value: memberPayables
          .filter(p => p.categoria_custo === category)
          .reduce((acc, curr) => acc + curr.valor_pago, 0)
      })).filter(c => c.value > 0);

      return {
        ...member,
        totalSpent,
        totalCommitted,
        categoryBreakdown,
        payables: memberPayables
      };
    }).filter(m => m.totalCommitted > 0);
  }, [teamMembers, payables]);

  const COLORS = ['#d4ff3f', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="text-[#d4ff3f] animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Centro de Custo...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Centro de <span className="text-[#d4ff3f]">Custo</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão financeira por categoria e tipo</p>
        </div>
        <button 
          onClick={fetchData}
          className="bg-[#1a1a1a] border border-slate-800/50 hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          Sincronizar Dados
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-[#1a1a1a] p-1.5 rounded-2xl border border-slate-800/50 w-fit">
        {[
          { id: 'Obra', label: 'Obras / Projetos', icon: Building2 },
          { id: 'Administrativo', label: 'Administrativo', icon: Briefcase },
          { id: 'Pessoal', label: 'Pessoais / Sócios', icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'Obra' | 'Administrativo' | 'Pessoal')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-[#d4ff3f] text-black shadow-[0_0_20px_rgba(212,255,63,0.2)]" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'Obra' && (
          <>
            {projectStats.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-dashed border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                  <Building2 size={40} className="text-slate-500" />
                </div>
                <h3 className="text-xl font-black mb-2">Nenhuma obra encontrada</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm font-bold">Vincule suas contas a pagar a um projeto para visualizar o centro de custo aqui.</p>
              </div>
            ) : (
              projectStats.map((project) => (
                <div key={project.id} className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm transition-all hover:border-slate-700/50">
                  {/* Project Header */}
                  <div 
                    className="p-6 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedItem(expandedItem === project.id ? null : project.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-[#0a0a0a] text-[#d4ff3f]">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{project.nome}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status: {project.status}</span>
                          <span className="text-slate-800">•</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">Gasto: {formatCurrency(project.totalSpent)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="hidden md:block text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Progresso Financeiro</p>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                project.budgetPercent > 100 ? "bg-rose-500" : "bg-[#d4ff3f]"
                              )}
                              style={{ width: `${Math.min(project.budgetPercent, 100)}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-black",
                            project.budgetPercent > 100 ? "text-rose-500" : "text-white"
                          )}>
                            {project.budgetPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {expandedItem === project.id ? <ChevronUp size={24} className="text-slate-500" /> : <ChevronDown size={24} className="text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedItem === project.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-800/50"
                      >
                        <div className="p-8 space-y-8">
                          {/* Top Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30">
                              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Orçamento Estimado</p>
                              <p className="text-2xl font-black text-white">{formatCurrency(project.orcamento)}</p>
                            </div>
                            <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30">
                              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Gasto (Pago)</p>
                              <p className="text-2xl font-black text-[#d4ff3f]">{formatCurrency(project.totalSpent)}</p>
                            </div>
                            <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30">
                              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Comprometido</p>
                              <p className="text-2xl font-black text-blue-500">{formatCurrency(project.totalCommitted)}</p>
                            </div>
                            <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30">
                              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Saldo Orçamentário</p>
                              <p className={cn(
                                "text-2xl font-black",
                                project.orcamento - project.totalSpent < 0 ? "text-rose-500" : "text-emerald-500"
                              )}>
                                {formatCurrency(project.orcamento - project.totalSpent)}
                              </p>
                            </div>
                          </div>

                          {/* Charts Section */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Category Breakdown */}
                            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-slate-800/30">
                              <div className="flex items-center gap-3 mb-6">
                                <PieChartIcon className="text-[#d4ff3f]" size={20} />
                                <h4 className="text-sm font-black uppercase tracking-widest">Custos por Categoria</h4>
                              </div>
                              <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={project.categoryBreakdown}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={100}
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      {project.categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                      formatter={(value: string | number) => formatCurrency(Number(value || 0))}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-6">
                                {project.categoryBreakdown.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                                    <span className="text-[10px] font-black text-white ml-auto">{formatCurrency(item.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Stage Breakdown Bar Chart */}
                            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-slate-800/30">
                              <div className="flex items-center gap-3 mb-6">
                                <Layers className="text-[#d4ff3f]" size={20} />
                                <h4 className="text-sm font-black uppercase tracking-widest">Custos por Etapa</h4>
                              </div>
                              <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={project.stageBreakdown} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                      dataKey="name" 
                                      type="category" 
                                      width={120} 
                                      tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }}
                                    />
                                    <Tooltip 
                                      cursor={{ fill: '#1a1a1a' }}
                                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                      formatter={(value: string | number) => formatCurrency(Number(value || 0))}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                      {project.stageBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Table */}
                          <div className="bg-[#0a0a0a] rounded-2xl border border-slate-800/30 overflow-hidden">
                            <div className="p-4 border-b border-slate-800/30 bg-[#1a1a1a]/30">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detalhamento por Etapa</h4>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/30">
                                    <th className="px-6 py-3">Etapa</th>
                                    <th className="px-6 py-3 text-right">Valor Gasto</th>
                                    <th className="px-6 py-3 text-right">% do Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                  {project.stageBreakdown.sort((a, b) => b.value - a.value).map((stage, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                      <td className="px-6 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest">{stage.name}</td>
                                      <td className="px-6 py-3 text-right text-[10px] font-black text-white">{formatCurrency(stage.value)}</td>
                                      <td className="px-6 py-3 text-right text-[10px] font-black text-[#d4ff3f]">
                                        {((stage.value / project.totalSpent) * 100).toFixed(1)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Administrativo' && (
          <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-[#0a0a0a] text-[#d4ff3f]">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Custos Administrativos</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gestão de custos fixos e operacionais da empresa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30 text-center">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Gasto</p>
                <p className="text-3xl font-black text-[#d4ff3f]">{formatCurrency(adminStats.totalSpent)}</p>
              </div>
              <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30 text-center">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Comprometido</p>
                <p className="text-3xl font-black text-blue-500">{formatCurrency(adminStats.totalCommitted)}</p>
              </div>
              <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-800/30 text-center">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Qtd. Lançamentos</p>
                <p className="text-3xl font-black text-white">{adminStats.payables.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-slate-800/30">
                <h4 className="text-sm font-black uppercase tracking-widest mb-6">Breakdown por Categoria</h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={adminStats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {adminStats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', color: '#fff' }}
                        formatter={(value: string | number) => formatCurrency(Number(value || 0))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {adminStats.categoryBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                      <span className="text-[10px] font-black text-white ml-auto">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-3xl border border-slate-800/30 overflow-hidden">
                <div className="p-4 border-b border-slate-800/30 bg-[#1a1a1a]/30">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Últimos Lançamentos</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/30">
                        <th className="px-6 py-3">Descrição</th>
                        <th className="px-6 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {adminStats.payables.slice(0, 8).map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest truncate max-w-[200px]">{p.categoria_custo}</td>
                          <td className="px-6 py-3 text-right text-[10px] font-black text-white">{formatCurrency(p.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Pessoal' && (
          <div className="space-y-6">
            {!hasAccessToPersonal ? (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                <div className="size-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert size={40} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-rose-500 mb-2">Acesso Restrito</h3>
                <p className="text-slate-400 max-w-md mx-auto text-sm font-bold">
                  Somente Administradores Master ou Financeiros podem visualizar os custos pessoais dos sócios.
                </p>
              </div>
            ) : (
              personalStats.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-dashed border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                  <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                    <User size={40} className="text-slate-500" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Nenhum custo pessoal encontrado</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm font-bold">Lançamentos vinculados a sócios aparecerão aqui.</p>
                </div>
              ) : (
                personalStats.map((member) => (
                  <div key={member.id} className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm transition-all hover:border-slate-700/50">
                    <div 
                      className="p-6 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedItem(expandedItem === member.id ? null : member.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#0a0a0a] text-[#d4ff3f]">
                          <User size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">{member.nome}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">Total Gasto: {formatCurrency(member.totalSpent)}</span>
                          </div>
                        </div>
                      </div>
                      {expandedItem === member.id ? <ChevronUp size={24} className="text-slate-500" /> : <ChevronDown size={24} className="text-slate-500" />}
                    </div>

                    <AnimatePresence>
                      {expandedItem === member.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-800/50"
                        >
                          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-slate-800/30">
                              <h4 className="text-sm font-black uppercase tracking-widest mb-6">Breakdown de Custos</h4>
                              <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={member.categoryBreakdown}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      {member.categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                      formatter={(value: string | number) => formatCurrency(Number(value || 0))}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="bg-[#0a0a0a] rounded-3xl border border-slate-800/30 overflow-hidden">
                              <div className="p-4 border-b border-slate-800/30 bg-[#1a1a1a]/30">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lançamentos Recentes</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/30">
                                      <th className="px-6 py-3">Categoria</th>
                                      <th className="px-6 py-3 text-right">Valor</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/30">
                                    {member.payables.slice(0, 5).map((p, idx) => (
                                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest">{p.categoria_custo}</td>
                                        <td className="px-6 py-3 text-right text-[10px] font-black text-white">{formatCurrency(p.valor)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
