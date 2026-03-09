'use client';

import React from 'react';
import { Search, Bell, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Header({ title, subtitle, searchValue, onSearch, action }: HeaderProps) {
  return (
    <header className="h-20 border-b border-slate-800/50 bg-[#0a0a0a] px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
      <div className="flex flex-col">
        <h2 className="text-xl font-black text-white tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-2 border border-slate-800/50 focus-within:border-[#d4ff3f]/50 transition-all">
          <Search size={18} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm text-white w-64 placeholder:text-slate-700 font-bold"
          />
        </div>

        <div className="flex items-center gap-3 border-l border-slate-800/50 pl-6">
          <button className="size-10 flex items-center justify-center rounded-2xl bg-[#1a1a1a] text-slate-500 hover:text-[#d4ff3f] hover:bg-[#2a2a2a] transition-all relative group">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
            <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full border-2 border-[#0a0a0a]"></span>
          </button>
          
          {action && (
            <button 
              onClick={action.onClick}
              className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              {action.label}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
