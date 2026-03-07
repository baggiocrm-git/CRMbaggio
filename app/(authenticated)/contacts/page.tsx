'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Truck,
  TrendingUp,
  UserCheck,
  X,
  Trash2,
  Edit2,
  Loader2,
  Upload,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string; // UUID from Supabase
  company: string;
  contact_person: string;
  category: string;
  status: string;
  email: string;
  phone: string;
  initials: string;
  color: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('TODOS OS CONTATOS');
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [regionFilter, setRegionFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    company: '',
    contact_person: '',
    category: 'Cliente',
    status: 'Ativo',
    email: '',
    phone: '',
  });

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedContacts = (data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        company: c.empresa as string,
        contact_person: c.pessoa_contato as string,
        category: c.categoria as string,
        status: c.status as string,
        email: c.email as string,
        phone: c.telefone as string,
        initials: c.iniciais as string,
        color: c.cor as string
      }));

      setContacts(mappedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const stats = [
    { label: 'Total de Clientes', value: contacts.filter(c => c.category === 'Cliente').length.toString(), icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Fornecedores Ativos', value: contacts.filter(c => c.category === 'Fornecedor' && c.status === 'Ativo').length.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { label: 'Total de Contatos', value: contacts.length.toString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
  ];

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        company: contact.company,
        contact_person: contact.contact_person,
        category: contact.category,
        status: contact.status,
        email: contact.email,
        phone: contact.phone,
      });
    } else {
      setEditingContact(null);
      setFormData({
        company: '',
        contact_person: '',
        category: 'Cliente',
        status: 'Ativo',
        email: '',
        phone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesTab = 
      activeTab === 'TODOS OS CONTATOS' || 
      (activeTab === 'CLIENTES' && contact.category === 'Cliente') ||
      (activeTab === 'FORNECEDORES' && contact.category === 'Fornecedor') ||
      (activeTab === 'DIVERSOS' && contact.category === 'Diversos');

    const matchesStatus = statusFilter === 'TODOS' || contact.status.toUpperCase() === statusFilter;
    const matchesCategory = categoryFilter === 'TODOS' || contact.category.toUpperCase() === categoryFilter;
    // Region is not in the schema yet, so we ignore it for now or assume it matches if 'ALL'
    const matchesRegion = regionFilter === 'TODOS';

    const matchesSearch = 
      contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesStatus && matchesCategory && matchesRegion && matchesSearch;
  });

  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  const handleDownload = () => {
    const headers = ['Empresa', 'Pessoa de Contato', 'Categoria', 'Status', 'E-mail', 'Telefone'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(c => [
        `"${c.company}"`,
        `"${c.contact_person}"`,
        `"${c.category}"`,
        `"${c.status}"`,
        `"${c.email}"`,
        `"${c.phone}"`
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

  const handleDownloadTemplate = () => {
    const headers = ['Empresa', 'Pessoa de Contato', 'Categoria', 'Status', 'E-mail', 'Telefone'];
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
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length <= 1) {
          alert('O arquivo está vazio ou contém apenas o cabeçalho.');
          setIsImporting(false);
          return;
        }

        // Detectar delimitador (vírgula ou ponto e vírgula)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';

        // Skip header
        const dataLines = lines.slice(1);
        const newContacts = dataLines.map((line, index) => {
          const parts = line.split(delimiter).map(s => s.trim().replace(/^"|"$/g, ''));
          const [company, contact_person, category, status, email, phone] = parts;
          
          if (!company) {
            console.warn(`Linha ${index + 2} ignorada: Nome da empresa não encontrado.`);
            return null;
          }

          const initials = company
            .split(' ')
            .filter(word => word.length > 0)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || company.slice(0, 2).toUpperCase() || '??';

          return {
            empresa: company,
            pessoa_contato: contact_person || '',
            categoria: category || 'Diversos',
            status: status || 'Ativo',
            email: email || '',
            telefone: phone || '',
            iniciais: initials,
            cor: 'bg-blue-100 text-blue-600'
          };
        }).filter(Boolean);

        if (newContacts.length > 0) {
          const { error } = await supabase.from('contatos').insert(newContacts);
          if (error) throw error;
          alert(`${newContacts.length} contatos importados com sucesso!`);
          await fetchContacts();
        } else {
          alert('Nenhum contato válido encontrado para importação.');
        }
      } catch (err: unknown) {
        console.error('Erro detalhado na importação:', err);
        const errorMessage = err instanceof Error ? err.message : 
                           (err as { message?: string })?.message || 
                           (err as { details?: string })?.details || 
                           'Erro desconhecido';
        alert(`Erro ao importar arquivo: ${errorMessage}. Verifique se o formato está correto.`);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initials = formData.company.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    try {
      const payload = {
        empresa: formData.company,
        pessoa_contato: formData.contact_person,
        categoria: formData.category,
        status: formData.status,
        email: formData.email,
        telefone: formData.phone,
        iniciais: initials
      };

      if (editingContact) {
        const { error } = await supabase
          .from('contatos')
          .update(payload)
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contatos')
          .insert([{
            ...payload,
            cor: 'bg-blue-100 text-blue-600' // Default color
          }]);

        if (error) throw error;
      }
      
      await fetchContacts();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      alert('Falha ao salvar contato. Por favor, verifique sua configuração do Supabase.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        const { error } = await supabase
          .from('contatos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchContacts();
      } catch (error) {
        console.error('Erro ao excluir contato:', error);
        alert('Falha ao excluir contato.');
      }
    }
  };
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Contatos e Fornecedores" 
          subtitle="Gestão centralizada de parceiros de engenharia, fornecedores de materiais e clientes de projetos."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          action={{ label: 'Adicionar Novo Contato', onClick: () => handleOpenModal() }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-8 overflow-x-auto">
            {['TODOS OS CONTATOS', 'CLIENTES', 'FORNECEDORES', 'DIVERSOS'].map((tab) => (
              <button 
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`pb-4 border-b-2 font-black text-sm uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative group">
              <button 
                onClick={() => setStatusFilter(statusFilter === 'ATIVO' ? 'TODOS' : 'ATIVO')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Status: {statusFilter}
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
            <div className="relative group">
              <button 
                onClick={() => setCategoryFilter(categoryFilter === 'TODOS' ? 'CLIENTE' : categoryFilter === 'CLIENTE' ? 'FORNECEDOR' : categoryFilter === 'FORNECEDOR' ? 'DIVERSOS' : 'TODOS')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Categoria: {categoryFilter}
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
            <div className="relative group">
              <button 
                onClick={() => setRegionFilter(regionFilter === 'TODOS' ? 'BRASIL' : 'TODOS')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Região: {regionFilter}
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <button 
                onClick={handleDownloadTemplate}
                title="Baixar Modelo de Importação (.txt)"
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <FileText size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Modelo</span>
              </button>
              <label className="p-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Importar</span>
                <input type="file" accept=".txt,.csv" onChange={handleImport} className="hidden" disabled={isImporting} />
              </label>
              <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
                <Filter size={20} />
              </button>
              <button 
                onClick={handleDownload}
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Empresa / Contato</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Categoria</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Detalhes de Contato</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Ações Rápidas</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={24} className="text-blue-600 animate-spin" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando contatos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhum contato encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-xl ${contact.color} flex items-center justify-center font-black text-sm`}>
                              {contact.initials}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{contact.company}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{contact.contact_person}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            contact.category === 'Cliente' ? 'bg-blue-600/10 text-blue-600' : 
                            contact.category === 'Fornecedor' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' :
                            'bg-purple-600/10 text-purple-600'
                          }`}>
                            {contact.category === 'Parceiro' ? 'Diversos' : contact.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${
                              contact.status === 'Ativo' ? 'bg-emerald-500' : 
                              contact.status === 'Pendente' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              contact.status === 'Ativo' ? 'text-emerald-600' : 
                              contact.status === 'Pendente' ? 'text-amber-600' : 'text-slate-500'
                            }`}>{contact.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-bold">
                            <p className="text-slate-700 dark:text-slate-300">{contact.email}</p>
                            <p className="text-slate-400 mt-0.5">{contact.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600/10 hover:text-blue-600 transition-all">
                              <Mail size={18} />
                            </button>
                            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600/10 hover:text-blue-600 transition-all">
                              <Phone size={18} />
                            </button>
                            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600/10 hover:text-blue-600 transition-all">
                              <MessageSquare size={18} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenModal(contact)}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(contact.id)}
                              className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-500 hover:text-rose-600 transition-all"
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
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Exibindo {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredContacts.length)} de {filteredContacts.length} contatos
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`size-8 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-5">
                <div className={`size-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))}
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-black text-blue-600 tracking-tight">
                    {editingContact ? 'Editar Contato' : 'Adicionar Novo Contato'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Nome da Empresa</label>
                      <input 
                        required
                        type="text" 
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Acme Construções"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Contato Principal / Cargo</label>
                      <input 
                        required
                        type="text" 
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="ex: Gerente de Projetos"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Categoria</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Cliente">Cliente</option>
                        <option value="Fornecedor">Fornecedor</option>
                        <option value="Diversos">Diversos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Endereço de E-mail</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="contato@empresa.com.br"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Número de Telefone</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                    >
                      {editingContact ? 'Salvar Alterações' : 'Adicionar Contato'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
