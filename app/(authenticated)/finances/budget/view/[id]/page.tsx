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
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Budget } from '@/lib/types';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType
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
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [printConfig, setPrintConfig] = useState({
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.dotx') && !file.name.endsWith('.docx')) {
        alert('Por favor, selecione um arquivo de modelo do Word (.dotx ou .docx)');
        return;
      }

      setIsUploadingTemplate(true);
      try {
        // Ensure bucket exists (this might fail if not admin, but we try)
        try {
          await supabase.storage.createBucket('budget-templates', { public: true });
        } catch {
          // Ignore error if bucket already exists
        }

        const { error } = await supabase.storage
          .from('budget-templates')
          .upload('proposal_template.dotx', file, {
            upsert: true
          });

        if (error) throw error;
        
        setHasTemplate(true);
        alert('Modelo (.dotx) carregado com sucesso!');
      } catch (error) {
        console.error('Error uploading template:', error);
        alert('Erro ao carregar modelo para o Supabase.');
      } finally {
        setIsUploadingTemplate(false);
      }
    }
  };

  const cleanString = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return "";
    const s = String(str);
    // Remove control characters that break XML (except \n, \r, \t)
    return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  };

  const downloadBaseTemplate = async () => {
    // This creates a .docx with the tags already placed, 
    // which the user can then customize with their letterhead.
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "PROPOSTA COMERCIAL", bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({ children: [new TextRun({ text: "À", bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: "{clientName}", bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: "A/C: {attentionTo}" })] }),
          new Paragraph({ children: [new TextRun({ text: "{clientAddress}" })] }),
          new Paragraph({ children: [new TextRun({ text: "São Paulo - SP" })], spacing: { after: 400 } }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "ASS.: ", bold: true }),
              new TextRun({ text: "PROPOSTA COMERCIAL Nº {proposalNumber} - {serviceDescription}", bold: true }),
            ],
            spacing: { after: 400 },
          }),
          
          new Paragraph({ children: [new TextRun({ text: "Prezados Senhores," })], spacing: { after: 200 } }),
          
          new Paragraph({
            children: [new TextRun({ text: "Apresentamos a V. Sas. a nossa proposta comercial relativa à execução dos serviços em epígrafe, assumindo inteira responsabilidade por quaisquer erros ou omissões que tiverem sido cometidos quando da preparação da mesma:" })],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "1. Preço global de nossa proposta para a prestação dos serviços objeto desta licitação é de " }),
              new TextRun({ text: "{totalGeral}", bold: true }),
              new TextRun({ text: " ({totalGeralWords}), de acordo com os preços constantes da Planilha de Serviços abaixo:" }),
            ],
            spacing: { after: 400 },
          }),

          // Table with tags - Simplified for maximum compatibility
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quant.", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SERVIÇOS", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "UNID.", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "P. UNIT. R$", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "P. TOTAL R$", bold: true })], alignment: AlignmentType.CENTER })] }),
                ],
              }),
              // Loop tags for docxtemplater - Single paragraph per cell is safer
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "{#items}{quantidade}", alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: "{descricao}" })] }),
                  new TableCell({ children: [new Paragraph({ text: "{unidade}", alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: "{preco_unit}", alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: "{subtotal}{/items}", alignment: AlignmentType.RIGHT })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "VALOR TOTAL", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{totalGeral}", bold: true })], alignment: AlignmentType.RIGHT })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "CONDIÇÕES GERAIS:", bold: true })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Pagamento: ", bold: true }), new TextRun({ text: "{paymentConditions}" })] }),
          new Paragraph({ children: [new TextRun({ text: "Prazo de Execução: ", bold: true }), new TextRun({ text: "{executionTime}" })] }),
          new Paragraph({ children: [new TextRun({ text: "Validade da Proposta: ", bold: true }), new TextRun({ text: "{validity}" })], spacing: { after: 400 } }),
          
          new Paragraph({ children: [new TextRun({ text: "{farewell}" })], spacing: { after: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Atenciosamente," })], spacing: { after: 800 } }),
          
          new Paragraph({ children: [new TextRun({ text: "{techResponsible}", bold: true })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: "Responsável Técnico" })], alignment: AlignmentType.CENTER }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Modelo_Base_Proposta.docx");
  };

  const exportToWord = async () => {
    if (!budget) return;

    try {
      // 1. Fetch the template from Supabase Storage
      const { data, error } = await supabase.storage
        .from('budget-templates')
        .download('proposal_template.dotx');

      if (error) {
        throw new Error('Modelo (.dotx) não encontrado no Supabase. Por favor, faça o upload do seu arquivo timbrado primeiro.');
      }

      // Use Uint8Array for better compatibility with PizZip
      const arrayBuffer = await data.arrayBuffer();
      const content = new Uint8Array(arrayBuffer);
      const zip = new PizZip(content);

      // Fix for .dotx templates being saved as .docx
      // Word 2019+ is strict about the internal content type matching the extension
      try {
        const contentTypesXml = zip.file("[Content_Types].xml");
        if (contentTypesXml) {
          let contentTypes = contentTypesXml.asText();
          if (contentTypes.includes("wordprocessingml.template.main+xml")) {
            contentTypes = contentTypes.replace(
              "wordprocessingml.template.main+xml",
              "wordprocessingml.document.main+xml"
            );
            zip.file("[Content_Types].xml", contentTypes);
          }
        }
      } catch (patchError) {
        console.warn("Could not patch [Content_Types].xml:", patchError);
      }
      
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter() { return ""; }
      });

      // 2. Prepare data for the template - Ensure all values are cleaned strings
      const templateData = {
        clientName: cleanString(printConfig.clientName),
        clientAddress: cleanString(printConfig.clientAddress),
        attentionTo: cleanString(printConfig.attentionTo),
        proposalNumber: cleanString(printConfig.proposalNumber),
        serviceDescription: cleanString(printConfig.serviceDescription),
        totalGeral: cleanString(formatCurrency(budget.total_geral)),
        totalGeralWords: cleanString(formatCurrencyToWords(budget.total_geral)),
        paymentConditions: cleanString(printConfig.paymentConditions),
        executionTime: cleanString(printConfig.executionTime),
        validity: cleanString(printConfig.validity),
        techResponsible: cleanString(printConfig.techResponsible),
        farewell: cleanString(printConfig.farewell),
        items: sortedItems.map(item => ({
          quantidade: cleanString(item.quantidade),
          descricao: cleanString(item.descricao),
          unidade: cleanString(item.unidade),
          preco_unit: cleanString((item.preco_unit_com_bdi || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })),
          subtotal: cleanString((item.subtotal_preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        }))
      };

      // 3. Render the document
      try {
        doc.setData(templateData);
        doc.render();
      } catch (renderError: unknown) {
        const err = renderError as { properties?: { errors?: unknown[] } };
        console.error('Render Error Details:', err.properties?.errors);
        throw new Error('Erro na estrutura das tags do modelo. Verifique se as tags estão escritas corretamente (ex: {#items} e {/items} devem estar em pares).');
      }

      // 4. Generate output - Using Uint8Array for maximum compatibility
      const out = doc.getZip().generate({
        type: "uint8array",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE"
      });

      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const safeName = budget.nome.replace(/[^a-z0-9]/gi, '_');
      saveAs(blob, `Proposta_${safeName}.docx`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar documento Word.';
      console.error('Error generating Word document:', error);
      alert(errorMessage);
    }
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
        // Check if template exists
        const { data: files } = await supabase.storage.from('budget-templates').list();
        if (files && files.some(f => f.name === 'proposal_template.dotx')) {
          setHasTemplate(true);
        }

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
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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

      {/* Original Report Header */}
      <div>
        <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-8 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orçamento</p>
            <p className="text-lg font-black text-white">{budget.nome}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obra / Projeto</p>
            <div className="flex items-center gap-2 text-white">
              <Building2 size={16} className="text-[#d4ff3f]" />
              <p className="font-bold">{(budget as Budget & { projeto?: { nome: string } }).projeto?.nome || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão</p>
            <div className="flex items-center gap-2 text-white">
              <Calendar size={16} className="text-[#d4ff3f]" />
              <p className="font-bold">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variação Anual</p>
            <p className="text-lg font-black text-white">{budget.variacao_anual || 0}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Geral</p>
            <p className="text-2xl font-black text-[#d4ff3f]">{formatCurrency(budget.total_geral)}</p>
          </div>
        </div>
        
        {budget.descricao && (
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição / Escopo</p>
            <p className="text-sm text-slate-400 leading-relaxed">{budget.descricao}</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#0a0a0a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
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
                      <p className="text-[10px] font-black text-[#d4ff3f] uppercase tracking-widest truncate">{item.tcpo_id}</p>
                    </td>
                    <td className="px-2 py-1.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {expandedItems.has(item.id) ? <ChevronDown size={14} className="text-[#d4ff3f]" /> : <ChevronRight size={14} className="text-slate-600 group-hover:text-white" />}
                        </div>
                        <p className="text-sm font-bold text-white leading-tight truncate" title={item.descricao}>{item.descricao}</p>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{item.unidade}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <p className="text-sm font-bold">{item.quantidade}</p>
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
                        className="w-14 bg-[#0a0a0a] border border-slate-800/50 rounded-lg px-1 py-1 text-[10px] font-black text-white text-center outline-none focus:ring-1 focus:ring-[#d4ff3f]/30"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <p className="text-sm font-bold">{formatCurrency(item.preco_unit_com_bdi)}</p>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <p className="text-sm font-black text-[#d4ff3f]">{formatCurrency(item.subtotal_preco)}</p>
                    </td>
                  </tr>
                  {/* Composition Details */}
                  {expandedItems.has(item.id) && item.composicao && item.composicao.length > 0 && (
                    <tr className="bg-[#050505]">
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
                                  <td className="py-2 text-slate-300 truncate" title={insumo.insumo}>{insumo.insumo}</td>
                                  <td className="py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      insumo.tipo === 'mo' ? 'bg-blue-500/10 text-blue-500' :
                                      insumo.tipo === 'mat' ? 'bg-orange-500/10 text-orange-500' :
                                      'bg-purple-500/10 text-purple-500'
                                    }`}>
                                      {insumo.tipo}
                                    </span>
                                  </td>
                                  <td className="py-2 text-slate-500 uppercase">{insumo.un}</td>
                                  <td className="py-2 text-slate-300">{insumo.coef}</td>
                                  <td className="py-2 text-slate-500">{formatCurrency(insumo.p_unit)}</td>
                                  <td className="py-2 text-slate-300 text-right">{formatCurrency(insumo.p_total)}</td>
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
              <tr className="bg-[#0a0a0a]">
                <td colSpan={6} className="px-6 py-4 text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Total do Orçamento</p>
                </td>
                <td className="px-2 py-4 text-right">
                  <p className="text-xl font-black text-[#d4ff3f]">{formatCurrency(budget.total_geral)}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
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
              {/* Template Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modelo de Proposta (.dotx)</label>
                  {hasTemplate && (
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Modelo Carregado
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:border-[#d4ff3f]/50 transition-colors cursor-pointer bg-slate-900/30">
                    {isUploadingTemplate ? (
                      <Loader2 size={24} className="text-[#d4ff3f] animate-spin mb-2" />
                    ) : (
                      <Upload size={24} className="text-slate-500 mb-2" />
                    )}
                    <span className="text-xs font-bold text-slate-400">
                      {hasTemplate ? 'Substituir Modelo (.dotx)' : 'Fazer Upload do Modelo (.dotx)'}
                    </span>
                    <p className="text-[8px] text-slate-600 mt-2 uppercase font-black tracking-widest">O arquivo deve conter as tags de substituição</p>
                    <input type="file" className="hidden" accept=".dotx,.docx" onChange={handleFileChange} disabled={isUploadingTemplate} />
                  </label>
                </div>

                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tags disponíveis no seu modelo:</p>
                      <p className="text-[7px] text-slate-600 uppercase font-bold">Use o botão ao lado para baixar o modelo base</p>
                    </div>
                    <button 
                      onClick={downloadBaseTemplate}
                      className="bg-[#d4ff3f]/10 hover:bg-[#d4ff3f]/20 text-[#d4ff3f] px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-[#d4ff3f]/20"
                    >
                      <Download size={12} /> Baixar Modelo com Tags
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{clientName}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{attentionTo}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{clientAddress}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{proposalNumber}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{serviceDescription}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{totalGeral}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{totalGeralWords}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{paymentConditions}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{executionTime}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{validity}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{techResponsible}"}</code>
                    <code className="text-[9px] text-[#d4ff3f] font-mono">{"{farewell}"}</code>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tabela de Itens (Loop):</p>
                    <div className="flex flex-wrap gap-2">
                      <code className="text-[9px] text-blue-400 font-mono">{"{#items}"}</code>
                      <code className="text-[9px] text-slate-400 font-mono">{"{quantidade}"}</code>
                      <code className="text-[9px] text-slate-400 font-mono">{"{descricao}"}</code>
                      <code className="text-[9px] text-slate-400 font-mono">{"{unidade}"}</code>
                      <code className="text-[9px] text-slate-400 font-mono">{"{preco_unit}"}</code>
                      <code className="text-[9px] text-slate-400 font-mono">{"{subtotal}"}</code>
                      <code className="text-[9px] text-blue-400 font-mono">{"{/items}"}</code>
                    </div>
                  </div>
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
              <button 
                onClick={exportToWord}
                className="w-full bg-[#d4ff3f] hover:bg-[#c4ef2f] text-black py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,255,63,0.2)]"
              >
                <FileDown size={20} /> Gerar Proposta em Word (.docx)
              </button>
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
