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
  Loader2
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
  const [formData, setFormData] = useState({
    company: '',
    contact_person: '',
    category: 'Client',
    status: 'Active',
    email: '',
    phone: '',
  });

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
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
    { label: 'Total Clients', value: contacts.filter(c => c.category === 'Client').length.toString(), icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Active Suppliers', value: contacts.filter(c => c.category === 'Supplier' && c.status === 'Active').length.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { label: 'Total Contacts', value: contacts.length.toString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
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
        category: 'Client',
        status: 'Active',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initials = formData.company.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update({
            ...formData,
            initials
          })
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([{
            ...formData,
            initials,
            color: 'bg-blue-100 text-blue-600' // Default color
          }]);

        if (error) throw error;
      }
      
      await fetchContacts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please check your Supabase configuration.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchContacts();
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact.');
      }
    }
  };
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Contacts & Suppliers" 
          subtitle="Centralized management of engineering partners, material suppliers, and project clients."
          action={{ label: 'Add New Contact', onClick: () => handleOpenModal() }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-8 overflow-x-auto">
            <button className="pb-4 border-b-2 border-blue-600 text-blue-600 font-black text-sm uppercase tracking-widest">All Contacts</button>
            <button className="pb-4 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-sm uppercase tracking-widest transition-colors">Clients</button>
            <button className="pb-4 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-sm uppercase tracking-widest transition-colors">Suppliers</button>
            <button className="pb-4 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-sm uppercase tracking-widest transition-colors">Partners</button>
            <button className="pb-4 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-sm uppercase tracking-widest transition-colors">Archived</button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Status: Active
              <ChevronRight size={14} className="rotate-90" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Category: All
              <ChevronRight size={14} className="rotate-90" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Region: All
              <ChevronRight size={14} className="rotate-90" />
            </button>
            <div className="ml-auto flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
                <Filter size={20} />
              </button>
              <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
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
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Company / Contact</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Contact Details</th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Quick Actions</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={24} className="text-blue-600 animate-spin" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading contacts...</p>
                        </div>
                      </td>
                    </tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No contacts found</p>
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => (
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
                            contact.category === 'Client' ? 'bg-blue-600/10 text-blue-600' : 
                            contact.category === 'Supplier' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' :
                            'bg-purple-600/10 text-purple-600'
                          }`}>
                            {contact.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${
                              contact.status === 'Active' ? 'bg-emerald-500' : 
                              contact.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              contact.status === 'Active' ? 'text-emerald-600' : 
                              contact.status === 'Pending' ? 'text-amber-600' : 'text-slate-500'
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
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing 1 to 4 of 128 contacts</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 transition-all">
                  <ChevronLeft size={16} />
                </button>
                <button className="size-8 rounded-lg bg-blue-600 text-white text-[10px] font-black">1</button>
                <button className="size-8 rounded-lg text-slate-600 dark:text-slate-400 text-[10px] font-black hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">2</button>
                <button className="size-8 rounded-lg text-slate-600 dark:text-slate-400 text-[10px] font-black hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">3</button>
                <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 transition-all">
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
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Company Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Acme Construction"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Primary Contact / Role</label>
                      <input 
                        required
                        type="text" 
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Project Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Client">Client</option>
                        <option value="Supplier">Supplier</option>
                        <option value="Partner">Partner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Phone Number</label>
                      <input 
                        required
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="+1 555-0000"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                    >
                      {editingContact ? 'Save Changes' : 'Add Contact'}
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
