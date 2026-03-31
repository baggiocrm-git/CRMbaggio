'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Plus, 
  FileText, 
  FolderOpen 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isUploading: boolean;
  uploadProgress: number;
  newDoc: any;
  setNewDoc: (doc: any) => void;
  handleUpload: (e: React.FormEvent) => void;
  uploadFolderHistory: {id: string, name: string}[];
  setUploadFolderHistory: React.Dispatch<React.SetStateAction<{id: string, name: string}[]>>;
  uploadFolders: any[];
  
  isDocRenameModalOpen: boolean;
  setIsDocRenameModalOpen: (open: boolean) => void;
  docRenameForm: { id: string, nome: string };
  setDocRenameForm: (form: { id: string, nome: string }) => void;
  handleRenameDocument: (e: React.FormEvent) => void;
  
  isMoveModalOpen: boolean;
  setIsMoveModalOpen: (open: boolean) => void;
  docToMove: any;
  targetFolderId: string;
  setTargetFolderId: (id: string) => void;
  allFolders: any[];
  folders: any[];
  handleMoveDocument: (e: React.FormEvent) => void;
  
  isFolderModalOpen: boolean;
  setIsFolderModalOpen: (open: boolean) => void;
  folderForm: { id: string, nome: string, parent_id: string | null, mode: 'create' | 'edit' };
  setFolderForm: (form: any) => void;
  handleFolderSubmit: (e: React.FormEvent) => void;
  
  confirmModal: { isOpen: boolean, title: string, message: string, onConfirm: () => void };
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
}

export function DocumentModals({
  isModalOpen,
  setIsModalOpen,
  isUploading,
  uploadProgress,
  newDoc,
  setNewDoc,
  handleUpload,
  uploadFolderHistory,
  setUploadFolderHistory,
  uploadFolders,
  
  isDocRenameModalOpen,
  setIsDocRenameModalOpen,
  docRenameForm,
  setDocRenameForm,
  handleRenameDocument,
  
  isMoveModalOpen,
  setIsMoveModalOpen,
  docToMove,
  targetFolderId,
  setTargetFolderId,
  allFolders,
  folders,
  handleMoveDocument,
  
  isFolderModalOpen,
  setIsFolderModalOpen,
  folderForm,
  setFolderForm,
  handleFolderSubmit,
  
  confirmModal,
  setConfirmModal
}: DocumentModalsProps) {
  return (
    <AnimatePresence>
      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isUploading && setIsModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
          >
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">UPLOAD PARA DRIVE</h2>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pasta Destino</label>
                <div className="bg-[#0a0a0a] border border-slate-800/50 rounded-2xl p-3 space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {uploadFolderHistory.map((crumb, index) => {
                      const uniqueKey = `upload-crumb-${crumb.id || 'empty'}-${index}`;
                      return (
                        <React.Fragment key={uniqueKey}>
                          <button
                            type="button"
                            onClick={() => setUploadFolderHistory(prev => prev.slice(0, index + 1))}
                            className={cn(
                              "text-xs font-bold whitespace-nowrap transition-colors",
                              index === uploadFolderHistory.length - 1 ? "text-[#d4ff3f]" : "text-slate-500 hover:text-white"
                            )}
                          >
                            {crumb.name}
                          </button>
                          {index < uploadFolderHistory.length - 1 && (
                            <span className="text-slate-700 text-xs">/</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {uploadFolders.map((folder, idx) => {
                      const uniqueKey = `upload-folder-${folder.id || 'empty'}-${idx}`;
                      return (
                        <button
                          key={uniqueKey}
                          type="button"
                          onClick={() => {
                            setUploadFolderHistory(prev => [...prev, { id: folder.id, name: folder.nome }]);
                            setNewDoc((prev: any) => ({ ...prev, pasta_id: folder.id }));
                          }}
                          className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg text-left group transition-all"
                        >
                          <FolderOpen size={14} className="text-yellow-500/50 group-hover:text-yellow-500" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-white truncate">{folder.nome}</span>
                        </button>
                      );
                    })}
                    {uploadFolders.length === 0 && (
                      <p className="text-[10px] text-slate-600 italic p-2">Nenhuma subpasta encontrada</p>
                    )}
                  </div>
                </div>
                <input type="hidden" value={newDoc.pasta_id} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arquivo</label>
                <div className="relative">
                  <input 
                    type="file" 
                    required
                    key={isModalOpen ? 'open' : 'closed'}
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        const fileName = file.name.split('.').slice(0, -1).join('.');
                        setNewDoc({...newDoc, file, name: fileName});
                      } else {
                        setNewDoc({...newDoc, file: null, name: ''});
                      }
                    }}
                    className="hidden" 
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 bg-[#0a0a0a] border-2 border-dashed border-slate-800/50 rounded-2xl cursor-pointer hover:border-[#d4ff3f]/50 transition-all group"
                  >
                    {newDoc.file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="text-[#d4ff3f]" size={32} />
                        <span className="text-xs font-bold text-white">{newDoc.file.name}</span>
                        <span className="text-[10px] text-slate-500">{(newDoc.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Plus className="text-slate-600 group-hover:text-[#d4ff3f] transition-colors" size={32} />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Clique para selecionar arquivo</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Fazendo upload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-[#d4ff3f]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || !newDoc.file}
                  className="flex-1 bg-[#d4ff3f] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                >
                  {isUploading ? 'Processando...' : 'UPLOAD'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Document Rename Modal */}
      {isDocRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDocRenameModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
          >
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">
              Renomear Documento
            </h2>
            
            <form onSubmit={handleRenameDocument} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Documento</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={docRenameForm.nome}
                  onChange={e => setDocRenameForm({...docRenameForm, nome: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsDocRenameModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Move Document Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMoveModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
          >
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Mover Documento
            </h2>
            <p className="text-xs text-slate-500 mb-6">Selecione a pasta de destino para o documento <strong>{docToMove?.nome}</strong></p>
            
            <form onSubmit={handleMoveDocument} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pasta de Destino</label>
                <select 
                  value={targetFolderId}
                  onChange={e => setTargetFolderId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                >
                  <option value="root">Todos os Documentos (Raiz)</option>
                  {(allFolders.length > 0 ? allFolders : folders).map((folder, index) => {
                    const uniqueKey = `move-folder-${folder.id || 'empty'}-${index}`;
                    return (
                      <option key={uniqueKey} value={folder.id}>
                        {folder.nome}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                >
                  Mover
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFolderModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
          >
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">
              {folderForm.mode === 'create' ? 'Nova Pasta' : 'Renomear Pasta'}
            </h2>
            
            <form onSubmit={handleFolderSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Pasta</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={folderForm.nome}
                  onChange={e => setFolderForm({...folderForm, nome: e.target.value})}
                  placeholder="Ex: Contratos 2025"
                  className="w-full bg-[#0a0a0a] border border-slate-800/50 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#d4ff3f]/10"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-[#1a1a1a] border border-slate-800/50 rounded-[32px] p-8 shadow-2xl"
          >
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">{confirmModal.title}</h2>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">{confirmModal.message}</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-500/10"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
