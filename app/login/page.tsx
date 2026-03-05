'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
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
      // 1. Check for hardcoded Admin
      if ((email === 'Admin' || email === 'admin@buildflow.com') && password === '123456') {
        router.push('/dashboard');
        return;
      }

      // 2. Try Supabase login
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101822] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a2430] border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/20">
            <HardHat size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">BuildFlow CRM</h1>
          <p className="text-slate-400 text-sm mt-1 text-center">Sistema de Gestão de Engenharia e Construção</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-500 text-sm"
            >
              <AlertCircle size={18} />
              <p>{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Endereço de E-mail</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#101822] border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                placeholder="nome@empresa.com ou Admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#101822] border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-800 bg-[#101822] text-blue-600 focus:ring-0" />
              Lembrar de mim
            </label>
            <a href="#" className="text-blue-500 hover:underline font-medium">Esqueceu a senha?</a>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 group"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs">
            © 2024 BuildFlow Engineering CRM. Todos os direitos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
