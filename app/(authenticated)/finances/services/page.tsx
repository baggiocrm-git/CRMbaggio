'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TCPOItem } from '@/lib/types';
import { 
  Search, 
  FileSpreadsheet, 
  FileText,
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';

export default function ServicesPage() {
  const [services, setServices] = useState<TCPOItem[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof TCPOItem | 'total'; direction: 'asc' | 'desc' | null }>({
    key: 'id',
    direction: 'asc'
  });
  const saveTimeoutsRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleSort = (key: keyof TCPOItem | 'total') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof TCPOItem | 'total') => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcpo_itens')
        .select('*')
        .order('id');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredServices = services
    .filter(s => 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoria.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;
      
      let aValue: number | string;
      let bValue: number | string;

      if (sortConfig.key === 'total') {
        aValue = a.custo_mo + a.custo_mat + a.custo_eq;
        bValue = b.custo_mo + b.custo_mat + b.custo_eq;
      } else {
        aValue = ((a[sortConfig.key as keyof TCPOItem] as string | number | undefined) ?? '');
        bValue = ((b[sortConfig.key as keyof TCPOItem] as string | number | undefined) ?? '');
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleUpdateService = async (id: string, field: keyof TCPOItem, value: number) => {
    // Optimistic update
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

    try {
      const { error } = await supabase
        .from('tcpo_itens')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating service:', error);
      // Revert on error
      fetchServices();
    }
  };

  const formatCurrencyInput = (value: number) =>
    `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)}`;

  const parseCurrencyInput = (rawValue: string) => {
    const cleaned = rawValue.replace(/[^\d,.-]/g, '').trim();
    if (!cleaned) return 0;

    const hasDecimalSeparator = cleaned.includes(',') || cleaned.includes('.');
    if (hasDecimalSeparator) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const digitsOnly = cleaned.replace(/\D/g, '');
    if (!digitsOnly) return 0;
    return Number(digitsOnly) / 100;
  };

  const getFieldDraftKey = (serviceId: string, field: keyof TCPOItem) => `${serviceId}:${field}`;

  const scheduleServiceCommit = (id: string, field: keyof TCPOItem, rawValue: string) => {
    const timeoutKey = getFieldDraftKey(id, field);
    if (saveTimeoutsRef.current[timeoutKey]) {
      clearTimeout(saveTimeoutsRef.current[timeoutKey]);
    }

    saveTimeoutsRef.current[timeoutKey] = setTimeout(() => {
      handleUpdateService(id, field, parseCurrencyInput(rawValue));
      setDraftValues((prev) => {
        const next = { ...prev };
        delete next[timeoutKey];
        return next;
      });
      delete saveTimeoutsRef.current[timeoutKey];
    }, 700);
  };

  const commitServiceValue = (id: string, field: keyof TCPOItem) => {
    const timeoutKey = getFieldDraftKey(id, field);
    if (saveTimeoutsRef.current[timeoutKey]) {
      clearTimeout(saveTimeoutsRef.current[timeoutKey]);
      delete saveTimeoutsRef.current[timeoutKey];
    }

    const rawValue = draftValues[timeoutKey];
    if (rawValue === undefined) return;

    handleUpdateService(id, field, parseCurrencyInput(rawValue));
    setDraftValues((prev) => {
      const next = { ...prev };
      delete next[timeoutKey];
      return next;
    });
  };

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const exportToExcel = () => {
    setExporting(true);
    try {
      const dataToExport = filteredServices.map(s => ({
        'Código': s.id,
        'Categoria': s.categoria,
        'Descrição': s.descricao,
        'Unidade': s.unidade,
        'Custo MO (R$)': s.custo_mo,
        'Custo MAT (R$)': s.custo_mat,
        'Custo EQ (R$)': s.custo_eq,
        'Total Normal (R$)': s.custo_mo + s.custo_mat + s.custo_eq,
        'Total Sábado (R$)': s.custo_sabado || (s.custo_mo + s.custo_mat + s.custo_eq) * 1.5,
        'Total Dom./Fer. (R$)': s.custo_domingo_feriado || (s.custo_mo + s.custo_mat + s.custo_eq) * 2
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Serviços');
      XLSX.writeFile(wb, `Servicos_Orcamento_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportToWord = async () => {
    setExporting(true);
    try {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Código', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Descrição', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Un', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Normal (R$)', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sáb. (R$)', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dom/Fer (R$)', bold: true })] })] }),
          ],
        }),
        ...filteredServices.map(s => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(s.id)] }),
            new TableCell({ children: [new Paragraph(s.descricao)] }),
            new TableCell({ children: [new Paragraph(s.unidade)] }),
            new TableCell({ children: [new Paragraph((s.custo_mo + s.custo_mat + s.custo_eq).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))] }),
            new TableCell({ children: [new Paragraph((s.custo_sabado || (s.custo_mo + s.custo_mat + s.custo_eq) * 1.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))] }),
            new TableCell({ children: [new Paragraph((s.custo_domingo_feriado || (s.custo_mo + s.custo_mat + s.custo_eq) * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))] }),
          ],
        }))
      ];

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Listagem de Serviços de Orçamento",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }), // Spacer
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Servicos_Orcamento_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error('Error exporting to Word:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic">
            Serviços de <span className="text-[#d4ff3f]">Orçamento</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gerencie e exporte a listagem de serviços cadastrados</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            disabled={loading || exporting || filteredServices.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/10"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (XLSX)</span>
          </button>
          <button
            onClick={exportToWord}
            disabled={loading || exporting || filteredServices.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10"
          >
            <FileText className="w-4 h-4" />
            <span>Word (DOCX)</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por código, descrição ou categoria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-slate-800/50 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#d4ff3f]/30 transition-all"
        />
      </div>

      <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-2 py-4 w-[40px]"></th>
                <th className="px-2 py-4 cursor-pointer hover:text-white transition-colors w-[90px]" onClick={() => handleSort('id')}>
                  <div className="flex items-center">
                    Código {getSortIcon('id')}
                  </div>
                </th>
                <th className="px-2 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('descricao')}>
                  <div className="flex items-center">
                    Descrição {getSortIcon('descricao')}
                  </div>
                </th>
                <th className="px-2 py-4 cursor-pointer hover:text-white transition-colors w-[50px]" onClick={() => handleSort('unidade')}>
                  <div className="flex items-center">
                    Un {getSortIcon('unidade')}
                  </div>
                </th>
                <th className="px-2 py-4 text-right cursor-pointer hover:text-white transition-colors w-[145px]" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end">
                    Total Normal {getSortIcon('total')}
                  </div>
                </th>
                <th className="px-2 py-4 text-right cursor-pointer hover:text-white transition-colors w-[125px]" onClick={() => handleSort('custo_sabado')}>
                  <div className="flex items-center justify-end">
                    Total Sáb. {getSortIcon('custo_sabado')}
                  </div>
                </th>
                <th className="px-2 py-4 text-right cursor-pointer hover:text-white transition-colors w-[125px]" onClick={() => handleSort('custo_domingo_feriado')}>
                  <div className="flex items-center justify-end">
                    Total Dom./Fer. {getSortIcon('custo_domingo_feriado')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-slate-400">Carregando serviços...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum serviço encontrado.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <React.Fragment key={service.id}>
                    <tr 
                      className="hover:bg-[#0a0a0a] transition-colors cursor-pointer group"
                      onClick={() => toggleExpand(service.id)}
                    >
                      <td className="px-2 py-2">
                        {expandedItems.has(service.id) ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest truncate">{service.id}</p>
                      </td>
                      <td className="px-2 py-2 overflow-hidden">
                        <div className="text-[16px] font-bold text-white truncate" title={service.descricao}>{service.descricao}</div>
                        <div className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-0.5 truncate">{service.categoria}</div>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{service.unidade}</span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-[16px] font-black text-[#d4ff3f]">
                          R$ {(service.custo_mo + service.custo_mat + service.custo_eq).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={draftValues[getFieldDraftKey(service.id, 'custo_sabado')] ?? formatCurrencyInput(service.custo_sabado || (service.custo_mo + service.custo_mat + service.custo_eq) * 1.5)}
                            onChange={(e) => {
                              const rawValue = e.target.value;
                              setDraftValues((prev) => ({ ...prev, [getFieldDraftKey(service.id, 'custo_sabado')]: rawValue }));
                              scheduleServiceCommit(service.id, 'custo_sabado', rawValue);
                            }}
                            onBlur={() => commitServiceValue(service.id, 'custo_sabado')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitServiceValue(service.id, 'custo_sabado');
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-28 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-orange-400 text-right outline-none focus:ring-2 focus:ring-orange-400/30 transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={draftValues[getFieldDraftKey(service.id, 'custo_domingo_feriado')] ?? formatCurrencyInput(service.custo_domingo_feriado || (service.custo_mo + service.custo_mat + service.custo_eq) * 2)}
                            onChange={(e) => {
                              const rawValue = e.target.value;
                              setDraftValues((prev) => ({ ...prev, [getFieldDraftKey(service.id, 'custo_domingo_feriado')]: rawValue }));
                              scheduleServiceCommit(service.id, 'custo_domingo_feriado', rawValue);
                            }}
                            onBlur={() => commitServiceValue(service.id, 'custo_domingo_feriado')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitServiceValue(service.id, 'custo_domingo_feriado');
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-28 bg-[#0a0a0a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-rose-400 text-right outline-none focus:ring-2 focus:ring-rose-400/30 transition-all"
                          />
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedItems.has(service.id) && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-[#0a0a0a]/50"
                        >
                          <td colSpan={7} className="px-2 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/50">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mão de Obra</div>
                                <input
                                  type="text"
                                  value={draftValues[getFieldDraftKey(service.id, 'custo_mo')] ?? formatCurrencyInput(service.custo_mo || 0)}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    setDraftValues((prev) => ({ ...prev, [getFieldDraftKey(service.id, 'custo_mo')]: rawValue }));
                                    scheduleServiceCommit(service.id, 'custo_mo', rawValue);
                                  }}
                                  onBlur={() => commitServiceValue(service.id, 'custo_mo')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      commitServiceValue(service.id, 'custo_mo');
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-blue-500 text-left outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                />
                              </div>
                              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/50">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Material</div>
                                <input
                                  type="text"
                                  value={draftValues[getFieldDraftKey(service.id, 'custo_mat')] ?? formatCurrencyInput(service.custo_mat || 0)}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    setDraftValues((prev) => ({ ...prev, [getFieldDraftKey(service.id, 'custo_mat')]: rawValue }));
                                    scheduleServiceCommit(service.id, 'custo_mat', rawValue);
                                  }}
                                  onBlur={() => commitServiceValue(service.id, 'custo_mat')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      commitServiceValue(service.id, 'custo_mat');
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-orange-500 text-left outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
                                />
                              </div>
                              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/50">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Equipamento</div>
                                <input
                                  type="text"
                                  value={draftValues[getFieldDraftKey(service.id, 'custo_eq')] ?? formatCurrencyInput(service.custo_eq || 0)}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    setDraftValues((prev) => ({ ...prev, [getFieldDraftKey(service.id, 'custo_eq')]: rawValue }));
                                    scheduleServiceCommit(service.id, 'custo_eq', rawValue);
                                  }}
                                  onBlur={() => commitServiceValue(service.id, 'custo_eq')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      commitServiceValue(service.id, 'custo_eq');
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-2 py-1 text-[13px] font-black text-purple-500 text-left outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                                />
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
