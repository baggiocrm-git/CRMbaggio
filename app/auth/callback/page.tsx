'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      console.log('AuthCallbackPage: Iniciando processamento de autenticação...');
      
      try {
        const url = new URL(window.location.href);
        const authCode = url.searchParams.get('code');

        if (authCode) {
          console.log('AuthCallbackPage: Código OAuth detectado, trocando por sessão...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);

          if (exchangeError) {
            console.error('AuthCallbackPage: Erro ao trocar código por sessão:', exchangeError.message);
            router.push('/login?error=' + encodeURIComponent(exchangeError.message));
            return;
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthCallbackPage: Erro ao obter sessão:', error.message);
          router.push('/login?error=' + encodeURIComponent(error.message));
          return;
        }

        if (session) {
          console.log('AuthCallbackPage: Sessão encontrada para:', session.user.email);
          
          if (typeof window !== 'undefined' && window.opener) {
            console.log('AuthCallbackPage: Detectado como popup, enviando mensagem e fechando...');
            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
            // Small delay to ensure message is sent before closing
            setTimeout(() => window.close(), 500);
          } else {
            console.log('AuthCallbackPage: Redirecionando para dashboard...');
            router.push('/dashboard');
          }
        } else {
          console.warn('AuthCallbackPage: Nenhuma sessão encontrada após o callback.');
          // Wait a bit and try again, or redirect to login
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } catch (err) {
        console.error('AuthCallbackPage: Erro fatal:', err);
        router.push('/login?error=fatal_error');
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs w-full">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-800 rounded-full mx-auto"></div>
          <div className="w-16 h-16 border-4 border-[#d4ff3f] border-t-transparent rounded-full animate-spin mx-auto absolute inset-0"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-white text-lg font-black uppercase tracking-tighter">Autenticando...</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Finalizando sua conexão com o sistema. <br />
            Esta janela fechará automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
