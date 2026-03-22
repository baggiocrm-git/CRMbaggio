'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Loader2, 
  Building2, 
  Calendar,
  FileText,
  PieChart,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Upload,
  X,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Budget } from '@/lib/types';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType,
  VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';

interface AnalyticalItem {
  id: string;
  tcpo_id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  custo_unit_mo: number;
  custo_unit_mat: number;
  custo_unit_eq: number;
  custo_unit_total: number;
  bdi: number;
  preco_unit_com_bdi: number;
  subtotal_custo: number;
  subtotal_preco: number;
  ordem: number;
  composicao?: {
    insumo: string;
    un: string;
    coef: number;
    p_unit: number;
    p_total: number;
    tipo: 'mo' | 'mat' | 'eq';
  }[];
}

function numberToWords(n: number): string {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (n === 0) return 'zero';
  if (n === 100) return 'cem';

  let words = '';

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    if (millions === 1) words += 'um milhão ';
    else words += numberToWords(millions) + ' milhões ';
    n %= 1000000;
    if (n > 0) words += 'e ';
  }

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    if (thousands === 1) words += 'mil ';
    else words += numberToWords(thousands) + ' mil ';
    n %= 1000;
    if (n > 0) words += 'e ';
  }

  if (n >= 100) {
    words += hundreds[Math.floor(n / 100)] + ' ';
    n %= 100;
    if (n > 0) words += 'e ';
  }

  if (n >= 20) {
    words += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
    if (n > 0) words += 'e ';
  } else if (n >= 10) {
    words += teens[n - 10] + ' ';
    n = 0;
  }

  if (n > 0) {
    words += units[n] + ' ';
  }

  return words.trim();
}

function formatCurrencyToWords(value: number): string {
  const integerPart = Math.floor(value);
  const decimalPart = Math.round((value - integerPart) * 100);

  let result = '';

  if (integerPart > 0) {
    result += numberToWords(integerPart);
    result += integerPart === 1 ? ' real' : ' reais';
  }

  if (decimalPart > 0) {
    if (integerPart > 0) result += ' e ';
    result += numberToWords(decimalPart);
    result += decimalPart === 1 ? ' centavo' : ' centavos';
  }

  return result;
}

