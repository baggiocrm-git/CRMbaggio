'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Moon, 
  Sun, 
  Type, 
  Bell, 
  Shield, 
  Save, 
  Camera,
  Check,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load settings from localStorage
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
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
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
    }, 800);
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'appearance', name: 'Aparência', icon: Monitor },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
  ];

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
                        MF
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-[#0a0a0a] border border-slate-800 rounded-full text-[#d4ff3f] hover:scale-110 transition-transform">
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Maria Fonseca</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Diretora Financeira</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        type="text"
                        defaultValue="Maria Fonseca"
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        type="email"
                        defaultValue="maria.fonseca@cbsl.com.br"
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo</label>
                      <input 
                        type="text"
                        defaultValue="Diretora Financeira"
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                      <input 
                        type="text"
                        defaultValue="+55 (11) 98877-6655"
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
