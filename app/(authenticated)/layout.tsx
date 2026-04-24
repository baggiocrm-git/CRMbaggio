'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import InternalChat from '@/components/chat/InternalChat';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, House } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { canAccessPathForRole, findModuleByPath, getDefaultPathForRole, getRoleFromUser } from '@/lib/navigation';

const CLIENT_PORTAL_CLOSE_LOGOUT_KEY = 'client-portal-force-logout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Iniciando...');
  const [user, setUser] = useState<User | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);

  React.useLayoutEffect(() => {
    setLoadingStep('Iniciando verificação...');
  }, []);

  useEffect(() => {
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
    } catch {
      console.warn('DashboardLayout: LocalStorage is blocked.');
      setStorageBlocked(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingStep('Iniciando verificação...');

    const handleUserRole = async (userData: User) => {
      if (!mounted) return;

      try {
        const rawEmail =
          userData.email ||
          userData.user_metadata?.email ||
          (userData as any).app_metadata?.email ||
          (userData as any).identities?.[0]?.identity_data?.email ||
          '';

        const userEmail = rawEmail.toLowerCase().trim();
        let userRole = getRoleFromUser(userData);

        if (!userRole && userEmail === 'lucabaggio28@gmail.com') {
          userRole = 'Administrador';
          await supabase.auth.updateUser({ data: { role: 'Administrador' } });
        }

        const updatedUser = {
          ...userData,
          user_metadata: { ...(userData.user_metadata || {}), role: userRole },
        };

        setUser(updatedUser);

        if (!canAccessPathForRole(userRole, pathname)) {
          setLoading(false);
          router.push(getDefaultPathForRole(userRole));
          return;
        }

        if (userRole === 'Cliente') {
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
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('DashboardLayout: Erro em handleUserRole:', error);
        setLoading(false);
      }
    };

    if (!supabase?.auth) {
      setLoadingStep('Erro: Supabase não inicializado corretamente.');
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        if (typeof window !== 'undefined' && window.opener) {
          window.close();
          return;
        }
        await handleUserRole(session.user);
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setUser(null);
        setLoading(false);
        if (!window.location.pathname.includes('/login')) {
          router.push('/login');
        }
      }
    });

    const checkInitialSession = async () => {
      try {
        setLoadingStep('Verificando sessão ativa...');

        if (typeof window !== 'undefined' && window.localStorage.getItem(CLIENT_PORTAL_CLOSE_LOGOUT_KEY) === '1') {
          window.localStorage.removeItem(CLIENT_PORTAL_CLOSE_LOGOUT_KEY);
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setLoading(false);
            router.push('/login');
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('DashboardLayout: Erro em getSession:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user) {
          if (typeof window !== 'undefined' && window.opener) {
            window.close();
            return;
          }
          await handleUserRole(session.user);
        } else if (mounted) {
          setLoading(false);
          if (!window.location.pathname.includes('/login')) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('DashboardLayout: Erro fatal em checkInitialSession:', error);
        if (mounted) setLoading(false);
      }
    };

    checkInitialSession();

    const timer = setTimeout(() => {
      if (mounted) {
        setLoadingStep('O carregamento está demorando mais que o esperado. Tente limpar o cache.');
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [pathname, router]);

  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-2">Configuração Pendente</h2>
        <p className="text-slate-400 text-sm mb-6">
          As variáveis de ambiente do Supabase não foram detectadas. <br />
          Por favor, configure <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> nas configurações do projeto.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="bg-[#d4ff3f] text-[#0a0a0a] px-6 py-3 rounded-xl text-[10px] uppercase font-black"
        >
          Voltar ao Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 fixed inset-0 z-[99999]">
        <div className="flex flex-col items-center gap-6 max-w-md w-full text-center relative z-[99999]">
          <Loader2 className="w-12 h-12 text-[#d4ff3f] animate-spin" />
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Verificando sua sessão...</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{loadingStep}</p>
          </div>

          {storageBlocked && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={24} />
              <p className="text-center">
                O acesso ao armazenamento local está bloqueado. <br />
                Isso impedirá o funcionamento da sessão em iframes. <br />
                Tente abrir em uma nova aba.
              </p>
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] uppercase font-black"
              >
                Abrir em Nova Aba
              </button>
            </div>
          )}

          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-[#d4ff3f] animate-pulse w-full"></div>
          </div>

          <p className="text-slate-600 text-[8px] font-bold uppercase tracking-widest leading-relaxed mt-4">
            Se o carregamento travar, tente limpar o cache do navegador ou abrir em uma nova aba.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const errorParam = searchParams?.get('error');
    const errorDesc = searchParams?.get('error_description');

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-8 p-6">
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

  const isHubPage = pathname === '/dashboard';
  const activeModule = findModuleByPath(pathname);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-[38rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,255,63,0.16),_transparent_58%)]" />
        <div className="absolute right-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[10%] h-[22rem] w-[22rem] rounded-full bg-lime-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_35%,rgba(212,255,63,0.02)_100%)]" />
      </div>

      {!isHubPage && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between p-4">
          <Link
            href="/dashboard"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-[#081120]/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-lime-200 shadow-[0_0_30px_rgba(212,255,63,0.1)] backdrop-blur-xl transition hover:border-lime-300/40 hover:text-[#d4ff3f]"
          >
            <House size={14} />
            Voltar ao Início
          </Link>

          {activeModule && (
            <div className="hidden rounded-full border border-white/10 bg-[#081120]/78 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300 backdrop-blur-xl sm:block">
              {activeModule.title}
            </div>
          )}
        </div>
      )}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className={isHubPage ? 'flex-1' : 'flex-1 pt-20'}>
          {children}
        </div>
      </main>

      <InternalChat />
    </div>
  );
}
