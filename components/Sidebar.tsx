'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Contact, 
  Settings, 
  LogOut,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart,
  Target,
  Layers,
  Percent,
  ClipboardList,
  Calendar,
  BarChart3
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navItems: NavGroup[] = [
  { group: 'PRINCIPAL', items: [
    { name: 'Panorama', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Agenda', icon: Calendar, href: '/calendar' },
    { name: 'Contatos', icon: Contact, href: '/contacts' },
    { name: 'Chat', icon: Users, href: '/chat' },
    { name: 'R.H.', icon: Users, href: '/staff' },
    { name: 'Gestão de Documentos', icon: FileText, href: '/documents' },
  ]},
  { group: 'FINANCEIRO', items: [
    { name: 'Dashboard', icon: BarChart3, href: '/finances' },
    { name: 'Contas a Receber', icon: TrendingUp, href: '/finances/receivables' },
    { name: 'Contas a Pagar', icon: TrendingDown, href: '/finances/payables' },
    { name: 'Centros de Custo', icon: Layers, href: '/finances/cost-centers' },
  ]},
  { group: 'ENGENHARIA', items: [
    { name: 'Projetos', icon: Briefcase, href: '/projects' },
    { name: 'Orçamento', icon: Target, href: '/finances/budget' },
    { name: 'Insumos', icon: ClipboardList, href: '/finances/insumos' },
    { name: 'Serviços', icon: Layers, href: '/finances/services' },
  ]},
  { group: 'FISCAL', items: [
    { name: 'Impostos', icon: Percent, href: '/finances/taxes' },
    { name: 'Obrigações', icon: ClipboardList, href: '/finances/obligations' },
    { name: 'DRE', icon: PieChart, href: '/finances/dre' },
  ]},
  { group: 'OUTROS', items: [] },
];

interface SidebarProps {
  user?: User | null;
}

export default function Sidebar({ user: propUser }: SidebarProps) {
  const pathname = usePathname();
  const [internalUser, setInternalUser] = React.useState<User | null>(null);

  // Use prop user if available, otherwise use internal state
  const user = propUser !== undefined ? propUser : internalUser;

  React.useEffect(() => {
    if (propUser !== undefined) return; // Skip if controlled by prop

    // Listen for auth state changes to catch the user as soon as they log in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Sidebar: Auth state changed:', event, !!session);
      if (session?.user) {
        setInternalUser(session.user);
      } else {
        setInternalUser(null);
      }
    });

    // Initial check
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setInternalUser(user);
      }
    };
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [propUser]);

  const handleLogout = () => {
    // Force immediate cleanup and redirect
    try {
      supabase.auth.signOut().catch(() => {});
      localStorage.clear();
      sessionStorage.clear();
      // Use replace to prevent back-button issues
      window.location.replace('/login');
    } catch {
      window.location.replace('/login');
    }
  };

  // Deep search for email in the user object
  const userEmail = (
    user?.email || 
    user?.user_metadata?.email || 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any)?.app_metadata?.email ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any)?.identities?.[0]?.identity_data?.email ||
    'Conectado'
  ).toLowerCase().trim();
  
  const userRole = user?.user_metadata?.role || 'Usuário';
  const isAdmin = userRole === 'Administrador';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const filteredNavItems = navItems.map(group => {
    if (group.group === 'OUTROS') {
      const items = [...group.items];
      if (isAdmin) {
        // Add Users management to OUTROS group if admin
        const hasUsers = items.some(i => i.name === 'Usuários');
        if (!hasUsers) {
          items.push({ name: 'Usuários', icon: Users, href: '/users' });
        }
      }
      return { ...group, items };
    }
    return group;
  }).filter(group => group.items.length > 0);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/50 bg-[#0a0a0a] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800/50 flex flex-col items-center gap-3">
        <div className="size-16 relative">
          <Image 
            src="https://github.com/baggiocrm-git/imagens/blob/main/LOGO%20CBSL_sem%20escrita_Pequeno.png?raw=true" 
            alt="Logo" 
            fill
            priority
            className="object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-center">
          <h1 className="font-medium text-[10px] tracking-tight text-white uppercase whitespace-nowrap">Construtora Baggio Silveira Ltda.</h1>
          <span className="text-[8px] font-bold text-[#d4ff3f] uppercase tracking-widest">Gestão de Engenharia</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((group) => (
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
          <Link 
            href="/settings"
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
              pathname === '/settings' ? "bg-[#d4ff3f]/10 text-[#d4ff3f]" : "text-slate-400 hover:bg-[#1a1a1a] hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className={cn(pathname === '/settings' ? "text-[#d4ff3f]" : "text-slate-500 group-hover:text-white transition-colors")} />
              <span className="text-xs font-bold">Configurações</span>
            </div>
            {pathname === '/settings' && <div className="size-1.5 rounded-full bg-[#d4ff3f]" />}
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
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">{userRole} • {userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
