'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Moon, 
  Sun, 
  Type, 
  Bell, 
  Shield, 
  Save, 
  Camera,
  Check,
  ChevronRight,
  Monitor,
  Database,
  Copy,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: 'Usuário',
    phone: ''
  });

  // Load settings and user from Supabase
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    const savedFontSize = localStorage.getItem('app-font-size') || 'medium';
    setTheme(savedTheme);
    setFontSize(savedFontSize);
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${savedFontSize}`);

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setProfile({
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          role: user.user_metadata?.role || 'Usuário',
          phone: user.user_metadata?.phone || ''
        });
      }
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Update user metadata in Supabase
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profile.fullName,
        role: profile.role,
        phone: profile.phone
      }
    });

    if (error) {
      console.error('Error updating profile:', error);
    }

    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-font-size', fontSize);
    
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${fontSize}`);
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'appearance', name: 'Aparência', icon: Monitor },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'database', name: 'Banco de Dados', icon: Database },
  ];

  const userInitials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <header className="p-8 border-b border-slate-800/50">
        <h1 className="text-4xl font-black tracking-tight italic">
          Configurações <span className="text-[#d4ff3f]">do Sistema</span>
        </h1>
        <p className="text-slate-500 text-xs font-bold mt-1">Gerencie suas preferências e informações de conta</p>
      </header>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                  activeTab === tab.id 
                    ? "bg-[#1a1a1a] text-[#d4ff3f] shadow-lg shadow-black/20 border border-slate-800/50" 
                    : "text-slate-500 hover:bg-[#1a1a1a] hover:text-white"
                )}
              >
                <tab.icon size={18} />
                {tab.name}
                {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden">
            <div className="p-8">
              {activeTab === 'profile' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="size-24 rounded-full bg-[#d4ff3f] flex items-center justify-center text-[#0a0a0a] font-black text-3xl shadow-xl shadow-[#d4ff3f]/10">
                        {userInitials}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-[#0a0a0a] border border-slate-800 rounded-full text-[#d4ff3f] hover:scale-110 transition-transform">
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{profile.fullName || 'Usuário'}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{profile.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-slate-500 font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo</label>
                      <input 
                        type="text"
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                      <input 
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Monitor size={20} className="text-[#d4ff3f]" />
                      Tema do Sistema
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'light', name: 'Claro', icon: Sun },
                        { id: 'dark', name: 'Escuro', icon: Moon },
                        { id: 'system', name: 'Sistema', icon: Monitor },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
                            theme === t.id 
                              ? "bg-[#0a0a0a] border-[#d4ff3f] text-[#d4ff3f]" 
                              : "bg-[#0a0a0a] border-slate-800/50 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          <t.icon size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Type size={20} className="text-[#d4ff3f]" />
                      Tamanho da Fonte
                    </h3>
                    <div className="flex items-center gap-4 bg-[#0a0a0a] p-2 rounded-2xl border border-slate-800/50 w-fit">
                      {[
                        { id: 'small', name: 'Pequeno' },
                        { id: 'medium', name: 'Médio' },
                        { id: 'large', name: 'Grande' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setFontSize(s.id)}
                          className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                            fontSize === s.id 
                              ? "bg-[#1a1a1a] text-[#d4ff3f] shadow-lg" 
                              : "text-slate-500 hover:text-white"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter ml-1">
                      Ajuste o tamanho do texto para melhor legibilidade em todo o sistema.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-6">
                    <Bell size={20} className="text-[#d4ff3f]" />
                    Preferências de Notificação
                  </h3>
                  {[
                    { title: 'E-mails de Resumo', desc: 'Receba um resumo diário das atividades financeiras.' },
                    { title: 'Alertas de Vencimento', desc: 'Notificações sobre contas a pagar e receber próximas do vencimento.' },
                    { title: 'Novos Projetos', desc: 'Seja avisado quando um novo projeto for criado.' },
                    { title: 'Atualizações de Equipe', desc: 'Notificações sobre mudanças na equipe ou novos membros.' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/30">
                      <div>
                        <p className="text-sm font-black tracking-tight">{item.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.desc}</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={idx < 2} />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4ff3f]"></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-6">
                    <Shield size={20} className="text-[#d4ff3f]" />
                    Segurança da Conta
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 space-y-4">
                      <p className="text-sm font-black">Alterar Senha</p>
                      <div className="space-y-4">
                        <input 
                          type="password"
                          placeholder="Senha Atual"
                          className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                        />
                        <input 
                          type="password"
                          placeholder="Nova Senha"
                          className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                        />
                        <button className="px-6 py-2.5 bg-[#d4ff3f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all">
                          Atualizar Senha
                        </button>
                      </div>
                    </div>

                    <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black">Autenticação em Duas Etapas</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Adicione uma camada extra de segurança à sua conta.</p>
                      </div>
                      <button className="px-4 py-2 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1a1a1a] transition-all">
                        Configurar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'database' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-2">
                      <Database size={20} className="text-[#d4ff3f]" />
                      Configuração do Banco de Dados
                    </h3>
                    <a 
                      href="https://supabase.com/dashboard/project/_/sql" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] flex items-center gap-1 hover:underline"
                    >
                      Abrir Editor SQL <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-black">Script SQL: Contas a Receber</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Copie e execute o script abaixo no SQL Editor do seu painel Supabase para criar a tabela necessária.
                      </p>
                    </div>
                    
                    <div className="relative group">
                      <pre className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.contas_receber (
    id TEXT PRIMARY KEY,
    cliente TEXT NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_recebido DECIMAL(12,2) NOT NULL DEFAULT 0,
    situacao TEXT NOT NULL CHECK (situacao IN ('Aberto', 'Recebido', 'Em andamento')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON public.contas_receber
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);`}
                      </pre>
                      <button 
                        onClick={() => {
                          const sql = `CREATE TABLE IF NOT EXISTS public.contas_receber (
    id TEXT PRIMARY KEY,
    cliente TEXT NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_recebido DECIMAL(12,2) NOT NULL DEFAULT 0,
    situacao TEXT NOT NULL CHECK (situacao IN ('Aberto', 'Recebido', 'Em andamento')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON public.contas_receber
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          alert('Script SQL copiado para a área de transferência!');
                        }}
                        className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border border-slate-800 rounded-lg text-slate-500 hover:text-[#d4ff3f] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-black">Script SQL: Contas a Pagar</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Copie e execute o script abaixo para criar a tabela de Contas a Pagar.
                      </p>
                    </div>
                    
                    <div className="relative group">
                      <pre className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.contas_pagar (
    id TEXT PRIMARY KEY,
    fornecedor TEXT NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
    situacao TEXT NOT NULL CHECK (situacao IN ('Aberto', 'Pago', 'Em andamento')),
    projeto_id UUID REFERENCES public.projetos(id),
    categoria_custo TEXT,
    etapa_obra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON public.contas_pagar
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);`}
                      </pre>
                      <button 
                        onClick={() => {
                          const sql = `CREATE TABLE IF NOT EXISTS public.contas_pagar (
    id TEXT PRIMARY KEY,
    fornecedor TEXT NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
    situacao TEXT NOT NULL CHECK (situacao IN ('Aberto', 'Pago', 'Em andamento')),
    projeto_id UUID REFERENCES public.projetos(id),
    categoria_custo TEXT,
    etapa_obra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON public.contas_pagar
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          alert('Script SQL copiado para a área de transferência!');
                        }}
                        className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border border-slate-800 rounded-lg text-slate-500 hover:text-[#d4ff3f] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="p-4 bg-[#d4ff3f]/5 border border-[#d4ff3f]/20 rounded-xl flex items-start gap-4">
                      <AlertCircle size={18} className="text-[#d4ff3f] mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">Atenção</p>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                          Após executar o script, a página de Contas a Receber estará totalmente funcional e sincronizada com seu banco de dados.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-[#0a0a0a] border-t border-slate-800/50 flex items-center justify-between">
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Última alteração: Hoje às 14:32
              </p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setTheme('dark');
                    setFontSize('medium');
                  }}
                  className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#1a1a1a] transition-all"
                >
                  Restaurar Padrões
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-[#d4ff3f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Save size={16} />
                    </motion.div>
                  ) : showSuccess ? (
                    <Check size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {showSuccess ? 'Salvo!' : isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
