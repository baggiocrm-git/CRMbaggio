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
    <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101822] px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
      <div className="flex flex-col">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-transparent focus-within:border-blue-600/50 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm text-black dark:text-white placeholder:text-black w-64"
          />
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
          <button className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#101822]"></span>
          </button>
          
          {action && (
            <button 
              onClick={action.onClick}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
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
