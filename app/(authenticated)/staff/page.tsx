'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import CurrencyInput from '@/components/CurrencyInput';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  FileText, 
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  X,
  Trash2,
  Upload,
  Wallet,
  ReceiptText,
  Clock3,
  Pencil,
  Moon,
  AlertTriangle,
  Settings,
  Filter,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface Curso {
  id: string;
  nome: string;
  duracao: string;
  validade: string;
}

interface DocumentoAnexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

interface StaffDepartment {
  id: string;
  nome: string;
}

interface PayrollMovement {
  id: string;
  funcionario_id: string;
  funcionario_nome_snapshot: string;
  competencia: string;
  indice_contabil?: string | null;
  data_admissao?: string | null;
  funcao?: string | null;
  local_trabalho?: string | null;
  adiantamento_valor?: number | null;
  falta_descricao?: string | null;
  atestado_descricao?: string | null;
  horas_trabalhadas?: string | null;
  horas_extras_50?: string | null;
  horas_extras_100?: string | null;
  adicional_noturno?: string | null;
  vale_transporte?: string | null;
  vale_cafe?: number | null;
  vale_mercado?: number | null;
  total_vales?: number | null;
  gratificacao?: number | null;
  observacoes?: string | null;
  financeiro_lancado_por?: string | null;
  financeiro_lancado_em?: string | null;
  experiencia_ativa?: boolean | null;
  dias_experiencia?: number | null;
  em_ferias?: boolean | null;
  data_inicio_ferias?: string | null;
  data_fim_ferias?: string | null;
  created_at: string;
}

interface StaffPayment {
  id: string;
  funcionario_id: string;
  funcionario_nome_snapshot: string;
  competencia: string;
  tipo?: 'adiantamento' | 'pagamento' | null;
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  operacao?: string | null;
  chave_pix?: string | null;
  valor?: number | null;
  referencia?: string | null;
  registrado_por?: string | null;
  created_at: string;
}

interface TimecardEntry {
  id: string;
  funcionario_id: string;
  competencia: string;
  data_referencia: string;
  origem: 'manual' | 'digital';
  entrada_1?: string | null;
  saida_1?: string | null;
  entrada_2?: string | null;
  saida_2?: string | null;
  entrada_3?: string | null;
  saida_3?: string | null;
  horas_trabalhadas: number;
  horas_extras_50: number;
  horas_extras_100: number;
  adicional_noturno: number;
  adicional_noturno_inicio?: string | null;
  adicional_noturno_fim?: string | null;
  periculosidade_descricao?: string | null;
  falta_descricao?: string | null;
  atestado_descricao?: string | null;
  observacoes?: string | null;
  created_at: string;
}

interface ReceiptSelectionState {
  movementId: string;
  vt: boolean;
  vc: boolean;
  vm: boolean;
  gratificacao: boolean;
  outros: boolean;
  outrosDescricao: string;
  outrosValor: string;
}

interface StaffMember {
  id: string;
  nome: string;
  id_funcionario: string;
  cargo: string;
  funcao?: string | null;
  unidade_obra?: string | null;
  departamento: string;
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Em Licença';
  url_imagem: string;
  data_admissao?: string | null;
  data_demissao?: string | null;
  tipo_contrato?: string | null;
  regime_trabalho?: string | null;
  ctps?: string | null;
  pis?: string | null;
  cbo?: string | null;
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  endereco?: string | null;
  contato?: string | null;
  salario_base?: string | null;
  adicional_insalubridade?: string | null;
  adicional_periculosidade?: string | null;
  indice_contabil?: string | null;
  local_trabalho?: string | null;
  banco?: string | null;
  agencia?: string | null;
  conta_bancaria?: string | null;
  operacao_conta?: string | null;
  chave_pix?: string | null;
  tipo_chave_pix?: string | null;
  experiencia_ativa?: boolean | null;
  dias_experiencia?: number | null;
  data_fim_experiencia?: string | null;
  em_ferias?: boolean | null;
  data_inicio_ferias?: string | null;
  data_fim_ferias?: string | null;
  observacoes_rh?: string | null;
  motivo_demissao?: string | null;
  tipo_desligamento?: string | null;
  cursos?: Curso[];
  documentos_anexos?: DocumentoAnexo[];
  created_at: string;
}

type AccordionSection =
  | 'cargo'
  | 'vinculo'
  | 'pessoais'
  | 'remuneracao'
  | 'bancario'
  | 'jornada'
  | 'cursos'
  | 'documentos'
  | 'desligamento';

type StaffDirectoryFilterState = {
  search: string;
  status: 'todos' | StaffMember['status'];
  category: string;
};

type PayrollFilterState = {
  search: string;
  situation: 'todas' | 'com-falta' | 'com-atestado' | 'em-experiencia' | 'em-ferias' | 'com-adiantamento' | 'regular';
  local: string;
};

const predefinedDepartments = ['Administrativo', 'Externo'] as const;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const toIsoDate = (value: unknown): string | null => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
};

const parseCurrencyLike = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();
  if (!raw || /^nao$/i.test(normalizeText(raw))) return null;

  const normalized = raw
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (value?: number | null) =>
  currencyFormatter.format(Number(value || 0));

