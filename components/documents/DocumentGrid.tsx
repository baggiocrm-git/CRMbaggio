'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderOpen, 
  Search,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentCard } from './DocumentCard';
import type { Document } from '@/hooks/useDocuments';

interface DocumentGridProps {
  folders: any[];
  filteredDocuments: Document[];
  currentFolderId: string;
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
  setCurrentPath: React.Dispatch<React.SetStateAction<{id: string, name: string}[]>>;
  selectedDocs: Set<string>;
  setSelectedDocs: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFolders: Set<string>;
  setSelectedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function DocumentGrid({
  folders,
  filteredDocuments,
  currentFolderId,
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
  setCurrentPath,
  selectedDocs,
  setSelectedDocs,
  selectedFolders,
  setSelectedFolders
}: DocumentGridProps) {
  const allSelected = useMemo(() => {
    const allDocsSelected = filteredDocuments.length > 0 && filteredDocuments.every(doc => selectedDocs.has(doc.id));
    const allFoldersSelected = folders.length > 0 && folders.every(folder => selectedFolders.has(folder.id));
    
    if (filteredDocuments.length > 0 && folders.length > 0) {
      return allDocsSelected && allFoldersSelected;
    } else if (filteredDocuments.length > 0) {
      return allDocsSelected;
    } else if (folders.length > 0) {
      return allFoldersSelected;
    }
    return false;
  }, [filteredDocuments, folders, selectedDocs, selectedFolders]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDocs(new Set());
      setSelectedFolders(new Set());
    } else {
      const newDocs = new Set(selectedDocs);
      filteredDocuments.forEach(doc => newDocs.add(doc.id));
      const newFolders = new Set(selectedFolders);
      folders.forEach(folder => newFolders.add(folder.id));
      setSelectedDocs(newDocs);
      setSelectedFolders(newFolders);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
        >
          <div className={cn(
            "size-4 rounded border flex items-center justify-center transition-all",
            allSelected ? "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a]" : "border-slate-800 bg-white/5"
          )}>
            {allSelected && <Check size={10} strokeWidth={4} />}
          </div>
          Selecionar Tudo
        </button>
      </div>

      <div className="overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        <AnimatePresence mode='popLayout'>
            {folders.map((folder, idx) => {
              const isSelected = selectedFolders.has(folder.id);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={folder.id ? `grid-folder-${folder.id}-${idx}` : `grid-folder-idx-${idx}`}
                  onClick={() => {
                    if (folder.id && folder.id !== '') {
                      setCurrentPath(prev => [...prev, { id: folder.id, name: folder.nome }]);
                    }
                  }}
                  className={cn(
                    "group bg-[#1a1a1a] border rounded-xl p-3 transition-all cursor-pointer flex flex-col items-center text-center relative",
                    isSelected ? "border-orange-500 bg-orange-500/5" : "border-slate-800/50 hover:border-orange-500/30"
                  )}
                >
                  <div 
                    className="absolute top-1 left-1 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSelected = new Set(selectedFolders);
                      if (isSelected) newSelected.delete(folder.id);
                      else newSelected.add(folder.id);
                      setSelectedFolders(newSelected);
                    }}
                  >
                    <div className={cn(
                      "size-4 rounded border flex items-center justify-center transition-all",
                      isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-slate-800 bg-[#0a0a0a] opacity-0 group-hover:opacity-100"
                    )}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  </div>

                  <div className="text-orange-500 mb-2">
                    <FolderOpen size={32} fill="currentColor" fillOpacity={0.3} />
                  </div>
                  <h4 className="text-[10px] font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors w-full break-words">{folder.nome}</h4>
                </motion.div>
              );
            })}
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc, index) => (
              <DocumentCard 
                key={doc.id || `doc-grid-${index}`}
                doc={doc}
                index={index}
                currentFolderId={currentFolderId}
                folders={folders}
                handleViewDocument={handleViewDocument}
                getFileExtension={getFileExtension}
                getFileUrl={getFileUrl}
                activeDocMenu={activeDocMenu}
                setActiveDocMenu={setActiveDocMenu}
                handleSyncToDrive={handleSyncToDrive}
                setDocRenameForm={setDocRenameForm}
                setIsDocRenameModalOpen={setIsDocRenameModalOpen}
                setDocToMove={setDocToMove}
                setTargetFolderId={setTargetFolderId}
                setIsMoveModalOpen={setIsMoveModalOpen}
                handleDeleteDocument={handleDeleteDocument}
                selectedDocs={selectedDocs}
                setSelectedDocs={setSelectedDocs}
              />
            ))
          ) : folders.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <Search size={40} strokeWidth={1} />
                <p className="text-sm font-bold">Nenhum documento encontrado.</p>
              </div>
            </div>
          ) : null}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
