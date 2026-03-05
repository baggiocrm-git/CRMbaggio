'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Download, 
  CheckCircle2,
  Circle,
  Info,
  HardHat,
  Loader2,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffMember {
  id: string;
  name: string;
  emp_id: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  img_url: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: string;
  icon_name: string;
  color_class: string;
  bg_class: string;
  created_at: string;
}

const iconMap: Record<string, React.ElementType> = {
  FileText,
  ShieldCheck,
  HardHat,
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    emp_id: '',
    role: '',
    department: '',
    status: 'Active' as StaffMember['status'],
    img_url: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [staffRes, docsRes] = await Promise.all([
        supabase.from('staff').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false })
      ]);

      if (staffRes.error) throw staffRes.error;
      if (docsRes.error) throw docsRes.error;

      setStaffList(staffRes.data || []);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = [
    { label: 'Total Active Staff', value: staffList.filter(s => s.status === 'Active').length.toString(), change: '+4 this month', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Contracts', value: '12', change: 'Review needed', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Safety Certifications', value: '89%', change: '8 expiring', icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        emp_id: member.emp_id,
        role: member.role,
        department: member.department,
        status: member.status,
        img_url: member.img_url || '',
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        emp_id: '',
        role: '',
        department: '',
        status: 'Active',
        img_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([formData]);
        if (error) throw error;
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving staff member:', error);
      alert('Failed to save staff member.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (error) {
        console.error('Error deleting staff member:', error);
        alert('Failed to delete staff member.');
      }
    }
  };
  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Staff & Document Management" 
          subtitle="Centralized control for engineering personnel and compliance records."
          action={{ label: 'New Member', onClick: () => handleOpenModal() }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Staff Directory */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Staff Directory</h3>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Filter</button>
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Export</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Role & Department</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Docs</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 size={24} className="text-blue-600 animate-spin" />
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading staff...</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        staffList.map((person) => (
                          <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm relative">
                                  <Image src={person.img_url || `https://picsum.photos/seed/${person.id}/100/100`} alt={person.name} fill className="object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <p className="font-black text-sm text-slate-900 dark:text-white">{person.name}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Emp #{person.emp_id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{person.role}</p>
                              <p className="text-xs text-slate-500 font-medium">{person.department}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                person.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                              }`}>
                                {person.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex gap-1.5">
                                {[true, true, false].map((done, i) => (
                                  done 
                                    ? <CheckCircle2 key={i} size={16} className="text-blue-600" />
                                    : <Circle key={i} size={16} className="text-slate-200 dark:text-slate-700" />
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(person)} className="p-1 hover:text-blue-600 transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(person.id)} className="p-1 hover:text-rose-600 transition-colors">
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
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing 3 of 124 employees</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Previous</button>
                    <button className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest">Next</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Vault Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Digital Document Vault</h3>
                </div>
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 size={20} className="text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    documents.map((doc) => {
                      const Icon = iconMap[doc.icon_name] || FileText;
                      return (
                        <div key={doc.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:border-blue-600/50 transition-all cursor-pointer group">
                          <div className={`size-10 ${doc.bg_class} ${doc.color_class} rounded-xl flex items-center justify-center`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{doc.file_type} • {doc.file_size} • Updated {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <Download size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                  <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                    View All Documents
                  </button>
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <Info size={24} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-sm text-blue-600 uppercase tracking-widest mb-2">Upcoming Renewals</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      There are 8 professional certifications and 2 site permits set to expire in the next 30 days. Please initiate the renewal process.
                    </p>
                    <button className="text-[10px] font-black uppercase tracking-widest underline text-blue-600 mt-4">View Expiring Items</button>
                  </div>
                </div>
              </div>
            </div>
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
                    {editingMember ? 'Edit Staff Member' : 'New Staff Member'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Robert Jackson"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Employee ID</label>
                      <input 
                        required
                        type="text" 
                        value={formData.emp_id}
                        onChange={(e) => setFormData({...formData, emp_id: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="E294"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as StaffMember['status']})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Role</label>
                      <input 
                        required
                        type="text" 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Sr. Civil Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Department</label>
                      <input 
                        required
                        type="text" 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="e.g. Structural Division"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Image URL (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.img_url}
                        onChange={(e) => setFormData({...formData, img_url: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="https://picsum.photos/..."
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
                      {editingMember ? 'Save Changes' : 'Add Member'}
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
