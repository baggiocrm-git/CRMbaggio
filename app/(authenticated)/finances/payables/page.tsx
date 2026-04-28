'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Plus, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
// import * as XLSX from 'xlsx';
import CurrencyInput from '@/components/CurrencyInput';
import { handleFixedDecimalValueChange, transformRawCurrencyValue } from '@/lib/currency';
import { COST_CATEGORIES, CONSTRUCTION_STAGES } from '@/lib/constants';
import {
  approvePaymentRequest,
  createPaymentRequest,
  listAuditLogs,
  listPaymentRequestsByContaPagar,
  writeAuditLog,
} from '@/lib/banking';
import type { AuditLogRow, PaymentRequestRow } from '@/lib/banking';

interface Payable {
  id: string;
  fornecedor: string;
  descricao: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor: number;
  valor_pago: number;
  situacao: 'Aberto' | 'Pago' | 'Em andamento';
  projeto_id?: string;
  categoria_custo?: string;
  etapa_obra?: string;
  centro_custo_tipo?: 'Obra' | 'Administrativo' | 'Pessoal';
  socio_id?: string;
  created_at?: string;
  approval_status?: string | null;
  payment_request_id?: string | null;
  bank_account_id?: string | null;
  partner_payment_status?: string | null;
  paid_at?: string | null;
  last_event_at?: string | null;
}

interface TeamMember {
  id: string;
  nome: string;
}

interface Project {
  id: string;
  nome: string;
}

interface PayableSupplier {
  id: string;
  nome: string;
}

interface BankAccountOption {
  id: string;
  bank_connection_id: string;
  banco_nome: string | null;
  conta_mascarada: string | null;
  holder_name: string | null;
  is_active: boolean;
}

interface ExcelRow {
  id?: string;
  fornecedor?: string;
  descricao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  valor?: number | string;
  valor_pago?: number | string;
  situacao?: string;
}

