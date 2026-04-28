'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Cable, CreditCard, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { BankAccountType, BankingConnectionStatus, BankingConnectionType } from '@/lib/banking';

type BankConnectionRow = {
  id: string;
  nome: string;
  parceiro: string;
  connection_type: BankingConnectionType;
  status: BankingConnectionStatus;
  external_connection_id: string | null;
  consent_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type BankAccountRow = {
  id: string;
  bank_connection_id: string;
  banco_codigo: string | null;
  banco_nome: string | null;
  agencia: string | null;
  conta_mascarada: string | null;
  account_type: BankAccountType;
  holder_name: string | null;
  holder_document: string | null;
  is_active: boolean;
  external_account_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const connectionTypeOptions: Array<{ value: BankingConnectionType; label: string }> = [
  { value: 'open_finance', label: 'Open Finance' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cnab', label: 'CNAB' },
];

const connectionStatusOptions: Array<{ value: BankingConnectionStatus; label: string }> = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'expirada', label: 'Expirada' },
  { value: 'revogada', label: 'Revogada' },
  { value: 'erro', label: 'Erro' },
];

const accountTypeOptions: Array<{ value: BankAccountType; label: string }> = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'pagamento', label: 'Conta de Pagamento' },
  { value: 'outro', label: 'Outro' },
];

