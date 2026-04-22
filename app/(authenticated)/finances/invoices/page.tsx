'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FilePlus2,
  FolderUp,
  Loader2,
  Paperclip,
  ReceiptText,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PONTA_GROSSA_CONFIG, type PontaGrossaConfig } from '@/lib/nfse/ponta-grossa-config';

type InvoiceMode = 'labor' | 'mixed';
type InvoiceItemType = 'labor' | 'material';
type InvoiceStatus = 'Rascunho' | 'Em emissão' | 'Emitida';

interface InvoiceItem {
  id: string;
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface InvoiceAttachment {
  id: string;
  name: string;
  url: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface InvoiceDraft {
  recordId: string | null;
  invoiceNumber: string;
  issuerName: string;
  clientName: string;
  clientDocument: string;
  projectName: string;
  competence: string;
  issueDate: string;
  serviceCity: string;
  status: InvoiceStatus;
  serviceDescription: string;
  internalNotes: string;
  issRate: number;
  inssRate: number;
  otherRetentionRate: number;
  items: InvoiceItem[];
  attachments: InvoiceAttachment[];
}

interface InvoiceHistoryRecord {
  id: string;
  mode: InvoiceMode;
  invoiceNumber: string;
  savedAt: string;
  updatedAt: string;
  status: InvoiceStatus;
  clientName: string;
  projectName: string;
  draft: InvoiceDraft;
}

interface InvoiceHistoryRow {
  id: string;
  mode: InvoiceMode;
  invoice_number: string;
  status: InvoiceStatus;
  client_name: string | null;
  project_name: string | null;
  payload: InvoiceDraft;
  created_at: string;
  updated_at: string;
}

const DRAFTS_STORAGE_KEY = 'finances-invoices-drafts-v2';
const HISTORY_STORAGE_KEY = 'finances-invoices-history-v1';
const INVOICE_HISTORY_TABLE = 'finance_invoice_history';
const NFSE_SETTINGS_TABLE = 'finance_nfse_settings';
const PONTA_GROSSA_CONFIG_STORAGE_KEY = 'finances-invoices-pg-config-v2';
const INVOICE_HISTORY_SQL = `CREATE TABLE IF NOT EXISTS public.finance_invoice_history (
    id UUID PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('labor', 'mixed')),
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Rascunho', 'Em emissão', 'Emitida')),
    client_name TEXT,
    project_name TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_invoice_history_mode ON public.finance_invoice_history(mode);
CREATE INDEX IF NOT EXISTS idx_finance_invoice_history_updated_at ON public.finance_invoice_history(updated_at DESC);

ALTER TABLE public.finance_invoice_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for authenticated users" ON public.finance_invoice_history;
CREATE POLICY "Allow all actions for authenticated users" ON public.finance_invoice_history
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);`;
const NFSE_SETTINGS_SQL = `CREATE TABLE IF NOT EXISTS public.finance_nfse_settings (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_nfse_settings_provider ON public.finance_nfse_settings(provider);

ALTER TABLE public.finance_nfse_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for authenticated users" ON public.finance_nfse_settings;
CREATE POLICY "Allow all actions for authenticated users" ON public.finance_nfse_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);`;

function sanitizePontaGrossaConfigForStorage(config: PontaGrossaConfig): PontaGrossaConfig {
  return {
    ...config,
    certPath: '',
    certPassword: '',
    webservicePassword: '',
  };
}

const createItem = (type: InvoiceItemType): InvoiceItem => ({
  id: crypto.randomUUID(),
  type,
  description: '',
  quantity: 1,
  unit: 'un',
  unitPrice: 0,
});

const createDraft = (mode: InvoiceMode): InvoiceDraft => ({
  recordId: null,
  invoiceNumber: '',
  issuerName: 'Construtora Baggio Silveira Ltda.',
  clientName: '',
  clientDocument: '',
  projectName: '',
  competence: '',
  issueDate: new Date().toISOString().split('T')[0],
  serviceCity: 'Ponta Grossa - PR',
  status: 'Rascunho',
  serviceDescription: '',
  internalNotes: '',
  issRate: mode === 'labor' ? 5 : 2,
  inssRate: mode === 'labor' ? 11 : 0,
  otherRetentionRate: 0,
  items: [createItem(mode === 'labor' ? 'labor' : 'material')],
  attachments: [],
});

const invoiceMeta: Record<
  InvoiceMode,
  {
    label: string;
    title: string;
    accent: string;
    border: string;
    surface: string;
    icon: React.ElementType;
    systemName: string;
    systemDescription: string;
    checklist: string[];
    prefix: string;
  }
> = {
  labor: {
    label: 'Somente Mão de Obra',
    title: 'NF de Prestação de Serviço',
    accent: 'text-[#d4ff3f]',
    border: 'border-[#d4ff3f]/30',
    surface: 'bg-[#d4ff3f]/10',
    icon: Wrench,
    systemName: 'Portal da Prefeitura de Ponta Grossa - PR',
    systemDescription:
      'Fluxo recomendado para emissão das notas apenas de mão de obra, com conferência de retenções antes da emissão final.',
    checklist: [
      'Conferir competência, tomador e município da prestação.',
      'Validar retenções de ISS, INSS e demais tributos aplicáveis.',
      'Confirmar descrição do serviço exatamente como será destacada na nota.',
    ],
    prefix: 'NFMO',
  },
  mixed: {
    label: 'Material + Mão de Obra',
    title: 'NF Mista / Apoio Operacional',
    accent: 'text-orange-400',
    border: 'border-orange-400/30',
    surface: 'bg-orange-400/10',
    icon: Building2,
    systemName: 'MarketUp',
    systemDescription:
      'Fluxo operacional para notas com material e mão de obra, organizando a composição antes da emissão no sistema pago.',
    checklist: [
      'Separar corretamente itens de material e itens de mão de obra.',
      'Conferir base de cálculo, retenções e valores líquidos.',
      'Registrar observações internas para rastreabilidade da emissão.',
    ],
    prefix: 'NFMMO',
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

function cloneDraft(draft: InvoiceDraft): InvoiceDraft {
  return {
    ...draft,
    items: draft.items.map((item) => ({ ...item })),
    attachments: draft.attachments.map((attachment) => ({ ...attachment })),
  };
}

function rowToHistoryRecord(row: InvoiceHistoryRow): InvoiceHistoryRecord {
  const payload = cloneDraft(row.payload);
  return {
    id: row.id,
    mode: row.mode,
    invoiceNumber: row.invoice_number,
    savedAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    clientName: row.client_name || '',
    projectName: row.project_name || '',
    draft: {
      ...payload,
      recordId: row.id,
      invoiceNumber: row.invoice_number,
      status: row.status,
    },
  };
}

function generateInvoiceNumber(mode: InvoiceMode, history: InvoiceHistoryRecord[], issueDate: string) {
  const prefix = invoiceMeta[mode].prefix;
  const year = new Date(issueDate || new Date().toISOString()).getFullYear();
  const sequence = history.filter((record) => record.mode === mode && record.invoiceNumber.includes(`-${year}-`)).length + 1;
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

async function exportInvoiceMirror(record: InvoiceHistoryRecord) {
  const draft = record.draft;
  const totals = draft.items.reduce(
    (acc, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      if (item.type === 'labor') acc.labor += itemTotal;
      if (item.type === 'material') acc.material += itemTotal;
      acc.gross += itemTotal;
      return acc;
    },
    { labor: 0, material: 0, gross: 0 }
  );

  const issValue = totals.gross * (draft.issRate / 100);
  const inssValue = totals.gross * (draft.inssRate / 100);
  const otherRetentionValue = totals.gross * (draft.otherRetentionRate / 100);
  const netValue = totals.gross - issValue - inssValue - otherRetentionValue;

  const itemRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tipo', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Descrição', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Qtd.', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Un.', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Unitário', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })] }),
      ],
    }),
    ...draft.items.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.type === 'labor' ? 'Mão de Obra' : 'Material')] }),
            new TableCell({ children: [new Paragraph(item.description || '-')] }),
            new TableCell({ children: [new Paragraph(String(item.quantity))] }),
            new TableCell({ children: [new Paragraph(item.unit)] }),
            new TableCell({ children: [new Paragraph(formatCurrency(item.unitPrice))] }),
            new TableCell({ children: [new Paragraph(formatCurrency(item.quantity * item.unitPrice))] }),
          ],
        })
    ),
  ];

  const attachmentParagraphs =
    draft.attachments.length > 0
      ? draft.attachments.map(
          (attachment) =>
            new Paragraph({
              children: [new TextRun({ text: `${attachment.name} - ${attachment.url}`, size: 20 })],
            })
        )
      : [new Paragraph('Nenhum anexo vinculado a esta emissão.')];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Espelho da Nota Fiscal',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Número interno: ${record.invoiceNumber}`, bold: true })],
          }),
          new Paragraph(`Tipo: ${invoiceMeta[record.mode].label}`),
          new Paragraph(`Emitente: ${draft.issuerName}`),
          new Paragraph(`Tomador: ${draft.clientName || '-'}`),
          new Paragraph(`CPF/CNPJ: ${draft.clientDocument || '-'}`),
          new Paragraph(`Projeto/Obra: ${draft.projectName || '-'}`),
          new Paragraph(`Competência: ${draft.competence || '-'}`),
          new Paragraph(`Data de emissão: ${draft.issueDate || '-'}`),
          new Paragraph(`Município da prestação: ${draft.serviceCity || '-'}`),
          new Paragraph(`Status: ${draft.status}`),
          new Paragraph(`Canal operacional: ${invoiceMeta[record.mode].systemName}`),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Descrição da nota', bold: true })] }),
          new Paragraph(draft.serviceDescription || '-'),
          new Paragraph({ text: '' }),
          new Table({
            rows: itemRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Resumo financeiro', bold: true })] }),
          new Paragraph(`Subtotal mão de obra: ${formatCurrency(totals.labor)}`),
          new Paragraph(`Subtotal material: ${formatCurrency(totals.material)}`),
          new Paragraph(`Bruto da nota: ${formatCurrency(totals.gross)}`),
          new Paragraph(`ISS (${draft.issRate}%): ${formatCurrency(issValue)}`),
          new Paragraph(`INSS (${draft.inssRate}%): ${formatCurrency(inssValue)}`),
          new Paragraph(`Outras retenções (${draft.otherRetentionRate}%): ${formatCurrency(otherRetentionValue)}`),
          new Paragraph({
            children: [new TextRun({ text: `Valor líquido estimado: ${formatCurrency(netValue)}`, bold: true })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Anexos vinculados', bold: true })] }),
          ...attachmentParagraphs,
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Observações internas', bold: true })] }),
          new Paragraph(draft.internalNotes || '-'),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${record.invoiceNumber}-espelho.docx`);
}

export default function FinanceInvoicesPage() {
  const [activeMode, setActiveMode] = useState<InvoiceMode>('labor');
  const [drafts, setDrafts] = useState<Record<InvoiceMode, InvoiceDraft>>({
    labor: createDraft('labor'),
    mixed: createDraft('mixed'),
  });
  const [history, setHistory] = useState<InvoiceHistoryRecord[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteHistoryEnabled, setIsRemoteHistoryEnabled] = useState<boolean | null>(null);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const [isRemoteNfseSettingsEnabled, setIsRemoteNfseSettingsEnabled] = useState<boolean | null>(null);
  const [isSyncingNfseSettings, setIsSyncingNfseSettings] = useState(false);
  const [isSavingNfseSettings, setIsSavingNfseSettings] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isTestingPontaGrossa, setIsTestingPontaGrossa] = useState(false);
  const [isEmittingPontaGrossa, setIsEmittingPontaGrossa] = useState(false);
  const [pontaGrossaConfig, setPontaGrossaConfig] = useState<PontaGrossaConfig>(DEFAULT_PONTA_GROSSA_CONFIG);
  const [pontaGrossaResult, setPontaGrossaResult] = useState<Record<string, unknown> | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchRemoteNfseSettings = async () => {
    setIsSyncingNfseSettings(true);

    try {
      const response = await authFetch('/api/finances/invoices/pontagrossa/settings', {
        method: 'GET',
      });
      const payload = (await response.json()) as {
        error?: string;
        enabled?: boolean;
        missingTable?: boolean;
        config?: Partial<PontaGrossaConfig>;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao carregar a configuração compartilhada da NFS-e.');
      }

      if (payload.missingTable) {
        setIsRemoteNfseSettingsEnabled(false);
        return;
      }

      if (payload.config) {
        setPontaGrossaConfig((prev) =>
          sanitizePontaGrossaConfigForStorage({
            ...prev,
            ...payload.config,
          })
        );
      }

      setIsRemoteNfseSettingsEnabled(Boolean(payload.enabled));
    } catch (error) {
      console.error('FinanceInvoicesPage: failed to fetch remote NFS-e settings', error);
      setIsRemoteNfseSettingsEnabled(false);
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível carregar a configuração compartilhada da NFS-e.',
      });
    } finally {
      setIsSyncingNfseSettings(false);
    }
  };

  const saveRemoteNfseSettings = async (configOverride?: Partial<PontaGrossaConfig>) => {
    const configToSave = sanitizePontaGrossaConfigForStorage({
      ...pontaGrossaConfig,
      ...(configOverride || {}),
    });

    try {
      setIsSavingNfseSettings(true);
      const response = await authFetch('/api/finances/invoices/pontagrossa/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configToSave }),
      });

      const payload = (await response.json()) as { error?: string; config?: Partial<PontaGrossaConfig> };
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao salvar a configuração compartilhada da NFS-e.');
      }

      if (payload.config) {
        setPontaGrossaConfig(sanitizePontaGrossaConfigForStorage(payload.config as PontaGrossaConfig));
      }

      setIsRemoteNfseSettingsEnabled(true);
      return true;
    } catch (error) {
      console.error('FinanceInvoicesPage: failed to save remote NFS-e settings', error);
      setIsRemoteNfseSettingsEnabled(false);
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível salvar a configuração compartilhada da NFS-e.',
      });
      return false;
    } finally {
      setIsSavingNfseSettings(false);
    }
  };

  const fetchRemoteHistory = async () => {
    setIsSyncingHistory(true);
    const { data, error } = await supabase
      .from(INVOICE_HISTORY_TABLE)
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      const missingTable = error.message?.toLowerCase().includes('does not exist') || error.code === '42P01';
      if (missingTable) {
        setIsRemoteHistoryEnabled(false);
        setIsSyncingHistory(false);
        return;
      }

      console.error('FinanceInvoicesPage: failed to fetch remote history', error);
      setIsRemoteHistoryEnabled(false);
      setFeedbackMessage({ type: 'error', text: 'Não foi possível carregar o histórico compartilhado no Supabase.' });
      setIsSyncingHistory(false);
      return;
    }

    setHistory(((data as InvoiceHistoryRow[]) || []).map(rowToHistoryRecord));
    setIsRemoteHistoryEnabled(true);
    setIsSyncingHistory(false);
  };

  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      const savedPontaGrossaConfig = localStorage.getItem(PONTA_GROSSA_CONFIG_STORAGE_KEY);

      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts) as Partial<Record<InvoiceMode, InvoiceDraft>>;
        setDrafts({
          labor: parsedDrafts.labor ? cloneDraft({ ...createDraft('labor'), ...parsedDrafts.labor }) : createDraft('labor'),
          mixed: parsedDrafts.mixed ? cloneDraft({ ...createDraft('mixed'), ...parsedDrafts.mixed }) : createDraft('mixed'),
        });
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as InvoiceHistoryRecord[];
        setHistory(
          parsedHistory.map((record) => ({
            ...record,
            draft: cloneDraft(record.draft),
          }))
        );
      }

      if (savedPontaGrossaConfig) {
        setPontaGrossaConfig(
          sanitizePontaGrossaConfigForStorage({
            ...DEFAULT_PONTA_GROSSA_CONFIG,
            ...(JSON.parse(savedPontaGrossaConfig) as Partial<PontaGrossaConfig>),
          })
        );
      }
    } catch (error) {
      console.error('FinanceInvoicesPage: failed to restore data', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    void fetchRemoteHistory().finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    void fetchRemoteNfseSettings();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(PONTA_GROSSA_CONFIG_STORAGE_KEY, JSON.stringify(sanitizePontaGrossaConfigForStorage(pontaGrossaConfig)));
  }, [pontaGrossaConfig, isHydrated]);

  const currentDraft = drafts[activeMode];
  const currentMeta = invoiceMeta[activeMode];

  const updateDraft = (patch: Partial<InvoiceDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [activeMode]: {
        ...prev[activeMode],
        ...patch,
      },
    }));
  };

  const updateItem = (itemId: string, patch: Partial<InvoiceItem>) => {
    setDrafts((prev) => ({
      ...prev,
      [activeMode]: {
        ...prev[activeMode],
        items: prev[activeMode].items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      },
    }));
  };

  const addItem = () => {
    setDrafts((prev) => ({
      ...prev,
      [activeMode]: {
        ...prev[activeMode],
        items: [...prev[activeMode].items, createItem(activeMode === 'labor' ? 'labor' : 'material')],
      },
    }));
  };

  const removeItem = (itemId: string) => {
    setDrafts((prev) => {
      const filteredItems = prev[activeMode].items.filter((item) => item.id !== itemId);
      return {
        ...prev,
        [activeMode]: {
          ...prev[activeMode],
          items: filteredItems.length ? filteredItems : [createItem(activeMode === 'labor' ? 'labor' : 'material')],
        },
      };
    });
  };

  const removeAttachment = (attachmentId: string) => {
    setDrafts((prev) => ({
      ...prev,
      [activeMode]: {
        ...prev[activeMode],
        attachments: prev[activeMode].attachments.filter((attachment) => attachment.id !== attachmentId),
      },
    }));
  };

  const resetCurrentDraft = () => {
    setDrafts((prev) => ({
      ...prev,
      [activeMode]: createDraft(activeMode),
    }));
    setFeedbackMessage({ type: 'success', text: 'Rascunho atual reiniciado.' });
  };

  const totals = useMemo(() => {
    const laborSubtotal = currentDraft.items
      .filter((item) => item.type === 'labor')
      .reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const materialSubtotal = currentDraft.items
      .filter((item) => item.type === 'material')
      .reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const grossTotal = laborSubtotal + materialSubtotal;
    const issValue = grossTotal * ((currentDraft.issRate || 0) / 100);
    const inssValue = grossTotal * ((currentDraft.inssRate || 0) / 100);
    const otherRetentionValue = grossTotal * ((currentDraft.otherRetentionRate || 0) / 100);
    const netTotal = grossTotal - issValue - inssValue - otherRetentionValue;

    return {
      laborSubtotal,
      materialSubtotal,
      grossTotal,
      issValue,
      inssValue,
      otherRetentionValue,
      netTotal,
    };
  }, [currentDraft]);

  const sortedHistory = useMemo(
    () =>
      [...history]
        .filter((record) => record.mode === activeMode)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [activeMode, history]
  );

  const saveCurrentRecord = async (statusOverride?: InvoiceStatus) => {
    const nextNumber = currentDraft.invoiceNumber || generateInvoiceNumber(activeMode, history, currentDraft.issueDate);
    const nowIso = new Date().toISOString();
    const nextDraft: InvoiceDraft = cloneDraft({
      ...currentDraft,
      invoiceNumber: nextNumber,
      status: statusOverride || currentDraft.status,
      recordId: currentDraft.recordId || crypto.randomUUID(),
    });

    const record: InvoiceHistoryRecord = {
      id: nextDraft.recordId || crypto.randomUUID(),
      mode: activeMode,
      invoiceNumber: nextDraft.invoiceNumber,
      savedAt: currentDraft.recordId
        ? history.find((item) => item.id === currentDraft.recordId)?.savedAt || nowIso
        : nowIso,
      updatedAt: nowIso,
      status: nextDraft.status,
      clientName: nextDraft.clientName,
      projectName: nextDraft.projectName,
      draft: nextDraft,
    };

    setDrafts((prev) => ({
      ...prev,
      [activeMode]: nextDraft,
    }));

    if (isRemoteHistoryEnabled) {
      const { error } = await supabase.from(INVOICE_HISTORY_TABLE).upsert({
        id: record.id,
        mode: record.mode,
        invoice_number: record.invoiceNumber,
        status: record.status,
        client_name: record.clientName || null,
        project_name: record.projectName || null,
        payload: nextDraft,
        created_at: record.savedAt,
        updated_at: record.updatedAt,
      });

      if (error) {
        console.error('FinanceInvoicesPage: failed to save remote history', error);
        setFeedbackMessage({ type: 'error', text: 'Não foi possível salvar a nota no histórico compartilhado.' });
        return;
      }

      await fetchRemoteHistory();
    } else {
      setHistory((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === record.id);
        if (existingIndex === -1) return [record, ...prev];
        const next = [...prev];
        next[existingIndex] = record;
        return next;
      });
    }

    setFeedbackMessage({
      type: 'success',
      text:
        statusOverride === 'Emitida'
          ? `Nota ${nextDraft.invoiceNumber} marcada como emitida e salva no histórico.`
          : `Nota ${nextDraft.invoiceNumber} salva no histórico.`,
    });
  };

  const loadHistoryRecord = (recordId: string) => {
    const record = history.find((item) => item.id === recordId);
    if (!record) return;

    setActiveMode(record.mode);
    setDrafts((prev) => ({
      ...prev,
      [record.mode]: cloneDraft(record.draft),
    }));
    setFeedbackMessage({ type: 'success', text: `Nota ${record.invoiceNumber} carregada para edição.` });
  };

  const deleteHistoryRecord = async (recordId: string) => {
    const record = history.find((item) => item.id === recordId);

    if (isRemoteHistoryEnabled) {
      const { error } = await supabase.from(INVOICE_HISTORY_TABLE).delete().eq('id', recordId);
      if (error) {
        console.error('FinanceInvoicesPage: failed to delete remote history', error);
        setFeedbackMessage({ type: 'error', text: 'Não foi possível excluir a nota do histórico compartilhado.' });
        return;
      }
      await fetchRemoteHistory();
    } else {
      setHistory((prev) => prev.filter((item) => item.id !== recordId));
    }

    if (record && drafts[record.mode].recordId === recordId) {
      setDrafts((prev) => ({
        ...prev,
        [record.mode]: createDraft(record.mode),
      }));
    }

    setFeedbackMessage({ type: 'success', text: 'Registro removido do histórico.' });
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAttachment(true);
      setFeedbackMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', activeMode);

      const response = await authFetch('/api/finances/invoices/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        name?: string;
        path?: string;
        url?: string;
        mimeType?: string;
        size?: number;
      };

      if (!response.ok || !payload.url || !payload.path || !payload.name) {
        throw new Error(payload.error || 'Não foi possível enviar o anexo.');
      }

      const attachment: InvoiceAttachment = {
        id: crypto.randomUUID(),
        name: payload.name,
        path: payload.path,
        url: payload.url,
        mimeType: payload.mimeType || file.type || 'application/octet-stream',
        size: payload.size || file.size,
        uploadedAt: new Date().toISOString(),
      };

      setDrafts((prev) => ({
        ...prev,
        [activeMode]: {
          ...prev[activeMode],
          attachments: [attachment, ...prev[activeMode].attachments],
        },
      }));

      setFeedbackMessage({ type: 'success', text: `Anexo ${file.name} enviado com sucesso.` });
    } catch (error) {
      console.error('FinanceInvoicesPage: upload failed', error);
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Falha ao enviar o anexo.',
      });
    } finally {
      setIsUploadingAttachment(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const exportCurrentMirror = async () => {
    const tempRecord: InvoiceHistoryRecord = {
      id: currentDraft.recordId || crypto.randomUUID(),
      mode: activeMode,
      invoiceNumber: currentDraft.invoiceNumber || generateInvoiceNumber(activeMode, history, currentDraft.issueDate),
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: currentDraft.status,
      clientName: currentDraft.clientName,
      projectName: currentDraft.projectName,
      draft: cloneDraft({
        ...currentDraft,
        invoiceNumber: currentDraft.invoiceNumber || generateInvoiceNumber(activeMode, history, currentDraft.issueDate),
      }),
    };

    await exportInvoiceMirror(tempRecord);
    setFeedbackMessage({ type: 'success', text: 'Espelho da nota exportado com sucesso.' });
  };

  const updatePontaGrossaConfig = <K extends keyof PontaGrossaConfig>(key: K, value: PontaGrossaConfig[K]) => {
    setPontaGrossaConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestPontaGrossa = async () => {
    try {
      setIsTestingPontaGrossa(true);
      setPontaGrossaResult(null);

      const response = await authFetch('/api/finances/invoices/pontagrossa/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: pontaGrossaConfig,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          page: 1,
        }),
      });

      const payload = (await response.json()) as { error?: string; parsed?: Record<string, unknown> };
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao consultar o webservice da Prefeitura.');
      }

      setPontaGrossaResult(payload.parsed || payload);
      setFeedbackMessage({ type: 'success', text: 'Consulta da Prefeitura executada com sucesso.' });
    } catch (error) {
      console.error('FinanceInvoicesPage: Ponta Grossa test failed', error);
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Falha ao consultar a Prefeitura.',
      });
    } finally {
      setIsTestingPontaGrossa(false);
    }
  };

  const handleEmitPontaGrossa = async () => {
    try {
      setIsEmittingPontaGrossa(true);
      setPontaGrossaResult(null);

      const tomadorCnpj = currentDraft.clientDocument.replace(/\D/g, '');
      const totalGross = currentDraft.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

      const response = await authFetch('/api/finances/invoices/pontagrossa/emit-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: pontaGrossaConfig,
          issueDate: currentDraft.issueDate,
          competenceDate: currentDraft.issueDate,
          serviceDescription: currentDraft.serviceDescription || currentDraft.internalNotes || 'Serviços prestados.',
          grossAmount: totalGross,
          deductions: 0,
          issRetido: 2,
          tomador: {
            cnpj: tomadorCnpj || undefined,
            razaoSocial: currentDraft.clientName || 'Tomador não informado',
            street: 'Não informado',
            number: 'S/N',
            neighborhood: 'Não informado',
            cityCode: pontaGrossaConfig.cityCode,
            cityName: pontaGrossaConfig.cityName,
            uf: 'PR',
            cep: '00000000',
          },
          serviceItems: currentDraft.items.map((item) => ({
            description: item.description || currentDraft.serviceDescription || 'Item de serviço',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxable: true,
          })),
        }),
      });

      const payload = (await response.json()) as { error?: string; parsed?: Record<string, unknown> };
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao emitir NFS-e síncrona na Prefeitura.');
      }

      setPontaGrossaResult(payload.parsed || payload);
      const nextSequenceConfig: Partial<PontaGrossaConfig> = {
        nextRpsNumber: pontaGrossaConfig.nextRpsNumber + 1,
        nextLotNumber: pontaGrossaConfig.nextLotNumber + 1,
      };

      setPontaGrossaConfig((prev) => ({
        ...prev,
        ...nextSequenceConfig,
      }));

      if (isRemoteNfseSettingsEnabled) {
        await saveRemoteNfseSettings(nextSequenceConfig);
      }

      setFeedbackMessage({ type: 'success', text: 'Emissão síncrona enviada para a Prefeitura.' });
    } catch (error) {
      console.error('FinanceInvoicesPage: Ponta Grossa emit failed', error);
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Falha ao emitir NFS-e síncrona.',
      });
    } finally {
      setIsEmittingPontaGrossa(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8 space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Emissão de <span className="text-[#d4ff3f]">Notas Fiscais</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Central operacional com histórico, numeração, anexos e espelho de emissão
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl border border-slate-800/60 bg-[#1a1a1a] text-[10px] font-black uppercase tracking-widest text-slate-400">
            Rascunho e histórico salvos neste navegador
          </div>
          <button
            type="button"
            onClick={resetCurrentDraft}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-800/60 bg-[#1a1a1a] hover:bg-[#242424] text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw size={14} />
            Novo Rascunho
          </button>
          <button
            type="button"
            onClick={() => void saveCurrentRecord()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all"
          >
            <Save size={14} />
            Salvar no Histórico
          </button>
          <button
            type="button"
            onClick={() => void saveCurrentRecord('Emitida')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
          >
            <CheckCircle2 size={14} />
            Marcar Emitida
          </button>
          <button
            type="button"
            onClick={() => void exportCurrentMirror()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
          >
            <ReceiptText size={14} />
            Exportar Espelho
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-bold uppercase tracking-widest ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800/60 bg-[#1a1a1a] p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronização do Histórico</p>
            <p className="text-sm text-slate-300 mt-1">
              {isSyncingHistory
                ? 'Validando histórico compartilhado no Supabase...'
                : isRemoteHistoryEnabled
                  ? 'Histórico compartilhado ativo entre usuários e máquinas.'
                  : 'Histórico compartilhado ainda não ativado. A página segue usando o navegador como fallback.'}
            </p>
          </div>
          {!isRemoteHistoryEnabled && !isSyncingHistory && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(INVOICE_HISTORY_SQL);
                setFeedbackMessage({ type: 'success', text: 'Script SQL copiado para ativar o histórico compartilhado.' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0a0a0a] hover:bg-[#141414] border border-slate-800/60 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Copy size={14} />
              Copiar SQL
            </button>
          )}
        </div>

        {!isRemoteHistoryEnabled && !isSyncingHistory && (
          <pre className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
            {INVOICE_HISTORY_SQL}
          </pre>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-[#1a1a1a] p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Persistência NFS-e</p>
            <p className="text-sm text-slate-300 mt-1">
              {isSyncingNfseSettings
                ? 'Carregando configuração compartilhada da NFS-e...'
                : isRemoteNfseSettingsEnabled
                  ? 'Numeração de RPS/lote e parâmetros fiscais compartilhados entre usuários e máquinas.'
                  : 'Persistência compartilhada da NFS-e ainda não ativada. O navegador segue como fallback.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void saveRemoteNfseSettings()}
              disabled={isSavingNfseSettings}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0a0a0a] hover:bg-[#141414] border border-slate-800/60 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isSavingNfseSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar Configuração
            </button>
            {!isRemoteNfseSettingsEnabled && !isSyncingNfseSettings && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(NFSE_SETTINGS_SQL);
                  setFeedbackMessage({ type: 'success', text: 'Script SQL copiado para ativar a persistência da NFS-e.' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0a0a0a] hover:bg-[#141414] border border-slate-800/60 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Copy size={14} />
                Copiar SQL
              </button>
            )}
          </div>
        </div>

        {!isRemoteNfseSettingsEnabled && !isSyncingNfseSettings && (
          <pre className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
            {NFSE_SETTINGS_SQL}
          </pre>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-[#1a1a1a] p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Integração Prefeitura de Ponta Grossa</p>
            <h2 className="text-xl font-black tracking-tight mt-1">Configuração do Webservice NFS-e</h2>
            <p className="text-sm text-slate-400 mt-2">
              Credenciais sensíveis podem ficar no <code>.env.local</code>; ajuste aqui somente os parâmetros operacionais e fiscais.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleTestPontaGrossa()}
              disabled={isTestingPontaGrossa}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0a0a0a] hover:bg-[#141414] border border-slate-800/60 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isTestingPontaGrossa ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Testar Consulta
            </button>
            <button
              type="button"
              onClick={() => void handleEmitPontaGrossa()}
              disabled={isEmittingPontaGrossa}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isEmittingPontaGrossa ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />}
              Emitir Síncrono
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Segurança</p>
          <p className="mt-1 text-sm text-emerald-100/90">
            Certificado A1, senha do certificado e senha do webservice podem ser carregados pelo servidor via <code>.env.local</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CNPJ</span>
            <input value={pontaGrossaConfig.cnpj} onChange={(e) => updatePontaGrossaConfig('cnpj', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inscrição Municipal</span>
            <input value={pontaGrossaConfig.inscricaoMunicipal} onChange={(e) => updatePontaGrossaConfig('inscricaoMunicipal', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Série RPS</span>
            <input value={pontaGrossaConfig.serieRps} onChange={(e) => updatePontaGrossaConfig('serieRps', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Próximo RPS</span>
            <input type="number" value={pontaGrossaConfig.nextRpsNumber} onChange={(e) => updatePontaGrossaConfig('nextRpsNumber', Number(e.target.value || 1))} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Próximo Lote</span>
            <input type="number" value={pontaGrossaConfig.nextLotNumber} onChange={(e) => updatePontaGrossaConfig('nextLotNumber', Number(e.target.value || 1))} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Item Lista Serviço</span>
            <input value={pontaGrossaConfig.municipalServiceCode} onChange={(e) => updatePontaGrossaConfig('municipalServiceCode', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CNAE</span>
            <input value={pontaGrossaConfig.cnaeCode} onChange={(e) => updatePontaGrossaConfig('cnaeCode', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Razão Social Prestador</span>
            <input value={pontaGrossaConfig.issuerRazaoSocial} onChange={(e) => updatePontaGrossaConfig('issuerRazaoSocial', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Produção</span>
            <select value={pontaGrossaConfig.production ? 'production' : 'homologation'} onChange={(e) => updatePontaGrossaConfig('production', e.target.value === 'production')} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none">
              <option value="production">Produção</option>
              <option value="homologation">Homologação</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <label className="space-y-1 xl:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Endereço Prestador</span>
            <input value={pontaGrossaConfig.issuerStreet} onChange={(e) => updatePontaGrossaConfig('issuerStreet', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Número</span>
            <input value={pontaGrossaConfig.issuerNumber} onChange={(e) => updatePontaGrossaConfig('issuerNumber', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bairro</span>
            <input value={pontaGrossaConfig.issuerNeighborhood} onChange={(e) => updatePontaGrossaConfig('issuerNeighborhood', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CEP</span>
            <input value={pontaGrossaConfig.issuerCep} onChange={(e) => updatePontaGrossaConfig('issuerCep', e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </label>
        </div>

        {pontaGrossaResult && (
          <pre className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
            {JSON.stringify(pontaGrossaResult, null, 2)}
          </pre>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(['labor', 'mixed'] as InvoiceMode[]).map((mode) => {
          const meta = invoiceMeta[mode];
          const Icon = meta.icon;
          const isActive = activeMode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(mode)}
              className={`text-left rounded-3xl border p-5 transition-all ${
                isActive
                  ? `${meta.border} ${meta.surface} shadow-lg shadow-black/20`
                  : 'border-slate-800/60 bg-[#141414] hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? meta.accent : 'text-slate-500'}`}>
                    {meta.label}
                  </p>
                  <h2 className="text-xl font-black tracking-tight mt-1">{meta.title}</h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{meta.systemDescription}</p>
                </div>
                <div className={`size-12 rounded-2xl flex items-center justify-center ${isActive ? meta.surface : 'bg-[#0a0a0a]'} ${isActive ? meta.accent : 'text-slate-500'}`}>
                  <Icon size={22} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <ShieldCheck size={12} />
                Canal operacional: {meta.systemName}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.35fr)_460px] gap-6">
        <div className="space-y-6">
          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`size-10 rounded-2xl flex items-center justify-center ${currentMeta.surface} ${currentMeta.accent}`}>
                <ReceiptText size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Dados da Emissão</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Base operacional da nota selecionada
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Número Interno</span>
                <input
                  value={currentDraft.invoiceNumber}
                  onChange={(e) => updateDraft({ invoiceNumber: e.target.value })}
                  placeholder={`Ex: ${currentMeta.prefix}-2026-0001`}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Emitente</span>
                <input
                  value={currentDraft.issuerName}
                  onChange={(e) => updateDraft({ issuerName: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tomador</span>
                <input
                  value={currentDraft.clientName}
                  onChange={(e) => updateDraft({ clientName: e.target.value })}
                  placeholder="Nome do cliente / empresa"
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CPF/CNPJ</span>
                <input
                  value={currentDraft.clientDocument}
                  onChange={(e) => updateDraft({ clientDocument: e.target.value })}
                  placeholder="Documento do tomador"
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Projeto / Obra</span>
                <input
                  value={currentDraft.projectName}
                  onChange={(e) => updateDraft({ projectName: e.target.value })}
                  placeholder="Nome da obra ou contrato"
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Competência</span>
                <input
                  value={currentDraft.competence}
                  onChange={(e) => updateDraft({ competence: e.target.value })}
                  placeholder="Ex: 04/2026"
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data de Emissão</span>
                <input
                  type="date"
                  value={currentDraft.issueDate}
                  onChange={(e) => updateDraft({ issueDate: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Município da Prestação</span>
                <input
                  value={currentDraft.serviceCity}
                  onChange={(e) => updateDraft({ serviceCity: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Operacional</span>
                <select
                  value={currentDraft.status}
                  onChange={(e) => updateDraft({ status: e.target.value as InvoiceStatus })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                >
                  <option>Rascunho</option>
                  <option>Em emissão</option>
                  <option>Emitida</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 mt-4">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição do Serviço / Destaque da Nota</span>
                <textarea
                  value={currentDraft.serviceDescription}
                  onChange={(e) => updateDraft({ serviceDescription: e.target.value })}
                  rows={5}
                  placeholder="Descreva o serviço que será destacado na nota fiscal."
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20 resize-none"
                />
              </label>
              <div className={`rounded-2xl border p-4 ${currentMeta.border} ${currentMeta.surface}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${currentMeta.accent}`}>Canal de emissão atual</p>
                <h4 className="text-base font-black tracking-tight mt-2">{currentMeta.systemName}</h4>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">{currentMeta.systemDescription}</p>
              </div>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-black tracking-tight">Composição da Nota</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Monte os itens que compõem a emissão
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest hover:bg-[#c4ef2f] transition-all"
              >
                <FilePlus2 size={14} />
                Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {currentDraft.items.map((item) => {
                const total = item.quantity * item.unitPrice;
                return (
                  <div key={item.id} className="grid grid-cols-1 xl:grid-cols-[140px_minmax(0,1fr)_90px_120px_130px_120px_44px] gap-3 bg-[#0a0a0a] border border-slate-800/50 rounded-2xl p-3">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</span>
                      <select
                        value={activeMode === 'labor' ? 'labor' : item.type}
                        disabled={activeMode === 'labor'}
                        onChange={(e) => updateItem(item.id, { type: e.target.value as InvoiceItemType })}
                        className="w-full bg-[#121212] border border-slate-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="labor">Mão de Obra</option>
                        <option value="material">Material</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</span>
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Descrição do item faturado"
                        className="w-full bg-[#121212] border border-slate-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qtd.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value || 0) })}
                        className="w-full bg-[#121212] border border-slate-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unidade</span>
                      <input
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                        className="w-full bg-[#121212] border border-slate-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Unit.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value || 0) })}
                        className="w-full bg-[#121212] border border-slate-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </label>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total</span>
                      <div className="h-[42px] rounded-xl border border-slate-800/60 bg-[#121212] px-3 flex items-center justify-end text-sm font-black text-white">
                        {formatCurrency(total)}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="size-[42px] rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-black tracking-tight">Anexos da Emissão</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Comprovantes, XML, PDF, contrato ou planilhas de apoio
                </p>
              </div>
              <input
                ref={attachmentInputRef}
                type="file"
                className="hidden"
                onChange={(event) => void handleAttachmentUpload(event)}
              />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1f2937] hover:bg-[#273246] disabled:opacity-50 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isUploadingAttachment ? <Loader2 size={14} className="animate-spin" /> : <FolderUp size={14} />}
                {isUploadingAttachment ? 'Enviando...' : 'Adicionar Anexo'}
              </button>
            </div>

            <div className="space-y-3">
              {currentDraft.attachments.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-6 text-center text-sm text-slate-500">
                  Nenhum anexo vinculado a esta nota ainda.
                </div>
              ) : (
                currentDraft.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Paperclip size={14} className="text-slate-500" />
                        <p className="text-sm font-bold text-white truncate">{attachment.name}</p>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                        {Math.max(1, Math.round(attachment.size / 1024))} KB · enviado em {formatDateTime(attachment.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Abrir
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="size-9 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-2xl bg-[#0a0a0a] flex items-center justify-center text-[#d4ff3f]">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Resumo Financeiro</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Valores calculados automaticamente
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-[#0a0a0a] border border-slate-800/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtotal Mão de Obra</span>
                <span className="text-sm font-black text-[#d4ff3f]">{formatCurrency(totals.laborSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#0a0a0a] border border-slate-800/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtotal Material</span>
                <span className="text-sm font-black text-orange-400">{formatCurrency(totals.materialSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#0a0a0a] border border-slate-800/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bruto da Nota</span>
                <span className="text-sm font-black text-white">{formatCurrency(totals.grossTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ISS %</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentDraft.issRate}
                  onChange={(e) => updateDraft({ issRate: Number(e.target.value || 0) })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">INSS %</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentDraft.inssRate}
                  onChange={(e) => updateDraft({ inssRate: Number(e.target.value || 0) })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Outras Retenções %</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentDraft.otherRetentionRate}
                  onChange={(e) => updateDraft({ otherRetentionRate: Number(e.target.value || 0) })}
                  className="w-full bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>ISS</span>
                <span>{formatCurrency(totals.issValue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>INSS</span>
                <span>{formatCurrency(totals.inssValue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Outras retenções</span>
                <span>{formatCurrency(totals.otherRetentionValue)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#d4ff3f]/20 bg-[#d4ff3f]/10 px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">Valor Líquido Estimado</p>
                <p className="text-xs font-bold text-slate-300 mt-1">Após retenções parametrizadas acima</p>
              </div>
              <span className="text-lg font-black text-[#d4ff3f]">{formatCurrency(totals.netTotal)}</span>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-2xl bg-[#0a0a0a] flex items-center justify-center text-orange-400">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Checklist Operacional</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Etapas para conferência antes da emissão
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {currentMeta.checklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#0a0a0a] border border-slate-800/50 px-4 py-3">
                  <CheckCircle2 size={16} className={currentMeta.accent} />
                  <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <h3 className="text-lg font-black tracking-tight">Observações Internas</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
              Informações de apoio para a equipe financeira
            </p>
            <textarea
              value={currentDraft.internalNotes}
              onChange={(e) => updateDraft({ internalNotes: e.target.value })}
              rows={6}
              placeholder="Anote retenções específicas, conferências pendentes, número do pedido ou qualquer detalhe útil."
              className="w-full mt-4 bg-[#0a0a0a] border border-slate-800/60 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20 resize-none"
            />
          </section>

          <section className="bg-[#1a1a1a] border border-slate-800/60 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-black tracking-tight">Histórico de Emissões</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Registros salvos para {invoiceMeta[activeMode].label.toLowerCase()}
                </p>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {sortedHistory.length} registro(s)
              </div>
            </div>

            <div className="space-y-3">
              {sortedHistory.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-6 text-center text-sm text-slate-500">
                  Nenhuma emissão salva para este fluxo ainda.
                </div>
              ) : (
                sortedHistory.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-slate-800/50 bg-[#0a0a0a] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{record.invoiceNumber}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                          {record.clientName || 'Sem tomador'} · {record.projectName || 'Sem obra'}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-1">
                          Atualizado em {formatDateTime(record.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          record.status === 'Emitida'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : record.status === 'Em emissão'
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => loadHistoryRecord(record.id)}
                        className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Carregar
                      </button>
                      <button
                        type="button"
                        onClick={() => void exportInvoiceMirror(record)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Espelho
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteHistoryRecord(record.id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {!isHydrated && (
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Carregando rascunhos e histórico de notas fiscais...
        </div>
      )}
    </div>
  );
}
