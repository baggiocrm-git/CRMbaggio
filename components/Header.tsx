'use client';

import React from 'react';
import { Search, Bell, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  extraAction?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Header = React.memo(function Header({ title, subtitle, searchValue, onSearch, onRefresh, isRefreshing, extraAction, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(6,10,24,0.94),rgba(7,16,31,0.82))] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-[3px] rounded-full bg-[linear-gradient(180deg,#d4ff3f,rgba(125,211,252,0.45))] sm:block" />
          <div className="flex flex-col">
            <div className="mb-1 inline-flex w-fit items-center rounded-full border border-lime-300/15 bg-lime-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-lime-200">
              Painel operacional
            </div>
            <h2 className="text-2xl font-black leading-none tracking-tight text-white">{title}</h2>
            {subtitle && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-400 transition-all hover:border-lime-300/20 hover:text-[#d4ff3f]",
              isRefreshing && "opacity-50"
            )}
          >
            <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        {onSearch && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all focus-within:border-[#d4ff3f]/50 sm:min-w-[18rem] lg:min-w-[22rem]">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchValue ?? ''}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full border-none bg-transparent text-sm font-bold text-white placeholder:text-slate-700 focus:ring-0"
            />
          </div>
        )}

        <div className="flex items-center gap-3 sm:border-l sm:border-white/10 sm:pl-4 lg:pl-6">
          <button className="group relative flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-500 transition-all hover:border-lime-300/20 hover:text-[#d4ff3f]">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-[#09111f]"></span>
          </button>

          {extraAction}
          
          {action && (
            <button 
              onClick={action.onClick}
              className="flex items-center gap-2 rounded-2xl bg-[#d4ff3f] px-5 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#0a0a0a] shadow-[0_18px_40px_rgba(212,255,63,0.16)] transition-all hover:bg-[#c4ef2f] active:scale-95"
            >
              <Plus size={18} />
              {action.label}
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;
