'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Search,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subDays,
  eachDayOfInterval,
  isToday,
  addWeeks,
  subWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type ViewType = 'day' | 'week' | 'month';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'task' | 'project' | 'personal';
  location?: string;
  attendees?: string[];
  calendarColor?: string;
}

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Reunião de Alinhamento - Projeto Alpha',
    start: new Date(2026, 2, 9, 10, 0),
    end: new Date(2026, 2, 9, 11, 30),
    type: 'meeting',
    location: 'Sala de Reuniões A',
    attendees: ['Maria Fonseca', 'João Silva']
  },
  {
    id: '2',
    title: 'Revisão de Orçamento Q1',
    start: new Date(2026, 2, 10, 14, 0),
    end: new Date(2026, 2, 10, 15, 30),
    type: 'task',
    location: 'Remoto'
  },
  {
    id: '3',
    title: 'Visita Técnica - Obra Central',
    start: new Date(2026, 2, 12, 9, 0),
    end: new Date(2026, 2, 12, 12, 0),
    type: 'project',
    location: 'Av. Paulista, 1000'
  }
];

interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<Event[]>([]); // Start empty, will fill with mock if not connected
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock events only if not connected
  useEffect(() => {
    if (!isGoogleConnected) {
      setEvents(MOCK_EVENTS);
      const mockCalendars = [
        { id: 'pessoal', summary: 'Pessoal', backgroundColor: '#3b82f6' },
        { id: 'trabalho', summary: 'Trabalho', backgroundColor: '#d4ff3f' },
        { id: 'projetos', summary: 'Projetos', backgroundColor: '#f97316' },
        { id: 'feriados', summary: 'Feriados', backgroundColor: '#f43f5e' },
      ];
      setCalendars(mockCalendars);
      setSelectedCalendarIds(mockCalendars.map((calendar) => calendar.id));
    }
  }, [isGoogleConnected]);

  const fetchGoogleCalendars = React.useCallback(async () => {
    try {
      const response = await fetch('/api/google/calendar/list');
      if (response.ok) {
        const data: GoogleCalendar[] = await response.json();
        
        // Deduplicate by summary/name to avoid "Feriados no Brasil" appearing twice
        const uniqueCalendars = data.reduce((acc: GoogleCalendar[], current) => {
          const x = acc.find(item => item.summary === current.summary);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        setCalendars(uniqueCalendars);
        setSelectedCalendarIds((prev) => {
          const validSelectedIds = prev.filter((id) => uniqueCalendars.some((calendar) => calendar.id === id));
          if (validSelectedIds.length > 0) return validSelectedIds;
          return uniqueCalendars.map((calendar) => calendar.id);
        });
      }
    } catch (err) {
      console.error('Error fetching calendar list:', err);
    }
  }, []);

  const fetchGoogleEvents = React.useCallback(async (calendarIds: string[], availableCalendars: GoogleCalendar[]) => {
    try {
      setIsSyncing(true);
      setError(null);
      
      if (calendarIds.length === 0) {
        setEvents([]);
        setIsSyncing(false);
        return;
      }

      // Fetch from all selected calendars
      const allEventsPromises = calendarIds.map(async (calendarId) => {
        const response = await fetch(`/api/google/calendar/events?calendarId=${encodeURIComponent(calendarId)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Falha ao buscar eventos da agenda ${calendarId}`);
        }
        const data = await response.json();
        
        // Find calendar color
        const calendar = availableCalendars.find(c => c.id === calendarId);
        
        return data.map((e: { id: string; summary?: string; start: { dateTime?: string; date: string }; end: { dateTime?: string; date: string }; location?: string; attendees?: { displayName?: string; email: string }[] }) => ({
          id: e.id,
          title: e.summary || 'Sem título',
          start: new Date(e.start.dateTime || e.start.date),
          end: new Date(e.end.dateTime || e.end.date),
          type: 'meeting',
          location: e.location,
          attendees: e.attendees?.map((a: { displayName?: string; email: string }) => a.displayName || a.email),
          calendarColor: calendar?.backgroundColor || '#d4ff3f'
        }));
      });

      const results = await Promise.all(allEventsPromises);
      const mergedEvents = results.flat();

      // Replace events with Google events when connected
      setEvents(mergedEvents);
      setIsGoogleConnected(true);
    } catch (err: unknown) {
      console.error('Error fetching Google events:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      
      // If unauthorized, it means tokens are invalid, so reset connection state
      if (errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('invalid_grant')) {
        setIsGoogleConnected(false);
        setEvents(MOCK_EVENTS);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Re-fetch events when selected calendars change
  useEffect(() => {
    if (!isGoogleConnected) return;

    if (selectedCalendarIds.length === 0) {
      setEvents([]);
      return;
    }

    if (calendars.length > 0) {
      fetchGoogleEvents(selectedCalendarIds, calendars);
    }
  }, [isGoogleConnected, selectedCalendarIds, calendars, fetchGoogleEvents]);

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'google_oauth', 'width=600,height=700');
      
      if (!authWindow) {
        alert('Por favor, habilite popups para conectar sua conta Google.');
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.app_metadata?.provider === 'google') {
        setIsGoogleConnected(true);
        fetchGoogleCalendars();
        return;
      }

      // Check if we have tokens in the database
      const { data: tokens } = await supabase
        .from('google_tokens')
        .select('id')
        .eq('id', 2)
        .maybeSingle();
      
      if (tokens) {
        setIsGoogleConnected(true);
        fetchGoogleCalendars();
      }
    };

    checkConnection();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' || event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
        fetchGoogleCalendars();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setError(`Erro na autenticação: ${event.data.message}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchGoogleCalendars]);

  const renderHeader = () => (
    <header className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/20">
      <div>
        <h1 className="text-4xl font-black tracking-tight italic">
          Agenda <span className="text-[#d4ff3f]">Inteligente</span>
        </h1>
        <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-12">
        <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-slate-800/50">
          {(['day', 'week', 'month'] as ViewType[]).map((v) => (
            <button 
              key={v} 
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                view === v ? "bg-[#2a2a2a] text-[#d4ff3f]" : "text-slate-500 hover:text-white"
              )}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-slate-800/50">
          <button onClick={prev} className="p-1.5 hover:text-[#d4ff3f] transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:text-white">Hoje</button>
          <button onClick={next} className="p-1.5 hover:text-[#d4ff3f] transition-colors"><ChevronRight size={16} /></button>
        </div>

        <button 
          onClick={() => fetchGoogleEvents(selectedCalendarIds, calendars)}
          disabled={isSyncing}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 w-[180px] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-[#1a1a1a] border border-slate-800 text-slate-400 hover:text-white hover:bg-[#2a2a2a]",
            isSyncing && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(isSyncing && "animate-spin")}>
            <TrendingUp size={14} />
          </div>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleConnectGoogle}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              isGoogleConnected 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                : "bg-[#1a1a1a] border border-slate-800 text-slate-400 hover:text-white hover:bg-[#2a2a2a]"
            )}
          >
            {isGoogleConnected ? <CheckCircle2 size={14} /> : <ExternalLink size={14} />}
            {isGoogleConnected ? 'Google Conectado' : 'Conectar Google'}
          </button>

          {isGoogleConnected && (
            <button 
              onClick={async () => {
                if (confirm('Deseja realmente desconectar sua conta Google?')) {
                  const { error } = await supabase.from('google_tokens').delete().eq('id', 2);
                  if (!error) {
                    setIsGoogleConnected(false);
                    setEvents(MOCK_EVENTS);
                    setError(null);
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
            >
              Desconectar
            </button>
          )}
        </div>

        <button className="flex items-center gap-2 px-6 py-2 bg-[#d4ff3f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all shadow-lg shadow-[#d4ff3f]/10">
          <Plus size={14} /> Novo Evento
        </button>
      </div>
    </header>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const rows: React.ReactNode[] = [];
    let daysInWeek: React.ReactNode[] = [];

    days.forEach((day, i) => {
      const dayEvents = events.filter(e => isSameDay(e.start, day));
      
      daysInWeek.push(
        <div 
          key={day.toString()} 
          className={cn(
            "min-h-[120px] p-2 border-r border-b border-white/20 flex flex-col gap-1 transition-colors",
            !isSameMonth(day, monthStart) ? "bg-[#141414]/50 opacity-30" : "bg-[#141414]",
            isToday(day) && "bg-[#d4ff3f]/5"
          )}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={cn(
              "text-[10px] font-black",
              isToday(day) ? "text-[#d4ff3f]" : "text-slate-500"
            )}>
              {format(day, 'd')}
            </span>
            {isToday(day) && <div className="size-1 rounded-full bg-[#d4ff3f]" />}
          </div>
          
          <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[80px]">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                className={cn(
                  "px-2 py-1 rounded-md text-[9px] font-bold truncate border",
                  !event.calendarColor && event.type === 'meeting' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  !event.calendarColor && event.type === 'task' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                  !event.calendarColor && event.type === 'project' ? "bg-[#d4ff3f]/10 text-[#d4ff3f] border-[#d4ff3f]/20" :
                  !event.calendarColor ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : ""
                )}
                style={event.calendarColor ? { 
                  backgroundColor: `${event.calendarColor}15`, 
                  color: event.calendarColor,
                  borderColor: `${event.calendarColor}30`
                } : {}}
              >
                {format(event.start, 'HH:mm')} {event.title}
              </div>
            ))}
          </div>
        </div>
      );

      if ((i + 1) % 7 === 0) {
        rows.push(<div key={i} className="grid grid-cols-7">{daysInWeek}</div>);
        daysInWeek = [];
      }
    });

    return (
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 border-b border-white/20 bg-[#1a1a1a]">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/20 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {rows}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = eachDayOfInterval({ start: startDate, end: endOfWeek(startDate) });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-[80px_1fr] border-b border-white/20 bg-[#1a1a1a]">
          <div className="border-r border-white/20"></div>
          <div className="grid grid-cols-7">
            {days.map(day => (
              <div key={day.toString()} className="py-4 text-center border-r border-white/20">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{format(day, 'EEE', { locale: ptBR })}</p>
                <p className={cn(
                  "text-lg font-black",
                  isToday(day) ? "text-[#d4ff3f]" : "text-white"
                )}>{format(day, 'd')}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-[80px_1fr] min-h-full">
            <div className="border-r border-white/20">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-white/10 flex items-start justify-center pt-2">
                  <span className="text-[10px] font-black text-slate-600">{format(new Date().setHours(hour, 0), 'HH:mm')}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 relative bg-[#141414]">
              {days.map(day => (
                <div key={day.toString()} className="border-r border-white/20 relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-20 border-b border-white/10"></div>
                  ))}
                  {events.filter(e => isSameDay(e.start, day)).map(event => {
                    const top = (event.start.getHours() * 80) + (event.start.getMinutes() / 60 * 80);
                    const height = ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)) * 80;
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 p-2 rounded-xl border z-10 overflow-hidden",
                          !event.calendarColor && event.type === 'meeting' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          !event.calendarColor && event.type === 'task' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                          !event.calendarColor && event.type === 'project' ? "bg-[#d4ff3f]/20 text-[#d4ff3f] border-[#d4ff3f]/30" :
                          !event.calendarColor ? "bg-slate-500/20 text-slate-400 border-slate-500/30" : ""
                        )}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          ...(event.calendarColor ? {
                            backgroundColor: `${event.calendarColor}20`,
                            color: event.calendarColor,
                            borderColor: `${event.calendarColor}40`
                          } : {})
                        }}
                      >
                        <p className="text-[10px] font-black truncate">{event.title}</p>
                        <p className="text-[8px] font-bold opacity-70">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter(e => isSameDay(e.start, currentDate));

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 bg-[#1a1a1a] border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-[#d4ff3f] flex flex-col items-center justify-center text-[#0a0a0a]">
              <span className="text-[10px] font-black uppercase tracking-tighter">{format(currentDate, 'EEE', { locale: ptBR })}</span>
              <span className="text-xl font-black leading-none">{format(currentDate, 'd')}</span>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{format(currentDate, "dd 'de' MMMM", { locale: ptBR })}</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{dayEvents.length} eventos agendados</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-[100px_1fr] min-h-full">
            <div className="border-r border-white/20">
              {hours.map(hour => (
                <div key={hour} className="h-24 border-b border-white/10 flex items-start justify-center pt-4">
                  <span className="text-xs font-black text-slate-600">{format(new Date().setHours(hour, 0), 'HH:mm')}</span>
                </div>
              ))}
            </div>
            <div className="relative p-4 bg-[#141414]">
              {hours.map(hour => (
                <div key={hour} className="h-24 border-b border-white/10"></div>
              ))}
              {dayEvents.map(event => {
                const top = (event.start.getHours() * 96) + (event.start.getMinutes() / 60 * 96);
                const height = ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)) * 96;
                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "absolute left-8 right-8 p-4 rounded-2xl border z-10 flex flex-col justify-between shadow-2xl",
                      !event.calendarColor && event.type === 'meeting' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      !event.calendarColor && event.type === 'task' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      !event.calendarColor && event.type === 'project' ? "bg-[#d4ff3f]/10 text-[#d4ff3f] border-[#d4ff3f]/20" :
                      !event.calendarColor ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : ""
                    )}
                    style={{ 
                      top: `${top + 16}px`, 
                      height: `${height - 8}px`,
                      ...(event.calendarColor ? {
                        backgroundColor: `${event.calendarColor}15`,
                        color: event.calendarColor,
                        borderColor: `${event.calendarColor}30`
                      } : {})
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-black tracking-tight leading-tight">{event.title}</h4>
                        <button className="p-1 hover:bg-white/10 rounded-lg transition-colors"><MoreHorizontal size={16} /></button>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-70">
                          <Clock size={12} /> {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-70">
                            <MapPin size={12} /> {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                    {event.attendees && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-2">
                          {event.attendees.map((a, i) => (
                            <div key={i} className="size-6 rounded-full border-2 border-[#1a1a1a] bg-slate-800 flex items-center justify-center text-[8px] font-black">
                              {a.split(' ').map(n => n[0]).join('')}
                            </div>
                          ))}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">+{event.attendees.length} participantes</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 mx-8 mt-4 rounded-xl flex items-center justify-between">
          <p className="text-rose-500 text-xs font-bold uppercase tracking-widest">Erro: {error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-white transition-colors">
            <Plus size={16} className="rotate-45" />
          </button>
        </div>
      )}
      {renderHeader()}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mini Calendar & Filters */}
        <aside className="w-80 border-r border-white/20 p-8 hidden xl:flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-[#1a1a1a] p-3 rounded-2xl border border-slate-800/50">
              <Search size={16} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar eventos..." 
                className="bg-transparent border-none focus:ring-0 text-xs text-white w-full font-bold placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">MINHAS AGENDAS</h4>
            <div className="space-y-2">
              {calendars.map(cal => (
                <label key={cal.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl border border-slate-800/30 cursor-pointer hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-3 rounded-full" 
                      style={{ backgroundColor: cal.backgroundColor || '#d4ff3f' }}
                    ></div>
                    <span className="text-xs font-bold truncate max-w-[160px]">{cal.summary}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedCalendarIds.includes(cal.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCalendarIds(prev => prev.includes(cal.id) ? prev : [...prev, cal.id]);
                      } else {
                        setSelectedCalendarIds(prev => prev.filter(id => id !== cal.id));
                      }
                    }}
                    className="size-4 rounded border-slate-800 bg-transparent text-[#d4ff3f] focus:ring-[#d4ff3f]/30" 
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-auto p-6 bg-[#1a1a1a] rounded-3xl border border-slate-800/50 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 size-24 bg-[#d4ff3f]/5 rounded-full blur-2xl group-hover:bg-[#d4ff3f]/10 transition-all"></div>
            <h5 className="text-sm font-black tracking-tight mb-2">Dica do Dia</h5>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
              Sincronize seu Google Agenda para centralizar todos os seus compromissos em um só lugar.
            </p>
          </div>
        </aside>

        {/* Main Calendar Area */}
        <main className="flex-1 flex flex-col bg-[#0a0a0a]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={view + currentDate.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