export default function BankingPage() {
  const [connections, setConnections] = useState<BankConnectionRow[]>([]);
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConnection, setSavingConnection] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [connectionForm, setConnectionForm] = useState({
    nome: '',
    parceiro: '',
    connection_type: 'open_finance' as BankingConnectionType,
    status: 'ativa' as BankingConnectionStatus,
    external_connection_id: '',
    consent_id: '',
  });

  const [accountForm, setAccountForm] = useState({
    bank_connection_id: '',
    banco_codigo: '',
    banco_nome: '',
    agencia: '',
    conta_mascarada: '',
    account_type: 'corrente' as BankAccountType,
    holder_name: '',
    holder_document: '',
    external_account_id: '',
    is_active: true,
  });

  const fetchBankingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [connectionsRes, accountsRes] = await Promise.all([
        supabase.from('bank_connections').select('*').order('created_at', { ascending: false }),
        supabase.from('bank_accounts').select('*').order('created_at', { ascending: false }),
      ]);

      if (connectionsRes.error) throw connectionsRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setConnections((connectionsRes.data as BankConnectionRow[]) || []);
      setAccounts((accountsRes.data as BankAccountRow[]) || []);
    } catch (fetchError) {
      console.error('Error loading banking page data:', fetchError);
      setError('Não foi possível carregar conexões bancárias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankingData();
  }, [fetchBankingData]);

  const activeConnections = useMemo(
    () => connections.filter((connection) => connection.status === 'ativa').length,
    [connections]
  );

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.is_active).length,
    [accounts]
  );

  const connectionMap = useMemo(() => {
    return new Map(connections.map((connection) => [connection.id, connection]));
  }, [connections]);

  const resetConnectionForm = () => {
    setEditingConnectionId(null);
    setConnectionForm({
      nome: '',
      parceiro: '',
      connection_type: 'open_finance',
      status: 'ativa',
      external_connection_id: '',
      consent_id: '',
    });
  };

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountForm({
      bank_connection_id: '',
      banco_codigo: '',
      banco_nome: '',
      agencia: '',
      conta_mascarada: '',
      account_type: 'corrente',
      holder_name: '',
      holder_document: '',
      external_account_id: '',
      is_active: true,
    });
  };

  const handleEditConnection = (connection: BankConnectionRow) => {
    setEditingConnectionId(connection.id);
    setConnectionForm({
      nome: connection.nome,
      parceiro: connection.parceiro,
      connection_type: connection.connection_type,
      status: connection.status,
      external_connection_id: connection.external_connection_id || '',
      consent_id: connection.consent_id || '',
    });
  };

  const handleEditAccount = (account: BankAccountRow) => {
    setEditingAccountId(account.id);
    setAccountForm({
      bank_connection_id: account.bank_connection_id,
      banco_codigo: account.banco_codigo || '',
      banco_nome: account.banco_nome || '',
      agencia: account.agencia || '',
      conta_mascarada: account.conta_mascarada || '',
      account_type: account.account_type,
      holder_name: account.holder_name || '',
      holder_document: account.holder_document || '',
      external_account_id: account.external_account_id || '',
      is_active: account.is_active,
    });
  };

  const handleDeleteConnection = async (connection: BankConnectionRow) => {
    const confirmed = window.confirm(`Remover a conexão "${connection.nome}"? As contas vinculadas também serão removidas.`);
    if (!confirmed) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase.from('bank_connections').delete().eq('id', connection.id);
      if (deleteError) throw deleteError;
      if (editingConnectionId === connection.id) resetConnectionForm();
      await fetchBankingData();
    } catch (deleteError) {
      console.error('Error deleting bank connection:', deleteError);
      setError('Não foi possível remover a conexão bancária.');
    }
  };

  const handleDeleteAccount = async (account: BankAccountRow) => {
    const confirmed = window.confirm(`Remover a conta "${account.conta_mascarada || account.banco_nome || account.id}"?`);
    if (!confirmed) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase.from('bank_accounts').delete().eq('id', account.id);
      if (deleteError) throw deleteError;
      if (editingAccountId === account.id) resetAccountForm();
      await fetchBankingData();
    } catch (deleteError) {
      console.error('Error deleting bank account:', deleteError);
      setError('Não foi possível remover a conta bancária.');
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConnection(true);
    try {
      const payload = {
        nome: connectionForm.nome.trim(),
        parceiro: connectionForm.parceiro.trim(),
        connection_type: connectionForm.connection_type,
        status: connectionForm.status,
        external_connection_id: connectionForm.external_connection_id.trim() || null,
        consent_id: connectionForm.consent_id.trim() || null,
      };

      const query = editingConnectionId
        ? supabase.from('bank_connections').update(payload).eq('id', editingConnectionId)
        : supabase.from('bank_connections').insert(payload);

      const { error: insertError } = await query;

      if (insertError) throw insertError;

      resetConnectionForm();
      await fetchBankingData();
    } catch (insertError) {
      console.error('Error creating bank connection:', insertError);
      setError('Não foi possível salvar a conexão bancária.');
    } finally {
      setSavingConnection(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const payload = {
        bank_connection_id: accountForm.bank_connection_id,
        banco_codigo: accountForm.banco_codigo.trim() || null,
        banco_nome: accountForm.banco_nome.trim() || null,
        agencia: accountForm.agencia.trim() || null,
        conta_mascarada: accountForm.conta_mascarada.trim() || null,
        account_type: accountForm.account_type,
        holder_name: accountForm.holder_name.trim() || null,
        holder_document: accountForm.holder_document.trim() || null,
        external_account_id: accountForm.external_account_id.trim() || null,
        is_active: accountForm.is_active,
      };

      const query = editingAccountId
        ? supabase.from('bank_accounts').update(payload).eq('id', editingAccountId)
        : supabase.from('bank_accounts').insert(payload);

      const { error: insertError } = await query;

      if (insertError) throw insertError;

      resetAccountForm();
      await fetchBankingData();
    } catch (insertError) {
      console.error('Error creating bank account:', insertError);
      setError('Não foi possível salvar a conta bancária.');
    } finally {
      setSavingAccount(false);
    }
  };

  const getConnectionTone = (status: BankingConnectionStatus) => {
    switch (status) {
      case 'ativa':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
      case 'expirada':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
      case 'revogada':
      case 'erro':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
      default:
        return 'border-slate-500/20 bg-slate-500/10 text-slate-300';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] px-8 pb-8 pt-3 text-white custom-scrollbar">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black italic tracking-tight">
            Conexões <span className="text-[#d4ff3f]">Bancárias</span>
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">
            Cadastre conexões e contas para operar cobranças, pagamentos e conciliação.
          </p>
        </div>
        <button
          onClick={fetchBankingData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800/50 bg-[#1a1a1a] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Conexões', value: connections.length.toString(), icon: Cable, tone: 'text-cyan-300' },
          { label: 'Conexões ativas', value: activeConnections.toString(), icon: ShieldCheck, tone: 'text-emerald-300' },
          { label: 'Contas ativas', value: activeAccounts.toString(), icon: CreditCard, tone: 'text-[#d4ff3f]' },
        ].map((card) => (
          <div key={card.label} className="flex items-center gap-3 rounded-2xl border border-slate-800/50 bg-[#1a1a1a] px-4 py-3">
            <div className={cn('rounded-xl bg-[#0a0a0a] p-2', card.tone)}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="text-lg font-black text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-slate-800/50 bg-[#1a1a1a]">
          <div className="flex items-center justify-between border-b border-slate-800/50 px-6 py-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Conexões Cadastradas</h2>
              <p className="mt-1 text-[11px] font-bold text-slate-500">Base para Open Finance, Pix, CNAB e cobrança.</p>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {loading ? (
              <p className="rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-6 text-center text-sm font-bold text-slate-500">
                Carregando conexões...
              </p>
            ) : connections.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-800/50 bg-[#0a0a0a] px-4 py-6 text-center text-sm font-bold text-slate-500">
                Nenhuma conexão bancária cadastrada ainda.
              </p>
            ) : (
              connections.map((connection) => (
                <div key={connection.id} className="rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-white">{connection.nome}</p>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest', getConnectionTone(connection.status))}>
                          {connection.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {connection.parceiro} · {connection.connection_type}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-[11px] font-bold text-slate-500">
                      <p>{new Date(connection.created_at).toLocaleDateString('pt-BR')}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditConnection(connection)}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300 transition-all hover:text-cyan-200"
                        >
                          <Pencil size={12} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteConnection(connection)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-300 transition-all hover:text-rose-200"
                        >
                          <Trash2 size={12} />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-800/50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connection ID</p>
                      <p className="mt-1 break-all text-[11px] font-bold text-white">{connection.external_connection_id || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800/50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Consent ID</p>
                      <p className="mt-1 break-all text-[11px] font-bold text-white">{connection.consent_id || '-'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-800/50 bg-[#1a1a1a]">
            <div className="border-b border-slate-800/50 px-6 py-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Nova Conexão</h2>
              <p className="mt-1 text-[11px] font-bold text-slate-500">Cadastro manual inicial para mapear parceiros e escopos.</p>
            </div>
            <form onSubmit={handleCreateConnection} className="grid grid-cols-2 gap-4 p-6">
              <div className="col-span-2 flex flex-wrap items-center gap-3">
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Interno</label>
                <input
                  required
                  value={connectionForm.nome}
                  onChange={(e) => setConnectionForm((current) => ({ ...current, nome: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Ex.: Banco principal empresa"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Parceiro</label>
                <input
                  required
                  value={connectionForm.parceiro}
                  onChange={(e) => setConnectionForm((current) => ({ ...current, parceiro: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Ex.: Belvo, Pluggy, Parceiro X"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</label>
                <select
                  value={connectionForm.connection_type}
                  onChange={(e) => setConnectionForm((current) => ({ ...current, connection_type: e.target.value as BankingConnectionType }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                >
                  {connectionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                <select
                  value={connectionForm.status}
                  onChange={(e) => setConnectionForm((current) => ({ ...current, status: e.target.value as BankingConnectionStatus }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                >
                  {connectionStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">External Connection ID</label>
                <input
                  value={connectionForm.external_connection_id}
                  onChange={(e) => setConnectionForm((current) => ({ ...current, external_connection_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Opcional"
                />
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-3">
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Consent ID</label>
                <input
                  value={connectionForm.consent_id}
                  onChange={(e) => setConnectionForm((current) => ({ ...current, consent_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Opcional"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={savingConnection}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#d4ff3f] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#c4ef2f] disabled:opacity-50"
                >
                  <Plus size={14} />
                  {savingConnection ? 'Salvando...' : 'Salvar Conexão'}
                </button>
                {editingConnectionId && (
                  <button
                    type="button"
                    onClick={resetConnectionForm}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:text-white"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-800/50 bg-[#1a1a1a]">
            <div className="border-b border-slate-800/50 px-6 py-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Nova Conta Bancária</h2>
              <p className="mt-1 text-[11px] font-bold text-slate-500">Vincule contas operacionais para pagamentos e cobranças.</p>
            </div>
            <form onSubmit={handleCreateAccount} className="grid grid-cols-2 gap-4 p-6">
              <div className="col-span-2">
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Conexão</label>
                <select
                  required
                  value={accountForm.bank_connection_id}
                  onChange={(e) => setAccountForm((current) => ({ ...current, bank_connection_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                >
                  <option value="">Selecione uma conexão</option>
                  {connections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.nome} · {connection.parceiro}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Banco</label>
                <input
                  value={accountForm.banco_nome}
                  onChange={(e) => setAccountForm((current) => ({ ...current, banco_nome: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Ex.: Itaú, Sicredi"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Código Banco</label>
                <input
                  value={accountForm.banco_codigo}
                  onChange={(e) => setAccountForm((current) => ({ ...current, banco_codigo: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Ex.: 341"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Agência</label>
                <input
                  value={accountForm.agencia}
                  onChange={(e) => setAccountForm((current) => ({ ...current, agencia: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Conta Mascarada</label>
                <input
                  value={accountForm.conta_mascarada}
                  onChange={(e) => setAccountForm((current) => ({ ...current, conta_mascarada: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Ex.: ****1234"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo da Conta</label>
                <select
                  value={accountForm.account_type}
                  onChange={(e) => setAccountForm((current) => ({ ...current, account_type: e.target.value as BankAccountType }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                >
                  {accountTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Titular</label>
                <input
                  value={accountForm.holder_name}
                  onChange={(e) => setAccountForm((current) => ({ ...current, holder_name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Documento</label>
                <input
                  value={accountForm.holder_document}
                  onChange={(e) => setAccountForm((current) => ({ ...current, holder_document: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">External Account ID</label>
                <input
                  value={accountForm.external_account_id}
                  onChange={(e) => setAccountForm((current) => ({ ...current, external_account_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                  placeholder="Opcional"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3">
                <input
                  id="account-active"
                  type="checkbox"
                  checked={accountForm.is_active}
                  onChange={(e) => setAccountForm((current) => ({ ...current, is_active: e.target.checked }))}
                  className="size-4 accent-[#d4ff3f]"
                />
                <label htmlFor="account-active" className="text-sm font-bold text-white">
                  Conta ativa para operação
                </label>
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={savingAccount || !connections.length}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#d4ff3f] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#c4ef2f] disabled:opacity-50"
                >
                  <Plus size={14} />
                  {savingAccount ? 'Salvando...' : 'Salvar Conta Bancária'}
                </button>
                {editingAccountId && (
                  <button
                    type="button"
                    onClick={resetAccountForm}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:text-white"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-800/50 bg-[#1a1a1a]">
        <div className="border-b border-slate-800/50 px-6 py-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Contas Vinculadas</h2>
          <p className="mt-1 text-[11px] font-bold text-slate-500">Resumo operacional das contas disponíveis para pagamentos e cobranças.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800/50 bg-[#0a0a0a] text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Conexão</th>
                <th className="px-4 py-3">Banco</th>
                <th className="px-4 py-3">Conta</th>
                <th className="px-4 py-3">Titular</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm font-bold text-slate-500">
                    Nenhuma conta bancária cadastrada ainda.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const connection = connectionMap.get(account.bank_connection_id);
                  return (
                    <tr key={account.id} className="text-sm">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{connection?.nome || 'Sem conexão'}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          {connection?.parceiro || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{account.banco_nome || '-'}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{account.banco_codigo || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{account.conta_mascarada || '-'}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{account.account_type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{account.holder_name || '-'}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{account.holder_document || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest',
                            account.is_active
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                          )}
                        >
                          {account.is_active ? 'ativa' : 'inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditAccount(account)}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300 transition-all hover:text-cyan-200"
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAccount(account)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-300 transition-all hover:text-rose-200"
                          >
                            <Trash2 size={12} />
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