const decimalHoursToLabel = (value?: number | null) => {
  const totalMinutes = Math.round(Number(value || 0) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m`;
};

const timeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getOverlapMinutes = (start: number, end: number, rangeStart: number, rangeEnd: number) => {
  const overlapStart = Math.max(start, rangeStart);
  const overlapEnd = Math.min(end, rangeEnd);
  return Math.max(0, overlapEnd - overlapStart);
};

const calculateSpanMinutes = (startRaw?: string | null, endRaw?: string | null) => {
  const start = timeToMinutes(startRaw);
  const end = timeToMinutes(endRaw);
  if (start === null || end === null) return 0;
  if (end > start) return end - start;
  if (end < start) return 24 * 60 - start + end;
  return 0;
};

const calculateShiftMetrics = (
  dateReference: string,
  punches: string[],
  manualNightWindow?: { inicio?: string | null; fim?: string | null }
) => {
  const pairs = [
    [punches[0], punches[1]],
    [punches[2], punches[3]],
    [punches[4], punches[5]],
  ] as const;

  let totalMinutes = 0;
  let nightMinutes = 0;

  pairs.forEach(([startRaw, endRaw]) => {
    const start = timeToMinutes(startRaw);
    const end = timeToMinutes(endRaw);
    if (start === null || end === null || end <= start) return;

    totalMinutes += end - start;

    const dayNightStart = 22 * 60;
    const dayNightEnd = 24 * 60;
    const earlyNightStart = 0;
    const earlyNightEnd = 5 * 60;

    nightMinutes += getOverlapMinutes(start, end, dayNightStart, dayNightEnd);
    nightMinutes += getOverlapMinutes(start, end, earlyNightStart, earlyNightEnd);
  });

  const date = new Date(`${dateReference}T00:00:00`);
  const weekday = date.getDay();
  let extra50Minutes = 0;
  let extra100Minutes = 0;

  if (weekday === 0) {
    extra100Minutes = totalMinutes;
  } else if (weekday === 6) {
    extra50Minutes = totalMinutes;
  }

  const manualNightMinutes = calculateSpanMinutes(
    manualNightWindow?.inicio || null,
    manualNightWindow?.fim || null
  );

  return {
    horas_trabalhadas: Number((totalMinutes / 60).toFixed(2)),
    horas_extras_50: Number((extra50Minutes / 60).toFixed(2)),
    horas_extras_100: Number((extra100Minutes / 60).toFixed(2)),
    adicional_noturno: Number(((nightMinutes + manualNightMinutes) / 60).toFixed(2)),
  };
};

const parseCompetenciaFromFileName = (fileName: string) => {
  const match = fileName.match(/(\d{2})_(\d{4})/);
  if (match) return `${match[2]}-${match[1]}`;

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const HAZARD_NOTES_HEADING = 'Periculosidade do cartão:';
const STAFF_SETTINGS_STORAGE_KEY = 'staff-rh-settings';
const COMPANY_SETTINGS_STORAGE_KEY = 'system-company-settings';
const SYSTEM_SETTINGS_COMPANY_KEY = 'company_profile';
const CBSL_LOGO_URL = 'https://raw.githubusercontent.com/baggiocrm-git/imagens/main/LOGO%20CBSL_sem%20escrita_Pequeno.png';
const RECEIPT_CITY = 'São Paulo - SP';

const stripGeneratedHazardNotes = (value?: string | null) =>
  String(value || '')
    .replace(new RegExp(`(?:\\n---\\n)?${HAZARD_NOTES_HEADING}[\\s\\S]*$`), '')
    .trim();

const mergePayrollNotes = (manualNotes?: string | null, generatedNotes?: string | null) => {
  const manual = stripGeneratedHazardNotes(manualNotes);
  const generated = String(generatedNotes || '').trim();
  if (!manual && !generated) return null;
  if (!generated) return manual || null;
  if (!manual) return `${HAZARD_NOTES_HEADING}\n${generated}`;
  return `${manual}\n---\n${HAZARD_NOTES_HEADING}\n${generated}`;
};

const parseNumericConfig = (value: string) => {
  const parsed = parseCurrencyLike(value);
  return parsed ?? 0;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getBenefitTotal = (
  movement: Pick<PayrollMovement, 'vale_transporte' | 'vale_cafe' | 'vale_mercado'>,
  valeTransportePrice: number
) => {
  const qty = Number(String(movement.vale_transporte || '').replace(/[^\d]/g, ''));
  return qty * valeTransportePrice + Number(movement.vale_cafe || 0) + Number(movement.vale_mercado || 0);
};

const numberToPortugueseWords = (value: number) => {
  const units = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const convertHundreds = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return unit ? `${tens[ten]} e ${units[unit]}` : tens[ten];
    }
    if (n === 100) return 'cem';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return remainder ? `${hundreds[hundred]} e ${convertHundreds(remainder)}` : hundreds[hundred];
  };

  const convertInteger = (n: number): string => {
    if (n === 0) return 'zero';

    const millions = Math.floor(n / 1000000);
    const thousands = Math.floor((n % 1000000) / 1000);
    const rest = n % 1000;
    const parts: string[] = [];

    if (millions) {
      parts.push(`${convertHundreds(millions)} ${millions === 1 ? 'milhão' : 'milhões'}`);
    }

    if (thousands) {
      if (thousands === 1) {
        parts.push('mil');
      } else {
        parts.push(`${convertHundreds(thousands)} mil`);
      }
    }

    if (rest) {
      parts.push(convertHundreds(rest));
    }

    return parts
      .filter(Boolean)
      .join(parts.length > 1 ? ', ' : '')
      .replace(/, ([^,]*)$/, ' e $1');
  };

  const integerPart = Math.floor(value);
  const cents = Math.round((value - integerPart) * 100);
  const integerWords = `${convertInteger(integerPart)} ${integerPart === 1 ? 'real' : 'reais'}`;

  if (!cents) return integerWords;

  return `${integerWords} e ${convertInteger(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`;
};

const inferDepartmentFromImport = (localTrabalho: string, funcao: string) => {
  const base = normalizeText(`${localTrabalho} ${funcao}`);

  if (
    base.includes('adm') ||
    base.includes('administr') ||
    base.includes('escritorio') ||
    base.includes('financeiro') ||
    base.includes('rh')
  ) {
    return 'Administrativo';
  }

  return 'Externo';
};

const parseObservationDates = (observation: string, competencia: string) => {
  const year = Number(competencia.slice(0, 4));
  const matches = [...observation.matchAll(/(\d{2})\/(\d{2})/g)];
  if (matches.length < 2) return { inicio: null, fim: null };

  const [first, second] = matches;
  return {
    inicio: `${year}-${first[2]}-${first[1]}`,
    fim: `${year}-${second[2]}-${second[1]}`,
  };
};

const calculateExperienceWindow = (admissionDate: string | null, competencia: string) => {
  if (!admissionDate) {
    return { experiencia_ativa: false, dias_experiencia: null as number | null, data_fim_experiencia: null as string | null };
  }

  const competenceDate = new Date(`${competencia}-28T00:00:00`);
  const admission = new Date(`${admissionDate}T00:00:00`);
  if (Number.isNaN(competenceDate.getTime()) || Number.isNaN(admission.getTime())) {
    return { experiencia_ativa: false, dias_experiencia: null as number | null, data_fim_experiencia: null as string | null };
  }

  const diffDays = Math.floor((competenceDate.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { experiencia_ativa: true, dias_experiencia: 45, data_fim_experiencia: admissionDate };
  }

  if (diffDays <= 45) {
    const end = new Date(admission);
    end.setDate(end.getDate() + 45);
    return { experiencia_ativa: true, dias_experiencia: 45, data_fim_experiencia: end.toISOString().slice(0, 10) };
  }

  if (diffDays <= 90) {
    const end = new Date(admission);
    end.setDate(end.getDate() + 90);
    return { experiencia_ativa: true, dias_experiencia: 90, data_fim_experiencia: end.toISOString().slice(0, 10) };
  }

  return { experiencia_ativa: false, dias_experiencia: null as number | null, data_fim_experiencia: null as string | null };
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [payrollMovements, setPayrollMovements] = useState<PayrollMovement[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<StaffPayment[]>([]);
  const [timecardEntries, setTimecardEntries] = useState<TimecardEntry[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([...predefinedDepartments]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingTimecard, setIsSavingTimecard] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimecardPanelOpen, setIsTimecardPanelOpen] = useState(false);
  const [isPaymentsPanelOpen, setIsPaymentsPanelOpen] = useState(false);
  const [isTimecardModalOpen, setIsTimecardModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isStaffSettingsOpen, setIsStaffSettingsOpen] = useState(false);
  const [isNightPopupOpen, setIsNightPopupOpen] = useState(false);
  const [isDirectoryFilterOpen, setIsDirectoryFilterOpen] = useState(false);
  const [isDirectoryExportOpen, setIsDirectoryExportOpen] = useState(false);
  const [isPayrollFilterOpen, setIsPayrollFilterOpen] = useState(false);
  const [isPayrollExportOpen, setIsPayrollExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);
  const [infoPopup, setInfoPopup] = useState<{ title: string; content: string } | null>(null);
  const [noteEditorPopup, setNoteEditorPopup] = useState<{ id: string; nome: string; value: string } | null>(null);
  const [receiptSelectionPopup, setReceiptSelectionPopup] = useState<ReceiptSelectionState | null>(null);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [timecardModalEmployee, setTimecardModalEmployee] = useState<StaffMember | null>(null);
  const [financeModalEmployee, setFinanceModalEmployee] = useState<StaffMember | null>(null);
  const [editingFinanceItem, setEditingFinanceItem] = useState<{
    kind: 'payment' | 'movement';
    id: string;
  } | null>(null);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);
  const [isCustomFunction, setIsCustomFunction] = useState(false);
  const [selectedCompetencia, setSelectedCompetencia] = useState('');
  const [selectedTimecardEmployeeId, setSelectedTimecardEmployeeId] = useState('');
  const [currentUserLabel, setCurrentUserLabel] = useState('Usuário atual');
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<AccordionSection, boolean>>({
    cargo: false,
    vinculo: false,
    pessoais: false,
    remuneracao: false,
    bancario: false,
    jornada: false,
    cursos: false,
    documentos: false,
    desligamento: false,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directoryHeaderRef = useRef<HTMLDivElement | null>(null);
  const payrollHeaderRef = useRef<HTMLDivElement | null>(null);
  const [timecardForm, setTimecardForm] = useState({
    data_referencia: new Date().toISOString().slice(0, 10),
    entrada_1: '',
    saida_1: '',
    entrada_2: '',
    saida_2: '',
    entrada_3: '',
    saida_3: '',
    adicional_noturno_inicio: '',
    adicional_noturno_fim: '',
    periculosidade_descricao: '',
    falta_descricao: '',
    atestado_descricao: '',
    observacoes: '',
  });
  const [financeForm, setFinanceForm] = useState({
    tipo_lancamento: 'adiantamento' as 'adiantamento' | 'pagamento',
    valor_lancamento: '',
    quantidade_vt: '',
    valor_vc: '',
    valor_vm: '',
  });
  const [staffSettings, setStaffSettings] = useState({
    valeTransportePreco: '0,00',
    valeMercadoPreco: '0,00',
  });
  const [companyReceiptCity, setCompanyReceiptCity] = useState(RECEIPT_CITY);
  const [directoryFilter, setDirectoryFilter] = useState<StaffDirectoryFilterState>({
    search: '',
    status: 'todos',
    category: 'todas',
  });
  const [payrollFilter, setPayrollFilter] = useState<PayrollFilterState>({
    search: '',
    situation: 'todas',
    local: 'todos',
  });
  const [formData, setFormData] = useState({
    nome: '',
    id_funcionario: '',
    cargo: '',
    funcao: '',
    unidade_obra: '',
    departamento: '',
    status: 'Ativo' as StaffMember['status'],
    url_imagem: '',
    data_admissao: '',
    data_demissao: '',
    tipo_contrato: '',
    regime_trabalho: '',
    ctps: '',
    pis: '',
    cbo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    estado_civil: '',
    endereco: '',
    contato: '',
    salario_base: '',
    adicional_insalubridade: '',
    adicional_periculosidade: '',
    indice_contabil: '',
    local_trabalho: '',
    banco: '',
    agencia: '',
    conta_bancaria: '',
    operacao_conta: '',
    chave_pix: '',
    tipo_chave_pix: '',
    experiencia_ativa: false,
    dias_experiencia: '',
    data_fim_experiencia: '',
    em_ferias: false,
    data_inicio_ferias: '',
    data_fim_ferias: '',
    observacoes_rh: '',
    motivo_demissao: '',
    tipo_desligamento: '',
    cursos: [] as Curso[],
    documentos_anexos: [] as DocumentoAnexo[],
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: staffData, error: staffError } = await supabase
        .from('equipe')
        .select('*')
        .order('created_at', { ascending: false });

      if (staffError) throw staffError;
      setStaffList(staffData || []);
    } catch (error) {
      console.error('Erro ao buscar dados da equipe:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipe_departamentos')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;

      const names = (data as StaffDepartment[] | null)?.map((department) => department.nome).filter(Boolean) || [];
      const merged = Array.from(new Set([...predefinedDepartments, ...names]));
      setDepartmentOptions(merged);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error instanceof Error ? error.message : String(error));
      setDepartmentOptions([...predefinedDepartments]);
    }
  }, []);

  const fetchPayrollMovements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipe_movimentos_mensais')
        .select('*')
        .order('competencia', { ascending: false })
        .order('funcionario_nome_snapshot', { ascending: true });

      if (error) throw error;
      setPayrollMovements((data as PayrollMovement[] | null) || []);
    } catch (error) {
      console.error('Erro ao buscar movimentações mensais:', error instanceof Error ? error.message : String(error));
      setPayrollMovements([]);
    }
  }, []);

  const fetchPaymentRecords = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipe_pagamentos')
        .select('*')
        .order('competencia', { ascending: false })
        .order('funcionario_nome_snapshot', { ascending: true });

      if (error) throw error;
      setPaymentRecords((data as StaffPayment[] | null) || []);
    } catch (error) {
      console.error('Erro ao buscar pagamentos da equipe:', error instanceof Error ? error.message : String(error));
      setPaymentRecords([]);
    }
  }, []);

  const fetchTimecards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipe_cartoes_ponto')
        .select('*')
        .order('data_referencia', { ascending: false });

      if (error) throw error;
      setTimecardEntries((data as TimecardEntry[] | null) || []);
    } catch (error) {
      console.error('Erro ao buscar cartões de ponto:', error instanceof Error ? error.message : String(error));
      setTimecardEntries([]);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
    fetchDepartments();
    fetchPayrollMovements();
    fetchPaymentRecords();
    fetchTimecards();
  }, [fetchData, fetchDepartments, fetchPayrollMovements, fetchPaymentRecords, fetchTimecards]);

  useEffect(() => {
    if (!selectedCompetencia && payrollMovements.length > 0) {
      setSelectedCompetencia(payrollMovements[0].competencia);
    }
  }, [payrollMovements, selectedCompetencia]);

  useEffect(() => {
    if (!selectedTimecardEmployeeId && staffList.length > 0) {
      setSelectedTimecardEmployeeId(staffList[0].id);
    }
  }, [staffList, selectedTimecardEmployeeId]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.trim();
      if (email) {
        setCurrentUserLabel(email);
      }
    };

    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STAFF_SETTINGS_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<typeof staffSettings>;
      setStaffSettings((current) => ({
        valeTransportePreco: parsed.valeTransportePreco || current.valeTransportePreco,
        valeMercadoPreco: parsed.valeMercadoPreco || current.valeMercadoPreco,
      }));
    } catch {
      // ignore invalid local settings
    }
  }, []);

  useEffect(() => {
    const loadCompanyReceiptCity = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', SYSTEM_SETTINGS_COMPANY_KEY)
        .maybeSingle();

      if (!error) {
        const value = data?.value as { companyCity?: string } | null;
        if (value?.companyCity?.trim()) {
          setCompanyReceiptCity(value.companyCity.trim());
          return;
        }
      }

      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as { companyCity?: string };
        if (parsed.companyCity?.trim()) {
          setCompanyReceiptCity(parsed.companyCity.trim());
        }
      } catch {
        // ignore invalid company settings
      }
    };

    void loadCompanyReceiptCity();
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (directoryHeaderRef.current && !directoryHeaderRef.current.contains(target)) {
        setIsDirectoryFilterOpen(false);
        setIsDirectoryExportOpen(false);
      }

      if (payrollHeaderRef.current && !payrollHeaderRef.current.contains(target)) {
        setIsPayrollFilterOpen(false);
        setIsPayrollExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const payrollCompetencias = useMemo(
    () => Array.from(new Set(payrollMovements.map((movement) => movement.competencia))),
    [payrollMovements]
  );

  const functionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          staffList
            .map((member) => (member.funcao || member.cargo || '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [staffList]
  );

  const configuredValeTransportePrice = useMemo(
    () => parseNumericConfig(staffSettings.valeTransportePreco),
    [staffSettings.valeTransportePreco]
  );

  const configuredValeMercadoPrice = useMemo(
    () => parseNumericConfig(staffSettings.valeMercadoPreco),
    [staffSettings.valeMercadoPreco]
  );

  const getValeTransporteAmount = useCallback(
    (quantity?: string | null) => {
      const qty = Number(String(quantity || '').replace(/[^\d]/g, ''));
      if (!qty || !configuredValeTransportePrice) return 0;
      return qty * configuredValeTransportePrice;
    },
    [configuredValeTransportePrice]
  );

  const currentPayrollMovements = useMemo(
    () => {
      const competenciaBase = selectedCompetencia || new Date().toISOString().slice(0, 7);
      const filtered = payrollMovements.filter((movement) =>
        selectedCompetencia ? movement.competencia === selectedCompetencia : movement.competencia === competenciaBase
      );

      const movementMap = new Map(filtered.map((movement) => [movement.funcionario_id, movement]));

      return [...staffList]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map((member) => {
          const existing = movementMap.get(member.id);

          if (existing) return existing;

          return {
            id: `virtual-${member.id}-${competenciaBase}`,
            funcionario_id: member.id,
            funcionario_nome_snapshot: member.nome,
            competencia: competenciaBase,
            indice_contabil: member.indice_contabil || null,
            data_admissao: member.data_admissao || null,
            funcao: member.funcao || member.cargo || null,
            local_trabalho: member.local_trabalho || member.unidade_obra || null,
            adiantamento_valor: null,
            falta_descricao: null,
            atestado_descricao: null,
            horas_trabalhadas: null,
            horas_extras_50: null,
            horas_extras_100: null,
            adicional_noturno: null,
            vale_transporte: null,
            vale_cafe: null,
            vale_mercado: null,
            total_vales: null,
            gratificacao: null,
            observacoes: null,
            financeiro_lancado_por: null,
            financeiro_lancado_em: null,
            experiencia_ativa: member.experiencia_ativa ?? null,
            dias_experiencia: member.dias_experiencia ?? null,
            em_ferias: member.em_ferias ?? null,
            data_inicio_ferias: member.data_inicio_ferias || null,
            data_fim_ferias: member.data_fim_ferias || null,
            created_at: member.created_at,
          } as PayrollMovement;
        });
    },
    [payrollMovements, selectedCompetencia, staffList]
  );

  const currentPayments = useMemo(() => {
    const competenciaBase = selectedCompetencia || new Date().toISOString().slice(0, 7);
    const filteredPayments = paymentRecords.filter((payment) =>
      selectedCompetencia ? payment.competencia === selectedCompetencia : payment.competencia === competenciaBase
    );

    const paymentsByEmployee = new Map<string, StaffPayment[]>();
    filteredPayments.forEach((payment) => {
      const current = paymentsByEmployee.get(payment.funcionario_id) || [];
      current.push(payment);
      paymentsByEmployee.set(payment.funcionario_id, current);
    });

    return [...staffList]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .flatMap((member) => {
        const memberPayments = paymentsByEmployee.get(member.id) || [];

        if (memberPayments.length === 0) {
          return [
            {
              id: `virtual-payment-${member.id}-${competenciaBase}`,
              funcionario_id: member.id,
              funcionario_nome_snapshot: member.nome,
              competencia: competenciaBase,
              tipo: null,
              banco: member.banco || null,
              agencia: member.agencia || null,
              conta: member.conta_bancaria || null,
              operacao: member.operacao_conta || null,
              chave_pix: member.chave_pix || null,
              valor: null,
              referencia: null,
              registrado_por: null,
              created_at: member.created_at,
            },
          ];
        }

        return memberPayments.map((payment) => ({
          ...payment,
          funcionario_nome_snapshot: member.nome,
          banco: member.banco || payment.banco || null,
          agencia: member.agencia || payment.agencia || null,
          conta: member.conta_bancaria || payment.conta || null,
          operacao: member.operacao_conta || payment.operacao || null,
          chave_pix: member.chave_pix || payment.chave_pix || null,
        }));
      });
  }, [paymentRecords, selectedCompetencia, staffList]);

  const currentTimecards = useMemo(
    () =>
      timecardEntries.filter((entry) =>
        selectedCompetencia ? entry.competencia === selectedCompetencia : true
      ),
    [timecardEntries, selectedCompetencia]
  );

  const payrollLocationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          staffList
            .map((member) => (member.local_trabalho || member.unidade_obra || '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [staffList]
  );

  const selectedTimecardEmployee = useMemo(
    () => staffList.find((member) => member.id === selectedTimecardEmployeeId) || null,
    [staffList, selectedTimecardEmployeeId]
  );

  const selectedEmployeeTimecards = useMemo(
    () => currentTimecards.filter((entry) => entry.funcionario_id === selectedTimecardEmployeeId),
    [currentTimecards, selectedTimecardEmployeeId]
  );

  const modalEmployeeTimecards = useMemo(
    () =>
      currentTimecards.filter((entry) => entry.funcionario_id === (timecardModalEmployee?.id || '')),
    [currentTimecards, timecardModalEmployee]
  );

  const financeHistory = useMemo(() => {
    if (!financeModalEmployee || !selectedCompetencia) return [];

    const history: Array<{
      id: string;
      sourceId: string;
      kind: 'payment' | 'movement';
      paymentType?: 'adiantamento' | 'pagamento';
      tipo: string;
      detalhe: string;
      valor: string;
      autor: string;
      data: string;
      sortKey: string;
      rawValor?: number | null;
      rawVT?: string | null;
      rawVC?: number | null;
      rawVM?: number | null;
    }> = [];

    currentPayments
      .filter(
        (payment) =>
          payment.funcionario_id === financeModalEmployee.id &&
          payment.competencia === selectedCompetencia &&
          !String(payment.id).startsWith('virtual-payment-') &&
          Boolean(payment.tipo)
      )
      .forEach((payment) => {
        history.push({
          id: `payment-${payment.id}`,
          sourceId: payment.id,
          kind: 'payment',
          paymentType: payment.tipo,
          tipo: payment.tipo === 'adiantamento' ? 'Adiantamento' : 'Pagamento',
          detalhe: payment.referencia || '-',
          valor: formatCurrency(payment.valor),
          autor: payment.registrado_por || 'Sem identificação',
          data: formatDate(payment.created_at?.slice(0, 10) || null),
          sortKey: payment.created_at || '',
          rawValor: payment.valor,
        });
      });

    const movement = payrollMovements.find(
      (item) =>
        item.funcionario_id === financeModalEmployee.id &&
        item.competencia === selectedCompetencia
    );

    if (movement && (movement.vale_transporte || movement.vale_cafe || movement.vale_mercado)) {
      history.push({
        id: `movement-${movement.id}`,
        sourceId: movement.id,
        kind: 'movement',
        tipo: 'Benefícios',
        detalhe: `VT ${movement.vale_transporte || '-'} • VC ${formatCurrency(movement.vale_cafe)} • VM ${formatCurrency(movement.vale_mercado || configuredValeMercadoPrice)}`,
        valor: formatCurrency(getBenefitTotal(movement, configuredValeTransportePrice)),
        autor: movement.financeiro_lancado_por || 'Sem identificação',
        data: formatDate(movement.financeiro_lancado_em?.slice(0, 10) || null),
        sortKey: movement.financeiro_lancado_em || '',
        rawVT: movement.vale_transporte,
        rawVC: movement.vale_cafe,
        rawVM: movement.vale_mercado,
      });
    }

    return history.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [configuredValeMercadoPrice, currentPayments, financeModalEmployee, getValeTransporteAmount, payrollMovements, selectedCompetencia]);

  const selectedEmployeeTimecardSummary = useMemo(() => {
    return selectedEmployeeTimecards.reduce(
      (acc, entry) => {
        acc.horas += Number(entry.horas_trabalhadas || 0);
        acc.extra50 += Number(entry.horas_extras_50 || 0);
        acc.extra100 += Number(entry.horas_extras_100 || 0);
        acc.noturno += Number(entry.adicional_noturno || 0);
        return acc;
      },
      { horas: 0, extra50: 0, extra100: 0, noturno: 0 }
    );
  }, [selectedEmployeeTimecards]);

  const payrollSummary = useMemo(() => {
    return currentPayrollMovements.reduce(
      (acc, movement) => {
        acc.adiantamentos += Number(movement.adiantamento_valor || 0);
        acc.vales += getBenefitTotal(movement, configuredValeTransportePrice);
        acc.vc += Number(movement.vale_cafe || 0);
        acc.vm += Number(movement.vale_mercado || 0);
        acc.gratificacoes += Number(movement.gratificacao || 0);
        if (movement.experiencia_ativa) acc.experiencia += 1;
        if (movement.em_ferias) acc.ferias += 1;
        return acc;
      },
      { adiantamentos: 0, vales: 0, vc: 0, vm: 0, gratificacoes: 0, experiencia: 0, ferias: 0 }
    );
  }, [configuredValeTransportePrice, currentPayrollMovements]);

  const handleOpenImport = () => fileInputRef.current?.click();

  const resetFinanceForm = () => {
    setFinanceForm({
      tipo_lancamento: 'adiantamento',
      valor_lancamento: '',
      quantidade_vt: '',
      valor_vc: '',
      valor_vm: '',
    });
    setEditingFinanceItem(null);
  };

  const resetTimecardForm = () => {
    setTimecardForm({
      data_referencia: new Date().toISOString().slice(0, 10),
      entrada_1: '',
      saida_1: '',
      entrada_2: '',
      saida_2: '',
      entrada_3: '',
      saida_3: '',
      adicional_noturno_inicio: '',
      adicional_noturno_fim: '',
      periculosidade_descricao: '',
      falta_descricao: '',
      atestado_descricao: '',
      observacoes: '',
    });
  };

  const openIndividualTimecard = (member: StaffMember) => {
    setSelectedTimecardEmployeeId(member.id);
    setTimecardModalEmployee(member);
    resetTimecardForm();
    setIsTimecardModalOpen(true);
  };

  const openFinanceModal = (member: StaffMember) => {
    setFinanceModalEmployee(member);
    resetFinanceForm();
    setIsFinanceModalOpen(true);
  };

  const handleEditFinanceItem = (item: (typeof financeHistory)[number]) => {
    if (item.kind === 'payment') {
      setFinanceForm({
        tipo_lancamento: item.paymentType || 'adiantamento',
        valor_lancamento: item.rawValor != null ? String(item.rawValor).replace('.', ',') : '',
        quantidade_vt: '',
        valor_vc: '',
        valor_vm: '',
      });
    } else {
      setFinanceForm({
        tipo_lancamento: 'adiantamento',
        valor_lancamento: '',
        quantidade_vt: item.rawVT || '',
        valor_vc: item.rawVC != null ? String(item.rawVC).replace('.', ',') : '',
        valor_vm: item.rawVM != null ? String(item.rawVM).replace('.', ',') : '',
      });
    }

    setEditingFinanceItem({
      kind: item.kind,
      id: item.sourceId,
    });
  };

  const handleDeleteFinanceItem = async (item: (typeof financeHistory)[number]) => {
    if (!window.confirm('Deseja apagar este lançamento financeiro?')) return;

    try {
      if (item.kind === 'payment') {
        if (item.sourceId.startsWith('virtual-payment-')) {
          return;
        }

        const { error } = await supabase.from('equipe_pagamentos').delete().eq('id', item.sourceId);
        if (error) throw error;

        if (item.paymentType === 'adiantamento' && financeModalEmployee && selectedCompetencia) {
          const { error: movementError } = await supabase
            .from('equipe_movimentos_mensais')
            .update({ adiantamento_valor: null })
            .eq('funcionario_id', financeModalEmployee.id)
            .eq('competencia', selectedCompetencia);

          if (movementError) throw movementError;
        }
      } else {
        const { error } = await supabase
          .from('equipe_movimentos_mensais')
          .update({
            vale_transporte: null,
            vale_cafe: null,
            vale_mercado: null,
            total_vales: null,
            financeiro_lancado_por: null,
            financeiro_lancado_em: null,
          })
          .eq('id', item.sourceId);

        if (error) throw error;
      }

      if (editingFinanceItem?.kind === item.kind && editingFinanceItem.id === item.sourceId) {
        resetFinanceForm();
      }

      await Promise.all([fetchPayrollMovements(), fetchPaymentRecords()]);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao apagar lançamento financeiro do RH:', error);
      alert(`Falha ao apagar lançamento financeiro: ${errorMessage}`);
    }
  };

  const markTimecardAsAbsence = () => {
    setTimecardForm((current) => ({
      ...current,
      entrada_1: '',
      saida_1: '',
      entrada_2: '',
      saida_2: '',
      entrada_3: '',
      saida_3: '',
      adicional_noturno_inicio: '',
      adicional_noturno_fim: '',
      falta_descricao: current.falta_descricao.trim() ? current.falta_descricao : 'Falta',
      atestado_descricao: '',
    }));
  };

  const markTimecardAsCertificate = () => {
    setTimecardForm((current) => ({
      ...current,
      entrada_1: '',
      saida_1: '',
      entrada_2: '',
      saida_2: '',
      entrada_3: '',
      saida_3: '',
      adicional_noturno_inicio: '',
      adicional_noturno_fim: '',
      falta_descricao: '',
      atestado_descricao: current.atestado_descricao.trim() ? current.atestado_descricao : 'ATESTADO',
    }));
  };

  const applyHazardObservation = () => {
    const hazardLabel = 'Adicional de Periculosidade';
    setTimecardForm((current) => {
      const currentObservation = current.observacoes.trim();
      const nextObservation = currentObservation
        ? currentObservation.includes(hazardLabel)
          ? current.observacoes
          : `${currentObservation} | ${hazardLabel}`
        : hazardLabel;

      return {
        ...current,
        observacoes: nextObservation,
        periculosidade_descricao: current.periculosidade_descricao.trim() || hazardLabel,
      };
    });
  };

  const advanceTimecardDate = () => {
    setTimecardForm((current) => {
      if (!current.data_referencia) return current;
      const date = new Date(`${current.data_referencia}T00:00:00`);
      if (Number.isNaN(date.getTime())) return current;
      date.setDate(date.getDate() + 1);
      return {
        ...current,
        data_referencia: date.toISOString().slice(0, 10),
        entrada_1: '',
        saida_1: '',
        entrada_2: '',
        saida_2: '',
        entrada_3: '',
        saida_3: '',
        adicional_noturno_inicio: '',
        adicional_noturno_fim: '',
        periculosidade_descricao: '',
        falta_descricao: '',
        atestado_descricao: '',
        observacoes: '',
      };
    });
  };

  const handleQuickAbsenceEntry = async () => {
    if (!selectedTimecardEmployeeId) {
      alert('Selecione um funcionário para lançar a falta.');
      return;
    }

    if (!timecardForm.data_referencia || !selectedCompetencia) {
      alert('Selecione a competência e a data da falta.');
      return;
    }

    setIsSavingTimecard(true);

    try {
      const payload = {
        funcionario_id: selectedTimecardEmployeeId,
        competencia: selectedCompetencia,
        data_referencia: timecardForm.data_referencia,
        origem: 'manual',
        entrada_1: null,
        saida_1: null,
        entrada_2: null,
        saida_2: null,
        entrada_3: null,
        saida_3: null,
        adicional_noturno_inicio: null,
        adicional_noturno_fim: null,
        periculosidade_descricao: null,
        falta_descricao: 'FALTA',
        atestado_descricao: null,
        observacoes: timecardForm.observacoes.trim() || null,
        horas_trabalhadas: 0,
        horas_extras_50: 0,
        horas_extras_100: 0,
        adicional_noturno: 0,
      };

      const { error } = await supabase
        .from('equipe_cartoes_ponto')
        .upsert([payload], { onConflict: 'funcionario_id,data_referencia' });

      if (error) throw error;

      await fetchTimecards();
      await syncMovementFromTimecards(selectedTimecardEmployeeId, selectedCompetencia);
      await fetchPayrollMovements();

      setTimecardForm((current) => ({
        ...current,
        entrada_1: '',
        saida_1: '',
        entrada_2: '',
        saida_2: '',
        entrada_3: '',
        saida_3: '',
        adicional_noturno_inicio: '',
        adicional_noturno_fim: '',
        periculosidade_descricao: '',
        falta_descricao: 'FALTA',
        atestado_descricao: '',
        observacoes: '',
      }));

      advanceTimecardDate();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao lançar falta rápida:', error);
      alert(`Falha ao lançar falta: ${errorMessage}`);
    } finally {
      setIsSavingTimecard(false);
    }
  };

  const savePrintableReceipt = async (title: string, bodyHtml: string, extraStyles = '') => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=700');
    if (!receiptWindow) {
      alert('Não foi possível abrir a janela de impressão.');
      return;
    }

    receiptWindow.document.write(`
      <html lang="pt-BR">
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            .receipt-header { display:flex; align-items:flex-start; gap:16px; margin-bottom:20px; }
            .receipt-logo { width:54px; height:54px; object-fit:contain; }
            .receipt-headline { flex:1; text-align:center; padding-right:54px; }
            .receipt-title { font-size:28px; font-weight:900; letter-spacing:0.08em; margin:0; }
            .receipt-company { font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-top:6px; color:#444; }
            h2 { font-size: 16px; margin: 24px 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; text-align: left; }
            th { background: #f2f2f2; }
            .signature { margin-top: 48px; display: flex; justify-content: space-between; gap: 24px; }
            .signature div { flex: 1; border-top: 1px solid #111; padding-top: 8px; font-size: 12px; text-align: center; }
            ${extraStyles}
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    receiptWindow.print();
  };

  const openReceiptSelection = (movement: PayrollMovement) => {
    setReceiptSelectionPopup({
      movementId: movement.id,
      vt: Boolean(movement.vale_transporte),
      vc: Number(movement.vale_cafe || 0) > 0,
      vm: Number(movement.vale_mercado || 0) > 0,
      gratificacao: Number(movement.gratificacao || 0) > 0,
      outros: false,
      outrosDescricao: '',
      outrosValor: '',
    });
  };

  const handlePrintIndividualReceipt = async (movement: PayrollMovement, selection: ReceiptSelectionState) => {
    const receiptItems: Array<{ label: string; value: number }> = [];

    if (selection.vt) {
      receiptItems.push({
        label: `Vale Transporte${movement.vale_transporte ? ` (${movement.vale_transporte})` : ''}`,
        value: getValeTransporteAmount(movement.vale_transporte),
      });
    }
    if (selection.vc) receiptItems.push({ label: 'Vale Café', value: Number(movement.vale_cafe || 0) });
    if (selection.vm) receiptItems.push({ label: 'Vale Mercado', value: Number(movement.vale_mercado || 0) });
    if (selection.gratificacao) receiptItems.push({ label: 'Gratificação', value: Number(movement.gratificacao || 0) });
    if (selection.outros && selection.outrosDescricao.trim()) {
      receiptItems.push({
        label: selection.outrosDescricao.trim(),
        value: parseCurrencyLike(selection.outrosValor) || 0,
      });
    }

    if (receiptItems.length === 0) {
      alert('Selecione pelo menos um item para gerar o recibo.');
      return;
    }

    const rows = receiptItems
      .map((item) => `<tr><td>${item.label}</td><td>${formatCurrency(item.value)}</td></tr>`)
      .join('');
    const total = receiptItems.reduce((sum, item) => sum + item.value, 0);
    const totalPorExtenso = numberToPortugueseWords(total);
    const printedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const body = `
      <div class="receipt-header">
        <img src="${CBSL_LOGO_URL}" alt="Logo CBSL" class="receipt-logo" />
        <div class="receipt-headline">
          <h1 class="receipt-title">RECIBO</h1>
          <div class="receipt-company">Construtora Baggio Silveira Ltda.</div>
        </div>
      </div>
      <p><strong>Funcionário:</strong> ${movement.funcionario_nome_snapshot}</p>
      <table>
        <thead>
          <tr><th>Benefício</th><th>Valor</th></tr>
        </thead>
        <tbody>
          ${rows}
          <tr><td><strong>Total</strong></td><td><strong>${formatCurrency(total)}</strong></td></tr>
        </tbody>
      </table>
      <p style="margin-top:24px;">
        Recebi da <strong>Construtora Baggio Silveira Ltda.</strong>, a importância de
        <strong> ${formatCurrency(total)}</strong> (${totalPorExtenso}).
      </p>
      <p style="margin-top:28px;">${companyReceiptCity}, ${printedDate}</p>
      <div class="signature">
        <div>Assinatura do colaborador</div>
        <div>Responsável pelo pagamento</div>
      </div>
    `;

    await savePrintableReceipt(`Recibo ${movement.funcionario_nome_snapshot}`, body);
  };

  const handlePrintCollectiveReceipt = () => {
    const printedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const cards = filteredPayrollMovements
      .map((movement) => {
        const receiptItems: Array<{ label: string; value: number }> = [];

        if (movement.vale_transporte) {
          receiptItems.push({
            label: `Vale Transporte (${movement.vale_transporte})`,
            value: getValeTransporteAmount(movement.vale_transporte),
          });
        }
        if (Number(movement.vale_cafe || 0) > 0) {
          receiptItems.push({ label: 'Vale Café', value: Number(movement.vale_cafe || 0) });
        }
        if (Number(movement.vale_mercado || 0) > 0) {
          receiptItems.push({ label: 'Vale Mercado', value: Number(movement.vale_mercado || 0) });
        }
        if (Number(movement.gratificacao || 0) > 0) {
          receiptItems.push({ label: 'Gratificação', value: Number(movement.gratificacao || 0) });
        }

        if (receiptItems.length === 0) return '';

        const rows = receiptItems
          .map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(formatCurrency(item.value))}</td></tr>`)
          .join('');
        const total = receiptItems.reduce((sum, item) => sum + item.value, 0);

        return `
          <section class="collective-receipt-card">
            <div class="collective-header">
              <img src="${CBSL_LOGO_URL}" alt="Logo CBSL" class="collective-logo" />
              <div class="collective-title-wrap">
                <h2 class="collective-title">RECIBO</h2>
                <div class="collective-company">Construtora Baggio Silveira Ltda.</div>
              </div>
            </div>
            <div class="collective-name">${escapeHtml(movement.funcionario_nome_snapshot)}</div>
            <table class="collective-table">
              <thead>
                <tr><th>Item</th><th>Valor</th></tr>
              </thead>
              <tbody>
                ${rows}
                <tr><td><strong>Total</strong></td><td><strong>${escapeHtml(formatCurrency(total))}</strong></td></tr>
              </tbody>
            </table>
            <p class="collective-text">
              Recebi da <strong>Construtora Baggio Silveira Ltda.</strong>, a importância de
              <strong>${escapeHtml(formatCurrency(total))}</strong> (${escapeHtml(numberToPortugueseWords(total))}).
            </p>
            <p class="collective-city">${escapeHtml(companyReceiptCity)}, ${escapeHtml(printedDate)}</p>
            <div class="collective-signature">Assinatura do colaborador</div>
          </section>
        `;
      })
      .filter(Boolean)
      .join('');

    if (!cards) {
      alert('Não há benefícios lançados para gerar recibos coletivos nesta visualização.');
      return;
    }

    const body = `<div class="collective-grid">${cards}</div>`;
    const styles = `
      @page { size: A4 portrait; margin: 8mm; }
      body { background:#fff; padding:0; }
      .collective-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; }
      .collective-receipt-card {
        height: 84mm;
        border: 1px solid #d4d4d8;
        border-radius: 14px;
        padding: 4.5mm;
        box-sizing: border-box;
        break-inside: avoid;
        page-break-inside: avoid;
        display:flex;
        flex-direction:column;
      }
      .collective-header { display:flex; align-items:flex-start; gap:10px; }
      .collective-logo { width:34px; height:34px; object-fit:contain; flex-shrink:0; }
      .collective-title-wrap { flex:1; text-align:center; padding-right:34px; }
      .collective-title { margin:0; font-size:18px; font-weight:900; letter-spacing:0.12em; }
      .collective-company { margin-top:3px; font-size:9px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#444; }
      .collective-name { margin-top:6px; font-size:12px; font-weight:700; }
      .collective-table { width:100%; border-collapse:collapse; margin-top:6px; }
      .collective-table th, .collective-table td { border:1px solid #ddd; padding:3px 5px; font-size:8.5px; }
      .collective-table th { background:#f5f5f5; }
      .collective-text { margin-top:6px; margin-bottom:3px; font-size:8.5px; line-height:1.3; }
      .collective-city { margin-top:8px; font-size:9px; text-align:center; }
      .collective-signature { margin-top:22px; width:50%; align-self:center; border-top:1px solid #111; padding-top:4px; text-align:center; font-size:8.5px; }
    `;

    savePrintableReceipt('Recibos coletivos de benefícios', body, styles);
  };

  const exportDirectoryToXlsx = () => {
    const rows = sortedStaffExportList.map((person) => ({
      Funcionário: person.nome,
      Função: person.funcao || person.cargo || '-',
      Status: person.status,
      Departamento: person.departamento || '-',
      Local: person.local_trabalho || person.unidade_obra || '-',
      Admissão: formatDate(person.data_admissao),
      Índice: person.indice_contabil || '-',
    }));

    if (rows.length === 0) {
      alert('Não há funcionários nesta filtragem para exportar.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DiretorioEquipe');
    XLSX.writeFile(workbook, `diretorio-equipe-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setIsDirectoryExportOpen(false);
  };

  const exportDirectoryToPdf = () => {
    if (sortedStaffExportList.length === 0) {
      alert('Não há funcionários nesta filtragem para exportar.');
      return;
    }

    const rows = sortedStaffExportList
      .map(
        (person) => `
          <tr>
            <td>${escapeHtml(person.nome)}</td>
            <td>${escapeHtml(person.funcao || person.cargo || '-')}</td>
            <td>${escapeHtml(person.status)}</td>
            <td>${escapeHtml(person.departamento || '-')}</td>
            <td>${escapeHtml(person.local_trabalho || person.unidade_obra || '-')}</td>
          </tr>
        `
      )
      .join('');

    const body = `
      <h1>Diretório de Equipe</h1>
      <p><strong>Total filtrado:</strong> ${sortedStaffExportList.length} funcionário(s)</p>
      <table>
        <thead>
          <tr>
            <th>Funcionário</th>
            <th>Função</th>
            <th>Status</th>
            <th>Departamento</th>
            <th>Local</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    setIsDirectoryExportOpen(false);
    void savePrintableReceipt(
      'Diretório de Equipe',
      body,
      `
        @page { size: A4 portrait; margin: 8mm; }
        body { padding: 10px; }
        h1 { margin: 0 0 6px; font-size: 18px; }
        p { margin: 0 0 8px; font-size: 10px; }
        table { margin-top: 6px; table-layout: fixed; }
        th, td { padding: 4px 5px; font-size: 9px; white-space: nowrap; }
      `
    );
  };

  const exportPayrollToXlsx = () => {
    const rows = filteredPayrollMovements.map((movement) => ({
      Funcionário: movement.funcionario_nome_snapshot,
      Código: movement.indice_contabil || '-',
      Admissão: formatDate(movement.data_admissao),
      Função: movement.funcao || '-',
      Local: movement.local_trabalho || '-',
      Adiantamento: formatCurrency(movement.adiantamento_valor),
      Faltas: movement.falta_descricao || '-',
      Atestados: movement.atestado_descricao || '-',
      Notas: movement.observacoes || '-',
      'h/Trab': movement.horas_trabalhadas || '-',
      Ex50: movement.horas_extras_50 || '-',
      Ex100: movement.horas_extras_100 || '-',
      '+Not': movement.adicional_noturno || '-',
      VT: movement.vale_transporte || '-',
      VC: formatCurrency(movement.vale_cafe),
      VM: formatCurrency(movement.vale_mercado),
      'VM+VC': formatCurrency(getBenefitTotal(movement, configuredValeTransportePrice)),
      Gratificação: formatCurrency(movement.gratificacao),
      Situação:
        movement.experiencia_ativa
          ? `Exp. ${movement.dias_experiencia || 45}d`
          : movement.em_ferias
            ? 'Férias'
            : 'Regular',
    }));

    if (rows.length === 0) {
      alert('Não há lançamentos nesta filtragem para exportar.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PainelMensalRH');
    XLSX.writeFile(workbook, `painel-mensal-rh-${selectedCompetencia || new Date().toISOString().slice(0, 7)}.xlsx`);
    setIsPayrollExportOpen(false);
  };

  const exportPayrollToPdf = () => {
    if (filteredPayrollMovements.length === 0) {
      alert('Não há lançamentos nesta filtragem para exportar.');
      return;
    }

    const rows = filteredPayrollMovements
      .map(
        (movement) => `
          <tr>
            <td>${escapeHtml(movement.funcionario_nome_snapshot)}</td>
            <td>${escapeHtml(movement.funcao || '-')}</td>
            <td>${escapeHtml(movement.local_trabalho || '-')}</td>
            <td>${escapeHtml(formatCurrency(movement.adiantamento_valor))}</td>
            <td>${escapeHtml(movement.horas_trabalhadas || '-')}</td>
            <td>${escapeHtml(formatCurrency(getBenefitTotal(movement, configuredValeTransportePrice)))}</td>
            <td>${escapeHtml(
              movement.experiencia_ativa
                ? `Exp. ${movement.dias_experiencia || 45}d`
                : movement.em_ferias
                  ? 'Férias'
                  : 'Regular'
            )}</td>
          </tr>
        `
      )
      .join('');

    const body = `
      <h1>Painel Mensal de RH</h1>
      <p><strong>Competência:</strong> ${escapeHtml(selectedCompetencia || '-')}</p>
      <p><strong>Total filtrado:</strong> ${filteredPayrollMovements.length} funcionário(s)</p>
      <table>
        <thead>
          <tr>
            <th>Funcionário</th>
            <th>Função</th>
            <th>Local</th>
            <th>Adiant.</th>
            <th>h/Trab</th>
            <th>Benefícios</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    setIsPayrollExportOpen(false);
    void savePrintableReceipt('Painel Mensal de RH', body);
  };

  const handleImportSpreadsheet = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportSummary(null);

    try {
      const competencia = parseCompetenciaFromFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const paymentSheet = workbook.Sheets['Pagamento'];
      const advanceSheet = workbook.Sheets['Adiantamento'];
      const bankSheet = workbook.Sheets['Contas Bancárias'];

      if (!paymentSheet) {
        throw new Error('A planilha precisa ter a aba "Pagamento".');
      }

      const paymentRows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(paymentSheet, {
        header: 1,
        defval: null,
      });
      const advanceRows = advanceSheet
        ? XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(advanceSheet, { header: 1, defval: null })
        : [];
      const bankRows = bankSheet
        ? XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(bankSheet, { header: 1, defval: null })
        : [];

      const paymentDataRows = paymentRows.slice(2).filter((row) => normalizeText(row?.[2]));
      const advanceDataRows = advanceRows.slice(3).filter((row) => normalizeText(row?.[1]));
      const bankDataRows = bankRows.slice(2).filter((row) => normalizeText(row?.[1]));

      const existingStaffMap = new Map(
        staffList.map((member) => [normalizeText(member.nome), member])
      );

      const resolvedStaff = new Map<string, StaffMember>();

      for (const row of paymentDataRows) {
        const nome = String(row[2] || '').trim();
        const normalizedName = normalizeText(nome);
        if (!normalizedName) continue;

        const dataAdmissao = toIsoDate(row[3]);
        const funcao = String(row[4] || '').trim();
        const localTrabalho = String(row[5] || '').trim();
        const indiceContabil = row[1] ? String(row[1]).trim() : '';
        const departamento = inferDepartmentFromImport(localTrabalho, funcao);
        const experiencia = calculateExperienceWindow(dataAdmissao, competencia);

        const basePayload = {
          nome,
          cargo: funcao || 'Funcionário',
          funcao: funcao || null,
          departamento,
          data_admissao: dataAdmissao,
          indice_contabil: indiceContabil || null,
          local_trabalho: localTrabalho || null,
          unidade_obra: localTrabalho || null,
          experiencia_ativa: experiencia.experiencia_ativa,
          dias_experiencia: experiencia.dias_experiencia,
          data_fim_experiencia: experiencia.data_fim_experiencia,
          status: 'Ativo',
        };

        const existing = resolvedStaff.get(normalizedName) || existingStaffMap.get(normalizedName);

        if (existing) {
          const { data, error } = await supabase
            .from('equipe')
            .update(basePayload)
            .eq('id', existing.id)
            .select('*')
            .single();

          if (error) throw error;
          resolvedStaff.set(normalizedName, data as StaffMember);
          continue;
        }

        const { data, error } = await supabase
          .from('equipe')
          .insert([basePayload])
          .select('*')
          .single();

        if (error) throw error;
        resolvedStaff.set(normalizedName, data as StaffMember);
      }

      const paymentUpserts = paymentDataRows.flatMap((row) => {
        const nome = String(row[2] || '').trim();
        const member = resolvedStaff.get(normalizeText(nome)) || existingStaffMap.get(normalizeText(nome));
        if (!member) return [];

        const observacoes = row.slice(17).filter(Boolean).map((item) => String(item).trim()).join(' | ');
        const hasVacationFlag = normalizeText(observacoes).includes('ferias');
        const vacationDates = hasVacationFlag ? parseObservationDates(observacoes, competencia) : { inicio: null, fim: null };
        const experiencia = calculateExperienceWindow(toIsoDate(row[3]), competencia);

        return [{
          funcionario_id: member.id,
          funcionario_nome_snapshot: member.nome,
          competencia,
          indice_contabil: row[1] ? String(row[1]).trim() : null,
          data_admissao: toIsoDate(row[3]),
          funcao: row[4] ? String(row[4]).trim() : null,
          local_trabalho: row[5] ? String(row[5]).trim() : null,
          adiantamento_valor: parseCurrencyLike(row[6]),
          falta_descricao: row[7] ? String(row[7]).trim() : null,
          atestado_descricao: row[8] ? String(row[8]).trim() : null,
          horas_trabalhadas: null,
          horas_extras_50: row[9] ? String(row[9]).trim() : null,
          horas_extras_100: row[10] ? String(row[10]).trim() : null,
          adicional_noturno: row[11] ? String(row[11]).trim() : null,
          vale_transporte: row[12] ? String(row[12]).trim() : null,
          vale_cafe: parseCurrencyLike(row[13]),
          vale_mercado: parseCurrencyLike(row[14]),
          total_vales: parseCurrencyLike(row[15]),
          gratificacao: parseCurrencyLike(row[16]),
          observacoes: observacoes || null,
          experiencia_ativa: experiencia.experiencia_ativa,
          dias_experiencia: experiencia.dias_experiencia,
          em_ferias: hasVacationFlag,
          data_inicio_ferias: vacationDates.inicio,
          data_fim_ferias: vacationDates.fim,
        }];
      });

      if (paymentUpserts.length > 0) {
        const { error } = await supabase
          .from('equipe_movimentos_mensais')
          .upsert(paymentUpserts, { onConflict: 'funcionario_id,competencia' });

        if (error) throw error;
      }

      const paymentRecordUpserts: Record<string, unknown>[] = [];
      const bankProfileUpdates: Promise<unknown>[] = [];

      advanceDataRows.forEach((row) => {
        const nome = String(row[1] || '').trim();
        const member = resolvedStaff.get(normalizeText(nome)) || existingStaffMap.get(normalizeText(nome));
        if (!member) return;

        paymentRecordUpserts.push({
          funcionario_id: member.id,
          funcionario_nome_snapshot: member.nome,
          competencia,
          tipo: 'adiantamento',
          banco: row[5] ? String(row[5]).trim() : null,
          agencia: row[6] ? String(row[6]).trim() : null,
          conta: row[7] ? String(row[7]).trim() : null,
          operacao: null,
          chave_pix: row[8] ? String(row[8]).trim() : null,
          valor: parseCurrencyLike(row[9]),
          referencia: row[4] ? `VT ${String(row[4]).trim()}` : null,
        });
      });

      bankDataRows.forEach((row) => {
        const nome = String(row[1] || '').trim();
        const normalizedName = normalizeText(nome);
        const member = resolvedStaff.get(normalizedName) || existingStaffMap.get(normalizedName);
        if (!member) return;

        paymentRecordUpserts.push({
          funcionario_id: member.id,
          funcionario_nome_snapshot: member.nome,
          competencia,
          tipo: 'pagamento',
          banco: row[4] ? String(row[4]).trim() : null,
          agencia: row[5] ? String(row[5]).trim() : null,
          conta: row[6] ? String(row[6]).trim() : null,
          operacao: row[7] ? String(row[7]).trim() : null,
          chave_pix: row[8] ? String(row[8]).trim() : null,
          valor: parseCurrencyLike(row[9]),
          referencia: 'Pagamento em conta',
        });

        bankProfileUpdates.push(
          supabase
            .from('equipe')
            .update({
              banco: row[4] ? String(row[4]).trim() : null,
              agencia: row[5] ? String(row[5]).trim() : null,
              conta_bancaria: row[6] ? String(row[6]).trim() : null,
              operacao_conta: row[7] ? String(row[7]).trim() : null,
              chave_pix: row[8] ? String(row[8]).trim() : null,
            })
            .eq('id', member.id)
        );
      });

      if (paymentRecordUpserts.length > 0) {
        const { error } = await supabase
          .from('equipe_pagamentos')
          .upsert(paymentRecordUpserts, { onConflict: 'funcionario_id,competencia,tipo' });

        if (error) throw error;
      }

      await Promise.all(bankProfileUpdates);

      await Promise.all([
        fetchData(),
        fetchDepartments(),
        fetchPayrollMovements(),
        fetchPaymentRecords(),
      ]);

      setSelectedCompetencia(competencia);
      setImportSummary(`Planilha importada com sucesso para a competência ${competencia}.`);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao importar planilha de RH:', error);
      alert(`Falha ao importar planilha de RH: ${errorMessage}`);
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleUpdateMovementField = async (
    movementId: string,
    field: 'horas_trabalhadas' | 'vale_transporte' | 'vale_cafe',
    value: string
  ) => {
    const targetMovement = payrollMovements.find((movement) => movement.id === movementId);
    const parsedValeCafe = field === 'vale_cafe' ? parseCurrencyLike(value) : null;
    const recalculatedTotal =
      field === 'vale_cafe'
        ? Number(parsedValeCafe || 0) + Number(targetMovement?.vale_mercado || 0)
        : null;

    setPayrollMovements((current) =>
      current.map((movement) =>
        movement.id === movementId
          ? {
              ...movement,
              [field]:
                field === 'vale_cafe'
                  ? parseCurrencyLike(value)
                  : value,
              ...(field === 'vale_cafe' ? { total_vales: recalculatedTotal } : {}),
            }
          : movement
      )
    );

    const nextValue =
      field === 'vale_cafe'
        ? parseCurrencyLike(value)
        : value.trim() || null;

    const { error } = await supabase
      .from('equipe_movimentos_mensais')
      .update(
        field === 'vale_cafe'
          ? { [field]: nextValue, total_vales: recalculatedTotal }
          : { [field]: nextValue }
      )
      .eq('id', movementId);

    if (error) {
      console.error('Erro ao atualizar campo da movimentação:', error instanceof Error ? error.message : String(error));
      await fetchPayrollMovements();
      alert('Não foi possível salvar a atualização da jornada.');
    }
  };

  const syncMovementFromTimecards = async (funcionarioId: string, competencia: string) => {
    const { data, error: fetchError } = await supabase
      .from('equipe_cartoes_ponto')
      .select('horas_trabalhadas, horas_extras_50, horas_extras_100, adicional_noturno, data_referencia, falta_descricao, atestado_descricao, periculosidade_descricao')
      .eq('funcionario_id', funcionarioId)
      .eq('competencia', competencia)
      .order('data_referencia', { ascending: true });

    if (fetchError) {
      console.error('Erro ao consultar cartões para sincronização:', fetchError instanceof Error ? fetchError.message : String(fetchError));
      return;
    }

    const relevantEntries = (data || []) as Pick<
      TimecardEntry,
      'horas_trabalhadas' | 'horas_extras_50' | 'horas_extras_100' | 'adicional_noturno' | 'data_referencia' | 'falta_descricao' | 'atestado_descricao' | 'periculosidade_descricao'
    >[];

    const totalHoras = relevantEntries.reduce((sum, entry) => sum + Number(entry.horas_trabalhadas || 0), 0);
    const totalExtra50 = relevantEntries.reduce((sum, entry) => sum + Number(entry.horas_extras_50 || 0), 0);
    const totalExtra100 = relevantEntries.reduce((sum, entry) => sum + Number(entry.horas_extras_100 || 0), 0);
    const totalNoturno = relevantEntries.reduce((sum, entry) => sum + Number(entry.adicional_noturno || 0), 0);
    const faltas = relevantEntries
      .filter((entry) => entry.falta_descricao)
      .map((entry) => `${formatDate(entry.data_referencia)} ${String(entry.falta_descricao).trim()}`.trim())
      .join(' | ');
    const atestados = relevantEntries
      .filter((entry) => entry.atestado_descricao)
      .map((entry) => `${formatDate(entry.data_referencia)} ${String(entry.atestado_descricao).trim()}`.trim())
      .join(' | ');
    const periculosidade = relevantEntries
      .filter((entry) => entry.periculosidade_descricao)
      .map((entry) => `${formatDate(entry.data_referencia)} ${String(entry.periculosidade_descricao).trim()}`.trim())
      .join(' | ');

    const currentMovement = payrollMovements.find(
      (movement) => movement.funcionario_id === funcionarioId && movement.competencia === competencia
    );
    const mergedNotes = mergePayrollNotes(currentMovement?.observacoes || null, periculosidade || null);

    const { error } = await supabase
      .from('equipe_movimentos_mensais')
      .update({
        horas_trabalhadas: decimalHoursToLabel(totalHoras),
        horas_extras_50: decimalHoursToLabel(totalExtra50),
        horas_extras_100: decimalHoursToLabel(totalExtra100),
        adicional_noturno: decimalHoursToLabel(totalNoturno),
        falta_descricao: faltas || null,
        atestado_descricao: atestados || null,
        observacoes: mergedNotes,
      })
      .eq('funcionario_id', funcionarioId)
      .eq('competencia', competencia);

    if (error) {
      console.error('Erro ao sincronizar jornada com a competência:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleSaveTimecard = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveTimecardEntry(false);
  };

  const handleSavePayrollNote = async () => {
    if (!noteEditorPopup) return;

    try {
      const baseMovement = payrollMovements.find((movement) => movement.id === noteEditorPopup.id);
      const { error } = await supabase
        .from('equipe_movimentos_mensais')
        .update({ observacoes: noteEditorPopup.value.trim() || null })
        .eq('id', noteEditorPopup.id);

      if (error) throw error;

      setNoteEditorPopup(null);
      await fetchPayrollMovements();

      if (baseMovement) {
        await syncMovementFromTimecards(baseMovement.funcionario_id, baseMovement.competencia);
        await fetchPayrollMovements();
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao salvar nota do RH:', error);
      alert(`Falha ao salvar nota: ${errorMessage}`);
    }
  };

  const saveTimecardEntry = async (advanceAfterSave: boolean) => {

    if (!selectedTimecardEmployeeId) {
      alert('Selecione um funcionário para lançar o cartão de ponto.');
      return;
    }

    if (!timecardForm.data_referencia || !selectedCompetencia) {
      alert('Selecione a competência e a data do apontamento.');
      return;
    }

    setIsSavingTimecard(true);

    try {
      const punches = [
        timecardForm.entrada_1,
        timecardForm.saida_1,
        timecardForm.entrada_2,
        timecardForm.saida_2,
        timecardForm.entrada_3,
        timecardForm.saida_3,
      ];

      const metrics = calculateShiftMetrics(timecardForm.data_referencia, punches, {
        inicio: timecardForm.adicional_noturno_inicio,
        fim: timecardForm.adicional_noturno_fim,
      });

      const payload = {
        funcionario_id: selectedTimecardEmployeeId,
        competencia: selectedCompetencia,
        data_referencia: timecardForm.data_referencia,
        origem: 'manual',
        entrada_1: timecardForm.entrada_1 || null,
        saida_1: timecardForm.saida_1 || null,
        entrada_2: timecardForm.entrada_2 || null,
        saida_2: timecardForm.saida_2 || null,
        entrada_3: timecardForm.entrada_3 || null,
        saida_3: timecardForm.saida_3 || null,
        adicional_noturno_inicio: timecardForm.adicional_noturno_inicio || null,
        adicional_noturno_fim: timecardForm.adicional_noturno_fim || null,
        periculosidade_descricao: timecardForm.periculosidade_descricao.trim() || null,
        falta_descricao: timecardForm.falta_descricao.trim() || null,
        atestado_descricao: timecardForm.atestado_descricao.trim() || null,
        observacoes: timecardForm.observacoes.trim() || null,
        ...metrics,
      };

      const { error } = await supabase
        .from('equipe_cartoes_ponto')
        .upsert([payload], { onConflict: 'funcionario_id,data_referencia' });

      if (error) throw error;

      await fetchTimecards();
      await syncMovementFromTimecards(selectedTimecardEmployeeId, selectedCompetencia);
      await fetchPayrollMovements();

      setTimecardForm({
        data_referencia: timecardForm.data_referencia,
        entrada_1: '',
        saida_1: '',
        entrada_2: '',
        saida_2: '',
        entrada_3: '',
        saida_3: '',
        adicional_noturno_inicio: '',
        adicional_noturno_fim: '',
        periculosidade_descricao: '',
        falta_descricao: '',
        atestado_descricao: '',
        observacoes: '',
      });

      if (advanceAfterSave) {
        advanceTimecardDate();
      }

      if (isTimecardModalOpen && !advanceAfterSave) {
        setIsTimecardModalOpen(false);
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao salvar cartão de ponto:', error);
      alert(`Falha ao salvar cartão de ponto: ${errorMessage}`);
    } finally {
      setIsSavingTimecard(false);
    }
  };

  const handleDeleteTimecard = async (entry: TimecardEntry) => {
    const confirmed = window.confirm(`Apagar o lançamento de ${formatDate(entry.data_referencia)} de ${selectedCompetencia || entry.competencia}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('equipe_cartoes_ponto')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      await fetchTimecards();
      await syncMovementFromTimecards(entry.funcionario_id, entry.competencia);
      await fetchPayrollMovements();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao apagar cartão de ponto:', error);
      alert(`Falha ao apagar lançamento: ${errorMessage}`);
    }
  };

  const ensureMonthlyMovement = async (member: StaffMember, competencia: string) => {
    const existing = payrollMovements.find(
      (movement) => movement.funcionario_id === member.id && movement.competencia === competencia
    );

    if (existing) return existing;

    const payload = {
      funcionario_id: member.id,
      funcionario_nome_snapshot: member.nome,
      competencia,
      indice_contabil: member.indice_contabil || null,
      data_admissao: member.data_admissao || null,
      funcao: member.funcao || member.cargo || null,
      local_trabalho: member.local_trabalho || member.unidade_obra || null,
      adiantamento_valor: null,
      falta_descricao: null,
      atestado_descricao: null,
      horas_trabalhadas: null,
      horas_extras_50: null,
      horas_extras_100: null,
      adicional_noturno: null,
      vale_transporte: null,
      vale_cafe: null,
      vale_mercado: null,
      total_vales: null,
      gratificacao: null,
      observacoes: null,
      experiencia_ativa: Boolean(member.experiencia_ativa),
      dias_experiencia: member.dias_experiencia || null,
      em_ferias: Boolean(member.em_ferias),
      data_inicio_ferias: member.data_inicio_ferias || null,
      data_fim_ferias: member.data_fim_ferias || null,
    };

    const { data, error } = await supabase
      .from('equipe_movimentos_mensais')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;
    return data as PayrollMovement;
  };

  const handleSaveFinanceEntry = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!financeModalEmployee) return;
    if (!selectedCompetencia) {
      alert('Selecione uma competência no Painel Mensal de RH antes do lançamento.');
      return;
    }

    try {
      const movement = await ensureMonthlyMovement(financeModalEmployee, selectedCompetencia);
      const valorLancamento = parseCurrencyLike(financeForm.valor_lancamento);
      const valorVc = parseCurrencyLike(financeForm.valor_vc);
      const valorVm = parseCurrencyLike(financeForm.valor_vm);
      const totalVales = Number(valorVc || 0) + Number(valorVm || 0);

      const movementUpdate: Record<string, unknown> = {
        vale_transporte: financeForm.quantidade_vt.trim() || movement.vale_transporte || null,
        vale_cafe: valorVc ?? movement.vale_cafe ?? null,
        vale_mercado: valorVm ?? movement.vale_mercado ?? null,
        total_vales:
          (valorVc !== null || valorVm !== null)
            ? totalVales
            : movement.total_vales ?? null,
        financeiro_lancado_por: currentUserLabel,
        financeiro_lancado_em: new Date().toISOString(),
      };

      if (financeForm.tipo_lancamento === 'adiantamento') {
        movementUpdate.adiantamento_valor = valorLancamento ?? movement.adiantamento_valor ?? null;
      }

      if (editingFinanceItem?.kind === 'movement') {
        const { error: movementError } = await supabase
          .from('equipe_movimentos_mensais')
          .update({
            vale_transporte: financeForm.quantidade_vt.trim() || null,
            vale_cafe: valorVc,
            vale_mercado: valorVm,
            total_vales: totalVales,
            financeiro_lancado_por: currentUserLabel,
            financeiro_lancado_em: new Date().toISOString(),
          })
          .eq('id', editingFinanceItem.id);

        if (movementError) throw movementError;
      } else {
        const { error: movementError } = await supabase
          .from('equipe_movimentos_mensais')
          .update(movementUpdate)
          .eq('id', movement.id);

        if (movementError) throw movementError;
      }

      if (valorLancamento !== null) {
        const paymentPayload = {
          funcionario_id: financeModalEmployee.id,
          funcionario_nome_snapshot: financeModalEmployee.nome,
          competencia: selectedCompetencia,
          tipo: financeForm.tipo_lancamento,
          banco: financeModalEmployee.banco || null,
          agencia: financeModalEmployee.agencia || null,
          conta: financeModalEmployee.conta_bancaria || null,
          operacao: financeModalEmployee.operacao_conta || null,
          chave_pix: financeModalEmployee.chave_pix || null,
          valor: valorLancamento,
          registrado_por: currentUserLabel,
          referencia:
            financeForm.tipo_lancamento === 'adiantamento'
              ? 'Lançamento manual de adiantamento'
              : 'Lançamento manual de pagamento',
        };

        if (editingFinanceItem?.kind === 'payment') {
          const { error: paymentError } = await supabase
            .from('equipe_pagamentos')
            .update(paymentPayload)
            .eq('id', editingFinanceItem.id);

          if (paymentError) throw paymentError;
        } else {
          const { error: paymentError } = await supabase
            .from('equipe_pagamentos')
            .upsert([paymentPayload], { onConflict: 'funcionario_id,competencia,tipo' });

          if (paymentError) throw paymentError;
        }
      }

      await Promise.all([fetchPayrollMovements(), fetchPaymentRecords()]);
      resetFinanceForm();
      setIsFinanceModalOpen(false);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao salvar lançamento financeiro do RH:', error);
      alert(`Falha ao salvar lançamento financeiro: ${errorMessage}`);
    }
  };

  if (!isMounted) return null;

  const stats = [
    {
      label: 'Equipe Ativa',
      value: staffList.filter((s) => s.status === 'Ativo').length.toString(),
      change: `${payrollSummary.experiencia} em experiência`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Adiantamentos',
      value: formatCurrency(payrollSummary.adiantamentos),
      change: `${currentPayments.filter((item) => item.tipo === 'adiantamento').length} lançamentos`,
      icon: Wallet,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Vales + Gratificações',
      value: formatCurrency(payrollSummary.vales + payrollSummary.gratificacoes),
      change: `${payrollSummary.ferias} em férias`,
      icon: CheckCircle2,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ];

  const handleOpenModal = (member?: StaffMember) => {
    setOpenSections({
      cargo: false,
      vinculo: false,
      pessoais: false,
      remuneracao: false,
      bancario: false,
      jornada: false,
      cursos: false,
      documentos: false,
      desligamento: false,
    });

    if (member) {
      setIsCustomDepartment(!departmentOptions.includes(member.departamento));
      setIsCustomFunction(Boolean(member.funcao) && !functionOptions.includes(member.funcao));
      setEditingMember(member);
      setFormData({
        nome: member.nome,
        id_funcionario: member.id_funcionario,
        cargo: member.funcao || member.cargo,
        funcao: member.funcao || '',
        unidade_obra: member.unidade_obra || '',
        departamento: member.departamento,
        status: member.status,
        url_imagem: member.url_imagem || '',
        data_admissao: member.data_admissao || '',
        data_demissao: member.data_demissao || '',
        tipo_contrato: member.tipo_contrato || '',
        regime_trabalho: member.regime_trabalho || '',
        ctps: member.ctps || '',
        pis: member.pis || '',
        cbo: member.cbo || '',
        cpf: member.cpf || '',
        rg: member.rg || '',
        data_nascimento: member.data_nascimento || '',
        estado_civil: member.estado_civil || '',
        endereco: member.endereco || '',
        contato: member.contato || '',
        salario_base: member.salario_base || '',
        adicional_insalubridade: member.adicional_insalubridade || '',
        adicional_periculosidade: member.adicional_periculosidade || '',
        indice_contabil: member.indice_contabil || '',
        local_trabalho: member.local_trabalho || '',
        banco: member.banco || '',
        agencia: member.agencia || '',
        conta_bancaria: member.conta_bancaria || '',
        operacao_conta: member.operacao_conta || '',
        chave_pix: member.chave_pix || '',
        tipo_chave_pix: member.tipo_chave_pix || '',
        experiencia_ativa: Boolean(member.experiencia_ativa),
        dias_experiencia: member.dias_experiencia ? String(member.dias_experiencia) : '',
        data_fim_experiencia: member.data_fim_experiencia || '',
        em_ferias: Boolean(member.em_ferias),
        data_inicio_ferias: member.data_inicio_ferias || '',
        data_fim_ferias: member.data_fim_ferias || '',
        observacoes_rh: member.observacoes_rh || '',
        motivo_demissao: member.motivo_demissao || '',
        tipo_desligamento: member.tipo_desligamento || '',
        cursos: member.cursos || [],
        documentos_anexos: member.documentos_anexos || [],
      });
    } else {
      setIsCustomDepartment(false);
      setIsCustomFunction(false);
      setEditingMember(null);
      setFormData({
        nome: '',
        id_funcionario: '',
        cargo: '',
        funcao: '',
        unidade_obra: '',
        departamento: '',
        status: 'Ativo',
        url_imagem: '',
        data_admissao: '',
        data_demissao: '',
        tipo_contrato: '',
        regime_trabalho: '',
        ctps: '',
        pis: '',
        cbo: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        estado_civil: '',
        endereco: '',
        contato: '',
        salario_base: '',
        adicional_insalubridade: '',
        adicional_periculosidade: '',
        indice_contabil: '',
        local_trabalho: '',
        banco: '',
        agencia: '',
        conta_bancaria: '',
        operacao_conta: '',
        chave_pix: '',
        tipo_chave_pix: '',
        experiencia_ativa: false,
        dias_experiencia: '',
        data_fim_experiencia: '',
        em_ferias: false,
        data_inicio_ferias: '',
        data_fim_ferias: '',
        observacoes_rh: '',
        motivo_demissao: '',
        tipo_desligamento: '',
        cursos: [],
        documentos_anexos: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setIsCustomDepartment(false);
    setIsCustomFunction(false);
    setOpenSections({
      cargo: false,
      vinculo: false,
      pessoais: false,
      remuneracao: false,
      bancario: false,
      jornada: false,
      cursos: false,
      documentos: false,
      desligamento: false,
    });
  };

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const buildStaffPayload = () => {
    const nullableFields = [
      'id_funcionario',
      'cargo',
      'funcao',
      'unidade_obra',
      'departamento',
      'url_imagem',
      'data_admissao',
      'data_demissao',
      'tipo_contrato',
      'regime_trabalho',
      'ctps',
      'pis',
      'cbo',
      'cpf',
      'rg',
      'data_nascimento',
      'estado_civil',
      'endereco',
      'contato',
      'salario_base',
      'adicional_insalubridade',
      'adicional_periculosidade',
      'indice_contabil',
      'local_trabalho',
      'banco',
      'agencia',
      'conta_bancaria',
      'operacao_conta',
      'chave_pix',
      'tipo_chave_pix',
      'data_fim_experiencia',
      'data_inicio_ferias',
      'data_fim_ferias',
      'observacoes_rh',
      'motivo_demissao',
      'tipo_desligamento',
    ] as const;

    const payload: Record<string, unknown> = {
      ...formData,
      nome: formData.nome.trim(),
      cargo: (formData.funcao || formData.cargo || '').trim(),
      cursos: formData.cursos,
      documentos_anexos: formData.documentos_anexos,
      experiencia_ativa: formData.experiencia_ativa,
      dias_experiencia: formData.dias_experiencia ? Number(formData.dias_experiencia) : null,
      em_ferias: formData.em_ferias,
    };

    nullableFields.forEach((field) => {
      const value = payload[field];

      if (typeof value === 'string') {
        const trimmed = value.trim();
        payload[field] = trimmed === '' ? null : trimmed;
      }
    });

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildStaffPayload();

    try {
      if (payload.departamento && typeof payload.departamento === 'string') {
        const normalizedDepartment = payload.departamento.trim();

        if (normalizedDepartment !== '') {
          const { error: departmentError } = await supabase
            .from('equipe_departamentos')
            .upsert(
              [{ nome: normalizedDepartment }],
              { onConflict: 'nome', ignoreDuplicates: false }
            );

          if (departmentError) throw departmentError;
        }
      }

      if (payload.funcao && typeof payload.funcao === 'string') {
        const normalizedFunction = payload.funcao.trim();
        if (normalizedFunction !== '') {
          setIsCustomFunction(false);
        }
      }

      const syncRelatedRecords = async (memberId: string, memberName: string) => {
        const syncPayload = {
          funcionario_nome_snapshot: memberName,
          funcao: (payload.funcao as string | null) || (payload.cargo as string | null) || null,
          indice_contabil: (payload.indice_contabil as string | null) || null,
          local_trabalho: (payload.local_trabalho as string | null) || (payload.unidade_obra as string | null) || null,
          data_admissao: (payload.data_admissao as string | null) || null,
        };

        const { error: movementsError } = await supabase
          .from('equipe_movimentos_mensais')
          .update(syncPayload)
          .eq('funcionario_id', memberId);

        if (movementsError) throw movementsError;

        const { error: paymentsError } = await supabase
          .from('equipe_pagamentos')
          .update({ funcionario_nome_snapshot: memberName })
          .eq('funcionario_id', memberId);

        if (paymentsError) throw paymentsError;
      };

      if (editingMember) {
        const { error } = await supabase
          .from('equipe')
          .update(payload)
          .eq('id', editingMember.id);
        if (error) throw error;
        await syncRelatedRecords(editingMember.id, String(payload.nome || editingMember.nome));
      } else {
        const { data, error } = await supabase
          .from('equipe')
          .insert([payload])
          .select('id, nome')
          .single();
        if (error) throw error;
        if (data?.id) {
          await syncRelatedRecords(data.id, String(data.nome || payload.nome || ''));
        }
      }
      await Promise.all([fetchData(), fetchDepartments(), fetchPayrollMovements(), fetchPaymentRecords()]);
      handleCloseModal();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : String(error);

      console.error('Erro ao salvar membro da equipe:', error);
      alert(`Falha ao salvar membro da equipe: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipe')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchData();
      handleCloseModal();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erro ao excluir membro da equipe:', error instanceof Error ? error.message : String(error));
      alert('Falha ao excluir membro da equipe.');
    }
  };
  const getCourseStatus = (cursos?: Curso[]) => {
    if (!cursos || cursos.length === 0) return { label: 'Sem Cursos', color: 'text-slate-500', bg: 'bg-slate-500/10' };
    
    const now = new Date();
    let mostUrgentDays = Infinity;
    
    cursos.forEach(curso => {
      const expiry = new Date(curso.validade);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < mostUrgentDays) mostUrgentDays = diffDays;
    });

    if (mostUrgentDays <= 5) return { label: 'Vencimento Crítico (5d)', color: 'text-red-600', bg: 'bg-red-600/10' };
    if (mostUrgentDays <= 15) return { label: 'Vencimento Próximo (15d)', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (mostUrgentDays <= 30) return { label: 'Atenção (30d)', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (mostUrgentDays <= 45) return { label: 'Aviso (45d)', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    
    return { label: 'Cursos em Dia', color: 'text-[#d4ff3f]', bg: 'bg-[#d4ff3f]/10' };
  };

  const getStaffCategory = (person: StaffMember) => {
    const department = (person.departamento || '').trim();

    if (department) return department;

    const base = `${person.departamento || ''} ${person.cargo || ''} ${person.funcao || ''}`.toLowerCase();

    if (base.includes('terceir')) return 'Terceirizado';
    if (
      base.includes('produ') ||
      base.includes('obra') ||
      base.includes('operac') ||
      base.includes('campo') ||
      base.includes('manuten')
    ) {
      return 'De Produção';
    }

    return 'Administrativo';
  };

  const categoryOrder = ['Administrativo', 'De Produção', 'Terceirizado'];
  const categoryMap = new Map<string, StaffMember[]>();

  staffList.forEach((person) => {
    const category = getStaffCategory(person);
    const existingItems = categoryMap.get(category) || [];
    existingItems.push(person);
    categoryMap.set(category, existingItems);
  });

  categoryMap.forEach((items, label) => {
    categoryMap.set(
      label,
      [...items].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    );
  });

  const categorizedStaff = [
    ...categoryOrder
      .filter((label) => categoryMap.has(label))
      .map((label) => ({ label, items: categoryMap.get(label) || [] })),
    { label: 'De Produção', items: [] as StaffMember[] },
    { label: 'Terceirizado', items: [] as StaffMember[] },
  ];

  const normalizedCategorizedStaff = [
    ...categorizedStaff.filter((group) => group.items.length > 0),
    ...Array.from(categoryMap.entries())
      .filter(([label]) => !categoryOrder.includes(label))
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([label, items]) => ({ label, items })),
  ];

  const filteredCategorizedStaff = normalizedCategorizedStaff
    .map((group) => ({
      ...group,
      items: group.items.filter((person) => {
        const matchesSearch =
          !directoryFilter.search ||
          normalizeText(
            `${person.nome} ${person.funcao || person.cargo || ''} ${person.departamento || ''} ${person.local_trabalho || person.unidade_obra || ''}`
          ).includes(normalizeText(directoryFilter.search));

        const matchesStatus =
          directoryFilter.status === 'todos' || person.status === directoryFilter.status;

        const matchesCategory =
          directoryFilter.category === 'todas' || group.label === directoryFilter.category;

        return matchesSearch && matchesStatus && matchesCategory;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const filteredStaffFlat = filteredCategorizedStaff.flatMap((group) =>
    group.items.map((person) => ({
      ...person,
      categoryLabel: group.label,
    }))
  );

  const filteredPayrollMovements = currentPayrollMovements.filter((movement) => {
    const matchesSearch =
      !payrollFilter.search ||
      normalizeText(
        `${movement.funcionario_nome_snapshot} ${movement.funcao || ''} ${movement.local_trabalho || ''} ${movement.indice_contabil || ''}`
      ).includes(normalizeText(payrollFilter.search));

    const matchesLocation =
      payrollFilter.local === 'todos' || (movement.local_trabalho || '-') === payrollFilter.local;

    const matchesSituation =
      payrollFilter.situation === 'todas' ||
      (payrollFilter.situation === 'com-falta' && Boolean(movement.falta_descricao)) ||
      (payrollFilter.situation === 'com-atestado' && Boolean(movement.atestado_descricao)) ||
      (payrollFilter.situation === 'em-experiencia' && Boolean(movement.experiencia_ativa)) ||
      (payrollFilter.situation === 'em-ferias' && Boolean(movement.em_ferias)) ||
      (payrollFilter.situation === 'com-adiantamento' && Number(movement.adiantamento_valor || 0) > 0) ||
      (payrollFilter.situation === 'regular' &&
        !movement.falta_descricao &&
        !movement.atestado_descricao &&
        !movement.experiencia_ativa &&
        !movement.em_ferias &&
        Number(movement.adiantamento_valor || 0) === 0);

    return matchesSearch && matchesLocation && matchesSituation;
  });

  const sortedStaffExportList = [...filteredStaffFlat].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return (
    <div className="staff-theme flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="R.H." 
        subtitle="Gestão centralizada de pessoal, cursos e conformidade."
        extraAction={
          <button
            type="button"
            onClick={() => setIsStaffSettingsOpen(true)}
            className="size-10 flex items-center justify-center rounded-2xl bg-[#1a1a1a] text-slate-500 hover:text-[#d4ff3f] hover:bg-[#2a2a2a] transition-all"
            title="Configurações do RH"
          >
            <Settings size={18} />
          </button>
        }
        action={{ label: 'Novo Membro', onClick: () => handleOpenModal() }}
      />

      <div className="p-8 space-y-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportSpreadsheet}
          className="hidden"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div 
              key={`${stat.label || 'stat'}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800/50 shadow-sm group hover:border-[#d4ff3f]/30 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-1.5 rounded-xl bg-slate-800/50 text-slate-400 group-hover:text-[#d4ff3f] transition-colors`}>
                  <stat.icon size={16} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Staff Directory */}
          <div className="space-y-6">
            <div className="staff-directory-shell bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-visible shadow-sm">
              <div ref={directoryHeaderRef} className="relative z-10 p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="font-black text-lg tracking-tight">Diretório de Equipe</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenImport}
                    disabled={isImporting}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#d4ff3f]/30 text-[#d4ff3f] hover:bg-[#d4ff3f]/10 disabled:opacity-50 transition-all inline-flex items-center gap-2"
                  >
                    {isImporting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    Importar Planilha
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectoryFilterOpen((current) => !current);
                      setIsDirectoryExportOpen(false);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-800/50 hover:bg-[#2a2a2a] transition-all inline-flex items-center gap-2"
                  >
                    <Filter size={12} />
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectoryExportOpen((current) => !current);
                      setIsDirectoryFilterOpen(false);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-800/50 hover:bg-[#2a2a2a] transition-all inline-flex items-center gap-2"
                  >
                    <Download size={12} />
                    Exportar
                  </button>
                </div>
                {isDirectoryFilterOpen && (
                  <div className="absolute right-6 top-[calc(100%+8px)] z-50 w-[320px] rounded-2xl border border-slate-800 bg-[#111111] p-4 shadow-2xl">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={directoryFilter.search}
                        onChange={(e) => setDirectoryFilter((current) => ({ ...current, search: e.target.value }))}
                        className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                        placeholder="Pesquisar funcionário, função, local..."
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={directoryFilter.status}
                          onChange={(e) => setDirectoryFilter((current) => ({ ...current, status: e.target.value as StaffDirectoryFilterState['status'] }))}
                          className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                        >
                          <option value="todos">Todos os status</option>
                          <option value="Ativo">Ativo</option>
                          <option value="Inativo">Inativo</option>
                          <option value="Afastado">Afastado</option>
                          <option value="Em Licença">Em Licença</option>
                        </select>
                        <select
                          value={directoryFilter.category}
                          onChange={(e) => setDirectoryFilter((current) => ({ ...current, category: e.target.value }))}
                          className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                        >
                          <option value="todas">Todas as categorias</option>
                          {normalizedCategorizedStaff.map((group, index) => (
                            <option key={`${group.label || 'grupo'}-${index}`} value={group.label}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDirectoryFilter({ search: '', status: 'todos', category: 'todas' })}
                        className="w-full rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-[#1a1a1a]"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </div>
                )}
                {isDirectoryExportOpen && (
                  <div className="absolute right-6 top-[calc(100%+8px)] z-50 w-[180px] rounded-2xl border border-slate-800 bg-[#111111] p-2 shadow-2xl">
                    <button type="button" onClick={exportDirectoryToXlsx} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-all hover:bg-[#1a1a1a]">
                      <Download size={14} />
                      XLSX
                    </button>
                    <button type="button" onClick={exportDirectoryToPdf} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-all hover:bg-[#1a1a1a]">
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                )}
              </div>
              <div className={`staff-directory-body ${filteredStaffFlat.length === 0 ? 'min-h-[260px]' : ''} overflow-x-auto`}>
                <table className="w-full text-left">
                  <thead className="staff-directory-head bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-2.5">Funcionário</th>
                      <th className="px-6 py-2.5">Função</th>
                      <th className="px-6 py-2.5">Status</th>
                      <th className="px-6 py-2.5">Docs</th>
                    </tr>
                  </thead>
                  <tbody className="staff-directory-table divide-y divide-slate-800/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-14 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 size={24} className="text-[#d4ff3f] animate-spin" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando equipe...</p>
                              </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCategorizedStaff.flatMap((group) => {
                        const groupRows: React.ReactNode[] = [
                          <tr key={`group-${group.label}`} className="staff-directory-group-row bg-[#111111]">
                            <td colSpan={4} className="px-6 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">{group.label}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.items.length} funcionário(s)</span>
                              </div>
                            </td>
                          </tr>,
                        ];

                        if (group.items.length === 0) {
                          groupRows.push(
                            <tr key={`empty-${group.label}`}>
                              <td colSpan={4} className="px-6 py-20 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                Nenhum funcionário nesta categoria
                              </td>
                            </tr>
                          );
                          return groupRows;
                        }

                        return groupRows.concat(
                          group.items.map((person, index) => {
                            const courseStatus = getCourseStatus(person.cursos);
                            return (
                              <tr
                                key={`${person.id || 'staff'}-${person.nome || 'pessoa'}-${index}`}
                                onClick={() => handleOpenModal(person)}
                                className="staff-directory-row hover:bg-[#2a2a2a]/30 transition-colors group cursor-pointer"
                              >
                                <td className="px-6 py-1.5">
                                  <div className="space-y-0">
                                    <p className="staff-directory-name text-sm font-medium leading-tight text-slate-100">{person.nome}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-1.5">
                                  <p className="staff-directory-role text-sm font-medium leading-tight text-slate-200">{person.cargo}</p>
                                </td>
                                <td className="px-6 py-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${
                                      person.status === 'Ativo' ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                      {person.status}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${courseStatus.bg} ${courseStatus.color}`}>
                                      {courseStatus.label}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openIndividualTimecard(person);
                                      }}
                                      className="staff-directory-icon inline-flex items-center justify-center rounded-lg border border-[#d4ff3f]/30 bg-[#d4ff3f]/10 p-1.5 text-[#d4ff3f] transition-all hover:bg-[#d4ff3f]/20"
                                      title="Cartão ponto individual"
                                    >
                                      <Clock3 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFinanceModal(person);
                                      }}
                                      className="staff-directory-icon inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-300 transition-all hover:bg-amber-500/20"
                                      title="Lançamentos financeiros"
                                    >
                                      <Wallet size={13} />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-1.5">
                                  <div className="flex gap-1.5">
                                    {(person.documentos_anexos || []).length > 0 ? (
                                      <CheckCircle2 size={16} className="text-[#d4ff3f]" />
                                    ) : (
                                      <Circle size={16} className="text-slate-700" />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="staff-directory-footer p-4 bg-[#0a0a0a] border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibindo {filteredStaffFlat.length} funcionários</span>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#2a2a2a] transition-all">Anterior</button>
                  <button className="px-4 py-1.5 bg-[#1a1a1a] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a2a2a] transition-all">Próximo</button>
                </div>
              </div>
            </div>

            {importSummary && (
              <div className="rounded-2xl border border-[#d4ff3f]/20 bg-[#d4ff3f]/5 px-4 py-3 text-sm text-[#d4ff3f]">
                {importSummary}
              </div>
            )}

            <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-visible shadow-sm">
              <div ref={payrollHeaderRef} className="relative z-10 p-4 border-b border-slate-800/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-black text-base tracking-tight">Painel Mensal de RH</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Controle de folha, benefícios, experiência, férias e pagamentos bancários.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedCompetencia}
                    onChange={(e) => setSelectedCompetencia(e.target.value)}
                    className="bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                  >
                    {payrollCompetencias.length === 0 ? (
                      <option value="">Sem competência importada</option>
                    ) : (
                      payrollCompetencias.map((competencia, index) => (
                        <option key={`${competencia || 'competencia'}-${index}`} value={competencia}>
                          {competencia}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPayrollFilterOpen((current) => !current);
                      setIsPayrollExportOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-[#2a2a2a]"
                  >
                    <Filter size={14} />
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPayrollExportOpen((current) => !current);
                      setIsPayrollFilterOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-[#2a2a2a]"
                  >
                    <Download size={14} />
                    Exportar
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCollectiveReceipt}
                    disabled={filteredPayrollMovements.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    <ReceiptText size={14} />
                    Recibo Coletivo
                  </button>
                </div>
                {isPayrollFilterOpen && (
                  <div className="absolute right-4 top-[calc(100%+8px)] z-50 w-[360px] rounded-2xl border border-slate-800 bg-[#111111] p-4 shadow-2xl">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={payrollFilter.search}
                        onChange={(e) => setPayrollFilter((current) => ({ ...current, search: e.target.value }))}
                        className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                        placeholder="Pesquisar funcionário, função, local..."
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={payrollFilter.situation}
                          onChange={(e) => setPayrollFilter((current) => ({ ...current, situation: e.target.value as PayrollFilterState['situation'] }))}
                          className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                        >
                          <option value="todas">Todas as situações</option>
                          <option value="com-falta">Com falta</option>
                          <option value="com-atestado">Com atestado</option>
                          <option value="com-adiantamento">Com adiantamento</option>
                          <option value="em-experiencia">Em experiência</option>
                          <option value="em-ferias">Em férias</option>
                          <option value="regular">Regular</option>
                        </select>
                        <select
                          value={payrollFilter.local}
                          onChange={(e) => setPayrollFilter((current) => ({ ...current, local: e.target.value }))}
                          className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                        >
                          <option value="todos">Todos os locais</option>
                          {payrollLocationOptions.map((location, index) => (
                            <option key={`${location || 'local'}-${index}`} value={location}>
                              {location}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPayrollFilter({ search: '', situation: 'todas', local: 'todos' })}
                        className="w-full rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-[#1a1a1a]"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </div>
                )}
                {isPayrollExportOpen && (
                  <div className="absolute right-4 top-[calc(100%+8px)] z-50 w-[180px] rounded-2xl border border-slate-800 bg-[#111111] p-2 shadow-2xl">
                    <button type="button" onClick={exportPayrollToXlsx} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-all hover:bg-[#1a1a1a]">
                      <Download size={14} />
                      XLSX
                    </button>
                    <button type="button" onClick={exportPayrollToPdf} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-all hover:bg-[#1a1a1a]">
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 border-b border-slate-800/50">
                <div className="rounded-2xl border border-slate-800 bg-[#101010] p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adiantamentos</p>
                  <p className="mt-1.5 text-lg font-black tracking-tight">{formatCurrency(payrollSummary.adiantamentos)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#101010] p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">VC</p>
                  <p className="mt-1.5 text-lg font-black tracking-tight">{formatCurrency(payrollSummary.vc)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#101010] p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">VM</p>
                  <p className="mt-1.5 text-lg font-black tracking-tight">{formatCurrency(payrollSummary.vm)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#101010] p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">VM + VC</p>
                  <p className="mt-1.5 text-lg font-black tracking-tight">{formatCurrency(payrollSummary.vales)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#101010] p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gratificações</p>
                  <p className="mt-1.5 text-lg font-black tracking-tight">{formatCurrency(payrollSummary.gratificacoes)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#101010] p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exp. / Férias</p>
                  <p className="mt-1.5 text-lg font-black tracking-tight">{payrollSummary.experiencia} / {payrollSummary.ferias}</p>
                </div>
              </div>

              <div className={`overflow-x-auto border-b border-slate-800/50 rh-panel-scrollbar ${filteredPayrollMovements.length === 0 ? 'min-h-[220px]' : ''}`}>
                <table className="w-full min-w-[1320px] text-left">
                  <thead className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-2">Funcionário</th>
                      <th className="px-3 py-2">Cód</th>
                      <th className="px-2 py-2">Admissão</th>
                      <th className="px-3 py-2">Função</th>
                      <th className="px-3 py-2">Local</th>
                      <th className="px-3 py-2">Adiant.</th>
                      <th className="px-4 py-2">Faltas</th>
                      <th className="px-2 py-2 w-[48px] min-w-[48px]">Ates.</th>
                      <th className="px-2 py-2 w-[48px] min-w-[48px]">Notas</th>
                      <th className="px-3 py-2">h/Trab</th>
                      <th className="px-4 py-2">Ex50%</th>
                      <th className="px-4 py-2">Ex100%</th>
                      <th className="px-3 py-2">+Not</th>
                      <th className="px-2 py-2">VT</th>
                      <th className="px-2 py-2">VC</th>
                      <th className="px-2 py-2">VM</th>
                      <th className="px-2 py-2">VM + VC</th>
                      <th className="px-2 py-2">Gratif.</th>
                      <th className="px-2 py-2">Situação</th>
                      <th className="px-2 py-2 w-[44px] min-w-[44px] text-center">Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredPayrollMovements.length === 0 ? (
                      <tr>
                        <td colSpan={20} className="px-6 py-16 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Importe a planilha para começar o controle mensal do RH.
                        </td>
                      </tr>
                    ) : (
                      filteredPayrollMovements.map((movement, index) => (
                        <tr key={`${movement.id || 'movement'}-${movement.funcionario_id || movement.funcionario_nome_snapshot || 'row'}-${index}`} className="hover:bg-[#2a2a2a]/30 transition-colors">
                          <td className="px-4 py-1 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium leading-tight whitespace-nowrap text-slate-100">{movement.funcionario_nome_snapshot}</p>
                            </div>
                          </td>
                          <td className="px-3 py-1 text-sm font-medium leading-tight text-slate-400">{movement.indice_contabil || '-'}</td>
                          <td className="px-2 py-1 text-sm font-medium leading-tight text-slate-400 whitespace-nowrap">{formatDate(movement.data_admissao)}</td>
                          <td className="px-3 py-1 text-sm font-medium leading-tight text-slate-400 min-w-[108px]">{movement.funcao || '-'}</td>
                          <td className="px-3 py-1 text-sm font-medium leading-tight text-slate-400">{movement.local_trabalho || '-'}</td>
                          <td className="px-3 py-1 text-sm font-medium leading-tight">{formatCurrency(movement.adiantamento_valor)}</td>
                          <td className="px-2 py-1 text-sm font-medium leading-tight text-center">
                            {movement.falta_descricao ? (
                              <button
                                type="button"
                                onClick={() => setInfoPopup({ title: 'Dias de falta', content: movement.falta_descricao || '-' })}
                                className="inline-flex rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/20"
                              >
                                SIM
                              </button>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-1 text-sm font-medium leading-tight text-center">
                            {movement.atestado_descricao ? (
                              <button
                                type="button"
                                onClick={() => setInfoPopup({ title: 'Dias de atestado', content: movement.atestado_descricao || '-' })}
                                className="inline-flex rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/20"
                              >
                                SIM
                              </button>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-1 text-sm font-medium leading-tight">
                            <button
                              type="button"
                              onClick={() =>
                                setNoteEditorPopup({
                                  id: movement.id,
                                  nome: movement.funcionario_nome_snapshot,
                                  value: movement.observacoes || '',
                                })
                              }
                              className="rounded-lg border border-slate-700 bg-[#0a0a0a] p-1.5 text-slate-300 transition-all hover:bg-[#151515]"
                              title={movement.observacoes ? 'Editar notas' : 'Adicionar notas'}
                            >
                              <FileText size={12} />
                            </button>
                          </td>
                          <td className="px-3 py-1 text-sm font-medium leading-tight w-[72px] min-w-[72px] whitespace-nowrap">{movement.horas_trabalhadas || '-'}</td>
                          <td className="px-4 py-1 text-sm font-medium leading-tight w-[72px] min-w-[72px] whitespace-nowrap">{movement.horas_extras_50 || '-'}</td>
                          <td className="px-4 py-1 text-sm font-medium leading-tight w-[72px] min-w-[72px] whitespace-nowrap">{movement.horas_extras_100 || '-'}</td>
                          <td className="px-3 py-1 text-sm font-medium leading-tight w-[72px] min-w-[72px] whitespace-nowrap">{movement.adicional_noturno || '-'}</td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              defaultValue={movement.vale_transporte || ''}
                              onBlur={(e) => void handleUpdateMovementField(movement.id, 'vale_transporte', e.target.value)}
                              maxLength={3}
                              className="w-12 rounded-lg border border-slate-800 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                              placeholder="VT"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              defaultValue={movement.vale_cafe ? String(movement.vale_cafe).replace('.', ',') : ''}
                              onBlur={(e) => void handleUpdateMovementField(movement.id, 'vale_cafe', e.target.value)}
                              className="w-16 rounded-lg border border-slate-800 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/40"
                              placeholder="VC"
                            />
                          </td>
                          <td className="px-2 py-1 text-sm font-medium leading-tight">{formatCurrency(movement.vale_mercado)}</td>
                          <td className="px-2 py-1 text-sm font-medium leading-tight">{formatCurrency(getBenefitTotal(movement, configuredValeTransportePrice))}</td>
                          <td className="px-2 py-1 text-sm font-medium leading-tight">{formatCurrency(movement.gratificacao)}</td>
                          <td className="px-2 py-1">
                            <div className="flex flex-wrap gap-2">
                              {movement.experiencia_ativa && (
                                <span className="inline-flex rounded-lg bg-sky-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-sky-300">
                                  Exp. {movement.dias_experiencia || 45}d
                                </span>
                              )}
                              {movement.em_ferias && (
                                <span className="inline-flex rounded-lg bg-[#d4ff3f]/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">
                                  Férias
                                </span>
                              )}
                              {!movement.experiencia_ativa && !movement.em_ferias && (
                                <span className="inline-flex rounded-lg bg-slate-700/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                  Regular
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => openReceiptSelection(movement)}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-800 p-1.5 hover:bg-[#2a2a2a] transition-all"
                              title="Recibo individual"
                            >
                              <ReceiptText size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setIsPaymentsPanelOpen((current) => !current)}
                  className="flex w-full items-center justify-between px-4 py-1.5 text-left transition-all hover:bg-[#151515]"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pagamentos Bancários</p>
                    <p className="mt-1 text-xs text-slate-400">Funcionário, tipo, banco, agência, conta e PIX</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${isPaymentsPanelOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPaymentsPanelOpen && (
                  <div className="overflow-x-auto border-t border-slate-800/50">
                    <table className="w-full min-w-[820px] text-left">
                      <thead className="bg-[#0f0f0f] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-1.5">Funcionário</th>
                          <th className="px-4 py-1.5">Tipo</th>
                          <th className="px-4 py-1.5">Banco</th>
                          <th className="px-4 py-1.5">Agência</th>
                          <th className="px-4 py-1.5">Conta</th>
                          <th className="px-4 py-1.5">PIX</th>
                          <th className="px-4 py-1.5">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {currentPayments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Nenhum pagamento bancário importado para esta competência.
                            </td>
                          </tr>
                        ) : (
                          currentPayments.map((payment, index) => (
                            <tr key={`${payment.id || 'payment'}-${payment.funcionario_id || payment.funcionario_nome_snapshot || 'row'}-${index}`}>
                              <td className="px-4 py-1.5 text-sm">{payment.funcionario_nome_snapshot}</td>
                              <td className="px-4 py-1.5">
                                <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                                  payment.tipo === 'adiantamento'
                                    ? 'bg-orange-500/10 text-orange-400'
                                    : payment.tipo === 'pagamento'
                                      ? 'bg-emerald-500/10 text-emerald-300'
                                      : 'bg-slate-700/50 text-slate-300'
                                }`}>
                                  {payment.tipo || 'Sem lançamento'}
                                </span>
                              </td>
                              <td className="px-4 py-1.5 text-sm">{payment.banco || '-'}</td>
                              <td className="px-4 py-1.5 text-sm">{payment.agencia || '-'}</td>
                              <td className="px-4 py-1.5 text-sm">{payment.conta || '-'}</td>
                              <td className="px-4 py-1.5 text-sm">{payment.chave_pix || '-'}</td>
                              <td className="px-4 py-1.5 text-sm">{payment.valor ? formatCurrency(payment.valor) : '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div key="staff-delete-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-sm rounded-3xl border border-slate-800/50 bg-[#1a1a1a] p-5 shadow-2xl"
            >
              <h3 className="text-base font-black tracking-tight">Confirmar exclusão</h3>
              <p className="mt-2 text-sm text-slate-300">
                Deseja realmente excluir <span className="font-bold text-white">{deleteTarget.nome}</span>?
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-slate-800 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteTarget.id)}
                  className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-rose-600"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isFinanceModalOpen && financeModalEmployee && (
          <div key="staff-finance-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                resetFinanceForm();
                setIsFinanceModalOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-base font-black tracking-tight">Lançamentos Financeiros</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {financeModalEmployee.nome} • {selectedCompetencia || 'Sem competência'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetFinanceForm();
                    setIsFinanceModalOpen(false);
                  }}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-[0.84fr,8px,1.16fr] gap-0">
                <form onSubmit={handleSaveFinanceEntry} className="p-4 space-y-3 border-r border-slate-800/50">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo</label>
                    <select
                      value={financeForm.tipo_lancamento}
                      onChange={(e) => setFinanceForm({ ...financeForm, tipo_lancamento: e.target.value as 'adiantamento' | 'pagamento' })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    >
                      <option value="adiantamento">Adiantamento</option>
                      <option value="pagamento">Pagamento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor</label>
                    <input
                      type="text"
                      value={financeForm.valor_lancamento}
                      onChange={(e) => setFinanceForm({ ...financeForm, valor_lancamento: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="1500,00"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">VT</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={financeForm.quantidade_vt}
                      onChange={(e) => setFinanceForm({ ...financeForm, quantidade_vt: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="Qtd"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">VC</label>
                      <input
                        type="text"
                        value={financeForm.valor_vc}
                        onChange={(e) => setFinanceForm({ ...financeForm, valor_vc: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                        placeholder="120,00"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">VM</label>
                      <input
                        type="text"
                        value={financeForm.valor_vm}
                        onChange={(e) => setFinanceForm({ ...financeForm, valor_vm: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                        placeholder={staffSettings.valeMercadoPreco || '801,50'}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4ff3f] px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#c4ef2f]"
                  >
                    <Wallet size={13} />
                    {editingFinanceItem ? 'Salvar edição' : 'Salvar'}
                  </button>
                </form>

                <div className="my-4 rounded-full bg-[#d4ff3f]" />

                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inclusões feitas</p>
                  </div>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    {financeHistory.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-[#0f0f0f] px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Nenhum lançamento ainda
                      </div>
                    ) : (
                      financeHistory.map((item, index) => (
                        <div key={`${item.id || 'finance'}-${item.autor || item.tipo || 'item'}-${index}`} className="rounded-2xl border border-slate-800 bg-[#0f0f0f] px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="text-xs font-black text-white">{item.tipo}</p>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.data}</span>
                                <span className="text-xs font-black text-[#d4ff3f]">{item.valor}</span>
                                <span className="text-[10px] text-slate-500">por {item.autor}</span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-300">{item.detalhe}</p>
                            </div>
                            <div className="flex items-center gap-1 pl-2">
                              <button
                                type="button"
                                onClick={() => handleEditFinanceItem(item)}
                                className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition-colors hover:border-[#d4ff3f] hover:text-[#d4ff3f]"
                                title="Editar lançamento"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFinanceItem(item)}
                                className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition-colors hover:border-red-500 hover:text-red-400"
                                title="Apagar lançamento"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {infoPopup && (
          <div key="staff-info-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoPopup(null)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-[#1a1a1a] p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">{infoPopup.title}</p>
                <button onClick={() => setInfoPopup(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-slate-800 bg-[#0a0a0a] p-3 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                {infoPopup.content}
              </div>
            </motion.div>
          </div>
        )}
        {noteEditorPopup && (
          <div key="staff-note-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteEditorPopup(null)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#1a1a1a] p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Notas do RH</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{noteEditorPopup.nome}</p>
                </div>
                <button onClick={() => setNoteEditorPopup(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={8}
                value={noteEditorPopup.value}
                onChange={(e) => setNoteEditorPopup({ ...noteEditorPopup, value: e.target.value })}
                className="mt-3 w-full resize-none rounded-xl border border-slate-800 bg-[#0a0a0a] p-3 text-sm leading-relaxed text-slate-200 outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                placeholder="Digite observações, lembretes ou anotações do funcionário"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteEditorPopup(null)}
                  className="rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSavePayrollNote()}
                  className="rounded-xl bg-[#d4ff3f] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {receiptSelectionPopup && (
          <div key="staff-receipt-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptSelectionPopup(null)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-[#1a1a1a] p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Gerar Recibo</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selecione os itens do recibo</p>
                </div>
                <button onClick={() => setReceiptSelectionPopup(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { key: 'vt', label: 'Vale Transporte' },
                  { key: 'vc', label: 'Vale Café' },
                  { key: 'vm', label: 'Vale Mercado' },
                  { key: 'gratificacao', label: 'Gratificação' },
                ].map((item, index) => (
                  <label key={`${item.key || 'receipt-item'}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f0f0f] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(receiptSelectionPopup[item.key as keyof ReceiptSelectionState])}
                      onChange={(e) =>
                        setReceiptSelectionPopup({
                          ...receiptSelectionPopup,
                          [item.key]: e.target.checked,
                        })
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f0f0f] px-3 py-2">
                  <input
                    type="checkbox"
                    checked={receiptSelectionPopup.outros}
                    onChange={(e) => setReceiptSelectionPopup({ ...receiptSelectionPopup, outros: e.target.checked })}
                  />
                  <span>Outros</span>
                </label>
                {receiptSelectionPopup.outros && (
                  <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-[#0f0f0f] p-3">
                    <input
                      type="text"
                      value={receiptSelectionPopup.outrosDescricao}
                      onChange={(e) => setReceiptSelectionPopup({ ...receiptSelectionPopup, outrosDescricao: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                      placeholder="Descrição do item"
                    />
                    <input
                      type="text"
                      value={receiptSelectionPopup.outrosValor}
                      onChange={(e) => setReceiptSelectionPopup({ ...receiptSelectionPopup, outrosValor: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                      placeholder="Valor"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptSelectionPopup(null)}
                  className="rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const movement = currentPayrollMovements.find((item) => item.id === receiptSelectionPopup.movementId);
                    if (!movement) {
                      alert('Não foi possível localizar este lançamento.');
                      return;
                    }
                    void handlePrintIndividualReceipt(movement, receiptSelectionPopup);
                    setReceiptSelectionPopup(null);
                  }}
                  className="rounded-xl bg-[#d4ff3f] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]"
                >
                  Gerar Recibo
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isStaffSettingsOpen && (
          <div key="staff-settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStaffSettingsOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#1a1a1a] p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Configurações do RH</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Benefícios padrão</p>
                </div>
                <button onClick={() => setIsStaffSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">Preço do Vale Transporte</label>
                  <CurrencyInput
                    value={staffSettings.valeTransportePreco}
                    onValueChange={(_, __, values) =>
                      setStaffSettings((current) => ({
                        ...current,
                        valeTransportePreco: values?.formatted || '0,00',
                      }))
                    }
                    prefix=""
                    className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">Preço do Vale Mercado</label>
                  <CurrencyInput
                    value={staffSettings.valeMercadoPreco}
                    onValueChange={(_, __, values) =>
                      setStaffSettings((current) => ({
                        ...current,
                        valeMercadoPreco: values?.formatted || '0,00',
                      }))
                    }
                    prefix=""
                    className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffSettingsOpen(false)}
                  className="rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem(STAFF_SETTINGS_STORAGE_KEY, JSON.stringify(staffSettings));
                    }
                    setIsStaffSettingsOpen(false);
                  }}
                  className="rounded-xl bg-[#d4ff3f] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isTimecardModalOpen && timecardModalEmployee && (
          <div key="staff-timecard-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTimecardModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-[92vh] max-h-[25cm] w-[10cm] max-w-full flex-col overflow-hidden rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black tracking-tight">Cartão Ponto</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {timecardModalEmployee.nome}
                  </p>
                </div>
                <button onClick={() => setIsTimecardModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTimecard} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="space-y-3 p-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Competência</label>
                    <div className="rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white">
                      {selectedCompetencia || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={timecardForm.data_referencia}
                        onChange={(e) => setTimecardForm({ ...timecardForm, data_referencia: e.target.value })}
                        className="flex-1 bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setIsNightPopupOpen(true)}
                        disabled={isSavingTimecard}
                        className="rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-3 py-2 text-indigo-300 transition-all hover:bg-indigo-500/25 disabled:opacity-50"
                        title="Adicional noturno"
                      >
                        <Moon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={applyHazardObservation}
                        disabled={isSavingTimecard}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-amber-300 transition-all hover:bg-amber-500/25 disabled:opacity-50"
                        title="Adicional de Periculosidade"
                      >
                        <AlertTriangle size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveTimecardEntry(true)}
                        disabled={isSavingTimecard}
                        className="rounded-xl border border-slate-700 bg-[#0f0f0f] px-3 py-2 text-slate-300 transition-all hover:bg-[#181818] disabled:opacity-50"
                        title="Avançar para o próximo dia"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={timecardForm.entrada_1} onChange={(e) => setTimecardForm({ ...timecardForm, entrada_1: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                    <input type="time" value={timecardForm.saida_1} onChange={(e) => setTimecardForm({ ...timecardForm, saida_1: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                    <input type="time" value={timecardForm.entrada_2} onChange={(e) => setTimecardForm({ ...timecardForm, entrada_2: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                    <input type="time" value={timecardForm.saida_2} onChange={(e) => setTimecardForm({ ...timecardForm, saida_2: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                    <input type="time" value={timecardForm.entrada_3} onChange={(e) => setTimecardForm({ ...timecardForm, entrada_3: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                    <input type="time" value={timecardForm.saida_3} onChange={(e) => setTimecardForm({ ...timecardForm, saida_3: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={timecardForm.falta_descricao}
                      onChange={(e) => setTimecardForm({ ...timecardForm, falta_descricao: e.target.value })}
                      className={`flex-1 bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all ${
                        normalizeText(timecardForm.falta_descricao) === 'falta' ? 'text-rose-400' : 'text-white'
                      }`}
                      placeholder="Falta"
                    />
                    <button
                      type="button"
                      onClick={() => void handleQuickAbsenceEntry()}
                      disabled={isSavingTimecard}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-300 transition-all hover:bg-rose-500/25 disabled:opacity-50"
                    >
                      Falta
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={timecardForm.atestado_descricao}
                      onChange={(e) => setTimecardForm({ ...timecardForm, atestado_descricao: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="Atestado"
                    />
                    <button
                      type="button"
                      onClick={markTimecardAsCertificate}
                      disabled={isSavingTimecard}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-300 transition-all hover:bg-amber-500/25 disabled:opacity-50"
                    >
                      Atestado
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={timecardForm.observacoes}
                    onChange={(e) => setTimecardForm({ ...timecardForm, observacoes: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none"
                    placeholder="Observações"
                  />
                  <button
                    type="submit"
                    disabled={isSavingTimecard}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4ff3f] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#c4ef2f] disabled:opacity-50"
                  >
                    {isSavingTimecard ? <Loader2 size={14} className="animate-spin" /> : <Clock3 size={14} />}
                    Salvar Ponto
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveTimecardEntry(true)}
                    disabled={isSavingTimecard}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4ff3f]/30 bg-[#d4ff3f]/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#d4ff3f] transition-all hover:bg-[#d4ff3f]/20 disabled:opacity-50"
                  >
                    {isSavingTimecard ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    Salvar e Continuar
                  </button>
                </div>

                <div className="border-t border-slate-800/50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lançamentos recentes</p>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                  <div className="space-y-2">
                    {modalEmployeeTimecards.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-[#0f0f0f] px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Nenhum lançamento nesta competência
                      </div>
                    ) : (
                      modalEmployeeTimecards.slice(0, 12).map((entry, index) => (
                        <div key={`${entry.id || 'timecard'}-${entry.data_referencia || 'data'}-${index}`} className="rounded-2xl border border-slate-800 bg-[#0f0f0f] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black">{formatDate(entry.data_referencia)}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">
                                {decimalHoursToLabel(entry.horas_trabalhadas)}
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleDeleteTimecard(entry)}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 transition-all hover:bg-rose-500/20"
                                title="Apagar lançamento"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {[entry.entrada_1, entry.saida_1, entry.entrada_2, entry.saida_2, entry.entrada_3, entry.saida_3].filter(Boolean).join(' • ') || '-'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </form>
              {isNightPopupOpen && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
                  <div className="w-full rounded-2xl border border-slate-800 bg-[#111111] p-4 shadow-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest text-white">Adicional Noturno</p>
                      <button type="button" onClick={() => setIsNightPopupOpen(false)} className="text-slate-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        value={timecardForm.adicional_noturno_inicio}
                        onChange={(e) => setTimecardForm({ ...timecardForm, adicional_noturno_inicio: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                      />
                      <input
                        type="time"
                        value={timecardForm.adicional_noturno_fim}
                        onChange={(e) => setTimecardForm({ ...timecardForm, adicional_noturno_fim: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsNightPopupOpen(false)}
                        className="rounded-xl bg-[#d4ff3f] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
        {isModalOpen && (
          <div key="staff-member-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight">
                  {editingMember ? 'Ficha do Funcionário' : 'Novo Membro'}
                </h3>
                <div className="flex items-center gap-2">
                  {editingMember && (
                    <button 
                      type="button"
                      onClick={() => setDeleteTarget({ id: editingMember.id, nome: editingMember.nome })}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Excluir Funcionário"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: Roberto Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffMember['status'] })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Afastado">Afastado</option>
                      <option value="Em Licença">Em Licença</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Admissão</label>
                    <input
                      type="date"
                      value={formData.data_admissao}
                      onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleSection('cargo')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Cargo e lotação</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cargo, função, departamento e unidade</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.cargo ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.cargo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Função</label>
                        <div className="space-y-2">
                          <select
                            value={isCustomFunction ? '__nova__' : formData.funcao}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              if (nextValue === '__nova__') {
                                setIsCustomFunction(true);
                                setFormData({
                                  ...formData,
                                  funcao: functionOptions.includes(formData.funcao) ? '' : formData.funcao,
                                  cargo: functionOptions.includes(formData.funcao) ? '' : formData.funcao,
                                });
                                return;
                              }

                              setIsCustomFunction(false);
                              setFormData({
                                ...formData,
                                funcao: nextValue,
                                cargo: nextValue,
                              });
                            }}
                            className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                          >
                            <option value="">Selecione</option>
                            {functionOptions.filter(Boolean).map((funcao, index) => (
                              <option key={`${funcao || 'funcao'}-${index}`} value={funcao}>
                                {funcao}
                              </option>
                            ))}
                            <option value="__nova__">Nova Função</option>
                          </select>
                          {isCustomFunction && (
                            <input
                              type="text"
                              value={formData.funcao}
                              onChange={(e) => setFormData({ ...formData, funcao: e.target.value, cargo: e.target.value })}
                              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                              placeholder="Digite a nova função"
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Índice Contábil</label>
                        <input type="text" value={formData.indice_contabil} onChange={(e) => setFormData({ ...formData, indice_contabil: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: 508" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Local</label>
                        <input type="text" value={formData.local_trabalho} onChange={(e) => setFormData({ ...formData, local_trabalho: e.target.value, unidade_obra: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Tetra Pak / Obra Centro" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Departamento</label>
                        <div className="space-y-2">
                          <select
                            value={isCustomDepartment ? '__novo__' : formData.departamento}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              if (nextValue === '__novo__') {
                                setIsCustomDepartment(true);
                                setFormData({
                                  ...formData,
                                  departamento: departmentOptions.includes(formData.departamento) ? '' : formData.departamento,
                                });
                                return;
                              }

                              setIsCustomDepartment(false);
                              setFormData({
                                ...formData,
                                departamento: nextValue,
                              });
                            }}
                            className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                          >
                            <option value="">Selecione</option>
                            {departmentOptions.filter(Boolean).map((department, index) => (
                              <option key={`${department || 'departamento'}-${index}`} value={department}>
                                {department}
                              </option>
                            ))}
                            <option value="__novo__">Novo Departamento</option>
                          </select>
                          {isCustomDepartment && (
                            <input
                              type="text"
                              value={formData.departamento}
                              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                              placeholder="Digite o novo departamento"
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Unidade/Obra</label>
                        <input type="text" value={formData.unidade_obra} onChange={(e) => setFormData({ ...formData, unidade_obra: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Obra Centro" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('vinculo')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Vínculo contratual</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato, regime, CTPS, PIS e CBO</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.vinculo ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.vinculo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Contrato</label>
                        <select value={formData.tipo_contrato} onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all">
                          <option value="">Selecione</option>
                          <option value="CLT">CLT</option>
                          <option value="PJ">PJ</option>
                          <option value="Estagiário">Estagiário</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Regime</label>
                        <select value={formData.regime_trabalho} onChange={(e) => setFormData({ ...formData, regime_trabalho: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all">
                          <option value="">Selecione</option>
                          <option value="Horista">Horista</option>
                          <option value="Mensalista">Mensalista</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">CTPS</label>
                        <input type="text" value={formData.ctps} onChange={(e) => setFormData({ ...formData, ctps: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">PIS</label>
                        <input type="text" value={formData.pis} onChange={(e) => setFormData({ ...formData, pis: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">CBO</label>
                        <input type="text" value={formData.cbo} onChange={(e) => setFormData({ ...formData, cbo: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('pessoais')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Dados pessoais</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CPF, RG, nascimento, estado civil, endereço e contato</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.pessoais ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.pessoais && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">CPF</label>
                        <input type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">RG</label>
                        <input type="text" value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Nascimento</label>
                        <input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Estado Civil</label>
                        <input type="text" value={formData.estado_civil} onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Endereço</label>
                        <input type="text" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Contato</label>
                        <input type="text" value={formData.contato} onChange={(e) => setFormData({ ...formData, contato: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('remuneracao')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Remuneração</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Salário base, adicionais e conta bancária</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.remuneracao ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.remuneracao && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Salário Base</label>
                        <input type="text" value={formData.salario_base} onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: R$ 2.500,00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Insalubridade (%)</label>
                        <input type="text" value={formData.adicional_insalubridade} onChange={(e) => setFormData({ ...formData, adicional_insalubridade: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Periculosidade (%)</label>
                        <input type="text" value={formData.adicional_periculosidade} onChange={(e) => setFormData({ ...formData, adicional_periculosidade: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Banco</label>
                        <input type="text" value={formData.banco} onChange={(e) => setFormData({ ...formData, banco: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Agência</label>
                        <input type="text" value={formData.agencia} onChange={(e) => setFormData({ ...formData, agencia: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Conta Bancária</label>
                        <input type="text" value={formData.conta_bancaria} onChange={(e) => setFormData({ ...formData, conta_bancaria: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Operação</label>
                        <input type="text" value={formData.operacao_conta} onChange={(e) => setFormData({ ...formData, operacao_conta: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Chave PIX</label>
                        <select value={formData.tipo_chave_pix} onChange={(e) => setFormData({ ...formData, tipo_chave_pix: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all">
                          <option value="">Selecione</option>
                          <option value="CPF">CPF</option>
                          <option value="Telefone">Telefone</option>
                          <option value="E-mail">E-mail</option>
                          <option value="Aleatória">Aleatória</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Chave PIX</label>
                        <input type="text" value={formData.chave_pix} onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('jornada')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Experiência, férias e observações</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Controle de 45/90 dias, férias e dados operacionais</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.jornada ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.jornada && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0a0a0a] px-4 py-3 text-sm">
                        <input type="checkbox" checked={formData.experiencia_ativa} onChange={(e) => setFormData({ ...formData, experiencia_ativa: e.target.checked })} />
                        Funcionário em experiência
                      </label>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Período de Experiência (dias)</label>
                        <select value={formData.dias_experiencia} onChange={(e) => setFormData({ ...formData, dias_experiencia: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all">
                          <option value="">Selecione</option>
                          <option value="45">45</option>
                          <option value="90">90</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Fim da Experiência</label>
                        <input type="date" value={formData.data_fim_experiencia} onChange={(e) => setFormData({ ...formData, data_fim_experiencia: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0a0a0a] px-4 py-3 text-sm">
                        <input type="checkbox" checked={formData.em_ferias} onChange={(e) => setFormData({ ...formData, em_ferias: e.target.checked })} />
                        Funcionário em férias
                      </label>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Início das Férias</label>
                        <input type="date" value={formData.data_inicio_ferias} onChange={(e) => setFormData({ ...formData, data_inicio_ferias: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Fim das Férias</label>
                        <input type="date" value={formData.data_fim_ferias} onChange={(e) => setFormData({ ...formData, data_fim_ferias: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Observações do RH</label>
                        <textarea value={formData.observacoes_rh} onChange={(e) => setFormData({ ...formData, observacoes_rh: e.target.value })} rows={3} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none" placeholder="Ex.: férias marcadas, adaptação, pendências de cartão de ponto, benefícios..." />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('cursos')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Cursos e treinamentos</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lista com validade e botão de inclusão</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.cursos ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.cursos && (
                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">Cursos e Treinamentos</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newCurso: Curso = { id: Math.random().toString(36).substr(2, 9), nome: '', duracao: '', validade: '' };
                            setFormData({ ...formData, cursos: [...formData.cursos, newCurso] });
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-all"
                        >
                          + Adicionar
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.cursos.map((curso, idx) => (
                          <div key={curso.id} className="p-4 bg-[#0a0a0a] border border-slate-800 rounded-2xl space-y-3 relative group/curso">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, cursos: formData.cursos.filter(c => c.id !== curso.id) })}
                              className="absolute top-2 right-2 p-1 text-slate-600 hover:text-rose-500 opacity-0 group-hover/curso:opacity-100 transition-all"
                            >
                              <X size={14} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="md:col-span-2">
                                <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Nome do Curso</label>
                                <input
                                  type="text"
                                  value={curso.nome}
                                  onChange={(e) => {
                                    const newCursos = [...formData.cursos];
                                    newCursos[idx].nome = e.target.value;
                                    setFormData({ ...formData, cursos: newCursos });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                  placeholder="ex: NR-35 Trabalho em Altura"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Duração</label>
                                <input
                                  type="text"
                                  value={curso.duracao}
                                  onChange={(e) => {
                                    const newCursos = [...formData.cursos];
                                    newCursos[idx].duracao = e.target.value;
                                    setFormData({ ...formData, cursos: newCursos });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                  placeholder="ex: 8h"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Validade</label>
                                <input
                                  type="date"
                                  value={curso.validade}
                                  onChange={(e) => {
                                    const newCursos = [...formData.cursos];
                                    newCursos[idx].validade = e.target.value;
                                    setFormData({ ...formData, cursos: newCursos });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection('documentos')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-black tracking-tight">Documentos anexos</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cadastro de anexos com categoria</p>
                    </div>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.documentos ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.documentos && (
                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest">Documentos Anexos</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newDoc: DocumentoAnexo = { id: Math.random().toString(36).substr(2, 9), nome: '', url: '', tipo: 'Documento pessoal' };
                            setFormData({ ...formData, documentos_anexos: [...formData.documentos_anexos, newDoc] });
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-all"
                        >
                          + Anexar
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.documentos_anexos.map((doc, idx) => (
                          <div key={doc.id} className="p-4 bg-[#0a0a0a] border border-slate-800 rounded-2xl flex items-start gap-4 relative group/doc">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, documentos_anexos: formData.documentos_anexos.filter(d => d.id !== doc.id) })}
                              className="absolute top-2 right-2 p-1 text-slate-600 hover:text-rose-500 opacity-0 group-hover/doc:opacity-100 transition-all"
                            >
                              <X size={14} />
                            </button>
                            <div className="size-10 bg-slate-800/50 text-slate-400 rounded-xl flex items-center justify-center">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={doc.nome}
                                onChange={(e) => {
                                  const newDocs = [...formData.documentos_anexos];
                                  newDocs[idx].nome = e.target.value;
                                  setFormData({ ...formData, documentos_anexos: newDocs });
                                }}
                                className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                placeholder="Nome do documento"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <select
                                  value={doc.tipo}
                                  onChange={(e) => {
                                    const newDocs = [...formData.documentos_anexos];
                                    newDocs[idx].tipo = e.target.value;
                                    setFormData({ ...formData, documentos_anexos: newDocs });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                >
                                  <option value="Documento pessoal">Documento pessoal</option>
                                  <option value="Contrato">Contrato</option>
                                  <option value="Treinamento">Treinamento</option>
                                  <option value="Exame">Exame</option>
                                  <option value="Outro">Outro</option>
                                </select>
                                <input
                                  type="text"
                                  value={doc.url}
                                  onChange={(e) => {
                                    const newDocs = [...formData.documentos_anexos];
                                    newDocs[idx].url = e.target.value;
                                    setFormData({ ...formData, documentos_anexos: newDocs });
                                  }}
                                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50"
                                  placeholder="URL do arquivo"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.status === 'Inativo' && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleSection('desligamento')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-slate-800 rounded-2xl text-left hover:border-[#d4ff3f]/30 transition-all"
                      >
                        <div>
                          <p className="text-sm font-black tracking-tight">Desligamento</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data, motivo e tipo</p>
                        </div>
                        <ChevronDown size={18} className={`text-slate-500 transition-transform ${openSections.desligamento ? 'rotate-180' : ''}`} />
                      </button>
                      {openSections.desligamento && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-[#0f0f0f] p-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data de Demissão</label>
                            <input type="date" value={formData.data_demissao} onChange={(e) => setFormData({ ...formData, data_demissao: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo</label>
                            <input type="text" value={formData.tipo_desligamento} onChange={(e) => setFormData({ ...formData, tipo_desligamento: e.target.value })} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all" placeholder="ex: Sem justa causa" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Motivo</label>
                            <textarea value={formData.motivo_demissao} onChange={(e) => setFormData({ ...formData, motivo_demissao: e.target.value })} rows={3} className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none" placeholder="Descreva o motivo do desligamento" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#2a2a2a] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all"
                  >
                    {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
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
