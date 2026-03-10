'use client';

import React from 'react';
import BudgetEditor from '@/components/finances/BudgetEditor';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBudgetPage() {
  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/finances/budget"
          className="p-2 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-slate-500 hover:text-white transition-all"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Novo <span className="text-[#d4ff3f]">Orçamento</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cadastro completo de fases e serviços (TCPO)</p>
        </div>
      </div>

      <BudgetEditor />
    </div>
  );
}
