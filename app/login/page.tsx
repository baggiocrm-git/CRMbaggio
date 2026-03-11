'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('Admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Tentativa de login iniciada:', { email });
      
      // 1. Check for hardcoded Admin
      if ((email === 'Admin' || email === 'admin@buildflow.com') && password === '123456') {
        console.log('Login Admin detectado, redirecionando para /dashboard');
        window.location.href = '/dashboard';
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
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 size-48 bg-[#d4ff3f]/5 blur-[100px] rounded-full" />
        
        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="size-28 flex items-center justify-center overflow-hidden mb-6 relative group">
            <div className="absolute inset-0 bg-[#d4ff3f]/10 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
            <Image 
              src="https://github.com/baggiocrm-git/imagens/blob/main/LOGO%20CBSL_sem%20escrita_Pequeno.png?raw=true" 
              alt="Logo" 
              fill
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
              <input type="checkbox" className="rounded border-slate-800 bg-[#0a0a0a] text-[#d4ff3f] focus:ring-0 focus:ring-offset-0" />
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
