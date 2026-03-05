'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Wallet, 
  Contact, 
  Settings, 
  HelpCircle,
  HardHat,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Projects', icon: Briefcase, href: '/projects' },
  { name: 'Staff & Documents', icon: Users, href: '/staff' },
  { name: 'Finances', icon: Wallet, href: '/finances' },
  { name: 'Contacts', icon: Contact, href: '/contacts' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you would clear cookies/session here
    router.push('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101822] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
          <HardHat size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">BuildFlow</h1>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Engineering CRM</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Main Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600 transition-colors")} />
                <span className="text-sm font-semibold">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}

        <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Support</div>
          <Link 
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <Settings size={20} className="text-slate-500" />
            <span className="text-sm font-semibold">Settings</span>
          </Link>
          <Link 
            href="/help"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <HelpCircle size={20} className="text-slate-500" />
            <span className="text-sm font-semibold">Help Center</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all mt-2 group"
          >
            <LogOut size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">Log Off</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden relative">
            <Image 
              src="https://picsum.photos/seed/user1/100/100" 
              alt="User" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Marcus Chen</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">Engineering Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
