'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Construction, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    staffOnSite: 0,
    receivable: 0,
    payable: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectsRes, staffRes, financesRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).neq('status', 'Completed'),
        supabase.from('staff').select('id', { count: 'exact' }).eq('status', 'Active'),
        supabase.from('finances').select('amount, type, status')
      ]);

      const receivable = financesRes.data
        ?.filter(f => f.type === 'Income' && f.status !== 'Completed')
        .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      
      const payable = financesRes.data
        ?.filter(f => f.type === 'Expense' && f.status !== 'Completed')
        .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        activeProjects: projectsRes.count || 0,
        staffOnSite: staffRes.count || 0,
        receivable,
        payable,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = [
    { label: 'Projetos Ativos', value: stats.activeProjects.toString(), change: '+2%', icon: Construction, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Equipe no Local', value: stats.staffOnSite.toString(), change: '-5%', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'A Receber', value: `R$${(stats.receivable / 1000).toFixed(1)}k`, change: '+8%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'A Pagar', value: `R$${(stats.payable / 1000).toFixed(1)}k`, change: '+12%', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const performanceData = [
    { name: 'Seg', value: 40 },
    { name: 'Ter', value: 60 },
    { name: 'Qua', value: 80 },
    { name: 'Qui', value: 95 },
    { name: 'Sex', value: 70 },
    { name: 'Sáb', value: 50 },
    { name: 'Dom', value: 45 },
  ];

  const highPriorityTasks = [
    { id: 1, title: 'Concretagem - Fase 4', site: 'Complexo Torre Norte', status: 'Vence Hoje', color: 'bg-red-500' },
    { id: 2, title: 'Auditoria de Inspeção de Segurança', site: 'Ponte Riverside', status: 'Vence Amanhã', color: 'bg-orange-500' },
    { id: 3, title: 'Realocação de Equipamentos', site: 'Múltiplos Locais', status: 'Em Andamento', color: 'bg-blue-500' },
  ];

  const recentActivity = [
    { id: 1, type: 'upload', title: 'Novo Relatório de Inspeção', desc: "Sarah Jenkins enviou 'Site-B_Struct_Final.pdf'", time: '12 minutos atrás', icon: FileText, iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10' },
    { id: 2, type: 'milestone', title: 'Marco Concluído', desc: 'Fase de escavação concluída na Metro Tower', time: '2 horas atrás', icon: CheckCircle2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
    { id: 3, type: 'alert', title: 'Alerta de Atraso Climático', desc: 'Operações de guindaste suspensas devido a ventos fortes', time: '5 horas atrás', icon: AlertCircle, iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  ];

  return (
    <>
      <Header 
        title="Visão Geral Operacional" 
        subtitle={`Monitorando ${stats.activeProjects} canteiros de obras ativos em tempo real.`}
        action={{ label: 'Novo Projeto', onClick: () => {} }}
      />
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse flex items-center justify-center">
                <Loader2 size={24} className="text-blue-600/20 animate-spin" />
              </div>
            ))
          ) : (
            kpis.map((kpi, idx) => (
              <motion.div 
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{kpi.label}</span>
                  <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</span>
                  <span className={`text-xs font-bold ${kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {kpi.change}
                  </span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${kpi.color.replace('text', 'bg')} w-3/4 opacity-80`}></div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Desempenho do Projeto</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500">Mensal</button>
                  <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">Semanal</button>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? '#136dec' : '#136dec40'} />
                      ))}
                    </Bar>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* High Priority Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Tarefas Ativas de Alta Prioridade</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {highPriorityTasks.map((task) => (
                  <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`size-2.5 rounded-full ${task.color} shadow-lg shadow-${task.color.split('-')[1]}-500/20`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-slate-500 font-medium">{task.site}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg uppercase tracking-widest">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Site Map Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Mapa do Local</h3>
              </div>
              <div className="aspect-square relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Image 
                  src="https://picsum.photos/seed/map/400/400?grayscale&blur=2" 
                  alt="Map" 
                  fill
                  className="object-cover opacity-30 dark:opacity-20"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="size-4 bg-blue-600 rounded-full animate-pulse border-2 border-white shadow-lg shadow-blue-600/50"></div>
                  <div className="size-4 bg-blue-600 rounded-full absolute top-1/4 left-1/3 border-2 border-white shadow-lg shadow-blue-600/50"></div>
                  <div className="size-4 bg-orange-500 rounded-full absolute bottom-1/3 right-1/4 border-2 border-white shadow-lg shadow-orange-500/50"></div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/20 dark:border-white/5">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Localização dos Projetos</p>
                  <p className="text-[10px] text-white/80 font-medium">Rastreamento ativo para 12 zonas primárias</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Atividade Recente</h3>
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {idx !== recentActivity.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200 dark:border-slate-800"></div>
                    )}
                    <div className={`size-8 rounded-xl ${activity.iconBg} ${activity.iconColor} flex items-center justify-center flex-shrink-0 z-10`}>
                      <activity.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{activity.title}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">{activity.desc}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
