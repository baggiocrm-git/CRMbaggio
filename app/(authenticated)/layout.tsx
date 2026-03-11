'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log('DashboardLayout renderizado');
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