export default function ViewBudgetPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<AnalyticalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof AnalyticalItem | 'total'; direction: 'asc' | 'desc' | null }>({
    key: 'ordem',
    direction: 'asc'
  });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isProposalMode, setIsProposalMode] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    letterhead: '',
    clientName: '',
    attentionTo: '',
    proposalNumber: `${new Date().getFullYear()}/001`,
    serviceDescription: 'Execução de serviços para adequações na indústria, conforme segue abaixo.',
    clientAddress: '',
    paymentConditions: 'na conclusão dos serviços com fatura para 15d.d.;',
    executionTime: '05 (cinco) dias íteis trabalhados (das 07:30 às 17:30hs);',
    validity: '30 (trinta) dias, a contar desta data.',
    techResponsible: 'Nome Engenheiro/Responsável Técnico',
    farewell: 'Esperando ter correspondido à sua expectativa, aproveitamos o ensejo para cumprimentá-lo.'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrintConfig(prev => ({ ...prev, letterhead: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    setIsProposalMode(true);
    setTimeout(() => {
      window.print();
      setIsProposalMode(false);
    }, 500);
  };

  const exportToWord = async () => {
    if (!budget) return;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "PROPOSTA COMERCIAL",
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "À", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: printConfig.clientName || 'EMPRESA MUNICIPAL DE URBANIZAÇÃO - EMURB', bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: printConfig.clientAddress || 'Rua São Bento nº 405 - 16º andar - conj. 163' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "São Paulo - SP" }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "ASS.: ", bold: true }),
                new TextRun({ text: `PROPOSTA COMERCIAL Nº ${printConfig.proposalNumber} - ${printConfig.serviceDescription}`, bold: true }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Prezados Senhores," }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Apresentamos a V. Sas. a nossa proposta comercial relativa à execução dos serviços em epígrafe, assumindo inteira responsabilidade por quaisquer erros ou omissões que tiverem sido cometidos quando da preparação da mesma:" }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `1. Preço global de nossa proposta para a prestação dos serviços objeto desta licitação é de ` }),
                new TextRun({ text: formatCurrency(budget.total_geral), bold: true }),
                new TextRun({ text: ` (${formatCurrencyToWords(budget.total_geral)}), de acordo com os preços constantes da Planilha de Serviços abaixo:` }),
              ],
              spacing: { after: 400 },
            }),
            // Table
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: "Quant.", bold: true })], alignment: AlignmentType.CENTER })],
                      verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: "SERVIÇOS", bold: true })], alignment: AlignmentType.CENTER })],
                      verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: "P. UNIT. R$", bold: true })], alignment: AlignmentType.CENTER })],
                      verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: "P. TOTAL R$", bold: true })], alignment: AlignmentType.CENTER })],
                      verticalAlign: VerticalAlign.CENTER,
                    }),
                  ],
                }),
                ...items.map(item => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: item.quantidade.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: item.descricao })] }),
                    new TableCell({ children: [new Paragraph({ text: item.preco_unit_com_bdi.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: item.subtotal_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), alignment: AlignmentType.RIGHT })] }),
                  ],
                })),
                new TableRow({
                  children: [
                    new TableCell({ columnSpan: 3, children: [new Paragraph({ children: [new TextRun({ text: "VALOR TOTAL", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(budget.total_geral), bold: true })], alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { before: 400 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "CONDIÇÕES GERAIS:", bold: true })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Pagamento: ", bold: true }),
                new TextRun({ text: printConfig.paymentConditions }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Prazo de Execução: ", bold: true }),
                new TextRun({ text: printConfig.executionTime }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Validade da Proposta: ", bold: true }),
                new TextRun({ text: printConfig.validity }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [new TextRun({ text: printConfig.farewell })],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Atenciosamente," })],
              spacing: { after: 800 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: printConfig.techResponsible, bold: true }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Responsável Técnico" }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Proposta_${budget.nome.replace(/\s+/g, '_')}.docx`);
  };

  const handleSort = (key: keyof AnalyticalItem | 'total') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof AnalyticalItem | 'total') => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronsUpDown size={12} className="ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={12} className="ml-1 text-[#d4ff3f]" /> : 
      <ChevronDown size={12} className="ml-1 text-[#d4ff3f]" />;
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Budget Info
        const { data: budgetData } = await supabase
          .from('orcamentos')
          .select('*, projeto:projetos(nome)')
          .eq('id', id)
          .single();
        
        setBudget(budgetData);

        // Fetch Items from the Analytical View
        const { data: itemsData } = await supabase
          .from('vw_orcamento_analitico')
          .select('*')
          .eq('orcamento_id', id)
          .order('ordem');
        
        const factor = 1 + (budgetData?.variacao_anual || 0) / 100;
        const adjustedItems = (itemsData || []).map(item => {
          const mo = (item.custo_unit_mo || 0) * factor;
          const mat = (item.custo_unit_mat || 0) * factor;
          const eq = item.custo_unit_eq || 0;
          const totalCustoUnit = mo + mat + eq;
          const subtotalCusto = totalCustoUnit * item.quantidade;
          const precoUnitComBdi = totalCustoUnit * (1 + (item.bdi || 0) / 100);
          const subtotalPreco = subtotalCusto * (1 + (item.bdi || 0) / 100);

          const adjustedComposicao = item.composicao?.map((c) => {
            if (c.tipo === 'mo' || c.tipo === 'mat') {
              const p_unit = c.p_unit * factor;
              return { ...c, p_unit, p_total: p_unit * c.coef };
            }
            return c;
          });

          return {
            ...item,
            custo_unit_mo: mo,
            custo_unit_mat: mat,
            custo_unit_total: totalCustoUnit,
            subtotal_custo: subtotalCusto,
            preco_unit_com_bdi: precoUnitComBdi,
            subtotal_preco: subtotalPreco,
            composicao: adjustedComposicao
          };
        });
        
        setItems(adjustedItems);
      } catch (error) {
        console.error('Error fetching budget details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aValue: number | string | boolean | null;
    let bValue: number | string | boolean | null;

    if (sortConfig.key === 'total') {
      aValue = a.subtotal_preco;
      bValue = b.subtotal_preco;
    } else {
      aValue = a[sortConfig.key as keyof AnalyticalItem];
      bValue = b[sortConfig.key as keyof AnalyticalItem];
    }

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[#d4ff3f] animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Detalhes do Orçamento...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-black text-white mb-4">Orçamento não encontrado</h2>
        <Link href="/finances/budget" className="text-[#d4ff3f] font-bold underline">Voltar para a lista</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8 print:p-0 print:bg-white print:text-black">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/finances/budget" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Visualizar <span className="text-[#d4ff3f]">Orçamento</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Relatório Analítico TCPO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(212,255,63,0.2)]"
          >
            <Printer size={18} /> Gerar Proposta
          </button>
        </div>
      </div>

      {/* Proposal Layout - Only visible on Print when in Proposal Mode */}
      {isProposalMode && (
        <div className="hidden print:block bg-white text-black p-0 min-h-screen font-serif text-[12px] leading-relaxed">
          {/* Letterhead */}
          {printConfig.letterhead ? (
            <div className="mb-8 text-center">
              <Image 
                src={printConfig.letterhead} 
                alt="Timbrado" 
                width={800}
                height={128}
                className="max-w-full h-auto max-h-40 mx-auto" 
                unoptimized
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="h-32 mb-8" /> // Spacer for blank A4
          )}

          <div className="px-12 py-8">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <p className="font-bold text-lg">EDITAL</p>
              </div>
              <div className="text-right">
                <p className="font-bold">ANEXO 2</p>
              </div>
            </div>

            <div className="text-center mb-12">
              <p className="font-bold text-lg uppercase">MODELO DE CARTA PARA APRESENTAÇÃO DA PROPOSTA COMERCIAL</p>
            </div>

            {/* Client Info */}
            <div className="mb-8 space-y-1">
              <p className="font-bold uppercase">À</p>
              <p className="font-bold uppercase">{printConfig.clientName || 'EMPRESA MUNICIPAL DE URBANIZAÇÃO - EMURB'}</p>
              <p className="font-bold">{printConfig.clientAddress || 'Rua São Bento nº 405 - 16º andar - conj. 163'}</p>
              <p className="font-bold">São Paulo - SP</p>
            </div>

            {/* Subject */}
            <div className="mb-8 flex gap-4">
              <p className="font-bold flex-shrink-0">ASS.:</p>
              <p className="font-bold uppercase text-justify">
                PROPOSTA COMERCIAL Nº {printConfig.proposalNumber} - {printConfig.serviceDescription}
              </p>
            </div>

            <div className="mb-4">
              <p>Prezados Senhores,</p>
            </div>

            <div className="mb-8">
              <p className="text-justify">
                Apresentamos a V. Sas. a nossa proposta comercial relativa à execução dos serviços em epígrafe, assumindo inteira responsabilidade por quaisquer erros ou omissões que tiverem sido cometidos quando da preparação da mesma:
              </p>
            </div>

            <div className="mb-8">
              <p className="text-justify">
                1. Preço global de nossa proposta para a prestação dos serviços objeto desta licitação é de <span className="font-bold">{formatCurrency(budget.total_geral)}</span> ({formatCurrencyToWords(budget.total_geral)}), de acordo com os preços constantes da Planilha de Serviços abaixo:
              </p>
            </div>

            {/* Budget Table for Proposal */}
            <div className="mb-8">
              <table className="w-full text-left border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-black text-[10px] font-bold uppercase">
                    <th className="border-r-2 border-black px-2 py-2 text-center" colSpan={4}>PLANILHA DE SERVIÇOS E PREÇOS</th>
                  </tr>
                  <tr className="bg-gray-50 border-b-2 border-black text-[9px] font-bold uppercase">
                    <th className="border-r-2 border-black px-1 py-2 w-16 text-center italic font-serif">Quantidade</th>
                    <th className="border-r-2 border-black px-2 py-2 text-center">SERVIÇOS</th>
                    <th className="border-r-2 border-black px-1 py-2 w-24 text-center">PREÇO UNITÁRIO R$</th>
                    <th className="px-1 py-2 w-24 text-center">PREÇO TOTAL R$</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-black text-[10px]">
                      <td className="border-r-2 border-black px-1 py-2 text-center font-bold">{item.quantidade}</td>
                      <td className="border-r-2 border-black px-2 py-2 text-justify leading-tight">{item.descricao}</td>
                      <td className="border-r-2 border-black px-1 py-2 text-right">{item.preco_unit_com_bdi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-1 py-2 text-right font-bold">{item.subtotal_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-bold text-[11px]">
                    <td className="border-r-2 border-black px-2 py-2 uppercase" colSpan={2}>VALOR TOTAL</td>
                    <td className="border-r-2 border-black px-1 py-2"></td>
                    <td className="px-1 py-2 text-right">{formatCurrency(budget.total_geral)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Conditions */}
            <div className="mb-8 space-y-2">
              <p className="font-bold">CONDIÇÕES GERAIS:</p>
              <p><span className="font-bold">Pagamento:</span> {printConfig.paymentConditions}</p>
              <p><span className="font-bold">Prazo de Execução:</span> {printConfig.executionTime}</p>
              <p><span className="font-bold">Validade da Proposta:</span> {printConfig.validity}</p>
            </div>

            {/* Footer Signature Area */}
            <div className="mt-20">
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="w-48 border-t border-black pt-1">
                    <p className="text-[10px] font-bold uppercase">GLC</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold uppercase mb-1">EDITAL DE TOMADA DE PREÇOS Nº {printConfig.proposalNumber}</p>
                  <div className="w-full border-t-2 border-black pt-1" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase">PAG. 1/1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Report Header - Hidden on Proposal Mode Print */}
      <div className={`${isProposalMode ? 'print:hidden' : ''}`}>
        <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-8 mb-8 shadow-sm print:border-none print:shadow-none print:bg-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orçamento</p>
            <p className="text-lg font-black text-white print:text-black">{budget.nome}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obra / Projeto</p>
            <div className="flex items-center gap-2 text-white print:text-black">
              <Building2 size={16} className="text-[#d4ff3f] print:text-black" />
              <p className="font-bold">{(budget as Budget & { projeto?: { nome: string } }).projeto?.nome || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão</p>
            <div className="flex items-center gap-2 text-white print:text-black">
              <Calendar size={16} className="text-[#d4ff3f] print:text-black" />
              <p className="font-bold">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variação Anual</p>
            <p className="text-lg font-black text-white print:text-black">{budget.variacao_anual || 0}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Geral</p>
            <p className="text-2xl font-black text-[#d4ff3f] print:text-black">{formatCurrency(budget.total_geral)}</p>
          </div>
        </div>
        
        {budget.descricao && (
          <div className="mt-8 pt-6 border-t border-slate-800/50 print:border-black/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição / Escopo</p>
            <p className="text-sm text-slate-400 print:text-black leading-relaxed">{budget.descricao}</p>
          </div>
        )}
      </div>

      {/* Summary Cards - Hidden on Print */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
        <div className="bg-[#1a1a1a] border border-slate-800/50 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mão de Obra</p>
            <p className="text-xl font-black">{formatCurrency(budget.total_mo)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-slate-800/50 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Materiais</p>
            <p className="text-xl font-black">{formatCurrency(budget.total_mat)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-slate-800/50 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
            <Download size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipamentos</p>
            <p className="text-xl font-black">{formatCurrency(budget.total_eq)}</p>
          </div>
        </div>
      </div>

      {/* Analytical Table */}
      <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm print:border-none print:shadow-none print:bg-transparent">
        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50 print:bg-gray-100 print:text-black print:border-black">
                <th className="px-2 py-2 w-[90px] cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('tcpo_id')}>
                  <div className="flex items-center">
                    Código {getSortIcon('tcpo_id')}
                  </div>
                </th>
                <th className="px-2 py-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('descricao')}>
                  <div className="flex items-center">
                    Discriminação dos Serviços {getSortIcon('descricao')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[60px] cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('unidade')}>
                  <div className="flex items-center justify-center">
                    Unid. {getSortIcon('unidade')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[70px] cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('quantidade')}>
                  <div className="flex items-center justify-center">
                    Quant. {getSortIcon('quantidade')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[80px] cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('bdi')}>
                  <div className="flex items-center justify-center">
                    BDI (%) {getSortIcon('bdi')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[100px] cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('preco_unit_com_bdi')}>
                  <div className="flex items-center justify-end">
                    $ UNIT. {getSortIcon('preco_unit_com_bdi')}
                  </div>
                </th>
                <th className="px-2 py-2 w-[110px] text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end">
                    Subtotal {getSortIcon('total')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 print:divide-black/10">
              {sortedItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    className="hover:bg-[#0a0a0a] transition-colors print:text-black cursor-pointer group"
                    onClick={() => toggleItem(item.id)}
                  >
                    <td className="px-2 py-1.5">
                      <p className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest print:text-black truncate">{item.tcpo_id}</p>
                    </td>
                    <td className="px-2 py-1.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="print:hidden flex-shrink-0">
                          {expandedItems.has(item.id) ? <ChevronDown size={14} className="text-[#d4ff3f]" /> : <ChevronRight size={14} className="text-slate-600 group-hover:text-white" />}
                        </div>
                        <p className="text-sm font-bold text-white print:text-black leading-tight truncate" title={item.descricao}>{item.descricao}</p>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase print:text-black">{item.unidade}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <p className="text-sm font-bold print:text-black">{item.quantidade}</p>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input 
                        type="number" 
                        value={item.bdi || ''}
                        onChange={async (e) => {
                          const newBdi = Number(e.target.value);
                          // Update local state
                          setItems(prevItems => prevItems.map(i => {
                            if (i.id === item.id) {
                              const subtotal_preco = (i.subtotal_custo || 0) * (1 + newBdi / 100);
                              const preco_unit_com_bdi = (i.custo_unit_total || 0) * (1 + newBdi / 100);
                              return { ...i, bdi: newBdi, subtotal_preco, preco_unit_com_bdi };
                            }
                            return i;
                          }));
                          
                          // Save to Supabase
                          try {
                            await supabase
                              .from('orcamento_itens')
                              .update({ bdi: newBdi })
                              .eq('id', item.id);
                          } catch (error) {
                            console.error('Error updating BDI:', error);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-14 bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-1 py-1 text-[10px] font-black text-white text-center outline-none focus:ring-1 focus:ring-[#d4ff3f]/30 print:hidden"
                      />
                      <span className="hidden print:inline text-sm font-bold">{item.bdi}%</span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <p className="text-sm font-bold print:text-black">{formatCurrency(item.preco_unit_com_bdi)}</p>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <p className="text-sm font-black text-[#d4ff3f] print:text-black">{formatCurrency(item.subtotal_preco)}</p>
                    </td>
                  </tr>
                  {/* Composition Details */}
                  {expandedItems.has(item.id) && item.composicao && item.composicao.length > 0 && (
                    <tr className="bg-[#050505] print:bg-white">
                      <td colSpan={7} className="px-8 py-2">
                        <div className="border-l-2 border-[#d4ff3f]/30 pl-4 py-1 space-y-2">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Composição Analítica (Insumos)</p>
                          <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                              <tr className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800/30">
                                <th className="pb-2">Insumo</th>
                                <th className="pb-2 w-[60px]">Tipo</th>
                                <th className="pb-2 w-[40px]">Un</th>
                                <th className="pb-2 w-[60px]">Coef.</th>
                                <th className="pb-2 w-[80px]">P. Unit</th>
                                <th className="pb-2 w-[90px] text-right">P. Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/10">
                              {item.composicao.map((insumo, iIdx) => (
                                <tr key={iIdx} className="text-[10px]">
                                  <td className="py-2 text-slate-300 print:text-black truncate" title={insumo.insumo}>{insumo.insumo}</td>
                                  <td className="py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      insumo.tipo === 'mo' ? 'bg-blue-500/10 text-blue-500' :
                                      insumo.tipo === 'mat' ? 'bg-orange-500/10 text-orange-500' :
                                      'bg-purple-500/10 text-purple-500'
                                    }`}>
                                      {insumo.tipo}
                                    </span>
                                  </td>
                                  <td className="py-2 text-slate-500 print:text-black uppercase">{insumo.un}</td>
                                  <td className="py-2 text-slate-300 print:text-black">{insumo.coef}</td>
                                  <td className="py-2 text-slate-500 print:text-black">{formatCurrency(insumo.p_unit)}</td>
                                  <td className="py-2 text-slate-300 print:text-black text-right">{formatCurrency(insumo.p_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0a0a0a] print:bg-gray-50">
                <td colSpan={6} className="px-6 py-4 text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Total do Orçamento</p>
                </td>
                <td className="px-2 py-4 text-right">
                  <p className="text-xl font-black text-[#d4ff3f] print:text-black">{formatCurrency(budget.total_geral)}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      </div>

      {/* Footer - Only on Print - Hidden on Proposal Mode */}
      <div className={`hidden print:block mt-20 pt-10 border-t border-black/20 text-center ${isProposalMode ? 'print:hidden' : ''}`}>
        <div className="flex justify-around">
          <div className="w-64 border-t border-black pt-2">
            <p className="text-xs font-bold uppercase">Responsável Técnico</p>
          </div>
          <div className="w-64 border-t border-black pt-2">
            <p className="text-xs font-bold uppercase">Cliente / Aprovação</p>
          </div>
        </div>
        <p className="text-[8px] text-gray-500 mt-10 italic">Gerado por CBSL Gestão de Engenharia em {new Date().toLocaleString('pt-BR')}</p>
      </div>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111111] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black italic">Configurar <span className="text-[#d4ff3f]">Impressão</span></h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Proposta Comercial</p>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Letterhead Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Folha de Rosto / Timbrado</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-4 hover:border-[#d4ff3f]/50 transition-colors cursor-pointer">
                    <Upload size={24} className="text-slate-500 mb-2" />
                    <span className="text-xs font-bold text-slate-400">Clique para fazer upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  {printConfig.letterhead && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-800 bg-white p-2">
                      <Image 
                        src={printConfig.letterhead} 
                        alt="Preview" 
                        width={96}
                        height={96}
                        className="w-full h-full object-contain" 
                        unoptimized
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente (Nome)</label>
                  <input 
                    type="text" 
                    value={printConfig.clientName}
                    onChange={(e) => setPrintConfig(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                    placeholder="NOME DO CLIENTE"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aos cuidados de</label>
                  <input 
                    type="text" 
                    value={printConfig.attentionTo}
                    onChange={(e) => setPrintConfig(prev => ({ ...prev, attentionTo: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                    placeholder="Pessoa que irá receber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº Proposta Comercial</label>
                  <input 
                    type="text" 
                    value={printConfig.proposalNumber}
                    onChange={(e) => setPrintConfig(prev => ({ ...prev, proposalNumber: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                    placeholder="025/2026_rev1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endereço do Cliente</label>
                  <input 
                    type="text" 
                    value={printConfig.clientAddress}
                    onChange={(e) => setPrintConfig(prev => ({ ...prev, clientAddress: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                    placeholder="Rua Exemplo, 123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo / Descrição Padrão</label>
                <textarea 
                  value={printConfig.serviceDescription}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condições de Pagamento</label>
                <input 
                  type="text" 
                  value={printConfig.paymentConditions}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, paymentConditions: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo de Execução</label>
                  <input 
                    type="text" 
                    value={printConfig.executionTime}
                    onChange={(e) => setPrintConfig(prev => ({ ...prev, executionTime: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Validade da Proposta</label>
                  <input 
                    type="text" 
                    value={printConfig.validity}
                    onChange={(e) => setPrintConfig(prev => ({ ...prev, validity: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsável Técnico</label>
                <input 
                  type="text" 
                  value={printConfig.techResponsible}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, techResponsible: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Despedida / Fechamento</label>
                <textarea 
                  value={printConfig.farewell}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, farewell: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/30 min-h-[80px]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Gerar PDF / Imprimir
                </button>
                <button 
                  onClick={exportToWord}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <FileDown size={16} /> Gerar Word (.docx)
                </button>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
