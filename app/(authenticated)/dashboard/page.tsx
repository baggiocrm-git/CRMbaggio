'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Construction, 
  Users, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Loader2,
  Calendar,
  Cloud,
  CheckCircle2,
  AlertCircle
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
  console.log('DashboardPage inicializado');
  const [stats, setStats] = useState({
    activeProjects: 0,
    staffOnSite: 0,
    receivable: 0,
    payable: 0,
  });
  const [recentRdos, setRecentRdos] = useState<{id: string, data: string, created_at: string, projetos?: {nome: string}}[]>([]);
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<{id: string, title: string, site: string, status: string, color: string}[]>([]);
  const [googleEvents, setGoogleEvents] = useState<{ id: string; summary: string; start: { dateTime?: string; date: string } }[]>([]);
  const [driveStatus, setDriveStatus] = useState<{ isConnected: boolean; isServiceAccount: boolean }>({ isConnected: false, isServiceAccount: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      console.log('DashboardPage: Iniciando fetchData');
      setIsLoading(true);
      
      // Check for session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('DashboardPage: Erro ao obter sessão:', sessionError);
      }
      if (!session) {
        console.warn('DashboardPage: Nenhuma sessão encontrada no fetchData');
      } else {
        console.log('DashboardPage: Sessão ativa para:', session.user.email);
      }

      console.log('DashboardPage: Executando queries no Supabase...');
      const [projectsRes, staffRes, receivablesRes, payablesRes, rdosRes, delayedProjectsRes] = await Promise.all([
        supabase.from('projetos').select('id', { count: 'exact' }).neq('status', 'Concluído'),
        supabase.from('equipe').select('id', { count: 'exact' }).eq('status', 'Ativo'),
        supabase.from('contas_receber').select('valor').neq('situacao', 'Recebido'),
        supabase.from('contas_pagar').select('valor').neq('situacao', 'Pago'),
        supabase.from('rdos').select('*, projetos(nome)').order('created_at', { ascending: false }).limit(5),
        supabase.from('projetos').select('*').eq('status', 'Atrasado').limit(3)
      ]);

      console.log('DashboardPage: Resultados das queries:', { 
        projects: projectsRes.count, 
        staff: staffRes.count,
        rdos: rdosRes.data?.length,
        projectsError: projectsRes.error,
        rdosError: rdosRes.error
      });

      const receivable = (receivablesRes.data || [])
        .reduce((acc, curr) => acc + Number(curr.valor), 0);
      
      const payable = (payablesRes.data || [])
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

      setStats({
        activeProjects: projectsRes.count || 0,
        staffOnSite: staffRes.count || 0,
        receivable,
        payable,
      });

      setRecentRdos(rdosRes.data || []);

      // Process chart data (RDOs per day for the last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          count: 0
        };
      });

      // We need more RDOs for the chart
      const { data: chartRdos } = await supabase
        .from('rdos')
        .select('data')
        .gte('data', last7Days[0].date);

      if (chartRdos) {
        chartRdos.forEach(r => {
          const day = last7Days.find(d => d.date === r.data);
          if (day) day.count++;
        });
      }
      setChartData(last7Days.map(d => ({ name: d.label, value: d.count })));

      // Process priority tasks
      const tasks = (delayedProjectsRes.data || []).map(p => ({
        id: p.id,
        title: `Projeto Atrasado: ${p.nome}`,
        site: p.localizacao || 'Local não informado',
        status: 'Atrasado',
        color: 'bg-red-500'
      }));

      // Add RDOs with occurrences
      const rdosWithOccurrences = (rdosRes.data || [])
        .filter(r => r.ocorrencias && r.ocorrencias.trim().length > 0)
        .map(r => ({
          id: r.id,
          title: `Ocorrência: ${r.projetos?.nome}`,
          site: r.ocorrencias.substring(0, 30) + '...',
          status: 'Verificar',
          color: 'bg-orange-500'
        }));

      setPriorityTasks([...tasks, ...rdosWithOccurrences].slice(0, 3));

      // Fetch Google Events if connected
      try {
        const [googleRes, driveStatusRes] = await Promise.all([
          fetch('/api/google/calendar/events'),
          fetch('/api/auth/google/status')
        ]);

        if (googleRes.ok) {
          const events = await googleRes.json();
          setGoogleEvents(events.slice(0, 3));
        }

        if (driveStatusRes.ok) {
          const status = await driveStatusRes.json();
          setDriveStatus(status);
        }
      } catch (e) {
        console.warn('DashboardPage: Erro ao buscar dados do Google:', e);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Listen for auth state changes to refresh data
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DashboardPage: Auth state change detected:', event);
      if (session) {
        fetchData();
      }
    });

    // Refresh on focus
    const onFocus = () => {
      console.log('DashboardPage: Window focused, refreshing data');
      fetchData();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchData]);

  const kpis = [
    { label: 'Projetos Ativos', value: stats.activeProjects.toString(), change: '+2%', icon: Construction, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Equipe no Local', value: stats.staffOnSite.toString(), change: '-5%', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'A Receber', value: `R$${(stats.receivable / 1000).toFixed(1)}k`, change: '+8%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'A Pagar', value: `R$${(stats.payable / 1000).toFixed(1)}k`, change: '+12%', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const performanceData = chartData.length > 0 ? chartData : [
    { name: 'Seg', value: 0 },
    { name: 'Ter', value: 0 },
    { name: 'Qua', value: 0 },
    { name: 'Qui', value: 0 },
    { name: 'Sex', value: 0 },
    { name: 'Sáb', value: 0 },
    { name: 'Dom', value: 0 },
  ];

  const highPriorityTasks = priorityTasks.length > 0 ? priorityTasks : [
    { id: 1, title: 'Nenhuma tarefa crítica', site: '-', status: 'OK', color: 'bg-emerald-500' },
  ];

  const recentActivity = recentRdos.map(r => ({
    id: r.id,
    type: 'upload',
    title: `RDO Enviado: ${r.projetos?.nome}`,
    desc: `Relatório do dia ${new Date(r.data).toLocaleDateString('pt-BR')}`,
    time: new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    icon: FileText,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10'
  }));

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="Visão Geral Operacional" 
        subtitle={`Monitorando ${stats.activeProjects} canteiros de obras ativos em tempo real.`}
        action={{ label: 'Novo Projeto', onClick: () => {} }}
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />
      
      <div className="p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-800/50 bg-[#1a1a1a] animate-pulse flex items-center justify-center">
                <Loader2 size={24} className="text-[#d4ff3f]/20 animate-spin" />
              </div>
            ))
          ) : (
            kpis.map((kpi, idx) => (
              <motion.div 
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl border border-slate-800/50 bg-[#1a1a1a] shadow-sm group hover:border-[#d4ff3f]/30 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{kpi.label}</span>
                  <div className={`p-2 rounded-xl bg-slate-800/50 text-slate-400 group-hover:text-[#d4ff3f] transition-colors`}>
                    <kpi.icon size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight">{kpi.value}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${kpi.change.startsWith('+') ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'bg-rose-500/10 text-rose-500'}`}>
                    {kpi.change}
                  </span>
                </div>
                <div className="mt-4 h-1 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div className={`h-full bg-[#d4ff3f] w-3/4 opacity-80`}></div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 p-8 rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black tracking-tight">Desempenho (RDOs por dia)</h3>
                <div className="flex bg-[#0a0a0a] p-1 rounded-xl">
                  {['Mensal', 'Semanal'].map((t) => (
                    <button 
                      key={t}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${t === 'Semanal' ? 'bg-[#2a2a2a] text-[#d4ff3f]' : 'text-slate-500 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={performanceData}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#2a2a2a', radius: 8 }}
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #334155', 
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#d4ff3f' : '#1e293b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* High Priority Tasks */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-black tracking-tight">Tarefas Ativas de Alta Prioridade</h3>
              <div className="divide-y divide-slate-800/50 bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
                {highPriorityTasks.map((task, idx) => (
                  <motion.div 
                    key={task.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (idx * 0.1) }}
                    className="p-6 flex items-center justify-between hover:bg-[#2a2a2a]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-2.5 rounded-full ${task.color} shadow-lg shadow-${task.color.split('-')[1]}-500/20`}></div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{task.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{task.site}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-3 py-1.5 bg-[#0a0a0a] text-slate-400 rounded-lg uppercase tracking-widest border border-slate-800/50">
                      {task.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Google Drive Integration Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="p-6 rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`size-12 rounded-2xl flex items-center justify-center ${driveStatus.isConnected || driveStatus.isServiceAccount ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800/50 text-slate-500'}`}>
                  <Cloud size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Google Drive</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Gestão de Documentos</p>
                </div>
              </div>

              {driveStatus.isServiceAccount ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sincronização Automática Ativa</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    O sistema está configurado para sincronizar documentos automaticamente com o Drive da empresa.
                  </p>
                </div>
              ) : driveStatus.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <CheckCircle2 size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Conta Conectada</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sua conta pessoal do Google está conectada para gestão de documentos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle size={16} className="text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Não Conectado</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Conecte uma conta do Google para habilitar a sincronização de documentos.
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/google/url');
                        const { url } = await response.json();
                        window.open(url, 'google_auth', 'width=600,height=700');
                      } catch (error) {
                        console.error('Erro ao conectar Google Drive:', error);
                      }
                    }}
                    className="w-full py-3 bg-[#d4ff3f] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
                  >
                    Conectar Agora
                  </button>
                </div>
              )}
            </motion.div>

            {/* Google Calendar Events */}
            {googleEvents.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest">Agenda Google</h3>
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {googleEvents.map((event) => (
                    <div key={event.id} className="p-4 bg-[#1a1a1a] rounded-2xl border border-slate-800/50 hover:border-[#d4ff3f]/30 transition-all group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black tracking-tight truncate group-hover:text-[#d4ff3f] transition-colors">{event.summary}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">
                            {new Date(event.start.dateTime || event.start.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(event.start.dateTime || event.start.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <h3 className="text-xs font-black uppercase tracking-widest">Atividade Recente</h3>
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {idx !== recentActivity.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-800"></div>
                    )}
                    <div className={`size-8 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center flex-shrink-0 z-10`}>
                      <activity.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight leading-tight">{activity.title}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{activity.desc}</p>
                      <p className="text-[10px] text-[#d4ff3f] font-black uppercase tracking-widest mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