export default function PayablesPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Payable | null>(null);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    situacao: 'Todas',
    dataInicio: '',
    dataFim: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Payable | null, direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fornecedor: '',
    descricao: '',
    data_vencimento: '',
    data_pagamento: '',
    valor: 0,
    valor_pago: 0,
    situacao: 'Aberto' as Payable['situacao'],
    projeto_id: '',
    categoria_custo: '',
    etapa_obra: '',
    centro_custo_tipo: 'Obra' as 'Obra' | 'Administrativo' | 'Pessoal',
    socio_id: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [bankingBusy, setBankingBusy] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const NEW_SUPPLIER_OPTION = '__novo_fornecedor__';

  const normalizeSupplierName = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('pt-BR');

  const fetchProjects = async () => {
    const { data } = await supabase.from('projetos').select('id, nome');
    if (data) setProjects(data);
  };

  const fetchTeamMembers = async () => {
    const { data } = await supabase.from('equipe').select('id, nome');
    if (data) setTeamMembers(data);
  };

  const fetchBankAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, bank_connection_id, banco_nome, conta_mascarada, holder_name, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts((data as BankAccountOption[]) || []);
    } catch (bankError) {
      console.error('Error fetching active bank accounts:', bankError);
      setBankAccounts([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const generateNextId = async () => {
    const now = new Date();
    const prefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id')
      .like('id', `${prefix}-%`)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last ID:', error);
      return `${prefix}-0001`;
    }

    if (!data || data.length === 0) {
      return `${prefix}-0001`;
    }

    const lastId = data[0].id;
    const parts = lastId.split('-');
    if (parts.length < 2) return `${prefix}-0001`;
    
    const lastNumber = parseInt(parts[1]);
    if (isNaN(lastNumber)) return `${prefix}-0001`;
    
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  };

  const generateImportIds = async (count: number) => {
    const now = new Date();
    const prefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data } = await supabase
      .from('contas_pagar')
      .select('id')
      .like('id', `${prefix}-%`)
      .order('id', { ascending: false })
      .limit(1);

    let startNumber = 1;
    if (data && data.length > 0) {
      const parts = data[0].id.split('-');
      if (parts.length >= 2) {
        const lastNumber = parseInt(parts[1]);
        if (!isNaN(lastNumber)) {
          startNumber = lastNumber + 1;
        }
      }
    }

    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(`${prefix}-${(startNumber + i).toString().padStart(4, '0')}`);
    }
    return ids;
  };

  const handleSort = (key: keyof Payable) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Payable) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

  const fetchPayables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setError('A tabela "contas_pagar" não foi encontrada. Por favor, configure o banco de dados nas configurações.');
        } else {
          setError(error.message);
        }
        console.error('Error fetching payables:', error);
        return;
      }
      setPayables(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contas_pagar_fornecedores')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) {
        const { data: payablesData, error: payablesError } = await supabase
          .from('contas_pagar')
          .select('fornecedor')
          .order('fornecedor', { ascending: true });

        if (payablesError) throw payablesError;

        const fallbackSuppliers = Array.from(
          new Set(
            ((payablesData as Array<{ fornecedor: string | null }> | null) || [])
              .map((item) => (item.fornecedor || '').trim().replace(/\s+/g, ' '))
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

        setSupplierOptions(fallbackSuppliers);
        return;
      }

      setSupplierOptions(((data as PayableSupplier[] | null) || []).map((supplier) => supplier.nome));
    } catch (err) {
      console.error('Error fetching suppliers:', err instanceof Error ? err.message : err);
      setSupplierOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchPayables();
    fetchSuppliers();
  }, [fetchPayables, fetchSuppliers]);

  useEffect(() => {
    if (!isModalOpen || !editingItem) {
      setPaymentRequests([]);
      setAuditLogs([]);
      return;
    }

    const loadBankingContext = async () => {
      try {
        const [requests, logs] = await Promise.all([
          listPaymentRequestsByContaPagar(editingItem.id),
          listAuditLogs('contas_pagar', editingItem.id),
        ]);
        setPaymentRequests(requests);
        setAuditLogs(logs);
      } catch (contextError) {
        console.error('Error loading banking context for payable:', contextError);
      }
    };

    loadBankingContext();
  }, [editingItem, isModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isFilterOpen) return;
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const handleOpenModal = (item?: Payable) => {
    if (item) {
      setSelectedBankAccountId(item.bank_account_id || '');
      setIsCustomSupplier(!supplierOptions.some((supplier) => normalizeSupplierName(supplier) === normalizeSupplierName(item.fornecedor)));
      setEditingItem(item);
      setFormData({
        fornecedor: item.fornecedor,
        descricao: item.descricao,
        data_vencimento: item.data_vencimento,
        data_pagamento: item.data_pagamento || '',
        valor: item.valor,
        valor_pago: item.valor_pago,
        situacao: item.situacao,
        projeto_id: item.projeto_id || '',
        categoria_custo: item.categoria_custo || '',
        etapa_obra: item.etapa_obra || '',
        centro_custo_tipo: item.centro_custo_tipo || 'Obra',
        socio_id: item.socio_id || ''
      });
    } else {
      setSelectedBankAccountId('');
      setIsCustomSupplier(false);
      setEditingItem(null);
      setFormData({
        fornecedor: '',
        descricao: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        data_pagamento: '',
        valor: 0,
        valor_pago: 0,
        situacao: 'Aberto',
        projeto_id: '',
        categoria_custo: '',
        etapa_obra: '',
        centro_custo_tipo: 'Obra',
        socio_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedFornecedor = formData.fornecedor.trim().replace(/\s+/g, ' ');
    const existingSupplier = supplierOptions.find(
      (supplier) => normalizeSupplierName(supplier) === normalizeSupplierName(cleanedFornecedor)
    );
    const finalFornecedor = existingSupplier || cleanedFornecedor;
    try {
      if (finalFornecedor) {
        const { error: supplierError } = await supabase
          .from('contas_pagar_fornecedores')
          .upsert([{ nome: finalFornecedor }], { onConflict: 'nome' });

        if (supplierError) {
          console.warn('Unable to persist supplier option:', supplierError);
        }
      }

      const payload: Record<string, string | number | null> = {
        fornecedor: finalFornecedor,
        descricao: formData.descricao,
        data_vencimento: formData.data_vencimento,
        data_pagamento: formData.data_pagamento || null,
        valor: formData.valor,
        valor_pago: formData.valor_pago,
        situacao: formData.situacao,
      };

      // Only include these if they have a value to avoid errors with older table schemas
      if (formData.projeto_id && formData.centro_custo_tipo === 'Obra') payload.projeto_id = formData.projeto_id;
      if (formData.categoria_custo) payload.categoria_custo = formData.categoria_custo;
      if (formData.etapa_obra) payload.etapa_obra = formData.etapa_obra;
      if (formData.centro_custo_tipo) payload.centro_custo_tipo = formData.centro_custo_tipo;
      if (formData.socio_id && formData.centro_custo_tipo === 'Pessoal') payload.socio_id = formData.socio_id;
      if (selectedBankAccountId) payload.bank_account_id = selectedBankAccountId;

      if (editingItem) {
        const { error } = await supabase
          .from('contas_pagar')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const nextId = await generateNextId();
        const { error } = await supabase
          .from('contas_pagar')
          .insert([{ ...payload, id: nextId }]);
        if (error) throw error;
      }

      handleCloseModal();
      fetchPayables();
      fetchSuppliers();
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Erro desconhecido ao salvar a conta a pagar.';
      console.error('Error saving payable:', errorMessage, err);
      alert(`Erro ao salvar conta a pagar: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchPayables();
    } catch (err) {
      console.error('Error deleting payable:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCustomSupplier(false);
    setSelectedBankAccountId('');
  };

  const getCurrentUserId = async () => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    return data.user?.id || null;
  };

  const refreshPayableBankingContext = async (payableId: string) => {
    await fetchPayables();
    const { data: refreshedItem } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('id', payableId)
      .single();
    if (refreshedItem) {
      setEditingItem(refreshedItem as Payable);
    }
    const [requests, logs] = await Promise.all([
      listPaymentRequestsByContaPagar(payableId),
      listAuditLogs('contas_pagar', payableId),
    ]);
    setPaymentRequests(requests);
    setAuditLogs(logs);
  };

  const submitPayableForApproval = async (item: Payable) => {
    setBankingBusy(true);
    try {
      const bankAccountId = selectedBankAccountId || item.bank_account_id || bankAccounts[0]?.id || null;
      if (!bankAccountId) {
        alert('Cadastre e selecione uma conta bancária ativa antes de enviar para aprovação.');
        return;
      }
      const userId = await getCurrentUserId();
      const request = await createPaymentRequest({
        contaPagarId: item.id,
        bankAccountId,
        requestType: 'manual',
        favorecidoNome: item.fornecedor,
        valor: item.valor,
        requestedBy: userId,
        metadata: {
          descricao: item.descricao,
          origem: 'contas_pagar_ui',
        },
      });

      await writeAuditLog({
        entityType: 'contas_pagar',
        entityId: item.id,
        action: 'payment_request_created',
        actorUserId: userId,
        newData: { payment_request_id: request.id, status: request.status },
      });

      alert('Solicitação enviada para aprovação.');
      await refreshPayableBankingContext(item.id);
    } catch (actionError) {
      console.error('Error sending payable for approval:', actionError);
      alert('Não foi possível enviar para aprovação.');
    } finally {
      setBankingBusy(false);
    }
  };

  const getBankAccountLabel = (account: BankAccountOption) => {
    const bankName = account.banco_nome || 'Banco';
    const accountMask = account.conta_mascarada || 'Conta sem máscara';
    const holder = account.holder_name ? ` · ${account.holder_name}` : '';
    return `${bankName} · ${accountMask}${holder}`;
  };

  const getBankAccountLabelById = (bankAccountId?: string | null) => {
    if (!bankAccountId) return 'Sem conta vinculada';
    const account = bankAccounts.find((item) => item.id === bankAccountId);
    return account ? getBankAccountLabel(account) : 'Conta não encontrada';
  };

  const handleSendForApproval = async () => {
    if (!editingItem) return;
    await submitPayableForApproval(editingItem);
  };

  const approvePayablePayment = async (item: Payable) => {
    if (!item.payment_request_id) return;
    setBankingBusy(true);
    try {
      const userId = await getCurrentUserId();
      await approvePaymentRequest({
        paymentRequestId: item.payment_request_id,
        approverUserId: userId || 'sistema',
        decision: 'aprovado',
        comment: 'Aprovado via painel financeiro.',
      });

      await writeAuditLog({
        entityType: 'contas_pagar',
        entityId: item.id,
        action: 'payment_request_approved',
        actorUserId: userId,
        newData: { payment_request_id: item.payment_request_id, decision: 'aprovado' },
      });

      alert('Pagamento aprovado.');
      await refreshPayableBankingContext(item.id);
    } catch (actionError) {
      console.error('Error approving payable:', actionError);
      alert('Não foi possível aprovar o pagamento.');
    } finally {
      setBankingBusy(false);
    }
  };

  const handleApproveCurrentPayment = async () => {
    if (!editingItem) return;
    await approvePayablePayment(editingItem);
  };

  const getApprovalStatusTone = (status?: string | null) => {
    switch (status) {
      case 'aprovado':
      case 'pago':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
      case 'pendente_aprovacao':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
      case 'rejeitado':
      case 'falhou':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-400';
      case 'enviado_banco':
        return 'border-blue-500/20 bg-blue-500/10 text-blue-400';
      default:
        return 'border-slate-500/20 bg-slate-500/10 text-slate-400';
    }
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(payables);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas a Pagar");
    XLSX.writeFile(wb, "contas_a_pagar.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const XLSX = await import('xlsx');
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);
      
      if (data.length === 0) {
        alert('A planilha está vazia.');
        return;
      }

      const ids = await generateImportIds(data.length);
      
      // Basic validation and mapping
      const mappedData = data.map((item: ExcelRow, index: number) => {
        const formatDate = (val: unknown) => {
          if (!val) return null;
          if (val instanceof Date) return val.toISOString().split('T')[0];
          return String(val);
        };

        // Normalize situacao
        let situacao: Payable['situacao'] = 'Aberto';
        const rawSituacao = String(item.situacao || '').toUpperCase();
        if (rawSituacao === 'PAGO' || rawSituacao === 'RECEBIDO') situacao = 'Pago';
        else if (rawSituacao === 'EM ANDAMENTO') situacao = 'Em andamento';
        else situacao = 'Aberto';

        return {
          id: ids[index],
          fornecedor: item.fornecedor || 'Sem Identificação',
          descricao: item.descricao || '',
          data_vencimento: formatDate(item.data_vencimento) || new Date().toISOString().split('T')[0],
          data_pagamento: formatDate(item.data_pagamento),
          valor: Number(item.valor) || 0,
          valor_pago: Number(item.valor_pago) || 0,
          situacao
        };
      });

      try {
        const { error } = await supabase.from('contas_pagar').insert(mappedData);
        if (error) throw error;
        const importedSuppliers = Array.from(
          new Set(
            mappedData
              .map((item) => item.fornecedor.trim().replace(/\s+/g, ' '))
              .filter(Boolean)
          )
        ).map((nome) => ({ nome }));
        if (importedSuppliers.length > 0) {
          const { error: supplierError } = await supabase
            .from('contas_pagar_fornecedores')
            .upsert(importedSuppliers, { onConflict: 'nome' });
          if (supplierError) {
            console.warn('Unable to persist imported suppliers:', supplierError);
          }
        }
        fetchPayables();
        fetchSuppliers();
        alert('Dados importados com sucesso!');
      } catch (err) {
        console.error('Error importing data:', err);
        alert('Erro ao importar dados. Verifique o formato da planilha.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredPayables = payables.filter(p => {
    const matchesSearch = p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSituacao = filters.situacao === 'Todas' || p.situacao === filters.situacao;
    
    const matchesDate = (!filters.dataInicio || p.data_vencimento >= filters.dataInicio) &&
      (!filters.dataFim || p.data_vencimento <= filters.dataFim);
      
    return matchesSearch && matchesSituacao && matchesDate;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalValue = payables.reduce((acc, curr) => acc + curr.valor, 0);
  const paidValue = payables.reduce((acc, curr) => acc + curr.valor_pago, 0);
  const openValue = payables.filter(p => p.situacao === 'Aberto').reduce((acc, curr) => acc + curr.valor, 0);
  const inProgressValue = payables.filter(p => p.situacao === 'Em andamento').reduce((acc, curr) => acc + curr.valor, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayables.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayables.length / itemsPerPage);

  return (
    <div className="finance-ledger-theme flex-1 bg-[#0a0a0a] px-8 pb-8 pt-3 text-white overflow-y-auto custom-scrollbar">
      <div className="mb-2 flex items-center gap-2">
        <Link
          href="/finances/receivables"
          className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-[#081120]/90 px-4 py-2 text-[10px] font-black uppercase tracking-normal text-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.18)] backdrop-blur-xl transition hover:border-orange-300/40 hover:text-orange-300"
        >
          <ArrowRight size={14} />
          Ir Para Contas a Receber
        </Link>
        <Link
          href="/finances/banking"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-[#081120]/90 px-4 py-2 text-[10px] font-black uppercase tracking-normal text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.14)] backdrop-blur-xl transition hover:border-cyan-300/40 hover:text-cyan-200"
        >
          <Landmark size={14} />
          Conexões Bancárias
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-black tracking-tight italic">
          Contas a <span className="text-[#d4ff3f]">pagar</span>
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-3.5 py-1.5 rounded-xl text-[7px] leading-none font-black uppercase tracking-[0.18em] shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-1.5"
          >
            <Plus size={11} /> CONTA A PAGAR
          </button>
          <div ref={filterRef} className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-[7px] leading-none font-black uppercase tracking-[0.18em] transition-all",
                isFilterOpen ? "bg-[#1a1a1a] border-[#d4ff3f] text-[#d4ff3f]" : "bg-[#1a1a1a] border-slate-800/50 text-slate-500 hover:text-white"
              )}
            >
              <Filter size={10} /> FILTROS
            </button>
            
            <AnimatePresence>
              {isFilterOpen && (
                <>
                <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] rounded-2xl border border-slate-800/50 shadow-2xl z-30 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtros Avançados</h4>
                    <button 
                      onClick={() => setFilters({ situacao: 'Todas', dataInicio: '', dataFim: '' })}
                      className="text-[8px] font-black uppercase tracking-widest text-[#d4ff3f] hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Situação</label>
                    <select 
                      value={filters.situacao}
                      onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-4 py-2 text-[12px] leading-none font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                    >
                      <option value="Todas">Todas as situações</option>
                      <option value="Aberto">Aberto</option>
                      <option value="Pago">Pago</option>
                      <option value="Em andamento">Em andamento</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Início</label>
                      <input 
                        type="date" 
                        value={filters.dataInicio}
                        onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-[12px] leading-none font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fim</label>
                      <input 
                        type="date" 
                        value={filters.dataFim}
                        onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2 text-[12px] leading-none font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[7px] leading-none font-black uppercase tracking-[0.18em] hover:text-white transition-all text-slate-500"
          >
            <Download size={10} /> EXPORTAR
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[7px] leading-none font-black uppercase tracking-[0.18em] hover:text-white transition-all text-slate-500"
          >
            <Upload size={10} /> IMPORTAR
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
            accept=".xlsx, .xls"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-rose-500" size={20} />
            <p className="text-[12px] leading-none font-bold text-rose-500 uppercase tracking-tight">{error}</p>
          </div>
          {error.includes('configurações') && (
            <a 
              href="/settings" 
              className="px-4 py-2 bg-rose-500 text-white text-[12px] leading-none font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all"
            >
              Ir para Configurações
            </a>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Valor', value: formatCurrency(totalValue), icon: TrendingUp, color: 'text-slate-500' },
          { label: 'Valor pago', value: formatCurrency(paidValue), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Valor em aberto', value: formatCurrency(openValue), icon: AlertCircle, color: 'text-orange-500' },
          { label: 'Valor em andamento', value: formatCurrency(inProgressValue), icon: Clock, color: 'text-blue-500' },
        ].map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] px-4 py-3 rounded-2xl border border-slate-800/50 shadow-sm flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-[#0a0a0a]", card.color)}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-slate-500 text-[11px] leading-none font-bold uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-lg leading-none font-black text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-slate-800/50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar fornecedor ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm leading-tight text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
            />
          </div>
        </div>

        <div className="">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[12px] leading-none font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[15%]" onClick={() => handleSort('fornecedor')}>
                  <div className="flex items-center gap-1">
                    Fornecedor {getSortIcon('fornecedor')}
                  </div>
                </th>
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[25%]" onClick={() => handleSort('descricao')}>
                  <div className="flex items-center gap-1">
                    Descrição {getSortIcon('descricao')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('data_vencimento')}>
                  <div className="flex items-center gap-1">
                    Venc. {getSortIcon('data_vencimento')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('data_pagamento')}>
                  <div className="flex items-center gap-1">
                    Pag. {getSortIcon('data_pagamento')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('valor')}>
                  <div className="flex items-center gap-1">
                    Valor {getSortIcon('valor')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[10%]" onClick={() => handleSort('valor_pago')}>
                  <div className="flex items-center gap-1">
                    Pago {getSortIcon('valor_pago')}
                  </div>
                </th>
                <th className="px-1 py-2 cursor-pointer hover:text-white transition-colors w-[12%]" onClick={() => handleSort('situacao')}>
                  <div className="flex items-center gap-1">
                    Situação {getSortIcon('situacao')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                    <p className="text-[12px] leading-none font-black text-slate-500 uppercase tracking-widest">Carregando dados...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm font-bold">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleOpenModal(item)}
                    className="hover:bg-[#0a0a0a] transition-colors group text-sm leading-tight cursor-pointer"
                  >
                    <td className="px-2 py-2">
                      <p className="font-bold text-white leading-tight truncate" title={item.fornecedor}>{item.fornecedor}</p>
                      <span
                        className={cn(
                          'mt-1 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
                          item.bank_account_id
                            ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                        )}
                        title={getBankAccountLabelById(item.bank_account_id)}
                      >
                        <Landmark size={10} className="shrink-0" />
                        <span className="truncate">{getBankAccountLabelById(item.bank_account_id)}</span>
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest', getApprovalStatusTone(item.approval_status))}>
                          {item.approval_status || 'nao_enviado'}
                        </span>
                        {item.partner_payment_status && (
                          <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-300">
                            {item.partner_payment_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-slate-400 leading-tight truncate" title={item.descricao}>{item.descricao}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="text-slate-500">{formatDate(item.data_vencimento)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="text-slate-500">{formatDate(item.data_pagamento)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-black text-white">{formatCurrency(item.valor)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <p className="font-bold text-emerald-500">{formatCurrency(item.valor_pago)}</p>
                    </td>
                    <td className="px-1 py-2">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-[11px] leading-none font-black uppercase tracking-widest",
                        item.situacao === 'Pago' ? "bg-emerald-500/10 text-emerald-500" : 
                        item.situacao === 'Aberto' ? "bg-orange-500/10 text-orange-500" : 
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {item.situacao}
                      </span>
                      {item.situacao !== 'Pago' && !item.payment_request_id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void submitPayableForApproval(item);
                          }}
                          className="mt-2 block rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-300 transition-all hover:bg-amber-500/20"
                        >
                          Aprovar
                        </button>
                      )}
                      {item.approval_status === 'pendente_aprovacao' && item.payment_request_id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void approvePayablePayment(item);
                          }}
                          className="mt-2 block rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/20"
                        >
                          Confirmar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-[#0a0a0a] border-t border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] leading-none font-bold text-slate-500 uppercase tracking-widest">Página</span>
              <select 
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2.5 py-1.5 text-[12px] leading-none font-black text-white outline-none"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] leading-none font-bold text-slate-500 uppercase tracking-widest">Exibir</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2.5 py-1.5 text-[12px] leading-none font-black text-white outline-none"
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] leading-none font-bold text-slate-500 uppercase tracking-widest">
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPayables.length)} de {filteredPayables.length}
            </span>
            <div className="flex gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl disabled:opacity-50 hover:text-white transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl disabled:opacity-50 hover:text-white transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 custom-scrollbar"
            >
              <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-sm font-black tracking-tight text-white">
                  {editingItem ? 'Editar Conta' : 'Nova Conta a Pagar'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Fornecedor</label>
                    <select
                      required={!isCustomSupplier}
                      value={isCustomSupplier ? NEW_SUPPLIER_OPTION : formData.fornecedor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === NEW_SUPPLIER_OPTION) {
                          setIsCustomSupplier(true);
                          setFormData({ ...formData, fornecedor: '' });
                          return;
                        }

                        setIsCustomSupplier(false);
                        setFormData({ ...formData, fornecedor: value });
                      }}
                      className={cn(
                        "w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all",
                        isCustomSupplier ? "text-slate-400" : "text-white"
                      )}
                    >
                      <option value="" disabled>Selecione um fornecedor</option>
                      {supplierOptions.map((supplier) => (
                        <option key={`supplier-${supplier}`} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                      <option value={NEW_SUPPLIER_OPTION} className="text-slate-400">Novo fornecedor</option>
                    </select>
                    {isCustomSupplier && (
                      <input
                        required
                        type="text"
                        value={formData.fornecedor}
                        onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                        className="w-full mt-3 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                        placeholder="Digite o nome do novo fornecedor"
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                    <input 
                      required
                      type="text" 
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="O que está sendo pago?"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Vencimento</label>
                    <input 
                      required
                      type="date" 
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Pagamento</label>
                    <input 
                      type="date" 
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData({...formData, data_pagamento: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor</label>
                    <CurrencyInput
                      required
                      prefix="R$ "
                      allowDecimals={false}
                      disableAbbreviations
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      fixedDecimalLength={2}
                      formatValueOnBlur={false}
                      transformRawValue={transformRawCurrencyValue}
                      value={formData.valor}
                      onValueChange={(value) => handleFixedDecimalValueChange(value, (v) => setFormData({...formData, valor: Number(v || 0)}))}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor Pago</label>
                    <CurrencyInput
                      prefix="R$ "
                      allowDecimals={false}
                      disableAbbreviations
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      fixedDecimalLength={2}
                      formatValueOnBlur={false}
                      transformRawValue={transformRawCurrencyValue}
                      value={formData.valor_pago}
                      onValueChange={(value) => handleFixedDecimalValueChange(value, (v) => setFormData({...formData, valor_pago: Number(v || 0)}))}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tipo de Centro de Custo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Obra', 'Administrativo', 'Pessoal'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({...formData, centro_custo_tipo: t as 'Obra' | 'Administrativo' | 'Pessoal'})}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                            formData.centro_custo_tipo === t 
                              ? "bg-[#d4ff3f] border-[#d4ff3f] text-black shadow-[0_0_20px_rgba(212,255,63,0.3)]"
                              : "bg-[#0a0a0a] border-slate-800/50 text-slate-400 hover:border-slate-700"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.centro_custo_tipo === 'Obra' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Obra / Projeto</label>
                      <select 
                        value={formData.projeto_id}
                        onChange={(e) => setFormData({...formData, projeto_id: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      >
                        <option value="">Nenhum</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.centro_custo_tipo === 'Pessoal' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Indivíduo / Sócio</label>
                      <select 
                        value={formData.socio_id}
                        onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                      >
                        <option value="">Selecione um Sócio</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Categoria de Custo</label>
                    <select 
                      value={formData.categoria_custo}
                      onChange={(e) => setFormData({...formData, categoria_custo: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    >
                      <option value="">Nenhuma</option>
                      {COST_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Etapa da Obra</label>
                    <select 
                      value={formData.etapa_obra}
                      onChange={(e) => setFormData({...formData, etapa_obra: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-[#d4ff3f]/30 outline-none transition-all"
                    >
                      <option value="">Nenhuma</option>
                      {CONSTRUCTION_STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Situação</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Aberto', 'Pago', 'Em andamento'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, situacao: s as Payable['situacao']})}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                            formData.situacao === s 
                              ? "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a]" 
                              : "bg-[#0a0a0a] border-slate-800/50 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editingItem && (
                    <div className="col-span-2 rounded-2xl border border-slate-800/50 bg-[#0a0a0a] p-3">
                      <div>
                        <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Conta Bancária Operacional
                        </label>
                        {bankAccounts.length === 0 && (
                          <div className="mb-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                              Nenhuma conta bancária ativa cadastrada.
                            </p>
                            <Link
                              href="/finances/banking"
                              className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:text-white"
                            >
                              <Landmark size={12} />
                              Ir para Conexões Bancárias
                            </Link>
                          </div>
                        )}
                        <select
                          value={selectedBankAccountId}
                          onChange={(e) => setSelectedBankAccountId(e.target.value)}
                          className="w-full rounded-xl border border-slate-800/50 bg-[#050505] px-3 py-2.5 text-sm font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[#d4ff3f]/30"
                        >
                          <option value="">Selecione uma conta ativa</option>
                          {bankAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {getBankAccountLabel(account)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest', getApprovalStatusTone(editingItem.approval_status))}>
                          Aprovação: {editingItem.approval_status || 'nao_enviado'}
                        </span>
                        {editingItem.partner_payment_status && (
                          <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                            Banco: {editingItem.partner_payment_status}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {!editingItem.payment_request_id && editingItem.situacao !== 'Pago' && (
                          <button
                            type="button"
                            disabled={bankingBusy}
                            onClick={handleSendForApproval}
                            className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-300 transition-all hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            Enviar para Aprovação
                          </button>
                        )}
                        {editingItem.approval_status === 'pendente_aprovacao' && editingItem.payment_request_id && (
                          <button
                            type="button"
                            disabled={bankingBusy}
                            onClick={handleApproveCurrentPayment}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            Aprovar Pagamento
                          </button>
                        )}
                      </div>
                      {paymentRequests.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Solicitações Recentes</p>
                          <div className="space-y-2">
                            {paymentRequests.slice(0, 3).map((request) => (
                              <div key={request.id} className="rounded-xl border border-slate-800/50 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{request.request_type}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                      {formatDate(request.created_at)}
                                    </span>
                                    <span className={cn('rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest', getApprovalStatusTone(request.status))}>
                                      {request.status}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-1 text-[10px] font-bold text-slate-400">{formatCurrency(request.valor)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {auditLogs.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Auditoria</p>
                          <div className="space-y-2">
                            {auditLogs.slice(0, 3).map((log) => (
                              <div key={log.id} className="rounded-xl border border-slate-800/50 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-white">{log.action}</p>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{formatDate(log.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 border border-slate-800/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#0a0a0a] transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all"
                    >
                      {editingItem ? 'Salvar Alterações' : 'Adicionar Conta'}
                    </button>
                  </div>
                  {editingItem && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
                          handleDelete(editingItem.id);
                          handleCloseModal();
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Excluir Conta
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

