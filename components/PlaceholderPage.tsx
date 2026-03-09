'use client';
import React from 'react';
import Header from '@/components/Header';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex-1 bg-[#0a0a0a] text-white">
      <Header title={title} subtitle="Esta página está em desenvolvimento." />
      <div className="p-8">
        <div className="bg-[#1a1a1a] p-12 rounded-3xl border border-slate-800/50 text-center">
          <p className="text-slate-500 font-bold uppercase tracking-widest">Módulo em Construção</p>
        </div>
      </div>
    </div>
  );
}
