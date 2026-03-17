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
  Camera, 
  Plus, 
  Trash2,
  Loader2,
  Sun,
  CloudRain,
  Wind,
  CloudLightning,
  FileText,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/types';

const CLIMA_OPTIONS = [
  { label: 'Ensolarado', icon: Sun, color: 'text-amber-400' },
  { label: 'Nublado', icon: Cloud, color: 'text-slate-400' },
  { label: 'Chuvoso', icon: CloudRain, color: 'text-blue-400' },
  { label: 'Tempestade', icon: CloudLightning, color: 'text-purple-400' },
  { label: 'Ventania', icon: Wind, color: 'text-cyan-400' },
];

export default function NewRDOPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    clima_manha: 'Ensolarado',
    clima_tarde: 'Ensolarado',
    mao_de_obra: [{ funcao: '', quantidade: 1 }],
    equipamentos: [{ nome: '', quantidade: 1, status: 'Operacional' }],
    atividades: '',
    ocorrencias: '',
    fotos: [] as string[],
    assinatura_responsavel: '',
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projetos')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleAddMaoDeObra = () => {
    setFormData({
      ...formData,
      mao_de_obra: [...formData.mao_de_obra, { funcao: '', quantidade: 1 }]
    });
  };

  const handleRemoveMaoDeObra = (index: number) => {
    const newList = [...formData.mao_de_obra];
    newList.splice(index, 1);
    setFormData({ ...formData, mao_de_obra: newList });
  };

  const handleAddEquipamento = () => {
    setFormData({
      ...formData,
      equipamentos: [...formData.equipamentos, { nome: '', quantidade: 1, status: 'Operacional' }]
    });
  };

  const handleRemoveEquipamento = (index: number) => {
    const newList = [...formData.equipamentos];
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
        
        // Small delay between uploads to avoid triggering proxy rate limits or race conditions
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
              credentials: 'include', // Ensure cookies are sent
              body: JSON.stringify({
                fileBase64: base64,
                fileName: file.name,
                fileType: file.type,
                projeto_id: id as string,
              }),
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              console.error(`Upload attempt ${retryCount + 1} failed with non-JSON response:`, text.substring(0, 200));
              
              if (retryCount < maxRetries) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1500)); // Wait longer before retry
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
                fotos: [...prev.fotos, data.url]
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
      alert(error instanceof Error ? error.message : 'Erro ao fazer upload de fotos.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newList = [...formData.fotos];
    newList.splice(index, 1);
    setFormData({ ...formData, fotos: newList });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rdos')
        .insert([{
          projeto_id: id,
          ...formData
        }]);
      
      if (error) throw error;
      router.push(`/projects/${id}/rdo`);
    } catch (error) {
      console.error('Error saving RDO:', error);
      alert('Erro ao salvar RDO.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#d4ff3f]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Novo Relatório Diário</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{project?.nome}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                <Cloud size={16} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Informações Básicas</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data do Relatório</label>
                <input 
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Clima Manhã</label>
                  <select 
                    value={formData.clima_manha}
                    onChange={(e) => setFormData({...formData, clima_manha: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all appearance-none"
                  >
                    {CLIMA_OPTIONS.map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Clima Tarde</label>
                  <select 
                    value={formData.clima_tarde}
                    onChange={(e) => setFormData({...formData, clima_tarde: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all appearance-none"
                  >
                    {CLIMA_OPTIONS.map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Labor */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                  <Users size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Mão de Obra</h2>
              </div>
              <button 
                type="button"
                onClick={handleAddMaoDeObra}
                className="p-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {formData.mao_de_obra.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Função</label>
                    <input 
                      type="text"
                      value={item.funcao}
                      onChange={(e) => {
                        const newList = [...formData.mao_de_obra];
                        newList[index].funcao = e.target.value;
                        setFormData({ ...formData, mao_de_obra: newList });
                      }}
                      placeholder="Ex: Pedreiro"
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Qtd</label>
                    <input 
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => {
                        const newList = [...formData.mao_de_obra];
                        newList[index].quantidade = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, mao_de_obra: newList });
                      }}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveMaoDeObra(index)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors mb-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Equipment */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                  <HardHat size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Equipamentos</h2>
              </div>
              <button 
                type="button"
                onClick={handleAddEquipamento}
                className="p-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {formData.equipamentos.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Equipamento</label>
                    <input 
                      type="text"
                      value={item.nome}
                      onChange={(e) => {
                        const newList = [...formData.equipamentos];
                        newList[index].nome = e.target.value;
                        setFormData({ ...formData, equipamentos: newList });
                      }}
                      placeholder="Ex: Betoneira"
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    />
                  </div>
                  <div className="w-16">
                    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Qtd</label>
                    <input 
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => {
                        const newList = [...formData.equipamentos];
                        newList[index].quantidade = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, equipamentos: newList });
                      }}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</label>
                    <select 
                      value={item.status}
                      onChange={(e) => {
                        const newList = [...formData.equipamentos];
                        newList[index].status = e.target.value;
                        setFormData({ ...formData, equipamentos: newList });
                      }}
                      className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-2 py-2 text-[10px] text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all appearance-none"
                    >
                      <option value="Operacional">Operacional</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Parado">Parado</option>
                    </select>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveEquipamento(index)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors mb-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Activities */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                <FileText size={16} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Atividades e Ocorrências</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Descrição das Atividades</label>
                <textarea 
                  rows={4}
                  value={formData.atividades}
                  onChange={(e) => setFormData({...formData, atividades: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none"
                  placeholder="Descreva o que foi feito hoje..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ocorrências / Observações</label>
                <textarea 
                  rows={3}
                  value={formData.ocorrencias}
                  onChange={(e) => setFormData({...formData, ocorrencias: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all resize-none"
                  placeholder="Algum imprevisto ou observação importante?"
                />
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-800/50 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#d4ff3f]/10 text-[#d4ff3f]">
                  <Camera size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Fotos da Obra</h2>
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 bg-[#d4ff3f]/10 text-[#d4ff3f] rounded-lg hover:bg-[#d4ff3f]/20 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />
            
            {formData.fotos.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-8 text-slate-600 cursor-pointer hover:border-[#d4ff3f]/30 transition-all"
              >
                <div className="text-center">
                  <Camera className="mx-auto mb-2 opacity-50" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Clique para selecionar fotos ou vídeos</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {formData.fotos.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 group">
                    {url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <Image 
                        src={url} 
                        alt={`Foto ${index + 1}`} 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl aspect-square text-slate-600 hover:border-[#d4ff3f]/30 transition-all"
                >
                  <Plus size={24} />
                </button>
              </div>
            )}
          </section>

          <button 
            type="submit"
            disabled={saving || uploading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#d4ff3f]/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Salvar Relatório</>}
          </button>
        </form>
      </div>
    </div>
  );
}
