'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Download, 
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
  name: string;
  category: string;
  email: string;
  phone: string;
  cellphone: string;
  info: string;
  initials: string;
  color: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'NOME' | 'EMPRESA' | 'TELEFONE'>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      
      const mappedContacts = (data || []).map((c: Record<string, unknown>) => {
        const name = (c.nome || '') as string;
        const company = (c.empresa || '') as string;
        
        // Generate initials on the fly
        const initials = (name || company || '??')
          .split(' ')
          .filter(word => word.length > 0)
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return {
          id: c.id as string,
          company: company,
          name: name,
          category: (c.categoria || '') as string,
          email: (c.email || '') as string,
          phone: (c.telefone || '') as string,
          cellphone: (c.celular || '') as string,
          info: (c.notas || '') as string,
          initials: initials,
          color: 'bg-blue-100 text-blue-600'
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
    let fieldA = a.name.toLowerCase();
    let fieldB = b.name.toLowerCase();

    if (filterType === 'EMPRESA') {
      fieldA = (a.company || a.name).toLowerCase();
      fieldB = (b.company || b.name).toLowerCase();
    } else if (filterType === 'TELEFONE') {
      fieldA = a.phone.toLowerCase();
      fieldB = b.phone.toLowerCase();
    }

    if (fieldA < fieldB) return -1;
    if (fieldA > fieldB) return 1;
    return 0;
  });

  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

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

  const handleDownloadTemplate = () => {
    const headers = ['Nome', 'Empresa', 'Telefone', 'Celular', 'E-mail', 'Categoria', 'Notas'];
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
        const countSemicolon = (firstLine.match(/;/g) || []).length;
        const countComma = (firstLine.match(/,/g) || []).length;
        const delimiter = countSemicolon > countComma ? ';' : ',';

        // Skip header
        const dataLines = lines.slice(1);
        const newContacts = dataLines.map((line, index) => {
          // Robust CSV split that handles quotes
          const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
          const parts = line.split(regex).map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          
          const [name, company, phone, cellphone, email, category, info] = parts;
          
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
    reader.readAsText(file);
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
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        action={{ label: 'Adicionar Novo Contato', onClick: () => handleOpenModal() }}
      />

      <div className="p-8 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtrar por:</span>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'TODOS' | 'NOME' | 'EMPRESA' | 'TELEFONE')}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Campos</option>
              <option value="NOME">Nome</option>
              <option value="EMPRESA">Empresa</option>
              <option value="TELEFONE">Telefone</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer"
            >
              <option value="TODOS">Todas</option>
              <option value="CLIENTE">Clientes</option>
              <option value="FORNECEDOR">Fornecedores</option>
              <option value="DIVERSOS">Diversos</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button 
              onClick={handleDownloadTemplate}
              title="Baixar Modelo de Importação (.txt)"
              className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors flex items-center gap-2"
            >
              <FileText size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Modelo</span>
            </button>
            <label className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors cursor-pointer flex items-center gap-2">
              {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Importar</span>
              <input type="file" accept=".txt,.csv" onChange={handleImport} className="hidden" disabled={isImporting} />
            </label>
            <button 
              onClick={handleDownload}
              className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors"
              title="Exportar CSV"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-800/50 bg-[#1a1a1a] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Empresa / Contato</th>
                  <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Detalhes de Contato</th>
                  <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Ações Rápidas</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={24} className="text-[#d4ff3f] animate-spin" />
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
                    <tr key={contact.id} className="hover:bg-[#2a2a2a]/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-xl bg-slate-800/50 text-[#d4ff3f] flex items-center justify-center font-black text-sm border border-slate-700`}>
                            {contact.initials}
                          </div>
                          <div>
                            <p className="font-black text-sm tracking-tight">{contact.company}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{contact.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          contact.category === 'Cliente' ? 'bg-[#d4ff3f]/10 text-[#d4ff3f]' : 
                          contact.category === 'Fornecedor' ? 'bg-slate-800 text-slate-400' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {contact.category === 'Parceiro' ? 'Diversos' : contact.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold">
                          <p className="text-slate-300">{contact.email}</p>
                          <p className="text-slate-500 mt-0.5">{contact.phone}{contact.cellphone ? ` / ${contact.cellphone}` : ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
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
                            className="p-2 rounded-xl bg-[#0a0a0a] text-slate-500 hover:bg-[#d4ff3f]/10 hover:text-[#d4ff3f] transition-all border border-slate-800/50"
                            title="Enviar E-mail"
                          >
                            <Mail size={18} />
                          </a>
                          <button 
                            onClick={() => {
                              const cleanPhone = (contact.cellphone || contact.phone).replace(/\D/g, '');
                              if (cleanPhone) {
                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                              } else {
                                alert('Telefone/Celular não cadastrado ou inválido.');
                              }
                            }}
                            className="p-2 rounded-xl bg-[#0a0a0a] text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-slate-800/50"
                            title="WhatsApp Web"
                          >
                            <Phone size={18} />
                          </button>
                          <a 
                            href={contact.cellphone || contact.phone ? `sms:${contact.cellphone || contact.phone}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!contact.cellphone && !contact.phone) {
                                e.preventDefault();
                                alert('Telefone/Celular não cadastrado.');
                              }
                            }}
                            className="p-2 rounded-xl bg-[#0a0a0a] text-slate-500 hover:bg-[#d4ff3f]/10 hover:text-[#d4ff3f] transition-all border border-slate-800/50"
                            title="Enviar SMS"
                          >
                            <MessageSquare size={18} />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(contact)}
                            className="p-2 rounded-lg hover:bg-[#2a2a2a] text-slate-500 hover:text-[#d4ff3f] transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(contact.id)}
                            className="p-2 rounded-lg hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 transition-all"
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
                      <option value="Cliente">Cliente</option>
                      <option value="Fornecedor">Fornecedor</option>
                      <option value="Diversos">Diversos</option>
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
