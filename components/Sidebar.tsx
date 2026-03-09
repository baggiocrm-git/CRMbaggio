'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Contact, 
  Settings, 
  HelpCircle,
  ChevronRight,
  LogOut,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart,
  Target,
  Layers,
  Percent,
  ClipboardList
} from 'lucide-react';

const navItems = [
  { group: 'PRINCIPAL', items: [
    { name: 'Painel', icon: LayoutDashboard, href: '/finances' },
    { name: 'Contas a Receber', icon: TrendingUp, href: '/finances/receivables', badge: '3' },
    { name: 'Contas a Pagar', icon: TrendingDown, href: '/finances/payables' },
  ]},
  { group: 'FINANCEIRO', items: [
    { name: 'DRE', icon: PieChart, href: '/finances/dre' },
    { name: 'Orçamento', icon: Target, href: '/finances/budget' },
    { name: 'Centros de Custo', icon: Layers, href: '/finances/cost-centers' },
  ]},
  { group: 'FISCAL', items: [
    { name: 'Impostos', icon: Percent, href: '/finances/taxes' },
    { name: 'Obrigações', icon: ClipboardList, href: '/finances/obligations' },
  ]},
  { group: 'OUTROS', items: [
    { name: 'Projetos', icon: Briefcase, href: '/projects' },
    { name: 'Equipe', icon: Users, href: '/staff' },
    { name: 'Contatos', icon: Contact, href: '/contacts' },
  ]}
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/50 bg-[#0a0a0a] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800/50 flex flex-col gap-1">
        <h1 className="font-black text-xl tracking-tight text-[#d4ff3f]">FinancePME</h1>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestão Financeira</span>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navItems.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-2">{group.group}</div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                    isActive 
                      ? "bg-[#1a1a1a] text-[#d4ff3f] shadow-lg shadow-black/20" 
                      : "text-slate-400 hover:bg-[#1a1a1a] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={cn(isActive ? "text-[#d4ff3f]" : "text-slate-500 group-hover:text-white transition-colors")} />
                    <span className="text-xs font-bold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="size-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <div className="size-1.5 rounded-full bg-[#d4ff3f]" />}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

        <div className="pt-4 border-t border-slate-800/50">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-2">CONFIG</div>
          <Link 
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-[#1a1a1a] hover:text-white rounded-xl transition-all"
          >
            <Settings size={18} className="text-slate-500" />
            <span className="text-xs font-bold">Configurações</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all mt-1 group"
          >
            <LogOut size={18} className="text-rose-500/50 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Sair</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-2xl border border-slate-800/50">
          <div className="size-8 rounded-full bg-[#d4ff3f] flex items-center justify-center text-[#0a0a0a] font-black text-xs">
            MF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Maria Fonseca</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">Financeiro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
