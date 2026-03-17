'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'Cliente') {
        // Fetch their project to redirect
        const { data: projectData } = await supabase
          .from('projetos')
          .select('id')
          .eq('cliente_id', user.id)
          .limit(1)
          .single();
        
        if (projectData) {
          router.push(`/client/rdo/${projectData.id}`);
        } else {
          await supabase.auth.signOut();
          router.push('/login');
        }
      } else {
        setLoading(false);
      }
    };
    checkRole();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#d4ff3f]" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
