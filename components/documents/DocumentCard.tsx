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
  FolderOpen,
  Calendar as CalendarIcon,
  Check
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Document } from '@/hooks/useDocuments';

interface DocumentCardProps {
  doc: Document;
  index: number;
  currentFolderId: string;
  folders: any[];
  handleViewDocument: (doc: Document) => void;
  getFileExtension: (doc: Document) => string;
  getFileUrl: (filePath: string) => string;
  activeDocMenu: string | null;
  setActiveDocMenu: (id: string | null) => void;
  handleSyncToDrive: (doc: Document) => void;
  setDocRenameForm: (form: any) => void;
  setIsDocRenameModalOpen: (open: boolean) => void;
  setDocToMove: React.Dispatch<React.SetStateAction<Document | null>>;
  setTargetFolderId: (id: string) => void;
  setIsMoveModalOpen: (open: boolean) => void;
  handleDeleteDocument: (doc: Document) => void;
  selectedDocs: Set<string>;
  setSelectedDocs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function DocumentCard({
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
}: DocumentCardProps) {
  const isSelected = selectedDocs.has(doc.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      key={doc.id ? `doc-grid-${doc.id}-${index}` : `doc-grid-idx-${index}`}
      className={cn(
        "group bg-[#1a1a1a] border rounded-xl p-3 transition-all flex flex-col items-center text-center relative",
        isSelected ? "border-[#d4ff3f] bg-[#d4ff3f]/5" : "border-slate-800/50 hover:border-[#d4ff3f]/30"
      )}
    >
      <div 
        className="absolute top-1 left-1 z-10"
        onClick={(e) => {
          e.stopPropagation();
          const newSelected = new Set(selectedDocs);
          if (isSelected) newSelected.delete(doc.id);
          else newSelected.add(doc.id);
          setSelectedDocs(newSelected);
        }}
      >
        <div className={cn(
          "size-4 rounded border flex items-center justify-center transition-all",
          isSelected ? "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a]" : "border-slate-800 bg-[#0a0a0a] opacity-0 group-hover:opacity-100"
        )}>
          {isSelected && <Check size={10} strokeWidth={4} />}
        </div>
      </div>

      <div 
        className={cn(
          "transition-colors cursor-pointer mb-2",
          isSelected ? "text-[#d4ff3f]" : "text-slate-400 group-hover:text-[#d4ff3f]"
        )}
        onClick={() => handleViewDocument(doc)}
      >
        <FileText size={32} />
      </div>
      
      <div className="w-full cursor-pointer" onClick={() => handleViewDocument(doc)}>
        <h3 className="text-[10px] font-bold text-white line-clamp-2 group-hover:text-[#d4ff3f] transition-colors break-words">{doc.nome}</h3>
      </div>

      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveDocMenu(activeDocMenu === doc.id ? null : doc.id);
            }}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" 
          >
            <MoreVertical size={12} />
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
            {activeDocMenu === doc.id && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 z-50 w-40 bg-[#1a1a1a] border border-slate-800 rounded-xl shadow-2xl p-1"
              >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocMenu(null);
                      handleSyncToDrive(doc);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-[#d4ff3f] hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Image 
                      src="https://www.google.com/favicon.ico" 
                      alt="Drive" 
                      width={10} 
                      height={10} 
                      className="rounded-full opacity-50"
                      referrerPolicy="no-referrer"
                    />
                    Sincronizar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocMenu(null);
                      setDocRenameForm({ id: doc.id, nome: doc.nome });
                      setIsDocRenameModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Edit2 size={10} />
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
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Move size={10} />
                    Mover
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocMenu(null);
                      handleDeleteDocument(doc);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={10} />
                    Excluir
                  </button>
                  </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
