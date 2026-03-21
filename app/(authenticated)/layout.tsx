'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string; id: string; user_metadata?: { role?: string } } | null>(null);
  const userRef = React.useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUserRole = async (userData: any) => {
      if (!mounted) return;
      
      try {
        const userEmail = (
          userData.email || 
          userData.user_metadata?.email || 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (userData as any).app_metadata?.email ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (userData as any).identities?.[0]?.identity_data?.email ||
          ''
        ).toLowerCase().trim();

        console.log('DashboardLayout: Processando papel do usuário:', userEmail, userData.user_metadata);
        
        // Force Administrator role for the main admin email in local state immediately
        if (userEmail === 'lucabaggio28@gmail.com') {
          const forcedUser = { 
            ...userData, 
            user_metadata: { 
              ...(userData.user_metadata || {}), 
              role: 'Administrador' 
            } 
          };
          setUser(forcedUser);
          
          // Auto-fix role for the main admin email if missing in metadata (sync with Supabase)
          if (userData.user_metadata?.role !== 'Administrador') {
            console.log('Auto-atribuindo papel de Administrador para:', userEmail);
            const { error: updateError } = await supabase.auth.updateUser({
              data: { role: 'Administrador' }
            });
            if (!updateError) {
              console.log('Papel de Administrador sincronizado com o perfil!');
              await supabase.auth.refreshSession();
            }
          }
          setLoading(false);
        } else {
          setUser(userData);
          if (userData.user_metadata?.role === 'Cliente') {
            const { data: projectData, error: projectError } = await supabase
              .from('projetos')
              .select('id')
              .eq('cliente_id', userData.id)
              .limit(1)
              .single();
            
            if (projectData) {
              router.push(`/client/rdo/${projectData.id}`);
              setLoading(false);
            } else {
              console.warn('Cliente sem projeto vinculado:', userData.id, projectError);
              if (projectError && projectError.code === 'PGRST116') {
                await supabase.auth.signOut();
                router.push('/login');
              } else {
                setLoading(false);
              }
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
        console.log('Sincronizando tokens do Google...');
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

    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase?.auth?.onAuthStateChange) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed event:', event, 'Session:', !!session);
        if (mounted && session?.user) {
          console.log('Sessão detectada via onAuthStateChange para:', session.user.email);
          if (timeoutId) clearTimeout(timeoutId);
          await handleUserRole(session.user);
          await syncGoogleTokens();
        } else if (mounted && event === 'SIGNED_OUT') {
          console.log('DashboardLayout: Evento SIGNED_OUT detectado');
          // Only redirect if we were previously logged in or if we are absolutely sure
          // This prevents accidental redirects on initialization if session is null
          setUser(null);
          router.push('/login');
        }
      });
      subscription = data.subscription;
    } else {
      console.error('ERRO CRÍTICO: supabase.auth.onAuthStateChange não é uma função!');
      // Tentar fallback ou logar chaves para diagnóstico
      console.log('Chaves disponíveis em supabase.auth:', Object.keys(supabase?.auth || {}));
    }

    // Initial check
    const checkInitialSession = async () => {
      console.log('Iniciando checkInitialSession...');
      console.log('URL no checkInitialSession:', window.location.href);

      // Check if localStorage is accessible
      try {
        const testKey = 'sb-test-storage-check';
        localStorage.setItem(testKey, 'ok');
        localStorage.removeItem(testKey);
        console.log('DashboardLayout: LocalStorage acessível');
      } catch (e) {
        console.error('DashboardLayout: LocalStorage BLOQUEADO ou INDISPONÍVEL:', e);
        // If storage is blocked, we might not be able to persist session
        // We should warn the user or at least log it
      }

      if (!supabase?.auth?.getSession) {
        console.error('ERRO CRÍTICO: supabase.auth.getSession não é uma função!');
        router.push('/login');
        return;
      }

      // Check if we have a hash (OAuth redirect)
      const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : '';
      const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');
      
      if (errorParam) {
        console.error('Erro de autenticação detectado na URL:', errorParam, errorDesc);
        setLoading(false);
        return;
      }

      const hasHash = hash.includes('access_token') || searchParams.has('code');
      
      if (hasHash) {
        console.log('Hash/Código de acesso detectado, aguardando processamento do Supabase...');
        
        // Manual hash parsing fallback if Supabase is slow
        if (hash.includes('access_token')) {
          try {
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
              console.log('Tentando setSession manual com dados do hash...');
              const { data: { session: manualSession } } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              if (manualSession?.user) {
                console.log('Sessão manual estabelecida para:', manualSession.user.email);
                await handleUserRole(manualSession.user);
                await syncGoogleTokens();
                return;
              }
            }
          } catch (e) {
            console.error('Erro no parsing manual do hash:', e);
          }
        }

        // Manual code exchange attempt if Supabase is slow and it's a code flow
        const code = searchParams.get('code');
        if (code) {
          console.log('Código detectado na URL, tentando exchange manual...');
          try {
            const { data: { session: exchangeSession }, error: exchangeError } = await supabase.auth.getSession();
            if (exchangeSession?.user) {
              console.log('Exchange de código bem sucedido via getSession!');
              await handleUserRole(exchangeSession.user);
              await syncGoogleTokens();
              return;
            }
            if (exchangeError) console.error('Erro no exchange via getSession:', exchangeError.message);
          } catch (e) {
            console.error('Erro ao tentar exchange manual:', e);
          }
        }
      }

      // Use getSession() as it triggers the hash parsing
      // We try a few times before giving up, to handle storage load delays
      let sessionFound = false;
      for (let i = 0; i < 4; i++) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          console.log(`Sessão inicial encontrada na tentativa ${i + 1} para:`, session.user.email);
          await handleUserRole(session.user);
          await syncGoogleTokens();
          sessionFound = true;
          break;
        }
        if (sessionError) console.warn(`Tentativa ${i + 1}: Erro ao buscar sessão inicial:`, sessionError.message);
        if (i < 3) await new Promise(resolve => setTimeout(resolve, 800)); // Wait a bit between retries
      }
      
      if (!sessionFound) {
        console.log('Nenhuma sessão inicial encontrada após retries. Aguardando processamento do hash ou onAuthStateChange...');
        
        // Fallback: If we have a hash but no session, maybe Supabase is stuck.
        // We wait for onAuthStateChange to fire SIGNED_IN.
        
        timeoutId = setTimeout(async () => {
          if (!mounted) return;
          console.log('Tentando buscar sessão novamente após timeout estendido...');
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (!retrySession) {
            // Last attempt: check for user directly
            const { data: { user: lastUser } } = await supabase.auth.getUser();
            if (lastUser) {
              console.log('Usuário encontrado via getUser() no último suspiro:', lastUser.email);
              await handleUserRole(lastUser);
              await syncGoogleTokens();
              return;
            }
            
            // If still nothing and we have a hash, maybe we should try to refresh the page?
            if (hasHash) {
              console.warn('Hash detectado mas nenhuma sessão encontrada. Tentando recarregar a página...');
              setLoading(false); // Stop loading to show the manual button
              return;
            }

            console.log('Nenhuma sessão encontrada após timeout estendido, redirecionando para login.');
            // Only redirect if we are absolutely sure there's no session
            // and we haven't received a SIGNED_IN event in the meantime
            if (mounted && !userRef.current) {
              router.push('/login');
            }
          } else {
            console.log('Sessão encontrada após retry para:', retrySession.user.email);
            await handleUserRole(retrySession.user);
            await syncGoogleTokens();
          }
        }, hasHash ? 20000 : 12000); // Wait even longer if we have a hash/code
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, [router]);

  const banner = (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest text-center py-1 shadow-lg pointer-events-none">
      VERSÃO: 20260321-0225 | REFRESH: F5 ESTÁVEL | STORAGE: V4
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
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-6">
        {children}
      </main>
    </div>
  );
}
