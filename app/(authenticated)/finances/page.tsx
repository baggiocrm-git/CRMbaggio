'use client';

import React from 'react';
import Header from '@/components/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download,
  PlusCircle,
  CheckCircle2,
  MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

const stats = [
  { label: 'Net Monthly Balance', value: '$145,200.00', change: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Accounts Payable', value: '$42,850.15', change: '8 Bills Due', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { label: 'Accounts Receivable', value: '$188,050.40', change: '$12k Pending', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

const cashFlowData = [
  { name: 'Jan', inflow: 120000, outflow: 80000 },
  { name: 'Feb', inflow: 150000, outflow: 90000 },
  { name: 'Mar', inflow: 130000, outflow: 100000 },
  { name: 'Apr', inflow: 180000, outflow: 110000 },
  { name: 'May', inflow: 210000, outflow: 120000 },
  { name: 'Jun', inflow: 212400, outflow: 67200 },
];

const operations = [
  { id: 1, title: 'Concrete Supply - #204', status: 'Pending', amount: '$8,450.00', due: 'Due in 2 days', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, title: 'Staff Payroll - June', status: 'Critical', amount: '$12,200.00', due: 'Overdue 1 day', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 3, title: 'Site Equipment Rental', status: 'Scheduled', amount: '$3,150.00', due: 'Due July 15', icon: TrendingDown, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 4, title: 'Permit Fees - Phase 1', status: 'Completed', amount: '$1,200.00', due: 'Paid yesterday', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const projects = [
  { name: 'Skyline Office Tower', contract: '#299-A', status: 'Active', budget: '$2,450,000', spent: '$1,840,000', balance: '$610,000', liquidity: 85, color: 'text-emerald-500' },
  { name: 'Riverfront Bridge Expansion', contract: '#102', status: 'Delayed', budget: '$850,000', spent: '$820,000', balance: '$30,000', liquidity: 12, color: 'text-rose-500' },
];

export default function FinancesPage() {
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Financial Cash Flow" 
          subtitle="Manage construction project liquidity, payroll, and material invoices."
          action={{ label: 'New Transaction', onClick: () => {} }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon size={80} />
                </div>
                <div className="flex flex-col gap-1 relative z-10">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 relative z-10">
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.change.startsWith('+') ? <ArrowUpRight size={12} /> : <AlertCircle size={12} />}
                    {stat.change}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">vs last month</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cash Flow Chart */}
            <div className="lg:col-span-2 flex flex-col gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Cash Flow Trends</h3>
                  <p className="text-xs text-slate-500 font-medium">Monthly operating revenue vs expenses</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">6 Months</button>
                  <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500">1 Year</button>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#136dec" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#136dec" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="inflow" stroke="#136dec" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-blue-600"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Inflow</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">$212,400</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-rose-500/50"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Outflow</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">$67,200</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Operations */}
            <div className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Upcoming Operations</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Paid</button>
                  <button className="bg-blue-600/10 text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-600/20 uppercase tracking-widest">Pending</button>
                  <button className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Overdue</button>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2">
                {operations.map((op) => (
                  <div key={op.id} className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-xl ${op.bg} ${op.color} flex items-center justify-center`}>
                        <op.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{op.title}</p>
                        <p className={`text-[10px] font-bold ${op.status === 'Critical' ? 'text-rose-500' : 'text-slate-500'} uppercase tracking-tighter`}>{op.due}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{op.amount}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        op.status === 'Completed' ? 'text-emerald-500' : 
                        op.status === 'Critical' ? 'text-rose-500' : 'text-amber-500'
                      }`}>{op.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full text-center text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline py-2">View All Invoices</button>
            </div>
          </div>

          {/* Profitability Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Project Profitability Overview</h3>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-[10px] uppercase font-black tracking-widest text-slate-500">
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Spent</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4 text-right">Liquidity Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projects.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{p.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Contract {p.contract}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          p.status === 'Active' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          <span className={`size-1.5 rounded-full ${p.status === 'Active' ? 'bg-blue-600 animate-pulse' : 'bg-amber-500'}`}></span>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">{p.budget}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{p.spent}</td>
                      <td className={`px-6 py-5 text-sm font-black ${p.color}`}>{p.balance}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${p.color.replace('text', 'bg')}`} style={{ width: `${p.liquidity}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-900 dark:text-white">{p.liquidity}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
