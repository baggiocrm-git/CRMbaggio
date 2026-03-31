'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderOpen, 
  Search
} from 'lucide-react';
import { DocumentRow } from './DocumentRow';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  nome: string;
  Categoria: string;
  area?: string;
  tipo_arquivo: string;
  status: string;
  Ano: string;
  data: string;
  tamanho_arquivo: string;
  file_path: string;
  pasta_id?: string | null;
  drive_file_id?: string | null;
  webViewLink?: string | null;
  is_drive_only?: boolean;
}

interface DocumentListProps {
  currentFolders: any[];
  filteredDocuments: Document[];
  currentFolderId: string;
  folders: any[];
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  toggleSort: (key: any) => void;
  getSortIcon: (key: any) => React.ReactNode;
  handleViewDocument: (doc: Document) => void;
  getFileExtension: (doc: Document) => string;
  getFileUrl: (path?: string) => string;
  activeDocMenu: string | null;
  setActiveDocMenu: (id: string | null) => void;
  handleSyncToDrive: (doc: Document) => void;
  setDocRenameForm: (form: any) => void;
  setIsDocRenameModalOpen: (open: boolean) => void;
  setDocToMove: (doc: Document) => void;
  setTargetFolderId: (id: string) => void;
  setIsMoveModalOpen: (open: boolean) => void;
  handleDeleteDocument: (doc: Document) => void;
  setCurrentPath: React.Dispatch<React.SetStateAction<{id: string, name: string}[]>>;
  setSearchQuery: (query: string) => void;
  setSelectedArea: (area: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedYear: (year: any) => void;
  selectedDocs: Set<string>;
  setSelectedDocs: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFolders: Set<string>;
  setSelectedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function DocumentList({
  currentFolders,
  filteredDocuments,
  currentFolderId,
  folders,
  sortConfig,
  toggleSort,
  getSortIcon,
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
  setSearchQuery,
  setSelectedArea,
  setSelectedStatus,
  setSelectedYear,
  selectedDocs,
  setSelectedDocs,
  selectedFolders,
  setSelectedFolders
}: DocumentListProps) {
  const allSelected = useMemo(() => {
    const allDocIds = filteredDocuments.map(d => d.id);
    const allFolderIds = currentFolders.map(f => f.id);
    return allDocIds.every(id => selectedDocs.has(id)) && allFolderIds.every(id => selectedFolders.has(id)) && (allDocIds.length > 0 || allFolderIds.length > 0);
  }, [filteredDocuments, currentFolders, selectedDocs, selectedFolders]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDocs(new Set());
      setSelectedFolders(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
      setSelectedFolders(new Set(currentFolders.map(f => f.id)));
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl overflow-hidden">
      <div className="overflow-x-hidden overflow-y-auto max-h-[800px] min-h-[280px] custom-scrollbar">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-slate-800/50">
              <th className="px-4 py-4 w-10">
                <div className="flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-slate-700 bg-slate-800 text-[#d4ff3f] focus:ring-[#d4ff3f]/20 cursor-pointer"
                  />
                </div>
              </th>
              <th 
                className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors w-1/2"
                onClick={() => toggleSort('nome')}
              >
                <div className="flex items-center">
                  Documento
                  {getSortIcon('nome')}
                </div>
              </th>
              <th 
                className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('tamanho_arquivo')}
              >
                <div className="flex items-center">
                  Tam
                  {getSortIcon('tamanho_arquivo')}
                </div>
              </th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            <AnimatePresence mode='popLayout'>
              {currentFolders.map((folder, idx) => (
                <motion.tr
                  key={folder.id ? `folder-row-${folder.id}-${idx}` : `folder-row-idx-${idx}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group hover:bg-white/5 transition-colors cursor-pointer",
                    selectedFolders.has(folder.id) && "bg-[#d4ff3f]/5"
                  )}
                  onClick={() => {
                    if (folder.id && folder.id !== '') {
                      setCurrentPath(prev => [...prev, { id: folder.id, name: folder.nome }]);
                    }
                  }}
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedFolders.has(folder.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedFolders);
                          if (e.target.checked) newSelected.add(folder.id);
                          else newSelected.delete(folder.id);
                          setSelectedFolders(newSelected);
                        }}
                        className="size-4 rounded border-slate-700 bg-slate-800 text-[#d4ff3f] focus:ring-[#d4ff3f]/20 cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="text-orange-500">
                        <FolderOpen size={20} fill="currentColor" fillOpacity={0.3} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">{folder.nome}</h4>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2"><p className="text-xs font-bold text-slate-400 uppercase">-</p></td>
                  <td className="px-4 py-2"></td>
                </motion.tr>
              ))}
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc, index) => (
                  <DocumentRow 
                    key={doc.id || `doc-${index}`}
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
                <tr>
                  <td colSpan={currentFolderId === 'root' ? 4 : 3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Search size={40} strokeWidth={1} />
                      <p className="text-sm font-bold">Nenhum documento encontrado com estes filtros.</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedArea('Todas');
                          setSelectedStatus('Todos');
                          setSelectedYear('Todos');
                          setCurrentPath([{id: 'root', name: 'Drive Root'}]);
                        }}
                        className="text-[#d4ff3f] text-xs font-black uppercase tracking-widest hover:underline"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      {/* Footer / Pagination Info */}
      <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#1a1a1a] sticky bottom-0 z-10">
        <p>Mostrando {filteredDocuments.length} documentos</p>
        <div className="flex items-center gap-4">
          <button className="hover:text-white transition-colors disabled:opacity-30" disabled>Anterior</button>
          <div className="flex items-center gap-2">
            <span className="text-white bg-white/5 px-2 py-1 rounded">1</span>
          </div>
          <button className="hover:text-white transition-colors disabled:opacity-30" disabled>Próximo</button>
        </div>
      </div>
    </div>
  );
}
