'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Cloud, 
  Users, 
  HardHat, 
  Plus, 
  Trash2,
  Loader2,
  Sun,
  FileText,
  Printer,
  Camera,
  X,
  CloudRain,
  CloudLightning,
  Wind,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Project, RDO } from '@/lib/types';
import { cn } from '@/lib/utils';

const CLIMA_OPTIONS = [
  { label: 'Ensolarado', icon: Sun, color: 'text-amber-400' },
  { label: 'Nublado', icon: Cloud, color: 'text-slate-400' },
  { label: 'Chuvoso', icon: CloudRain, color: 'text-blue-400' },
  { label: 'Tempestade', icon: CloudLightning, color: 'text-purple-400' },
  { label: 'Ventania', icon: Wind, color: 'text-cyan-400' },
];

export default function RDODetailPage() {
  const { id, rdoId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [rdo, setRdo] = useState<RDO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<RDO>>({
    data: '',
    clima_manha: '',
    clima_tarde: '',
    mao_de_obra: [],
    equipamentos: [],
    atividades: '',
    ocorrencias: '',
    fotos: [],
    assinatura_responsavel: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, rdoRes] = await Promise.all([
          supabase.from('projetos').select('*').eq('id', id).single(),
          supabase.from('rdos').select('*').eq('id', rdoId).single()
        ]);

        if (projectRes.error) throw projectRes.error;
        if (rdoRes.error) throw rdoRes.error;

        if (projectRes.data) setProject(projectRes.data);
        if (rdoRes.data) {
          setRdo(rdoRes.data);
          setFormData({
            ...rdoRes.data,
            mao_de_obra: rdoRes.data.mao_de_obra || [],
            equipamentos: rdoRes.data.equipamentos || [],
            fotos: rdoRes.data.fotos || []
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id && rdoId) fetchData();
  }, [id, rdoId]);

  const handleAddMaoDeObra = () => {
    setFormData({
      ...formData,
      mao_de_obra: [...(formData.mao_de_obra || []), { funcao: '', quantidade: 1 }]
    });
  };

  const handleRemoveMaoDeObra = (index: number) => {
    const newList = [...(formData.mao_de_obra || [])];
    newList.splice(index, 1);
    setFormData({ ...formData, mao_de_obra: newList });
  };

  const handleAddEquipamento = () => {
    setFormData({
      ...formData,
      equipamentos: [...(formData.equipamentos || []), { nome: '', quantidade: 1, status: 'Operacional' }]
    });
  };

  const handleRemoveEquipamento = (index: number) => {
    const newList = [...(formData.equipamentos || [])];
    newList.splice(index, 1);
    setFormData({ ...formData, equipamentos: newList });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) resolve(base64);
        else reject(new Error('Falha ao converter arquivo'));
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const filesArray = Array.from(files);
      
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        
        // Small delay between uploads
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        const base64 = await fileToBase64(file);

        let retryCount = 0;
        const maxRetries = 1;
        let success = false;

        while (retryCount <= maxRetries && !success) {
          try {
            const response = await fetch('/api/rdo/photos/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                fileBase64: base64,
                fileName: file.name,
                fileType: file.type,
                projeto_id: id as string,
                rdo_id: rdoId as string,
              }),
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              console.error(`Upload attempt ${retryCount + 1} failed with non-JSON response:`, text.substring(0, 200));
              
              if (retryCount < maxRetries) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1500));
                continue;
              }

              if (text.includes('Cookie check') || text.includes('Authenticate in new window')) {
                throw new Error('Sessão do preview expirada. Por favor, clique em "Abrir em nova aba" no canto superior direito para estabilizar a conexão.');
              }
              
              throw new Error(`Erro no servidor (Upload ${i + 1}): ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
              setFormData(prev => ({
                ...prev,
                fotos: [...(prev.fotos || []), data.url]
              }));
              success = true;
            } else {
              throw new Error(data.error || 'Erro no upload');
            }
          } catch (err) {
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1500));
              continue;
            }
            throw err;
          }
        }
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao fazer upload de fotos.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newList = [...(formData.fotos || [])];
    newList.splice(index, 1);
    setFormData({ ...formData, fotos: newList });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rdos')
        .update(formData)
        .eq('id', rdoId);
      
      if (error) throw error;
      setIsEditing(false);
      setRdo(formData as RDO);
    } catch (error) {
      console.error('Error updating RDO:', error);
      setError('Erro ao atualizar RDO.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('rdos').delete().eq('id', rdoId);
      if (error) throw error;
      router.push(`/projects/${id}/rdo`);
    } catch (error) {
      console.error('Error deleting RDO:', error);
      setError('Erro ao excluir RDO.');
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#d4ff3f]" size={32} />
      </div>
    );
  }

  if (!rdo) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 print:bg-white print:pb-0">
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-card { border: 1px solid #eee !important; background: white !important; box-shadow: none !important; margin-bottom: 20px !important; page-break-inside: avoid; }
          .print-grid { display: block !important; }
          .print-grid > div { margin-bottom: 15px !important; }
          .print-text { color: black !important; }
          .print-label { color: #666 !important; font-size: 8px !important; }
          .print-title { font-size: 18px !important; border-bottom: 2px solid #000 !important; padding-bottom: 10px !important; margin-bottom: 20px !important; }
          .print-photo { width: 48% !important; display: inline-block !important; margin: 1% !important; height: 200px !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 pt-8 print:pt-0">
        <div className="flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                RDO - {new Date(rdo.data).toLocaleDateString('pt-BR')}
              </h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{project?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="p-2 bg-[#1a1a1a] text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Imprimir"
            >
              <Printer size={20} />
            </button>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d4ff3f]/20 transition-all"
              >
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Print Header (Visible only when printing) */}
        <div className="hidden print:block print-title">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase">Relatório Diário de Obra</h1>
              <p className="text-sm font-bold text-gray-600">{project?.nome}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black">DATA: {new Date(rdo.data).toLocaleDateString('pt-BR')}</p>
              <p className="text-[10px] text-gray-500">ID: {rdo.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4 print-card">
            <div className="flex items-center gap-2 mb-2 no-print">
              <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                <Cloud size={16} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Informações Básicas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:flex print:gap-8">
              <div className="print:flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 print-label">Data do Relatório</label>
                <div className="print:hidden">
                  <input 
                    type="date"
                    disabled={!isEditing}
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all disabled:opacity-50"
                  />
                </div>
                <p className="hidden print:block text-sm font-bold">{new Date(formData.data || '').toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="print:flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 print-label">Clima Manhã</label>
                <div className="print:hidden">
                  <select 
                    disabled={!isEditing}
                    value={formData.clima_manha}
                    onChange={(e) => setFormData({...formData, clima_manha: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all appearance-none disabled:opacity-50"
                  >
                    {CLIMA_OPTIONS.map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <p className="hidden print:block text-sm font-bold">{formData.clima_manha}</p>
              </div>
              <div className="print:flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 print-label">Clima Tarde</label>
                <div className="print:hidden">
                  <select 
                    disabled={!isEditing}
                    value={formData.clima_tarde}
                    onChange={(e) => setFormData({...formData, clima_tarde: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all appearance-none disabled:opacity-50"
                  >
                    {CLIMA_OPTIONS.map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <p className="hidden print:block text-sm font-bold">{formData.clima_tarde}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:flex print:gap-4">
            {/* Labor */}
            <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4 print-card print:flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f] no-print">
                    <Users size={16} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-white print:text-black">Mão de Obra</h2>
                </div>
                {isEditing && (
                  <button 
                    type="button"
                    onClick={handleAddMaoDeObra}
                    className="p-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-colors no-print"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {formData.mao_de_obra?.length === 0 && <p className="text-[10px] text-slate-500 italic">Nenhuma mão de obra registrada.</p>}
                {formData.mao_de_obra?.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end border-b border-slate-800/30 pb-2 print:border-gray-200">
                    <div className="flex-1">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 print-label">Função</label>
                      <div className="print:hidden">
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={item.funcao}
                          onChange={(e) => {
                            const newList = [...(formData.mao_de_obra || [])];
                            newList[index].funcao = e.target.value;
                            setFormData({ ...formData, mao_de_obra: newList });
                          }}
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all disabled:opacity-50"
                        />
                      </div>
                      <p className="hidden print:block text-xs font-bold">{item.funcao}</p>
                    </div>
                    <div className="w-16">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 print-label">Qtd</label>
                      <div className="print:hidden">
                        <input 
                          type="number"
                          disabled={!isEditing}
                          value={item.quantidade}
                          onChange={(e) => {
                            const newList = [...(formData.mao_de_obra || [])];
                            newList[index].quantidade = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, mao_de_obra: newList });
                          }}
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all disabled:opacity-50"
                        />
                      </div>
                      <p className="hidden print:block text-xs font-bold">{item.quantidade}</p>
                    </div>
                    {isEditing && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveMaoDeObra(index)}
                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors mb-0.5 no-print"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Equipment */}
            <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4 print-card print:flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f] no-print">
                    <HardHat size={16} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-white print:text-black">Equipamentos</h2>
                </div>
                {isEditing && (
                  <button 
                    type="button"
                    onClick={handleAddEquipamento}
                    className="p-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-colors no-print"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {formData.equipamentos?.length === 0 && <p className="text-[10px] text-slate-500 italic">Nenhum equipamento registrado.</p>}
                {formData.equipamentos?.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end border-b border-slate-800/30 pb-2 print:border-gray-200">
                    <div className="flex-1">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 print-label">Equipamento</label>
                      <div className="print:hidden">
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={item.nome}
                          onChange={(e) => {
                            const newList = [...(formData.equipamentos || [])];
                            newList[index].nome = e.target.value;
                            setFormData({ ...formData, equipamentos: newList });
                          }}
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all disabled:opacity-50"
                        />
                      </div>
                      <p className="hidden print:block text-xs font-bold">{item.nome}</p>
                    </div>
                    <div className="w-12">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 print-label">Qtd</label>
                      <div className="print:hidden">
                        <input 
                          type="number"
                          disabled={!isEditing}
                          value={item.quantidade}
                          onChange={(e) => {
                            const newList = [...(formData.equipamentos || [])];
                            newList[index].quantidade = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, equipamentos: newList });
                          }}
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all disabled:opacity-50"
                        />
                      </div>
                      <p className="hidden print:block text-xs font-bold">{item.quantidade}</p>
                    </div>
                    <div className="w-20">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 print-label">Status</label>
                      <div className="print:hidden">
                        <select 
                          disabled={!isEditing}
                          value={item.status}
                          onChange={(e) => {
                            const newList = [...(formData.equipamentos || [])];
                            newList[index].status = e.target.value;
                            setFormData({ ...formData, equipamentos: newList });
                          }}
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-1 py-2 text-[9px] text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all appearance-none disabled:opacity-50"
                        >
                          <option value="Operacional">Operacional</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Parado">Parado</option>
                        </select>
                      </div>
                      <p className="hidden print:block text-[9px] font-bold">{item.status}</p>
                    </div>
                    {isEditing && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveEquipamento(index)}
                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors mb-0.5 no-print"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Activities */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4 print-card">
            <div className="flex items-center gap-2 mb-2 no-print">
              <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                <FileText size={16} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Atividades e Ocorrências</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 print-label">Descrição das Atividades</label>
                <div className="print:hidden">
                  <textarea 
                    rows={4}
                    disabled={!isEditing}
                    value={formData.atividades}
                    onChange={(e) => setFormData({...formData, atividades: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none disabled:opacity-50"
                  />
                </div>
                <p className="hidden print:block text-xs whitespace-pre-wrap leading-relaxed">{formData.atividades || 'Nenhuma atividade registrada.'}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 print-label">Ocorrências / Observações</label>
                <div className="print:hidden">
                  <textarea 
                    rows={3}
                    disabled={!isEditing}
                    value={formData.ocorrencias}
                    onChange={(e) => setFormData({...formData, ocorrencias: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none disabled:opacity-50"
                  />
                </div>
                <p className="hidden print:block text-xs whitespace-pre-wrap leading-relaxed">{formData.ocorrencias || 'Nenhuma ocorrência registrada.'}</p>
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4 print-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f] no-print">
                  <Camera size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-white print:text-black">Fotos da Obra</h2>
              </div>
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-colors disabled:opacity-50 no-print"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              )}
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />
            
            {(!formData.fotos || formData.fotos.length === 0) ? (
              <div 
                onClick={() => isEditing && fileInputRef.current?.click()}
                className={cn(
                  "flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-8 text-slate-600 no-print",
                  isEditing && "cursor-pointer hover:border-[#d4ff3f]/30 transition-all"
                )}
              >
                <div className="text-center">
                  <Camera className="mx-auto mb-2 opacity-50" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {isEditing ? 'Clique para selecionar fotos ou vídeos' : 'Nenhuma foto registrada'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:block">
                {formData.fotos.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 group print:print-photo">
                    {url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') ? (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <p className="text-[10px] text-white">Vídeo</p>
                      </div>
                    ) : (
                      <Image 
                        src={url} 
                        alt={`Foto ${index + 1}`} 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Signature Section */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-6 print-card">
            <div className="flex items-center gap-2 mb-2 no-print">
              <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                <FileText size={16} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Assinatura e Responsável</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 print-label">Responsável Técnico / Encarregado</label>
                <div className="print:hidden">
                  <input 
                    type="text"
                    disabled={!isEditing}
                    value={formData.assinatura_responsavel}
                    onChange={(e) => setFormData({...formData, assinatura_responsavel: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all disabled:opacity-50"
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="hidden print:block mt-12 border-t border-black pt-2 text-center">
                  <p className="text-xs font-black uppercase">{formData.assinatura_responsavel || '____________________________________'}</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest">Assinatura do Responsável</p>
                </div>
              </div>
              
              <div className="hidden print:block">
                <div className="mt-12 border-t border-black pt-2 text-center">
                  <p className="text-xs font-black uppercase">Fiscalização / Cliente</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest">Assinatura do Cliente</p>
                </div>
              </div>
            </div>
          </section>

          {isEditing && (
            <div className="flex gap-3 no-print">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-6 py-4 bg-[#1a1a1a] text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2a2a2a] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={saving || uploading}
                className="flex-[2] flex items-center justify-center gap-3 px-8 py-4 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#d4ff3f]/10 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Salvar Alterações</>}
              </button>
            </div>
          )}

          {!isEditing && (
            <button 
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all no-print"
            >
              <Trash2 size={20} /> Excluir Relatório
            </button>
          )}
        </form>

        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 bg-rose-500 text-white rounded-2xl flex items-center gap-3 shadow-2xl no-print">
            <AlertCircle size={20} />
            <p className="text-xs font-bold">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
            <div className="bg-[#1a1a1a] border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Excluir Relatório?</h3>
                <p className="text-slate-500 text-sm mt-2">Esta ação não pode ser desfeita. Todos os dados deste RDO serão perdidos.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-[#0a0a0a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
