'use client';

import React from 'react';
import Header from '@/components/Header';
import { 
  Plus, 
  Filter, 
  LayoutGrid, 
  List, 
  Calendar, 
  Map, 
  MoreHorizontal,
  Paperclip,
  MessageSquare,
  HardHat,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

const columns = [
  { id: 'planning', name: 'Planning', count: 2, color: 'bg-slate-400' },
  { id: 'in-progress', name: 'In Progress', count: 3, color: 'bg-blue-500' },
  { id: 'delayed', name: 'Delayed', count: 1, color: 'bg-rose-500' },
  { id: 'completed', name: 'Completed', count: 12, color: 'bg-emerald-500' },
];

const projects = [
  { 
    id: 1, 
    column: 'planning', 
    category: 'Residential', 
    title: 'Oak Ridge Apartments', 
    desc: 'Structural integrity assessment and foundation blueprinting phase.', 
    progress: 15, 
    manager: 'Sarah J.', 
    engineer: 'Mike T.',
    docs: 2,
    chats: 5
  },
  { 
    id: 2, 
    column: 'in-progress', 
    category: 'Commercial', 
    title: 'Downtown Tech Hub', 
    location: 'Chicago, IL',
    dates: 'May 12 - Oct 20',
    progress: 64, 
    manager: 'David Kincaid',
    type: 'Site Manager'
  },
  { 
    id: 3, 
    column: 'in-progress', 
    category: 'Infrastructure', 
    title: 'Harbor Bridge Renovation', 
    location: 'Seattle, WA',
    dates: 'Jun 05 - Dec 15',
    progress: 42, 
  },
  { 
    id: 4, 
    column: 'delayed', 
    category: 'Medical', 
    title: 'St. Jude Medical Wing', 
    delayMsg: 'Materials delivery delay: 14 days behind schedule',
    progress: 88, 
    manager: 'Alex Lombardi',
    endDate: 'Ends Oct 01',
    isOverdue: true
  },
  { 
    id: 5, 
    column: 'completed', 
    category: 'Retail', 
    title: 'Northside Mall Plaza', 
    handover: 'Handed over on Aug 28, 2023',
    isVerified: true
  }
];

export default function ProjectsPage() {
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Construction Project Management" 
          subtitle="Manage ongoing sites, site timelines, and technical documentation across all active regions."
          action={{ label: 'New Project', onClick: () => {} }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* View Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-8">
              <button className="flex items-center gap-2 border-b-2 border-blue-600 text-blue-600 pb-4 font-bold text-sm">
                <LayoutGrid size={16} />
                Kanban Board
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 pb-4 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <List size={16} />
                List View
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 pb-4 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Calendar size={16} />
                Timeline (Gantt)
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 pb-4 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Map size={16} />
                Site Map
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all mb-2">
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${col.color}`}></div>
                    <h3 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest">{col.name}</h3>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-lg font-black">{col.count}</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
                </div>

                <div className="flex flex-col gap-4">
                  {projects.filter(p => p.column === col.id).map((project) => (
                    <motion.div 
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white dark:bg-slate-900 border ${project.isOverdue ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                          project.column === 'planning' ? 'bg-blue-500/10 text-blue-600' :
                          project.column === 'in-progress' ? 'bg-blue-500/10 text-blue-600' :
                          project.column === 'delayed' ? 'bg-rose-500/10 text-rose-600' :
                          'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {project.category}
                        </span>
                        {project.dates && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{project.dates}</span>}
                        {project.isOverdue && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-black uppercase">
                            <AlertTriangle size={12} />
                            Overdue
                          </div>
                        )}
                        {project.isVerified && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>

                      <h4 className="font-black text-slate-900 dark:text-white mb-1 tracking-tight">{project.title}</h4>
                      
                      {project.location && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-4">
                          <MapPin size={12} />
                          {project.location}
                        </div>
                      )}

                      {project.desc && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-medium">{project.desc}</p>}
                      
                      {project.delayMsg && <p className="text-xs text-rose-500 mb-4 font-bold italic">{project.delayMsg}</p>}

                      {project.progress !== undefined && (
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>{project.column === 'planning' ? 'Site Readiness' : 'Overall Progress'}</span>
                            <span className={project.column === 'delayed' ? 'text-rose-500' : 'text-blue-600'}>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${project.column === 'delayed' ? 'bg-rose-500' : 'bg-blue-600'} w-[${project.progress}%]`} style={{ width: `${project.progress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {project.column === 'in-progress' && (
                        <button className="w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-2 mb-4">
                          <UploadCloud size={14} />
                          Upload Technical Docs
                        </button>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex -space-x-2">
                          {[1, 2].map(i => (
                            <div key={i} className="size-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black">
                              {i === 1 ? 'SJ' : 'MT'}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="flex items-center gap-1">
                            <Paperclip size={14} />
                            <span className="text-[10px] font-bold">{project.docs || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            <span className="text-[10px] font-bold">{project.chats || 0}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {col.id === 'completed' && (
                    <button className="w-full py-6 bg-transparent border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all flex flex-col items-center justify-center gap-2 group">
                      <Plus size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Archive</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
