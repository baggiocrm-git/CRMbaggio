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
  AlertCircle,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type ThemeOption = 'light' | 'dark';
type FontSizeOption = 'small' | 'medium' | 'large';
type UserRole =
  | 'Administrador'
  | 'Usuário'
  | 'Cliente'
  | 'Auxiliar Administrativo Nível 1'
  | 'Auxiliar Administrativo Nível 2';

const USER_LEVEL_TABS = ['profile', 'appearance', 'security'] as const;
const SYSTEM_SETTINGS_COMPANY_KEY = 'company_profile';

function applyThemePreference(theme: ThemeOption) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');

  root.classList.add(theme);
}

function applyFontSizePreference(fontSize: FontSizeOption) {
  const root = document.documentElement;
  root.classList.remove('font-small', 'font-medium', 'font-large');
  root.classList.add(`font-${fontSize}`);
}

export default function SettingsPage() {
  const COMPANY_SETTINGS_STORAGE_KEY = 'system-company-settings';
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState<ThemeOption>('dark');
  const [fontSize, setFontSize] = useState<FontSizeOption>('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordCardOpen, setIsPasswordCardOpen] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: 'Usuário',
    phone: ''
  });
  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyPhone: '',
    companyCnpj: '',
    companyIe: '',
    companyEmail: '',
  });

  // Load settings and user from Supabase
  useEffect(() => {
    const savedTheme = (localStorage.getItem('app-theme') as ThemeOption | null) || 'dark';
    const savedFontSize = (localStorage.getItem('app-font-size') as FontSizeOption | null) || 'medium';
    const savedCompanySettings = localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
    setTheme(savedTheme);
    setFontSize(savedFontSize);
    if (savedCompanySettings) {
      try {
        const parsed = JSON.parse(savedCompanySettings) as Partial<typeof companySettings>;
        setCompanySettings({
          companyName: parsed.companyName || '',
          companyAddress: parsed.companyAddress || '',
          companyCity: parsed.companyCity || '',
          companyPhone: parsed.companyPhone || '',
          companyCnpj: parsed.companyCnpj || '',
          companyIe: parsed.companyIe || '',
          companyEmail: parsed.companyEmail || '',
        });
      } catch {
        // ignore invalid company settings
      }
    }
    
    applyThemePreference(savedTheme);
    applyFontSizePreference(savedFontSize);

    const loadCompanySettingsFromSupabase = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', SYSTEM_SETTINGS_COMPANY_KEY)
        .maybeSingle();

      if (error) {
        console.error('Error loading company settings from Supabase:', error);
        return;
      }

      const value = data?.value;
      if (!value || typeof value !== 'object') return;

      const parsed = value as Partial<typeof companySettings>;
      setCompanySettings((current) => ({
        companyName: parsed.companyName || current.companyName,
        companyAddress: parsed.companyAddress || current.companyAddress,
        companyCity: parsed.companyCity || current.companyCity,
        companyPhone: parsed.companyPhone || current.companyPhone,
        companyCnpj: parsed.companyCnpj || current.companyCnpj,
        companyIe: parsed.companyIe || current.companyIe,
        companyEmail: parsed.companyEmail || current.companyEmail,
      }));
    };

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
    void loadCompanySettingsFromSupabase();
    getUser();
  }, []);

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    applyFontSizePreference(fontSize);
  }, [fontSize]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Update user metadata in Supabase
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profile.fullName,
        phone: profile.phone
      }
    });

    if (error) {
      console.error('Error updating profile:', error);
    }

    const { error: companySettingsError } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: SYSTEM_SETTINGS_COMPANY_KEY,
          value: companySettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (companySettingsError) {
      console.error('Error saving company settings to Supabase:', companySettingsError);
      alert('Os dados da empresa não puderam ser salvos no Supabase. Rode a migração de configurações do sistema e tente novamente.');
      setIsSaving(false);
      return;
    }

    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-font-size', fontSize);
    localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(companySettings));

    applyThemePreference(theme);
    applyFontSizePreference(fontSize);
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      setPasswordFeedback('Preencha a senha atual, a nova senha e a confirmação.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordFeedback('A confirmação da nova senha não confere.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordFeedback(null);

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || profile.email;

      if (!userEmail) {
        throw new Error('Não foi possível identificar o e-mail da conta atual.');
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordForm.currentPassword,
      });

      if (verifyError) {
        throw new Error('A senha atual informada está incorreta.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordFeedback(null);
      setIsPasswordCardOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível atualizar a senha.';
      setPasswordFeedback(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'company', name: 'Empresa', icon: Building2 },
    { id: 'appearance', name: 'Aparência', icon: Monitor },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'database', name: 'Banco de Dados', icon: Database },
  ];

  const isUserLevelSettingsOnly =
    profile.role === 'Auxiliar Administrativo Nível 1' ||
    profile.role === 'Auxiliar Administrativo Nível 2' ||
    profile.role === 'Usuário';

  const visibleTabs = isUserLevelSettingsOnly
    ? tabs.filter((tab) => USER_LEVEL_TABS.includes(tab.id as (typeof USER_LEVEL_TABS)[number]))
    : tabs;

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('profile');
    }
  }, [activeTab, visibleTabs]);

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
            {visibleTabs.map((tab) => (
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Acesso</label>
                      <input 
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-slate-500 font-bold outline-none cursor-not-allowed"
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

              {activeTab === 'company' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Building2 size={20} className="text-[#d4ff3f]" />
                      Dados da Empresa
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      Informações institucionais usadas em documentos, recibos e relatórios do sistema
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
                      <input 
                        type="text"
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="Construtora Baggio Silveira Ltda."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço</label>
                      <input 
                        type="text"
                        value={companySettings.companyAddress}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyAddress: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="Rua, número, bairro, cidade, UF"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                      <input 
                        type="text"
                        value={companySettings.companyPhone}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyPhone: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="(11) 0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        type="email"
                        value={companySettings.companyEmail}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyEmail: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="contato@empresa.com.br"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CNPJ</label>
                      <input 
                        type="text"
                        value={companySettings.companyCnpj}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyCnpj: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IE</label>
                      <input 
                        type="text"
                        value={companySettings.companyIe}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyIe: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="Inscrição Estadual"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cidade / UF</label>
                      <input 
                        type="text"
                        value={companySettings.companyCity}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyCity: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 focus:border-[#d4ff3f]/50 outline-none transition-all"
                        placeholder="São Paulo - SP"
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
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as ThemeOption)}
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
                          onClick={() => setFontSize(s.id as FontSizeOption)}
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
                    {isPasswordCardOpen && (
                    <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-slate-800/30 space-y-4">
                      <p className="text-sm font-black">Alterar Senha</p>
                      <div className="space-y-4">
                        <div className="relative">
                          <input 
                            type={showPassword.current ? 'text' : 'password'}
                            placeholder="Senha Atual"
                            value={passwordForm.currentPassword}
                            onChange={(e) => {
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                              setPasswordFeedback(null);
                            }}
                            className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => ({ ...current, current: !current.current }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            title={showPassword.current ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showPassword.next ? 'text' : 'password'}
                            placeholder="Nova Senha"
                            value={passwordForm.newPassword}
                            onChange={(e) => {
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                              setPasswordFeedback(null);
                            }}
                            className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => ({ ...current, next: !current.next }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            title={showPassword.next ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showPassword.next ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showPassword.confirm ? 'text' : 'password'}
                            placeholder="Repetir Nova Senha"
                            value={passwordForm.confirmNewPassword}
                            onChange={(e) => {
                              setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value });
                              setPasswordFeedback(null);
                            }}
                            className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => ({ ...current, confirm: !current.confirm }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            title={showPassword.confirm ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {passwordFeedback && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {passwordFeedback}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={handlePasswordUpdate}
                          disabled={isUpdatingPassword}
                          className="px-6 py-2.5 bg-[#d4ff3f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all"
                        >
                          {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                        </button>
                      </div>
                    </div>
                    )}

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
                      <p className="text-sm font-black">Script SQL: Gestão de Documentos</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Execute este script para criar as tabelas de pastas, documentos e tokens do Google.
                      </p>
                    </div>
                    
                    <div className="relative group">
                      <pre className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.pastas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    parent_id UUID REFERENCES public.pastas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    "Categoria" TEXT NOT NULL,
    area TEXT,
    data DATE NOT NULL,
    pasta_id UUID REFERENCES public.pastas(id) ON DELETE SET NULL,
    file_path TEXT,
    tamanho_arquivo TEXT,
    tipo_arquivo TEXT,
    status TEXT DEFAULT 'Vigente',
    "Ano" TEXT,
    nome_icone TEXT DEFAULT 'FileText',
    classe_cor TEXT,
    classe_fundo TEXT,
    drive_file_id TEXT,
    "webViewLink" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentos' AND column_name='drive_file_id') THEN
        ALTER TABLE public.documentos ADD COLUMN drive_file_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentos' AND column_name='webViewLink') THEN
        ALTER TABLE public.documentos ADD COLUMN "webViewLink" TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.google_tokens (
    id INTEGER PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    expiry_date BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated" ON public.pastas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.google_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
                      </pre>
                      <button 
                        onClick={() => {
                          const sql = `CREATE TABLE IF NOT EXISTS public.pastas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    parent_id UUID REFERENCES public.pastas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    "Categoria" TEXT NOT NULL,
    area TEXT,
    data DATE NOT NULL,
    pasta_id UUID REFERENCES public.pastas(id) ON DELETE SET NULL,
    file_path TEXT,
    tamanho_arquivo TEXT,
    tipo_arquivo TEXT,
    status TEXT DEFAULT 'Vigente',
    "Ano" TEXT,
    nome_icone TEXT DEFAULT 'FileText',
    classe_cor TEXT,
    classe_fundo TEXT,
    drive_file_id TEXT,
    "webViewLink" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentos' AND column_name='drive_file_id') THEN
        ALTER TABLE public.documentos ADD COLUMN drive_file_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentos' AND column_name='webViewLink') THEN
        ALTER TABLE public.documentos ADD COLUMN "webViewLink" TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.google_tokens (
    id INTEGER PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    expiry_date BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated" ON public.pastas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.google_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          alert('Script SQL copiado!');
                        }}
                        className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border border-slate-800 rounded-lg text-slate-500 hover:text-[#d4ff3f] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

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
    centro_custo_tipo TEXT DEFAULT 'Obra',
    socio_id UUID REFERENCES public.equipe(id),
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
    centro_custo_tipo TEXT DEFAULT 'Obra',
    socio_id UUID REFERENCES public.equipe(id),
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

                    <div className="space-y-2">
                      <p className="text-sm font-black">Script SQL: R.H. (Equipe)</p>
                      <div className="relative group">
                        <pre className="p-4 bg-[#0a0a0a] border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto">
                          {`-- Adicionar colunas para cursos, documentos e dados complementares na tabela equipe
ALTER TABLE public.equipe 
ADD COLUMN IF NOT EXISTS cursos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documentos_anexos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS funcao TEXT,
ADD COLUMN IF NOT EXISTS data_admissao DATE,
ADD COLUMN IF NOT EXISTS data_demissao DATE;`}
                        </pre>
                        <button 
                          onClick={() => {
                            const sql = `-- Adicionar colunas para cursos, documentos e dados complementares na tabela equipe
ALTER TABLE public.equipe 
ADD COLUMN IF NOT EXISTS cursos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documentos_anexos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS funcao TEXT,
ADD COLUMN IF NOT EXISTS data_admissao DATE,
ADD COLUMN IF NOT EXISTS data_demissao DATE;`;
                            navigator.clipboard.writeText(sql);
                            alert('Script SQL copiado para a área de transferência!');
                          }}
                          className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border border-slate-800 rounded-lg text-slate-500 hover:text-[#d4ff3f] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Copy size={14} />
                        </button>
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
              <div className="flex items-center">
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


