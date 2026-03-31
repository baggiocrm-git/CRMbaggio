'use client';

import React from 'react';
import { FileTree, FileSystemItem } from '@/components/documents/FileTree';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  folderTree: any[];
  currentFolderId: string;
  setCurrentPath: React.Dispatch<React.SetStateAction<{id: string, name: string}[]>>;
  allFolders: any[];
  folders: any[];
  setFolderForm: (form: any) => void;
  setIsFolderModalOpen: (open: boolean) => void;
  handleDeleteFolder: (folder: FileSystemItem) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedYear: number | 'Todos';
  setSelectedYear: (year: any) => void;
  connectedAccount: string | null;
  documentsCount: number;
  foldersCount: number;
  AREAS: string[];
  STATUSES: string[];
  YEARS: number[];
}

export function DocumentSidebar({
  folderTree,
  currentFolderId,
  setCurrentPath,
  allFolders,
  folders,
  setFolderForm,
  setIsFolderModalOpen,
  handleDeleteFolder,
  selectedArea,
  setSelectedArea,
  selectedStatus,
  setSelectedStatus,
  selectedYear,
  setSelectedYear,
  connectedAccount,
  documentsCount,
  foldersCount,
  AREAS,
  STATUSES,
  YEARS
}: DocumentSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-3xl p-6 space-y-6 flex flex-col h-full min-h-[600px]">
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Navegação</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <FileTree 
              data={folderTree}
              selectedId={currentFolderId}
              onItemClick={(item) => {
                if (item.id === 'root') {
                  setCurrentPath([{id: 'root', name: 'Drive Root'}]);
                } else {
                  const path: {id: string, name: string}[] = [];
                  let current = allFolders.find(f => f.id === item.id) || folders.find(f => f.id === item.id);
                  while (current) {
                    path.unshift({id: current.id, name: current.nome});
                    const parent = allFolders.find(f => f.id === current.parent_id);
                    current = parent;
                  }
                  path.unshift({id: 'root', name: 'Drive Root'});
                  setCurrentPath(path);
                }
              }}
              onNewFolder={(parentId) => {
                setFolderForm({ id: '', nome: '', parent_id: parentId, mode: 'create' });
                setIsFolderModalOpen(true);
              }}
              onRename={(item) => {
                setFolderForm({ id: item.id, nome: item.nome, parent_id: item.parent_id || null, mode: 'edit' });
                setIsFolderModalOpen(true);
              }}
              onDelete={(item) => handleDeleteFolder(item)}
            />
          </div>
        </div>

        <div className="h-px bg-slate-800/50" />

        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Status da Conexão</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Supabase:</span>
              <span className="text-[8px] font-bold text-emerald-500 uppercase">Ativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Google Drive:</span>
              <span className={cn(
                "text-[8px] font-bold uppercase",
                connectedAccount ? "text-emerald-500" : "text-rose-500"
              )}>
                {connectedAccount ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Arquivos:</span>
              <span className="text-[8px] font-bold text-white uppercase">{documentsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Pastas:</span>
              <span className="text-[8px] font-bold text-white uppercase">{foldersCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
