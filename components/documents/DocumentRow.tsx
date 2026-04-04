'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Eye, 
  Download, 
  MoreVertical, 
  Edit2, 
  Move, 
  Trash2, 
  FolderOpen 
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DocumentRowProps {
  doc: any;
  index: number;
  currentFolderId: string;
  folders: any[];
  handleViewDocument: (doc: any) => void;
  getFileExtension: (doc: any) => string;
  getFileUrl: (filePath: string) => string;
  activeDocMenu: string | null;
  setActiveDocMenu: (id: string | null) => void;
  handleSyncToDrive: (doc: any) => void;
  setDocRenameForm: (form: any) => void;
  setIsDocRenameModalOpen: (open: boolean) => void;
  setDocToMove: (doc: any) => void;
  setTargetFolderId: (id: string) => void;
  setIsMoveModalOpen: (open: boolean) => void;
  handleDeleteDocument: (doc: any) => void;
  selectedDocs: Set<string>;
  setSelectedDocs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function DocumentRow({
  doc,
  index,
  currentFolderId,
  folders,
  handleViewDocument,
  getFileExtension,
  getFileUrl,
  activeDocMenu,
  setActiveDocMenu,
  handleSyncToDrive,
  setDocRenameForm,
  setIsDocRenameModalOpen,
  setDocToMove,
  setTargetFolderId,
  setIsMoveModalOpen,
  handleDeleteDocument,
  selectedDocs,
  setSelectedDocs
}: DocumentRowProps) {
  const isSelected = selectedDocs.has(doc.id);

  const toggleSelection = (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedDocs);
    if (isSelected) newSelected.delete(doc.id);
    else newSelected.add(doc.id);
    setSelectedDocs(newSelected);
  };

  return (
    <motion.tr 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key={doc.id ? `doc-row-${doc.id}-${index}` : `doc-row-idx-${index}`} 
      className={cn(
        "group hover:bg-white/5 transition-colors cursor-pointer",
        isSelected && "bg-[#d4ff3f]/5"
      )}
      onClick={() => handleViewDocument(doc)}
    >
      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={toggleSelection}
            className="size-4 rounded border-slate-700 bg-slate-800 text-[#d4ff3f] focus:ring-[#d4ff3f]/20 cursor-pointer"
          />
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#d4ff3f] transition-colors">{doc.nome}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <p className="text-xs font-bold text-slate-400 uppercase">
          {doc.tamanho_arquivo || '-'}
        </p>
      </td>
      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {doc.webViewLink && (
            <a 
              href={doc.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#d4ff3f] transition-all" 
              title="Ver no Google Drive"
            >
              <Image 
                src="https://www.google.com/favicon.ico" 
                alt="Drive" 
                width={16} 
                height={16} 
                className="rounded-full opacity-50 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
            </a>
          )}
          {!doc.is_drive_only && (
            <a 
              href={getFileUrl(doc.file_path)}
              download={doc.nome}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
              title="Download"
            >
              <Download size={16} />
            </a>
          )}
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveDocMenu(activeDocMenu === doc.id ? null : doc.id);
              }}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
              title="Mais opções"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {activeDocMenu === doc.id && (
                <motion.div 
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDocMenu(null);
                  }} 
                />
              )}
              {activeDocMenu === doc.id && doc.id && (
                <motion.div
                  key={`menu-${doc.id}-${doc.nome}`}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 z-50 w-48 bg-[#1a1a1a] border border-slate-800 rounded-2xl shadow-2xl p-1"
                >
                    {!doc.drive_file_id && !doc.is_drive_only && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDocMenu(null);
                          handleSyncToDrive(doc);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-[#d4ff3f] hover:bg-white/5 transition-all"
                      >
                        <Image 
                          src="https://www.google.com/favicon.ico" 
                          alt="Drive" 
                          width={14} 
                          height={14} 
                          className="rounded-full opacity-50"
                          referrerPolicy="no-referrer"
                        />
                        Sincronizar com Drive
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDocMenu(null);
                        setDocRenameForm({ id: doc.id, nome: doc.nome });
                        setIsDocRenameModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit2 size={12} />
                      Renomear
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDocMenu(null);
                        setDocToMove(doc);
                        setTargetFolderId(doc.pasta_id || 'root');
                        setIsMoveModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Move size={12} />
                      Mover
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDocMenu(null);
                        handleDeleteDocument(doc);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                      Excluir
                    </button>
                    </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}
