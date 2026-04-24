'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getFinanceEntryPathForRole, getRoleFromUser, isAdminRole, isAuxAdminLevel1Role, isAuxAdminLevel2Role, isFinancialAdminLevel1Role, isFinancialAdminLevel2Role } from '@/lib/navigation';
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
  Target,
  Layers,
  ClipboardList,
  Calendar,
  BarChart3,
  ReceiptText
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
    { name: 'R.H.', icon: Users, href: '/staff' },
    { name: 'Gestão de Documentos', icon: FileText, href: '/documents' },
  ]},
  { group: 'FINANCEIRO', items: [
    { name: 'Dashboard', icon: BarChart3, href: '/finances' },
    { name: 'Contas a Receber', icon: TrendingUp, href: '/finances/receivables' },
    { name: 'Contas a Pagar', icon: TrendingDown, href: '/finances/payables' },
    { name: 'Centros de Custo', icon: Layers, href: '/finances/cost-centers' },
    { name: 'Notas Fiscais', icon: ReceiptText, href: '/finances/invoices' },
  ]},
  { group: 'ENGENHARIA', items: [
    { name: 'Projetos', icon: Briefcase, href: '/projects' },
    { name: 'Orçamento', icon: Target, href: '/finances/budget' },
    { name: 'Insumos', icon: ClipboardList, href: '/finances/insumos' },
    { name: 'Serviços', icon: Layers, href: '/finances/services' },
  ]},
  { group: 'OUTROS', items: [] },
];

interface SidebarProps {
  user?: User | null;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user: propUser, isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [internalUser, setInternalUser] = React.useState<User | null>(null);

  // Use prop user if available, otherwise use internal state
  const user = propUser !== undefined ? propUser : internalUser;

  React.useEffect(() => {
    if (propUser !== undefined) return; // Skip if controlled by prop

    // Listen for auth state changes to catch the user as soon as they log in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Sidebar: Auth state changed:', event, !!session);
      if (session?.user) {
        setInternalUser(session.user);
      } else {
        setInternalUser(null);
      }
    });

    // Initial check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setInternalUser(session?.user ?? null);
    };
    void checkUser();

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
  
  const userRole = getRoleFromUser(user) || 'Usuário';
  const isAdmin = isAdminRole(userRole);
  const isAuxAdminLevel1 = isAuxAdminLevel1Role(userRole);
  const isAuxAdminLevel2 = isAuxAdminLevel2Role(userRole);
  const isFinancialAdminLevel1 = isFinancialAdminLevel1Role(userRole);
  const isFinancialAdminLevel2 = isFinancialAdminLevel2Role(userRole);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const financeEntryHref = isAdmin ? '/finances' : getFinanceEntryPathForRole(userRole);

  const filteredNavItems = navItems.map(group => {
    if (isAuxAdminLevel2) {
      if (group.group === 'PRINCIPAL' || group.group === 'OUTROS') {
        return { ...group };
      }
      return { ...group, items: [] };
    }

    if (isAuxAdminLevel1) {
      if (group.group === 'PRINCIPAL' || group.group === 'FINANCEIRO' || group.group === 'OUTROS') {
        return { ...group };
      }
      return { ...group, items: [] };
    }

    if (isFinancialAdminLevel1) {
      if (group.group === 'FINANCEIRO') {
        return {
          ...group,
          items: group.items.filter((item) =>
            item.href === '/finances/receivables' || item.href === '/finances/payables'
          ),
        };
      }
      if (group.group === 'OUTROS') {
        return { ...group };
      }
      return { ...group, items: [] };
    }

    if (isFinancialAdminLevel2) {
      if (group.group === 'FINANCEIRO') {
        return {
          ...group,
          items: group.items.filter((item) => item.href === '/finances/invoices'),
        };
      }
      if (group.group === 'OUTROS') {
        return { ...group };
      }
      return { ...group, items: [] };
    }

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
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-[19rem] flex-shrink-0 p-3 transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-[21rem] lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,28,0.96),rgba(6,10,22,0.96))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-2 border-b border-white/10 px-6 pb-5 pt-6">
          <div className="relative size-16">
            <Image
              src="https://github.com/baggiocrm-git/imagens/blob/main/LOGO%20CBSL_sem%20escrita_Pequeno.png?raw=true"
              alt="Logo"
              fill
              sizes="64px"
              priority
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center leading-none">
            <h1 className="whitespace-nowrap text-[10px] font-medium uppercase leading-none tracking-tight text-white">Construtora Baggio Silveira Ltda.</h1>
            <span className="mt-2 block text-[8px] font-bold uppercase leading-none tracking-[0.32em] text-[#d4ff3f]">Gestão de Engenharia</span>
          </div>
          <div className="mt-2 inline-flex items-center rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-lime-200">
            Espaço Operacional
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
          {filteredNavItems.map((group) => (
            <div key={group.group} className="space-y-1">
              {group.group === 'FINANCEIRO' ? (
                <Link
                  href={financeEntryHref}
                  onClick={onClose}
                  className="mb-2 block px-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 transition-colors hover:text-white"
                >
                  {group.group}
                </Link>
              ) : (
                <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{group.group}</div>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl border px-3 py-3 transition-all",
                      isActive
                        ? "border-lime-300/20 bg-lime-300/10 text-[#d4ff3f] shadow-lg shadow-lime-950/20"
                        : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl border transition-all",
                          isActive
                            ? "border-lime-300/20 bg-lime-300/10 text-[#d4ff3f]"
                            : "border-white/10 bg-white/[0.03] text-slate-500 group-hover:border-white/15 group-hover:text-white"
                        )}
                      >
                        <item.icon size={18} />
                      </span>
                      <span className="text-xs font-bold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
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

          <div className="border-t border-white/10 pt-4">
            <Link
              href="/settings"
              onClick={onClose}
              className={cn(
                "group flex items-center justify-between rounded-2xl border px-3 py-3 transition-all",
                pathname === '/settings'
                  ? "border-lime-300/20 bg-[#d4ff3f]/10 text-[#d4ff3f]"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border transition-all",
                    pathname === '/settings'
                      ? "border-lime-300/20 bg-lime-300/10 text-[#d4ff3f]"
                      : "border-white/10 bg-white/[0.03] text-slate-500 group-hover:border-white/15 group-hover:text-white"
                  )}
                >
                  <Settings size={18} />
                </span>
                <span className="text-xs font-bold">Configurações</span>
              </div>
              {pathname === '/settings' && <div className="size-1.5 rounded-full bg-[#d4ff3f]" />}
            </Link>

            <button
              onClick={handleLogout}
              className="group mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-rose-500/80 transition-all hover:bg-rose-500/10 hover:text-rose-400"
            >
              <span className="flex size-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400/80 transition-transform group-hover:scale-105">
                <LogOut size={18} />
              </span>
              <span className="text-xs font-bold">Sair</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#d4ff3f] text-xs font-black text-[#0a0a0a] shadow-[0_10px_30px_rgba(212,255,63,0.18)]">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{userName}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{userRole} • {userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

