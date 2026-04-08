'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Search,
  Mail, 
  Phone, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Truck,
  TrendingUp,
  UserCheck,
  X,
  BrushCleaning,
  Trash2,
  Edit2,
  Loader2,
  Upload,
  FileText,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string; // UUID from Supabase
  company: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  cellphone: string;
  info: string;
}

interface AiSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface DropdownOption {
  value: string;
  label: string;
  accent?: boolean;
}

const decodeMojibake = (value: string) => {
  if (!value) return '';

  const suspicious = /Ã|Â|�/.test(value);
  if (!suspicious) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return decoded && decoded !== value ? decoded : value;
  } catch {
    return value;
  }
};

const normalizeImportedText = (value: unknown) => decodeMojibake(String(value || '').trim());

const CONTACT_CATEGORY_STORAGE_KEY = 'contacts_custom_categories';
const BASE_CONTACT_CATEGORIES = ['Cliente', 'Fornecedor', 'Diversos'];

type SortField = 'name' | 'company' | 'phone' | 'cellphone' | 'email' | 'category' | 'info';

function CustomSelect({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex items-center gap-2 bg-[#1a1a1a] border rounded-xl px-3 py-1.5 transition-all ${
          isOpen ? 'border-[#d4ff3f]/50 ring-1 ring-[#d4ff3f]/20' : 'border-[#d4ff3f]/20'
        }`}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white min-w-[110px] text-left">
          {selected?.label || value}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#d4ff3f]' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="fixed z-[80] overflow-hidden rounded-xl border border-[#d4ff3f]/30 bg-[#1a1a1a] shadow-2xl shadow-black/40"
          style={{
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option.value);
              }}
              className={`w-full px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest transition-colors ${
                value === option.value
                  ? 'bg-[#d4ff3f] text-[#0a0a0a]'
                  : option.accent
                    ? 'text-[#d4ff3f] hover:bg-[#d4ff3f]/10'
                    : 'text-white hover:bg-[#d4ff3f]/10 hover:text-[#d4ff3f]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'NOME' | 'EMPRESA' | 'TELEFONE'>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [openDropdown, setOpenDropdown] = useState<'filter' | 'category' | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryDraft, setNewCategoryDraft] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<AiSearchResult[]>([]);
  const [aiError, setAiError] = useState('');
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    empresa: '',
    nome: '',
    categoria: 'Cliente',
    email: '',
    telefone: '',
    celular: '',
    notas: '',
  });

  const fetchContactCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contatos_categorias')
        .select('nome')
        .order('nome', { ascending: true });

      if (error) throw error;

      const categories = (data || [])
        .map((item: Record<string, unknown>) => decodeMojibake(String(item.nome || '')).trim())
        .filter(Boolean);

      if (categories.length > 0) {
        setCustomCategories((prev) => Array.from(new Set([...prev, ...categories])));
      }
    } catch (error) {
      console.warn('Categorias do Supabase indisponíveis, usando fallback local.', error);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      
      const mappedContacts = (data || []).map((c: Record<string, unknown>) => {
        const name = decodeMojibake((c.nome || '') as string);
        const company = decodeMojibake((c.empresa || '') as string);
        
        return {
          id: c.id as string,
          company: company,
          name: name,
          category: decodeMojibake((c.categoria || '') as string),
          email: decodeMojibake((c.email || '') as string),
          phone: decodeMojibake((c.telefone || '') as string),
          cellphone: decodeMojibake((c.celular || '') as string),
          info: decodeMojibake((c.notas || '') as string),
        };
      });

      setContacts(mappedContacts);
    } catch (error: unknown) {
      console.error('Error fetching contacts:', error);
      let errorMessage = String(error);
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      alert(`Erro ao carregar contatos:\n${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchContactCategories();
  }, [fetchContactCategories]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(CONTACT_CATEGORY_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setCustomCategories(parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== ''));
      }
    } catch {
      // ignore invalid local storage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CONTACT_CATEGORY_STORAGE_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  const categoryOptions = Array.from(
    new Set(
      [...BASE_CONTACT_CATEGORIES, ...customCategories, ...contacts.map((contact) => contact.category).filter(Boolean)].map((item) =>
        decodeMojibake(item).trim()
      )
    )
  );

  const filterOptions: DropdownOption[] = [
    { value: 'TODOS', label: 'Todos os Campos' },
    { value: 'NOME', label: 'Nome' },
    { value: 'EMPRESA', label: 'Empresa' },
    { value: 'TELEFONE', label: 'Telefone' },
  ];

  const categorySelectOptions: DropdownOption[] = [
    { value: 'TODOS', label: 'Todas' },
    ...categoryOptions.map((category) => ({ value: category, label: category })),
    { value: 'NOVA_CATEGORIA', label: 'Nova categoria', accent: true },
  ];

  useEffect(() => {
    const handleWindowClick = () => setOpenDropdown(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const stats = [
    { label: 'Total de Clientes', value: contacts.filter(c => c.category === 'Cliente').length.toString(), icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Fornecedores', value: contacts.filter(c => c.category === 'Fornecedor').length.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { label: 'Total de Contatos', value: contacts.length.toString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
  ];

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        empresa: contact.company,
        nome: contact.name,
        categoria: contact.category,
        email: contact.email,
        telefone: contact.phone,
        celular: contact.cellphone,
        notas: contact.info,
      });
    } else {
      setEditingContact(null);
      setFormData({
        empresa: '',
        nome: '',
        categoria: 'Cliente',
        email: '',
        telefone: '',
        celular: '',
        notas: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleOpenAiModal = (prefill = '') => {
    setAiQuery(prefill || searchQuery || '');
    setAiResults([]);
    setAiError('');
    setIsAiModalOpen(true);
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    setAiError('');
    setAiResults([]);
  };

  const handleCreateCategory = async () => {
    const normalized = decodeMojibake(newCategoryDraft).trim();
    if (!normalized) return;

    const alreadyExists = categoryOptions.some((category) => category.toLowerCase() === normalized.toLowerCase());

    if (!alreadyExists) {
      setCustomCategories((prev) => [...prev, normalized]);

      try {
        const { error } = await supabase.from('contatos_categorias').insert([{ nome: normalized }]);
        if (error) throw error;
      } catch (error) {
        console.warn('Não foi possível persistir a categoria no Supabase. Mantendo fallback local.', error);
      }
    }

    setCategoryFilter(normalized);
    setFormData((prev) => ({ ...prev, categoria: normalized }));
    setNewCategoryDraft('');
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesCategory = categoryFilter === 'TODOS' || contact.category.toUpperCase() === categoryFilter.toUpperCase();

    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (filterType === 'TODOS') {
        matchesSearch = 
          contact.company.toLowerCase().includes(query) ||
          contact.name.toLowerCase().includes(query) ||
          contact.phone.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query);
      } else if (filterType === 'NOME') {
        matchesSearch = contact.name.toLowerCase().includes(query);
      } else if (filterType === 'EMPRESA') {
        matchesSearch = contact.company.toLowerCase().includes(query);
      } else if (filterType === 'TELEFONE') {
        matchesSearch = contact.phone.toLowerCase().includes(query);
      }
    }

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const fieldA = (a[sortField] || '').toLowerCase();
    const fieldB = (b[sortField] || '').toLowerCase();

    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const renderSortHeader = (label: string, field: SortField) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className={`inline-flex items-center gap-1 transition-colors ${
        sortField === field ? 'text-[#d4ff3f]' : 'text-slate-500 hover:text-[#d4ff3f]'
      }`}
    >
      <span>{label}</span>
      {sortField === field ? (
        sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      ) : (
        <span className="flex flex-col leading-none text-[8px] opacity-60">
          <ChevronUp size={10} />
          <ChevronDown size={10} className="-mt-1" />
        </span>
      )}
    </button>
  );

  const handleDownload = () => {
    const headers = ['Empresa', 'Nome', 'Telefone', 'Celular', 'E-mail', 'Categoria', 'Notas'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(c => [
        `"${c.company}"`,
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.cellphone}"`,
        `"${c.email}"`,
        `"${c.category}"`,
        `"${c.info}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'exportacao_contatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiSearch = async () => {
    const query = aiQuery.trim();
    if (!query) {
      setAiError('Digite o nome ou empresa do contato para pesquisar.');
      return;
    }

    try {
      setIsAiSearching(true);
      setAiError('');
      const response = await fetch(`/api/contacts/ai-search?q=${encodeURIComponent(query)}`);
      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error?.includes('GOOGLE_SEARCH_API_KEY') || payload?.error?.includes('GOOGLE_SEARCH_ENGINE_ID')) {
          const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          window.open(googleUrl, 'google_contact_search', 'width=1100,height=760,noopener,noreferrer');
          setAiError('Modo sem API ativado: a pesquisa foi aberta em popup no Google.');
          return;
        }
        throw new Error(payload?.error || 'Não foi possível consultar o Google.');
      }

      setAiResults(payload.results || []);
    } catch (error: unknown) {
      setAiResults([]);
      setAiError(error instanceof Error ? error.message : 'Falha ao pesquisar no Google.');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Empresa', 'Nome', 'Telefone', 'Celular', 'E-mail', 'Categoria', 'Notas'];
    const content = headers.join(',');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_contatos.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        const text = /Ã|Â|�/.test(utf8Text)
          ? new TextDecoder('windows-1252', { fatal: false }).decode(buffer)
          : utf8Text;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length <= 1) {
          alert('O arquivo está vazio ou contém apenas o cabeçalho.');
          setIsImporting(false);
          return;
        }

        // Detectar delimitador (vírgula ou ponto e vírgula)
        const firstLine = lines[0];
        const countSemicolon = (firstLine.match(/;/g) || []).length;
        const countComma = (firstLine.match(/,/g) || []).length;
        const delimiter = countSemicolon > countComma ? ';' : ',';

        // Skip header
        const dataLines = lines.slice(1);
        const newContacts = dataLines.map((line, index) => {
          // Robust CSV split that handles quotes
          const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
          const parts = line.split(regex).map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          
          const [company, name, phone, cellphone, email, category, info] = parts.map(normalizeImportedText);
          
          if (!name && !company) {
            console.warn(`Linha ${index + 2} ignorada: Nome ou Empresa não encontrado.`);
            return null;
          }

          const contactName = name || '';
          const contactCompany = company || '';
          
          const validCategories = ['Cliente', 'Fornecedor', 'Parceiro'];
          const finalCategory = validCategories.includes(category) ? category : 'Cliente';

          return {
            nome: contactName,
            empresa: contactCompany,
            telefone: phone || '',
            celular: cellphone || '',
            email: email || '',
            categoria: finalCategory,
            notas: info || ''
          };
        }).filter(Boolean);

        if (newContacts.length > 0) {
          const { error } = await supabase.from('contatos').insert(newContacts);
          if (error) {
            console.error('Erro do Supabase na inserção:', error instanceof Error ? error.message : String(error));
            throw error;
          }
          alert(`${newContacts.length} contatos importados com sucesso!`);
          await fetchContacts();
        } else {
          alert('Nenhum contato válido encontrado para importação.');
        }
      } catch (err: unknown) {
        let errorMessage = 'Erro desconhecido na importação';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          const obj = err as Record<string, unknown>;
          if (typeof obj.message === 'string') errorMessage = obj.message;
          else if (typeof obj.details === 'string') errorMessage = obj.details;
        }
        console.error('Erro detalhado na importação:', errorMessage);
        alert(`Erro ao importar arquivo: ${errorMessage}. Verifique se o formato está correto.`);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contatos')
          .update(formData)
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contatos')
          .insert([formData]);

        if (error) throw error;
      }
      
      await fetchContacts();
      handleCloseModal();
    } catch (error: unknown) {
      console.error('Erro ao salvar contato:', error);
      let errorMessage = String(error);
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      alert(`Erro ao salvar contato:\n${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase
          .from('contatos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Update local state immediately for better UX
        setContacts(prev => prev.filter(c => c.id !== id));
        alert('Contato excluído com sucesso.');
      } catch (error: unknown) {
        console.error('Erro ao excluir contato:', error);
        let errorMessage = String(error);
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = (error as { message: string }).message;
        }
        alert(`Erro ao excluir contato:\n${errorMessage}`);
      }
    }
  };
  return (
    <div className="flex-1 bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
      <Header 
        title="Contatos e Fornecedores" 
        subtitle="Gestão centralizada de parceiros de engenharia, fornecedores de materiais e clientes de projetos."
        extraAction={
          <button
            onClick={() => handleOpenAiModal()}
            className="size-10 flex items-center justify-center rounded-2xl bg-[#1a1a1a] text-slate-500 hover:text-[#d4ff3f] hover:bg-[#2a2a2a] transition-all"
            title="Pesquisa IA"
          >
            <Sparkles size={18} />
          </button>
        }
        action={{ label: 'Novo Contato', onClick: () => handleOpenModal() }}
      />

      <div className="p-8 space-y-8">
        {/* Filters */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="flex min-w-max items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl px-3 py-2 focus-within:border-[#d4ff3f]/40 transition-all w-[500px]">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar contatos..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-[#d4ff3f] transition-colors"
                title="Limpar pesquisa"
              >
                <BrushCleaning size={15} />
              </button>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <CustomSelect
                label="Filtro:"
                value={filterType}
                options={filterOptions}
                isOpen={openDropdown === 'filter'}
                onToggle={() => setOpenDropdown((prev) => (prev === 'filter' ? null : 'filter'))}
                onSelect={(value) => {
                  setFilterType(value as 'TODOS' | 'NOME' | 'EMPRESA' | 'TELEFONE');
                  setOpenDropdown(null);
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div onClick={(e) => e.stopPropagation()}>
                <CustomSelect
                  label="Categoria:"
                  value={categoryFilter}
                  options={categorySelectOptions}
                  isOpen={openDropdown === 'category'}
                  onToggle={() => setOpenDropdown((prev) => (prev === 'category' ? null : 'category'))}
                  onSelect={(value) => {
                    setCategoryFilter(value);
                    setOpenDropdown(null);
                  }}
                />
              </div>

              {categoryFilter === 'NOVA_CATEGORIA' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryDraft}
                    onChange={(e) => setNewCategoryDraft(e.target.value)}
                    placeholder="Cadastrar nova categoria"
                    className="w-56 bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#d4ff3f]/50"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-2 rounded-xl bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Nova categoria
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleDownloadTemplate}
              title="Baixar Modelo de Importação (.txt)"
              className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors flex items-center gap-2"
            >
              <FileText size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Modelo</span>
            </button>
            <label className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors cursor-pointer flex items-center gap-2">
              {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">Importar</span>
              <input type="file" accept=".txt,.csv" onChange={handleImport} className="hidden" disabled={isImporting} />
            </label>
            <button 
              onClick={handleDownload}
              className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors flex items-center gap-2"
              title="Exportar CSV"
            >
              <Download size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
            </button>
          </div>
        </div>


        {/* Data Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('Empresa', 'company')}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('Nome', 'name')}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('Telefone', 'phone')}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('Celular', 'cellphone')}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('E-mail', 'email')}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('Categoria', 'category')}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{renderSortHeader('Notas', 'info')}</th>
                  <th className="px-4 py-3 text-slate-500 text-[10px] font-black uppercase tracking-widest">Ações</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={24} className="text-[#d4ff3f] animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando contatos...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhum contato encontrado</p>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-[#2a2a2a]/30 transition-colors group leading-none">
                      <td className="px-4 py-1.5 text-sm text-[#d4ff3f] tracking-tight">{contact.company || '-'}</td>
                      <td className="px-4 py-1.5 text-sm text-white tracking-tight">{contact.name || '-'}</td>
                      <td className="px-4 py-1.5 text-xs text-slate-300">{contact.phone || '-'}</td>
                      <td className="px-4 py-1.5 text-xs text-slate-300">{contact.cellphone || '-'}</td>
                      <td className="px-4 py-1.5 text-xs text-slate-300">{contact.email || '-'}</td>
                      <td className="px-4 py-1.5 text-xs text-slate-500">{contact.category === 'Parceiro' ? 'Diversos' : contact.category}</td>
                      <td className="px-4 py-1.5 text-xs text-slate-500 max-w-[220px]">
                        <p className="truncate">{contact.info || '-'}</p>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex gap-1">
                          <a 
                            href={contact.email ? `mailto:${contact.email}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!contact.email) {
                                e.preventDefault();
                                alert('E-mail não cadastrado.');
                              }
                            }}
                            className="p-1 rounded-md bg-[#0a0a0a] text-slate-500 hover:bg-[#d4ff3f]/10 hover:text-[#d4ff3f] transition-all border border-slate-800/50"
                            title="Enviar E-mail"
                          >
                            <Mail size={18} />
                          </a>
                          <button onClick={() => {
                              const cleanPhone = (contact.cellphone || contact.phone).replace(/\D/g, '');
                              if (cleanPhone) {
                                if (contact.cellphone) {
                                  window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                  return;
                                }

                                window.location.href = `tel:${cleanPhone}`;
                              } else {
                                alert('Telefone/Celular não cadastrado ou inválido.');
                              }
                            }}
                            className="p-1 rounded-md bg-[#0a0a0a] text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-slate-800/50"
                            title={contact.cellphone ? 'WhatsApp' : 'Ligar'}
                          >
                            {contact.cellphone ? <MessageCircle size={18} /> : <Phone size={18} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(contact)}
                            className="p-1 rounded-md hover:bg-[#2a2a2a] text-slate-500 hover:text-[#d4ff3f] transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(contact.id)}
                            className="p-1 rounded-md hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 transition-all"
                            title="Excluir"
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
          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-800/50 bg-[#0a0a0a]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Exibindo {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredContacts.length)} de {filteredContacts.length} contatos
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-lg border border-slate-800/50 text-slate-500 hover:bg-[#1a1a1a] transition-all disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`size-8 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === page 
                      ? 'bg-[#d4ff3f] text-[#0a0a0a]' 
                      : 'text-slate-500 hover:bg-[#2a2a2a]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-lg border border-slate-800/50 text-slate-500 hover:bg-[#1a1a1a] transition-all disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6 rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-sm flex items-center gap-5 group hover:border-[#d4ff3f]/30 transition-all">
              <div className={`size-14 rounded-2xl bg-slate-800/50 text-slate-400 flex items-center justify-center group-hover:text-[#d4ff3f] transition-colors`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAiModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Pesquisa IA de Contatos</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Busca no Google com resumo dos resultados encontrados
                  </p>
                </div>
                <button onClick={handleCloseAiModal} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center gap-3 bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 focus-within:border-[#d4ff3f]/50 transition-all">
                    <Search size={18} className="text-slate-500" />
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAiSearch();
                        }
                      }}
                      placeholder="Digite nome, empresa ou contato para pesquisar..."
                      className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-slate-600 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAiSearch}
                    disabled={isAiSearching}
                    className="px-5 py-3 rounded-2xl bg-[#d4ff3f] hover:bg-[#c4ef2f] disabled:opacity-60 text-[#0a0a0a] text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Pesquisar
                  </button>
                </div>

                {aiError && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {aiError}
                  </div>
                )}

                {!aiError && !isAiSearching && aiResults.length === 0 && (
                  <div className="rounded-2xl border border-slate-800/50 bg-[#0f0f0f] px-4 py-6 text-center text-sm text-slate-500">
                    Pesquise um nome ou empresa para ver os resultados coletados do Google.
                  </div>
                )}

                <div className="max-h-[420px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {aiResults.map((result) => (
                    <div key={result.link} className="rounded-2xl border border-slate-800/50 bg-[#0f0f0f] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#d4ff3f]">
                            {result.displayLink}
                          </p>
                          <h4 className="text-sm font-black text-white tracking-tight">{result.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{result.snippet}</p>
                        </div>
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-2 rounded-xl bg-[#1a1a1a] text-slate-400 hover:text-[#d4ff3f] hover:bg-[#2a2a2a] transition-colors"
                          title="Abrir resultado"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-lg bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight">
                  {editingContact ? 'Editar Contato' : 'Novo Contato'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: João Silva"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Empresa</label>
                    <input 
                      type="text" 
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="ex: Acme Construções"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Categoria</label>
                    <select 
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Número de Telefone</label>
                    <input 
                      type="text" 
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Endereço de E-mail</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="contato@empresa.com.br"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Celular</label>
                    <input 
                      type="text" 
                      value={formData.celular}
                      onChange={(e) => setFormData({...formData, celular: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Notas</label>
                    <textarea 
                      value={formData.notas}
                      onChange={(e) => setFormData({...formData, notas: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all h-20 resize-none"
                      placeholder="Notas, observações ou detalhes adicionais..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#2a2a2a] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d4ff3f]/10 transition-all"
                  >
                    {editingContact ? 'Salvar Alterações' : 'Adicionar Contato'}
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



