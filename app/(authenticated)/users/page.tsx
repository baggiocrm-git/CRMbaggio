'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Plus, 
  Shield, 
  User, 
  Mail, 
  Lock, 
  X, 
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Usuário' as 'Administrador' | 'Usuário' | 'Cliente'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/list-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Erro ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const isAdm = user.email === 'lucabaggio28@gmail.com' || user.user_metadata?.role === 'Administrador';
        setIsAdmin(isAdm);
        if (isAdm) {
          fetchUsers();
        }
      }
    };
    checkAdmin();
  }, [fetchUsers]);

  const handleOpenModal = (user?: SupabaseUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        password: '', // Don't show password
        role: (user.user_metadata?.role as 'Administrador' | 'Usuário') || 'Usuário'
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Usuário'
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Você não pode excluir sua própria conta.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: userId })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir usuário.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const endpoint = editingUser ? '/api/admin/update-user' : '/api/admin/create-user';
      const body = editingUser 
        ? { id: editingUser.id, name: formData.name, role: formData.role }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'Usuário' });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !isLoading) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="size-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Acesso Negado</h2>
          <p className="text-slate-500 text-sm font-bold">
            Apenas administradores podem gerenciar usuários do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="Gestão de Usuários" 
        subtitle="Controle de acesso e permissões para administradores do sistema."
        action={isAdmin ? { label: 'Novo Usuário', onClick: () => handleOpenModal() } : undefined}
      />

      <div className="p-8 space-y-8">
        <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="font-black text-lg tracking-tight">Usuários do Sistema</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Users size={14} /> {users.length} Registrados
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Privilégios</th>
                  <th className="px-6 py-4">Último Acesso</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando usuários...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-xs font-bold">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#2a2a2a]/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-full bg-[#d4ff3f] flex items-center justify-center text-[#0a0a0a] font-black text-xs">
                            {(user.user_metadata?.full_name || user.email || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-sm">{user.user_metadata?.full_name || 'Sem Nome'}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">ID: {user.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-300">{user.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className={cn(user.user_metadata?.role === 'Administrador' ? "text-[#d4ff3f]" : "text-slate-500")} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            user.user_metadata?.role === 'Administrador' ? "text-[#d4ff3f]" : "text-slate-400"
                          )}>
                            {user.user_metadata?.role || 'Usuário'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} /> Ativo
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(user)} className="p-1 hover:text-[#d4ff3f] transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)} 
                            className={cn("p-1 transition-colors", user.id === currentUser?.id ? "text-slate-700 cursor-not-allowed" : "hover:text-rose-500")}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={14} /> {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                        placeholder="ex: João Silva"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={!!editingUser}
                        className={cn(
                          "w-full bg-[#0a0a0a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all",
                          editingUser && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="email@empresa.com"
                      />
                    </div>
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          required
                          type="password" 
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Privilégios</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Usuário', 'Administrador', 'Cliente'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({...formData, role: r})}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            formData.role === r 
                              ? "bg-[#d4ff3f]/10 border-[#d4ff3f] text-[#d4ff3f]" 
                              : "bg-[#0a0a0a] border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#2a2a2a] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : (editingUser ? <CheckCircle2 size={14} /> : <Plus size={14} />)}
                    {editingUser ? 'Salvar Alterações' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
