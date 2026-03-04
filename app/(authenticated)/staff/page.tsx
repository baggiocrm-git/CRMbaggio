'use client';

import React from 'react';
import Header from '@/components/Header';
import Image from 'next/image';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Download, 
  Filter, 
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Info,
  HardHat
} from 'lucide-react';
import { motion } from 'motion/react';

const stats = [
  { label: 'Total Active Staff', value: '124', change: '+4 this month', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Pending Contracts', value: '12', change: 'Review needed', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { label: 'Safety Certifications', value: '89%', change: '8 expiring', icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-500/10' },
];

const staff = [
  { id: 1, name: 'Robert Jackson', empId: 'E294', role: 'Sr. Civil Engineer', dept: 'Structural Division', status: 'Active', docs: [true, true, false], img: 'https://picsum.photos/seed/staff1/100/100' },
  { id: 2, name: 'Sarah Jenkins', empId: 'E302', role: 'Safety Inspector', dept: 'Compliance', status: 'Active', docs: [true, true, true], img: 'https://picsum.photos/seed/staff2/100/100' },
  { id: 3, name: 'Michael Vance', empId: 'E112', role: 'Project Coordinator', dept: 'Logistics', status: 'On Leave', docs: [true, false, false], img: 'https://picsum.photos/seed/staff3/100/100' },
];

const documents = [
  { id: 1, name: 'Project Alpha Master Contract', type: 'PDF', size: '4.2 MB', time: '2d ago', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, name: 'Environmental Permit 2024', type: 'DOCX', size: '1.8 MB', time: '5d ago', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 3, name: 'OSHA Safety Certifications', type: 'ZIP', size: '22 MB', time: '1w ago', icon: HardHat, color: 'text-red-500', bg: 'bg-red-500/10' },
];

export default function StaffPage() {
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Staff & Document Management" 
          subtitle="Centralized control for engineering personnel and compliance records."
          action={{ label: 'New Member', onClick: () => {} }}
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
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Staff Directory</h3>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Filter</button>
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Export</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Role & Department</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Docs</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {staff.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm relative">
                                <Image src={person.img} alt={person.name} fill className="object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-slate-900 dark:text-white">{person.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Emp #{person.empId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{person.role}</p>
                            <p className="text-xs text-slate-500 font-medium">{person.dept}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              person.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                            }`}>
                              {person.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-1.5">
                              {person.docs.map((done, i) => (
                                done 
                                  ? <CheckCircle2 key={i} size={16} className="text-blue-600" />
                                  : <Circle key={i} size={16} className="text-slate-200 dark:text-slate-700" />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                              <MoreHorizontal size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing 3 of 124 employees</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Previous</button>
                    <button className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest">Next</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Vault Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Digital Document Vault</h3>
                </div>
                <div className="p-4 space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:border-blue-600/50 transition-all cursor-pointer group">
                      <div className={`size-10 ${doc.bg} ${doc.color} rounded-xl flex items-center justify-center`}>
                        <doc.icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{doc.type} • {doc.size} • Updated {doc.time}</p>
                      </div>
                      <Download size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                  <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                    View All Documents
                  </button>
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <Info size={24} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-sm text-blue-600 uppercase tracking-widest mb-2">Upcoming Renewals</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      There are 8 professional certifications and 2 site permits set to expire in the next 30 days. Please initiate the renewal process.
                    </p>
                    <button className="text-[10px] font-black uppercase tracking-widest underline text-blue-600 mt-4">View Expiring Items</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
