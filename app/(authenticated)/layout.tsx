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
  const [loadingStep, setLoadingStep] = useState('Iniciando...');
  const [user, setUser] = useState<User | null>(null);
  const userRef = React.useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  React.useLayoutEffect(() => {
    setLoadingStep('Iniciando verificação...');
  }, []);

  const [storageBlocked, setStorageBlocked] = useState(false);

  useEffect(() => {
    // Check if localStorage is available
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
    console.log('DashboardLayout: useEffect started');
    let mounted = true;
    setLoadingStep('Iniciando verificação...');

    const handleUserRole = async (userData: User) => {
      if (!mounted) return;
      console.log('DashboardLayout: handleUserRole para:', userData.email);
      setLoadingStep(`Processando usuário: ${userData.email}`);
      
      try {
        const rawEmail = (
          userData.email || 
          userData.user_metadata?.email || 
          (userData as any).app_metadata?.email ||
          (userData as any).identities?.[0]?.identity_data?.email ||
          ''
        );
        
        const userEmail = rawEmail.toLowerCase().trim();
        console.log('DashboardLayout: Email processado:', userEmail);
        
        if (userEmail === 'lucabaggio28@gmail.com') {
          setLoadingStep('Configurando acesso administrativo...');
          console.log('DashboardLayout: Forçando admin para lucabaggio28');
          const forcedUser = { 
            ...userData, 
            user_metadata: { ...(userData.user_metadata || {}), role: 'Administrador' } 
          };
          setUser(forcedUser);
          setLoading(false);

          if (userData.user_metadata?.role !== 'Administrador') {
            console.log('DashboardLayout: Atualizando role no Supabase...');
            await supabase.auth.updateUser({ data: { role: 'Administrador' } });
            await supabase.auth.refreshSession();
          }
        } else {
          setUser(userData);
          const role = userData.user_metadata?.role;
          console.log('DashboardLayout: Papel do usuário:', role);

          if (role === 'Cliente') {
            setLoadingStep('Buscando projeto do cliente...');
            console.log('DashboardLayout: Iniciando busca de projeto...');
            
            // Add a safety timeout for the query
            const projectPromise = supabase
              .from('projetos')
              .select('id')
              .eq('cliente_id', userData.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao buscar projeto')), 5000)
            );

            try {
              const { data: projectData, error: projectError } = await Promise.race([projectPromise, timeoutPromise]) as any;
              
              if (projectError) {
                console.error('Erro ao buscar projeto do cliente:', projectError);
                setLoadingStep('Erro ao buscar projeto. Continuando...');
              }

              if (projectData) {
                console.log('DashboardLayout: Redirecionando cliente para RDO:', projectData.id);
                router.push(`/client/rdo/${projectData.id}`);
              } else {
                console.log('DashboardLayout: Nenhum projeto encontrado para o cliente.');
                setLoading(false);
              }
            } catch (err) {
              console.warn('DashboardLayout: Query de projeto falhou ou timeout:', err);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('DashboardLayout: Erro em handleUserRole:', e);
        setLoading(false);
      }
    };

    // 1. Set up listener
    console.log('DashboardLayout: Setting up auth listener');
    setLoadingStep('Conectando ao Supabase Auth...');
    
    if (!supabase?.auth) {
      console.error('DashboardLayout: supabase.auth não disponível');
      setLoadingStep('Erro: Supabase não inicializado corretamente.');
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('DashboardLayout: Auth event:', event);
      if (!mounted) return;

      if (session?.user) {
        if (typeof window !== 'undefined' && window.opener) {
          console.log('DashboardLayout: Fechando popup de login...');
          window.close();
          return;
        }
        await handleUserRole(session.user);
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        console.log('DashboardLayout: Sem sessão ou deslogado');
        setUser(null);
        setLoading(false);
        if (!window.location.pathname.includes('/login')) {
          router.push('/login');
        }
      }
    });

    // 2. Initial check as fallback
    const checkInitialSession = async () => {
      try {
        console.log('DashboardLayout: Iniciando checkInitialSession');
        setLoadingStep('Verificando sessão ativa...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('DashboardLayout: Erro em getSession:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('DashboardLayout: Sessão encontrada em checkInitialSession');
          if (typeof window !== 'undefined' && window.opener) {
            console.log('DashboardLayout: Fechando popup de login...');
            window.close();
            return;
          }
          await handleUserRole(session.user);
        } else {
          console.log('DashboardLayout: Nenhuma sessão em checkInitialSession');
          if (mounted) {
            setLoading(false);
            if (!window.location.pathname.includes('/login')) {
              router.push('/login');
            }
          }
        }
      } catch (err) {
        console.error('DashboardLayout: Erro fatal em checkInitialSession:', err);
        if (mounted) setLoading(false);
      }
    };

    checkInitialSession();

    // 3. Safety timeout
    const timer = setTimeout(() => {
      if (mounted) {
        setLoadingStep('O carregamento está demorando mais que o esperado. Tente limpar o cache.');
      }
    }, 10000);

    return () => {
      console.log('DashboardLayout: Unmount');
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  const banner = (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest text-center py-1 shadow-lg pointer-events-none">
      VERSÃO: 20260326-2358 | REFRESH: F5 ESTÁVEL | CALLBACK: ATIVO
    </div>
  );

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
        {banner}
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

          <div className="pt-8 space-y-4 w-full">
            <button 
              type="button"
              onClick={() => {
                console.log('DashboardLayout: Force reload clicked');
                window.location.reload(true);
              }}
              className="w-full bg-[#d4ff3f] text-[#0a0a0a] font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-[#c4ef2f] transition-all active:scale-95"
            >
              Forçar Recarregamento (F5)
            </button>
            
            <button 
              type="button"
              onClick={() => {
                console.log('DashboardLayout: Clear cache clicked');
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                  });
                } catch (e) {
                  console.error('Erro ao limpar cache:', e);
                }
                window.location.href = '/login';
              }}
              className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-rose-500/20 transition-all active:scale-95"
            >
              Limpar Cache e Ir para Login
            </button>

            <button 
              type="button"
              onClick={() => {
                console.log('DashboardLayout: Force dashboard clicked');
                setLoading(false);
              }}
              className="w-full bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-2xl hover:bg-slate-700 transition-all active:scale-95"
            >
              Pular Verificação (Apenas se Travado)
            </button>
          </div>

          <p className="text-slate-600 text-[8px] font-bold uppercase tracking-widest leading-relaxed mt-4">
            Se o carregamento travar, use os botões acima. <br />
            Isso pode ocorrer devido a restrições de cookies no navegador.
          </p>
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
      {banner}
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden pt-6">
        {children}
      </main>
    </div>
  );
}
