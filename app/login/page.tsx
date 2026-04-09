'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const router = useRouter();

  const banner = (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest text-center py-1 shadow-2xl pointer-events-none">
      VERSÃO: 20260326-2358 | REFRESH: F5 ESTÁVEL | CALLBACK: ATIVO
    </div>
  );

  useEffect(() => {
    // Check if localStorage is available
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
    } catch {
      console.warn('LocalStorage is blocked. This will prevent session persistence in iframes.');
      setStorageBlocked(true);
    }

    // Check for errors in URL (common in OAuth redirects)
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error_description') || searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    const checkUser = async () => {
      console.log('LoginPage: Verificando sessão inicial...');
      
      if (!supabase || !supabase.auth) {
        console.error('LoginPage: Supabase ou Supabase.auth não disponível');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('LoginPage: Resultado getSession:', { hasSession: !!session, error });
        
        if (error) {
          console.error('LoginPage: Erro ao verificar sessão:', error);
          setError(`Erro de conexão com Supabase: ${error.message}`);
        }
        
        if (session?.user) {
          console.log('LoginPage: Usuário já logado:', session.user.email);
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('LoginPage: Exceção em checkUser:', err);
        setError('Falha crítica ao conectar com o servidor de autenticação.');
      }
    };
    checkUser();

    // Listener para mensagens do popup de login
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        console.log('LoginPage: Mensagem SUPABASE_AUTH_SUCCESS recebida do popup');
        router.push('/dashboard');
      }
    };
    window.addEventListener('message', handleMessage);

    let subscription: any;
    if (supabase && supabase.auth) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('LoginPage: Login detectado via onAuthStateChange, redirecionando...');
          router.push('/dashboard');
        }
      });
      subscription = data.subscription;
    }

    // Load remembered email
    try {
      const rememberedEmail = localStorage.getItem('remembered_email');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('Could not load remembered email:', e);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, [router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginPage: handleLogin disparado');
    setLoading(true);
    setError(null);

    try {
      console.log('LoginPage: Tentativa de login iniciada:', { email });
      
      if (!supabase || !supabase.auth) {
        console.error('LoginPage: Supabase não disponível no handleLogin');
        throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      // 1. Check for hardcoded Admin (Only if explicitly enabled via env, otherwise skip)
      if (email === 'admin@buildflow.com' && password === '123456') {
        setError('Por favor, use o login oficial do Google para acessar como Administrador.');
        setLoading(false);
        return;
      }

      console.log('Tentando login via Supabase...');
      // 2. Try Supabase login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Erro na autenticação Supabase:', authError);
        throw new Error(authError.message);
      }

      console.log('Login Supabase bem-sucedido:', data.user?.id);
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      const userRole = data.user?.user_metadata?.role;
      if (userRole === 'Cliente') {
        // Fetch the project linked to this client
        const { data: projectData } = await supabase
          .from('projetos')
          .select('id')
          .eq('cliente_id', data.user.id)
          .limit(1)
          .single();
        
        if (projectData) {
          router.push(`/client/rdo/${projectData.id}`);
        } else {
          // If no project linked, maybe show a message or just go to dashboard (which will likely deny access)
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando Google Login...');
      
      if (!supabase || !supabase.auth) {
        throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      // Open popup immediately to avoid popup blocker
      const popup = window.open('', 'oauth_popup', 'width=600,height=700');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file'
        }
      });

      if (error) {
        if (popup) popup.close();
        throw error;
      }

      if (data?.url && popup) {
        popup.location.href = data.url;
      } else if (!popup) {
        throw new Error('O navegador bloqueou a janela de login. Por favor, permita popups para este site.');
      }
      
      // We don't set loading to false here because we're waiting for the popup to complete
      // and trigger the onAuthStateChange listener
    } catch (err) {
      console.error('Erro Google Login:', err);
      let message = 'Erro ao conectar com Google';
      
      // Robust error parsing
      const errorObj = err as { message?: string; msg?: string };
      const errorMessage = errorObj?.message || errorObj?.msg || (typeof err === 'string' ? err : '');
      
      if (errorMessage.toLowerCase().includes('provider is not enabled')) {
        message = 'Atenção: O login via Google não está ativado no seu painel do Supabase. Você precisa ir em Authentication > Providers > Google e ativar (Enabled) usando seu Client ID e Secret.';
      } else if (errorMessage) {
        message = errorMessage;
      }
      
      setError(message);
      setLoading(false);
    }
  };

  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const maskedUrl = supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Não configurado';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      {banner}
      <div className="w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        
        {!isSupabaseConfigured && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={48} className="text-rose-500 mb-4" />
            <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-2">Configuração Pendente</h2>
            <p className="text-slate-400 text-sm mb-6">
              As variáveis de ambiente do Supabase não foram detectadas no cliente. <br />
              Certifique-se de que configurou <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> no menu de Configurações (ícone de engrenagem) e <strong>REINICIOU O SERVIDOR</strong>.
            </p>
            <div className="bg-slate-900 p-4 rounded-xl text-left w-full overflow-x-auto mb-4">
              <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Estado Atual:</p>
              <code className="text-[10px] text-emerald-500 font-mono">
                URL: {maskedUrl}<br />
                KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada (Oculta)' : 'Não configurada'}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#d4ff3f] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#c4ef2f] transition-all"
            >
              Recarregar Página
            </button>
          </div>
        )}

        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 size-48 bg-[#d4ff3f]/5 blur-[100px] rounded-full" />
        
        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="size-28 flex items-center justify-center overflow-hidden mb-6 relative group">
            <div className="absolute inset-0 bg-[#d4ff3f]/10 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
            <Image 
              src="https://github.com/baggiocrm-git/imagens/blob/main/LOGO%20CBSL_sem%20escrita_Pequeno.png?raw=true" 
              alt="Logo" 
              fill
              sizes="112px"
              className="object-contain relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">CBSL <span className="text-[#d4ff3f]">ERP</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-center">Gestão de Engenharia e Construção</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          {storageBlocked && (
            <div className="bg-rose-500 border-2 border-rose-600 rounded-3xl p-6 flex flex-col items-center text-center gap-4 animate-bounce shadow-2xl shadow-rose-500/20">
              <AlertCircle size={40} className="text-white" />
              <div className="space-y-2">
                <h3 className="text-white font-black uppercase tracking-tighter text-lg">Ação Necessária!</h3>
                <p className="text-white/90 text-xs font-bold leading-relaxed">
                  O login do Google não funciona dentro desta janela de visualização por restrições de segurança do navegador.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full bg-white text-rose-600 px-6 py-4 rounded-2xl uppercase font-black text-xs hover:bg-slate-100 transition-all shadow-lg active:scale-95"
              >
                Clique aqui para abrir em nova aba
              </button>
            </div>
          )}

          {!storageBlocked && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário / E-mail</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#d4ff3f] transition-colors" size={20} />
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 transition-all outline-none placeholder:text-slate-700"
                    placeholder="nome@empresa.com ou Admin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#d4ff3f] transition-colors" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 transition-all outline-none placeholder:text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest px-1">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-[#0a0a0a] text-[#d4ff3f] focus:ring-0 focus:ring-offset-0" 
                  />
                  Lembrar
                </label>
                <a href="#" className="text-slate-500 hover:text-[#d4ff3f] transition-colors">Recuperar Senha</a>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#d4ff3f] hover:bg-[#c4ef2f] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-black text-xs uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#d4ff3f]/10 group mt-4 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    ACESSAR SISTEMA
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="pt-6 border-t border-slate-800/50 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle size={14} />
                  LIMPAR TUDO E RECARREGAR
                </button>
                <p className="text-slate-600 text-[8px] text-center mt-3 uppercase font-black tracking-widest opacity-50">
                  Use este botão se o sistema estiver travado em uma versão antiga
                </p>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/50"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="bg-[#1a1a1a] px-4 text-slate-600">Ou entrar com</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-[#0a0a0a] font-black text-xs uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-white/5 group"
              >
                <Image 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  width={18} 
                  height={18} 
                  className="transition-all"
                />
                Entrar com Google Account
              </button>

              <div className="pt-6 flex flex-col gap-4 items-center">
                <button 
                  type="button"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    // Clear all cookies
                    document.cookie.split(";").forEach(function(c) { 
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                    window.location.reload();
                  }}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest py-3 rounded-2xl transition-all border border-rose-500/20"
                >
                  LIMPAR TUDO E RECARREGAR (F5 FORÇADO)
                </button>
                <p className="text-slate-700 text-[8px] font-bold uppercase tracking-widest">
                  Use este botão se o login falhar após F5
                </p>
              </div>
            </>
          )}
        </form>

        <div className="mt-10 pt-8 border-t border-slate-800/50 text-center relative z-10">
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">
            © 2026 Baggio Silveira
          </p>
        </div>
      </div>
    </div>
  );
}
