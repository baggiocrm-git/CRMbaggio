'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import { 
  UserPlus, 
  Mail, 
  Phone, 
  MessageSquare, 
  MoreVertical, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  Truck,
  TrendingUp,
  UserCheck,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: number;
  company: string;
  contact: string;
  category: string;
  status: string;
  email: string;
  phone: string;
  initials: string;
  color: string;
}

const initialContacts: Contact[] = [
  { id: 1, company: 'Acme Construction', contact: 'Commercial Infrastructure', category: 'Client', status: 'Active', email: 'contact@acme.com', phone: '+1 555-0101', initials: 'AC', color: 'bg-blue-100 text-blue-600' },
  { id: 2, company: 'BuildRight Supplies', contact: 'Raw Materials & Concrete', category: 'Supplier', status: 'Pending', email: 'sales@buildright.com', phone: '+1 555-0202', initials: 'BS', color: 'bg-amber-100 text-amber-600' },
  { id: 3, company: 'Steel & Iron Co.', contact: 'Structural Components', category: 'Supplier', status: 'Active', email: 'info@steeliron.com', phone: '+1 555-0303', initials: 'SI', color: 'bg-slate-100 text-slate-600' },
  { id: 4, company: 'Design Partners LLC', contact: 'Architectural Services', category: 'Partner', status: 'Inactive', email: 'hello@designparts.com', phone: '+1 555-0404', initials: 'DP', color: 'bg-purple-100 text-purple-600' },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    category: 'Client',
    status: 'Active',
    email: '',
    phone: '',
  });

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
        contact: contact.contact,
        category: contact.category,
        status: contact.status,
        email: contact.email,
        phone: contact.phone,
      });
    } else {
      setEditingContact(null);
      setFormData({
        company: '',
        contact: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      setContacts(contacts.map(c => c.id === editingContact.id ? {
        ...c,
        ...formData,
        initials: formData.company.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      } : c));
    } else {
      const newContact: Contact = {
        id: Date.now(),
        ...formData,
        initials: formData.company.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        color: 'bg-blue-100 text-blue-600' // Default color for new contacts
      };
      setContacts([...contacts, newContact]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(c => c.id !== id));
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
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-xl ${contact.color} flex items-center justify-center font-black text-sm`}>
                            {contact.initials}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{contact.company}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{contact.contact}</p>
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
                  ))}
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
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Company Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Acme Construction"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Primary Contact / Role</label>
                      <input 
                        required
                        type="text" 
                        value={formData.contact}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Project Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Client">Client</option>
                        <option value="Supplier">Supplier</option>
                        <option value="Partner">Partner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                      <input 
                        required
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
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
