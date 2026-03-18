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
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';

export default function ServicesPage() {
  const [services, setServices] = useState<TCPOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const filteredServices = services.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

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
        'Total (R$)': s.custo_mo + s.custo_mat + s.custo_eq
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
            new TableCell({ children: [new Paragraph({ text: 'Código', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Descrição', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Un', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Total (R$)', bold: true })] }),
          ],
        }),
        ...filteredServices.map(s => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(s.id)] }),
            new TableCell({ children: [new Paragraph(s.descricao)] }),
            new TableCell({ children: [new Paragraph(s.unidade)] }),
            new TableCell({ children: [new Paragraph((s.custo_mo + s.custo_mat + s.custo_eq).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))] }),
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Un</th>
                <th className="px-6 py-4 text-right">Custo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-slate-400">Carregando serviços...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
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
                      <td className="px-6 py-2">
                        {expandedItems.has(service.id) ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </td>
                      <td className="px-6 py-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{service.id}</p>
                      </td>
                      <td className="px-6 py-2">
                        <div className="text-sm font-bold text-white">{service.descricao}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{service.categoria}</div>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{service.unidade}</span>
                      </td>
                      <td className="px-6 py-2 text-right">
                        <span className="text-sm font-black text-[#d4ff3f]">
                          R$ {(service.custo_mo + service.custo_mat + service.custo_eq).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
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
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/50">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mão de Obra</div>
                                <div className="text-sm font-black text-blue-500">R$ {service.custo_mo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              </div>
                              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/50">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Material</div>
                                <div className="text-sm font-black text-orange-500">R$ {service.custo_mat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              </div>
                              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-slate-800/50">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Equipamento</div>
                                <div className="text-sm font-black text-purple-500">R$ {service.custo_eq.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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

