'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Save, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Insumo } from '@/lib/types';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mo' | 'mat' | 'eq'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Insumo; direction: 'asc' | 'desc' | null }>({
    key: 'descricao',
    direction: 'asc'
  });
  const updateTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});
  const importInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSort = (key: keyof Insumo) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Insumo) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

  const roundCurrencyValue = (value: number | null | undefined) => Number((value ?? 0).toFixed(2));

  const formatCurrency = (value: number | null | undefined) =>
    `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)}`;

  const normalizeHeader = (value: unknown) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') return Number.isFinite(value) ? roundCurrencyValue(value) : null;
    if (typeof value !== 'string') return null;

    const cleaned = value.replace(/[^\d,.-]/g, '').trim();
    if (!cleaned) return null;

    if (cleaned.includes(',') || cleaned.includes('.')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? roundCurrencyValue(parsed) : null;
    }

    const digitsOnly = cleaned.replace(/\D/g, '');
    if (!digitsOnly) return null;
    return roundCurrencyValue(Number(digitsOnly) / 100);
  };

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcpo_insumos')
        .select('*')
        .order('descricao');
      
      if (error) throw error;
      setInsumos(
        (data || []).map((insumo) => ({
          ...insumo,
          preco_unitario: roundCurrencyValue(insumo.preco_unitario),
          preco_sabado: roundCurrencyValue(insumo.preco_sabado),
          preco_domingo_feriado: roundCurrencyValue(insumo.preco_domingo_feriado),
        }))
      );
    } catch (err) {
      console.error('Error fetching insumos:', err);
      setMessage({ text: 'Erro ao carregar insumos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleUpdatePrice = (id: string, field: 'preco_unitario' | 'preco_sabado' | 'preco_domingo_feriado', newPrice: number) => {
    const normalizedPrice = roundCurrencyValue(newPrice);

    // Update local state immediately for responsive UI
    setInsumos(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: normalizedPrice };
        // Apply formulas: Saturday = Normal + 50%, Sunday = Normal + 100%
        if (field === 'preco_unitario') {
          updated.preco_sabado = roundCurrencyValue(normalizedPrice * 1.5);
          updated.preco_domingo_feriado = roundCurrencyValue(normalizedPrice * 2.0);
        }
        return updated;
      }
      return i;
    }));

    // Debounce Supabase update to avoid "locking" the input during typing
    const timeoutKey = `${id}-${field}`;
    if (updateTimeouts.current[timeoutKey]) {
      clearTimeout(updateTimeouts.current[timeoutKey]);
    }

    updateTimeouts.current[timeoutKey] = setTimeout(async () => {
      try {
        const updates: Partial<Insumo> = { [field]: normalizedPrice };
        if (field === 'preco_unitario') {
          updates.preco_sabado = roundCurrencyValue(normalizedPrice * 1.5);
          updates.preco_domingo_feriado = roundCurrencyValue(normalizedPrice * 2.0);
        }
        
        const { error } = await supabase
          .from('tcpo_insumos')
          .update(updates)
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error(`Error updating ${field}:`, err);
        setMessage({ text: 'Erro ao salvar preço no banco de dados.', type: 'error' });
      }
    }, 1000);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setMessage(null);
    try {
      // We'll call a function to recalculate all TCPO items based on current insumos
      // For now, we'll implement the logic here or call a server-side function if we had one.
      // Since we are client-side, we'll do it here.
      
      // 1. Get all insumos and items
      const { data: allInsumos } = await supabase.from('tcpo_insumos').select('*');
      const { data: allItems } = await supabase.from('tcpo_itens').select('*');
      
      if (!allInsumos || !allItems) throw new Error('Falha ao buscar dados para recalcular.');

      const insumosMap = new Map<string, Insumo>(allInsumos.map(i => [i.id, i as Insumo]));
      const itemsMap = new Map<string, any>(allItems.map(i => [i.id, i]));

      // 2. Perform recalculation (3 passes to handle nesting)
      const updatedItems = [...allItems];
      
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < updatedItems.length; i++) {
          const item = updatedItems[i];
          if (!item.composicao || !Array.isArray(item.composicao)) continue;

          let totalMO = 0;
          let totalMat = 0;
          let totalEq = 0;

          const newComposicao = item.composicao.map((comp: { codigo?: string; p_unit: number; coef: number; tipo: string }) => {
            let p_unit = comp.p_unit;
            
            if (comp.codigo && insumosMap.has(comp.codigo)) {
              p_unit = insumosMap.get(comp.codigo)!.preco_unitario;
            } else if (comp.codigo && itemsMap.has(comp.codigo)) {
              const subItem = itemsMap.get(comp.codigo)!;
              p_unit = (subItem.custo_mo || 0) + (subItem.custo_mat || 0) + (subItem.custo_eq || 0);
            }

            const p_total = p_unit * (comp.coef || 0);
            
            if (comp.tipo === 'mo') totalMO += p_total;
            else if (comp.tipo === 'mat') totalMat += p_total;
            else if (comp.tipo === 'eq') totalEq += p_total;

            return { ...comp, p_unit, p_total };
          });

          updatedItems[i] = {
            ...item,
            composicao: newComposicao,
            custo_mo: totalMO,
            custo_mat: totalMat,
            custo_eq: totalEq,
            custo_sabado: (totalMO + totalMat + totalEq) * 1.5,
            custo_domingo_feriado: (totalMO + totalMat + totalEq) * 2
          };
          itemsMap.set(item.id, updatedItems[i]);
        }
      }

      // 3. Save updates
      // To avoid massive individual calls, we could use a RPC or just loop (limited for demo)
      for (const item of updatedItems) {
        await supabase.from('tcpo_itens').update({
          custo_mo: item.custo_mo,
          custo_mat: item.custo_mat,
          custo_eq: item.custo_eq,
          custo_sabado: item.custo_sabado,
          custo_domingo_feriado: item.custo_domingo_feriado,
          composicao: item.composicao,
          updated_at: new Date().toISOString()
        }).eq('id', item.id);
      }

      setMessage({ text: 'Todos os serviços foram recalculados com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error recalculating:', err);
      setMessage({ text: 'Erro ao recalcular serviços.', type: 'error' });
    } finally {
      setIsRecalculating(false);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInsumo, setNewInsumo] = useState<Partial<Insumo>>({
    id: '',
    descricao: '',
    unidade: 'un',
    preco_unitario: 0,
    preco_sabado: 0,
    preco_domingo_feriado: 0,
    tipo: 'mat'
  });

  const handleAddInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsumo.id || !newInsumo.descricao) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tcpo_insumos')
        .insert([newInsumo]);
      
      if (error) throw error;
      
      setInsumos(prev => [...prev, newInsumo as Insumo].sort((a, b) => a.descricao.localeCompare(b.descricao)));
      setIsAddModalOpen(false);
      setNewInsumo({ id: '', descricao: '', unidade: 'un', preco_unitario: 0, tipo: 'mat' });
      setMessage({ text: 'Insumo adicionado com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error adding insumo:', err);
      setMessage({ text: 'Erro ao adicionar insumo. Verifique se o código já existe.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInsumo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este insumo?')) return;

    try {
      const { error } = await supabase
        .from('tcpo_insumos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setInsumos(prev => prev.filter(i => i.id !== id));
      setMessage({ text: 'Insumo excluído com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error deleting insumo:', err);
      setMessage({ text: 'Erro ao excluir insumo. Ele pode estar sendo usado em composições.', type: 'error' });
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });

      if (!rows.length) {
        throw new Error('A planilha está vazia.');
      }

      const updates = rows
        .map((row) => {
          const normalizedEntries = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
            acc[normalizeHeader(key)] = value;
            return acc;
          }, {});

          const id = String(
            normalizedEntries['codigo'] ??
            normalizedEntries['código'] ??
            normalizedEntries['cod'] ??
            ''
          ).trim();

          if (!id) return null;

          const tipoValue = String(normalizedEntries['tipo'] ?? '').trim().toLowerCase();
          const parsedTipo: Insumo['tipo'] | null =
            tipoValue === 'mo' || tipoValue === 'mao de obra' || tipoValue === 'mão de obra'
              ? 'mo'
              : tipoValue === 'mat' || tipoValue === 'material' || tipoValue === 'materiais'
                ? 'mat'
                : tipoValue === 'eq' || tipoValue === 'equipamento' || tipoValue === 'equipamentos'
                  ? 'eq'
                  : null;

          const payload = {
            descricao: String(normalizedEntries['descricao'] ?? normalizedEntries['descrição'] ?? '').trim() || null,
            unidade: String(normalizedEntries['unidade'] ?? normalizedEntries['unid.'] ?? normalizedEntries['un'] ?? '').trim() || null,
            tipo: parsedTipo,
            preco_unitario: toNumber(normalizedEntries['normal'] ?? normalizedEntries['preco unitario'] ?? normalizedEntries['preço unitário'] ?? normalizedEntries['preco_unitario']),
            preco_sabado: toNumber(normalizedEntries['sabado'] ?? normalizedEntries['sábado'] ?? normalizedEntries['preco sabado'] ?? normalizedEntries['preço sábado'] ?? normalizedEntries['preco_sabado']),
            preco_domingo_feriado: toNumber(normalizedEntries['dom/fer'] ?? normalizedEntries['domingo/feriado'] ?? normalizedEntries['domingo feriado'] ?? normalizedEntries['preco domingo feriado'] ?? normalizedEntries['preço domingo feriado'] ?? normalizedEntries['preco_domingo_feriado']),
          };

          const definedPayload = Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== null)
          );

          if (Object.keys(definedPayload).length === 0) return null;

          return { id, payload: definedPayload };
        })
        .filter((item): item is { id: string; payload: Record<string, string | number> } => Boolean(item));

      if (!updates.length) {
        throw new Error('Nenhuma linha válida foi encontrada. Use a coluna Código e pelo menos um campo editável.');
      }

      const failures: string[] = [];

      for (const update of updates) {
        const { error } = await supabase
          .from('tcpo_insumos')
          .update(update.payload)
          .eq('id', update.id);

        if (error) {
          failures.push(`${update.id}: ${error.message}`);
        }
      }

      if (failures.length > 0) {
        throw new Error(`Alguns insumos não puderam ser atualizados. ${failures.slice(0, 3).join(' | ')}`);
      }

      setMessage({ text: `${updates.length} insumos atualizados com sucesso pela planilha.`, type: 'success' });
      await fetchInsumos();
    } catch (error) {
      console.error('Error importing insumos spreadsheet:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Não foi possível importar a planilha.',
        type: 'error',
      });
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const dataToExport = filteredInsumos.map((insumo) => ({
        'Código': insumo.id,
        'Descrição': insumo.descricao,
        'Unidade': insumo.unidade,
        'Tipo': getTypeName(insumo.tipo),
        'Normal': roundCurrencyValue(insumo.preco_unitario),
        'Sábado': roundCurrencyValue(insumo.preco_sabado),
        'Dom/Fer': roundCurrencyValue(insumo.preco_domingo_feriado),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Insumos');
      XLSX.writeFile(workbook, `Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting insumos to Excel:', error);
      setMessage({ text: 'Não foi possível exportar a planilha de insumos.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Código', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Descrição', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Un', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tipo', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Normal (R$)', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sáb. (R$)', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dom/Fer (R$)', bold: true })] })] }),
          ],
        }),
        ...filteredInsumos.map((insumo) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(insumo.id)] }),
            new TableCell({ children: [new Paragraph(insumo.descricao)] }),
            new TableCell({ children: [new Paragraph(insumo.unidade)] }),
            new TableCell({ children: [new Paragraph(getTypeName(insumo.tipo))] }),
            new TableCell({ children: [new Paragraph(roundCurrencyValue(insumo.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))] }),
            new TableCell({ children: [new Paragraph(roundCurrencyValue(insumo.preco_sabado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))] }),
            new TableCell({ children: [new Paragraph(roundCurrencyValue(insumo.preco_domingo_feriado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))] }),
          ],
        })),
      ];

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: 'Listagem de Insumos',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: '' }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Insumos_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error('Error exporting insumos to Word:', error);
      setMessage({ text: 'Não foi possível exportar o Word de insumos.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredInsumos = insumos
    .filter(i => {
      const matchesSearch = i.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || i.tipo === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const getTypeName = (type: string) => {
    switch (type) {
      case 'mo': return 'Mão de Obra';
      case 'mat': return 'Material';
      case 'eq': return 'Equipamento';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mo': return 'text-blue-500 bg-blue-500/10';
      case 'mat': return 'text-orange-500 bg-orange-500/10';
      case 'eq': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Gestão de <span className="text-[#d4ff3f]">Insumos</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cadastro e precificação base para composições</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => void handleImportExcel(event)}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={loading || isImporting}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isImporting ? 'Importando...' : 'Importar Excel'}
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            disabled={loading || isExporting || filteredInsumos.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button
            type="button"
            onClick={() => void exportToWord()}
            disabled={loading || isExporting || filteredInsumos.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FileText size={16} />
            Word
          </button>
          <button 
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isRecalculating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Recalcular Serviços
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> NOVO INSUMO
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-black italic uppercase tracking-tight">Novo <span className="text-[#d4ff3f]">Insumo</span></h2>
            </div>
            <form onSubmit={handleAddInsumo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código</label>
                <input 
                  type="text" 
                  required
                  value={newInsumo.id}
                  onChange={e => setNewInsumo({...newInsumo, id: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  placeholder="Ex: 01.01.001"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={newInsumo.descricao}
                  onChange={e => setNewInsumo({...newInsumo, descricao: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  placeholder="Nome do insumo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                  <input 
                    type="text" 
                    required
                    value={newInsumo.unidade}
                    onChange={e => setNewInsumo({...newInsumo, unidade: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                    placeholder="Ex: h, m2, kg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                  <select 
                    value={newInsumo.tipo}
                    onChange={e => setNewInsumo({...newInsumo, tipo: e.target.value as 'mo' | 'mat' | 'eq'})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  >
                    <option value="mat">Material</option>
                    <option value="mo">Mão de Obra</option>
                    <option value="eq">Equipamento</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Normal</label>
                  <input
                    type="text"
                    value={formatCurrency(newInsumo.preco_unitario)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cents = parseInt(val || "0", 10);
                      const amount = cents / 100;
                      setNewInsumo({
                        ...newInsumo, 
                        preco_unitario: amount,
                        preco_sabado: amount * 1.5,
                        preco_domingo_feriado: amount * 2
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sábado</label>
                  <input
                    type="text"
                    value={formatCurrency(newInsumo.preco_sabado)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cents = parseInt(val || "0", 10);
                      setNewInsumo({...newInsumo, preco_sabado: cents / 100});
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dom/Fer</label>
                  <input
                    type="text"
                    value={formatCurrency(newInsumo.preco_domingo_feriado)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cents = parseInt(val || "0", 10);
                      setNewInsumo({...newInsumo, preco_domingo_feriado: cents / 100});
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-xs font-bold uppercase tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar insumo por nome ou código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'all' ? 'bg-[#d4ff3f] text-[#0a0a0a]' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('mo')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'mo' ? 'bg-blue-500 text-white' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Mão de Obra
            </button>
            <button 
              onClick={() => setFilterType('mat')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'mat' ? 'bg-orange-500 text-white' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Materiais
            </button>
            <button 
              onClick={() => setFilterType('eq')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === 'eq' ? 'bg-purple-500 text-white' : 'bg-[#0a0a0a] text-slate-500 hover:text-white'
              }`}
            >
              Equipamentos
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors w-[140px]" onClick={() => handleSort('id')}>
                  <div className="flex items-center">
                    Código {getSortIcon('id')}
                  </div>
                </th>
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('descricao')}>
                  <div className="flex items-center">
                    Descrição do Insumo {getSortIcon('descricao')}
                  </div>
                </th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white transition-colors w-[60px]" onClick={() => handleSort('unidade')}>
                  <div className="flex items-center justify-center">
                    Unid. {getSortIcon('unidade')}
                  </div>
                </th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white transition-colors w-[145px]" onClick={() => handleSort('tipo')}>
                  <div className="flex items-center justify-center">
                    Tipo {getSortIcon('tipo')}
                  </div>
                </th>
                <th className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors w-[100px]" onClick={() => handleSort('preco_unitario')}>
                  <div className="flex items-center justify-end">
                    Normal {getSortIcon('preco_unitario')}
                  </div>
                </th>
                <th className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors w-[100px]" onClick={() => handleSort('preco_sabado')}>
                  <div className="flex items-center justify-end">
                    Sábado {getSortIcon('preco_sabado')}
                  </div>
                </th>
                <th className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors w-[100px]" onClick={() => handleSort('preco_domingo_feriado')}>
                  <div className="flex items-center justify-end">
                    Dom/Fer {getSortIcon('preco_domingo_feriado')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="text-[#d4ff3f] animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando insumos...</p>
                  </td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm font-bold">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((insumo) => (
                  <tr key={insumo.id} className="hover:bg-[#0a0a0a] transition-colors group">
                    <td className="px-2 py-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{insumo.id}</p>
                    </td>
                    <td className="px-2 py-1.5 overflow-hidden">
                      <p className="text-[16px] font-bold text-white truncate" title={insumo.descricao}>{insumo.descricao}</p>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{insumo.unidade}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${getTypeColor(insumo.tipo)}`}>
                        {getTypeName(insumo.tipo)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex justify-end">
                        <input
                          type="text"
                          value={formatCurrency(insumo.preco_unitario)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const cents = parseInt(val || "0", 10);
                            handleUpdatePrice(insumo.id, 'preco_unitario', cents / 100);
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-24 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex justify-end">
                        <input
                          type="text"
                          value={formatCurrency(insumo.preco_sabado)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const cents = parseInt(val || "0", 10);
                            handleUpdatePrice(insumo.id, 'preco_sabado', cents / 100);
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-24 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex justify-end">
                        <input
                          type="text"
                          value={formatCurrency(insumo.preco_domingo_feriado)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const cents = parseInt(val || "0", 10);
                            handleUpdatePrice(insumo.id, 'preco_domingo_feriado', cents / 100);
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-24 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-[#d4ff3f] text-right outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button 
                        onClick={() => handleDeleteInsumo(insumo.id)}
                        className="p-1 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
