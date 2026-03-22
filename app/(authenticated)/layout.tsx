'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const userRef = React.useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const handleUserRole = async (userData: User) => {
      if (!mounted) return;
      
      try {
        const rawEmail = (
          userData.email || 
          userData.user_metadata?.email || 
          (userData as User & { app_metadata?: { email?: string } }).app_metadata?.email ||
          (userData as User & { identities?: Array<{ identity_data?: { email?: string } }> }).identities?.[0]?.identity_data?.email ||
          ''
        );
        
        const userEmail = rawEmail.toLowerCase().trim();
        console.log('DashboardLayout: Processando papel do usuário:', userEmail);
        
        if (userEmail === 'lucabaggio28@gmail.com') {
          const forcedUser = { 
            ...userData, 
            user_metadata: { ...(userData.user_metadata || {}), role: 'Administrador' } 
          };
          setUser(forcedUser);
          setLoading(false);

          if (userData.user_metadata?.role !== 'Administrador') {
            await supabase.auth.updateUser({ data: { role: 'Administrador' } });
            await supabase.auth.refreshSession();
          }
        } else {
          setUser(userData);
          if (userData.user_metadata?.role === 'Cliente') {
            const { data: projectData } = await supabase
              .from('projetos')
              .select('id')
              .eq('cliente_id', userData.id)
              .single();
            
            if (projectData) {
              router.push(`/client/rdo/${projectData.id}`);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Erro ao processar papel do usuário:', e);
        setLoading(false);
      }
    };

    const syncGoogleTokens = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'google') {
        try {
          await supabase.from('google_tokens').upsert({
            id: 1,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token || null,
            token_type: 'Bearer',
            scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file',
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.error('Erro ao sincronizar tokens:', e);
        }
      }
    };

    // 1. Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (!mounted) return;

      if (session?.user) {
        await handleUserRole(session.user);
        await syncGoogleTokens();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        router.push('/login');
      }
    });

    // 2. Initial check
    const checkInitialSession = async () => {
      try {
        // Try up to 3 times to get session
        for (let i = 0; i < 3; i++) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await handleUserRole(session.user);
            return;
          }
          await new Promise(r => setTimeout(r, 500));
        }
        
        // If still no session, check if we are on a public page
        if (mounted) {
          setLoading(false);
          if (!window.location.pathname.includes('/login')) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Initial check error:', err);
        if (mounted) setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const banner = (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest text-center py-1 shadow-lg pointer-events-none">
      VERSÃO: 20260322-1240 | REFRESH: F5 OK | ATM: FINAL
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-6">
        {banner}
        <Loader2 className="animate-spin text-[#d4ff3f]" size={32} />
        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium">Verificando sua sessão...</p>
          <p className="text-slate-600 text-[10px] mt-2">Isso pode levar alguns segundos em conexões lentas.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest hover:underline"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // If loading is false but we don't have a user yet, it means we are in the "fallback" state
  if (!user) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const errorParam = searchParams?.get('error');
    const errorDesc = searchParams?.get('error_description');

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-8 p-6">
        {banner}
        <div className="text-center space-y-4">
          <div className={`${errorParam ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'} border rounded-full p-4 w-fit mx-auto`}>
            <AlertCircle className={errorParam ? 'text-red-500' : 'text-amber-500'} size={32} />
          </div>
          <h2 className="text-white text-xl font-black uppercase tracking-tighter">
            {errorParam ? 'Erro de Autenticação' : 'Sessão não detectada'}
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            {errorParam 
              ? `Ocorreu um erro ao tentar entrar: ${errorDesc || errorParam}`
              : 'Detectamos uma tentativa de login, mas o navegador ainda não processou os dados.'}
          </p>
          <p className="text-slate-600 text-[8px] break-all max-w-xs mx-auto opacity-50">
            URL: {typeof window !== 'undefined' ? window.location.href : ''}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[#d4ff3f] text-[#0a0a0a] font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-[#c4ef2f] transition-all"
          >
            Recarregar Página
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-transparent border border-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-900 transition-all"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#0a0a0a]">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden pt-6">
        {children}
      </main>
    </div>
  );
}
