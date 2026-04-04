'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugBanner() {
  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4 py-1.5 shadow-2xl border-b border-black/20 px-4">
      <span>VERSÃO: 20260321-0630 | REFRESH: F5 OK | STORAGE: V4.4</span>
      <button 
        onClick={handleLogout}
        className="bg-black text-[#d4ff3f] px-3 py-0.5 rounded-full hover:bg-slate-800 transition-colors pointer-events-auto cursor-pointer"
      >
        SAIR E LIMPAR
      </button>
    </div>
  );
}
