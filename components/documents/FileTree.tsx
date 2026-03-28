'use client';

import React, { useState } from 'react';
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  MoreVertical,
  Edit2,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface FileSystemItem {
  id: string;
  nome: string;
  type: 'file' | 'folder';
  parent_id?: string | null;
  children?: FileSystemItem[];
  isOpen?: boolean;
}

interface FileTreeProps {
  data: FileSystemItem[];
  selectedId?: string | null;
  onItemClick?: (item: FileSystemItem) => void;
  onRename?: (item: FileSystemItem) => void;
  onNewFolder?: (parentId: string | null) => void;
  onDelete?: (item: FileSystemItem) => void;
}

export function FileTree({ data, selectedId, onItemClick, onRename, onNewFolder, onDelete }: FileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderItem = (item: FileSystemItem, depth: number = 0) => {
    const isFolder = item.type === 'folder';
    if (!isFolder) return null; // Show only folders in the tree

    const isOpen = openFolders[item.id];
    const isSelected = selectedId === item.id;

    return (
      <div key={item.id || `folder-${item.nome}-${depth}`} className="select-none">
        <div
          onClick={() => {
            onItemClick?.(item);
            setOpenFolders(prev => ({ ...prev, [item.id]: !prev[item.id] }));
          }}
          className={cn(
            "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all border border-transparent relative",
            isSelected ? "bg-[#d4ff3f]/10 border-[#d4ff3f]/20 text-[#d4ff3f]" : "hover:bg-white/5 text-slate-400 hover:text-slate-200",
            "active:scale-[0.98]"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id, e);
              }}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            <Folder 
              size={18} 
              className={cn(
                "transition-colors",
                isOpen ? "text-[#d4ff3f] fill-[#d4ff3f]/10" : "text-slate-500"
              )} 
            />
            <span className="text-xs font-medium truncate">
              {item.nome}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === item.id ? null : item.id);
                }}
                className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <MoreVertical size={14} />
              </button>
              
              <AnimatePresence>
                {activeMenu === item.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(null);
                      }} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-1 z-20 w-40 bg-[#1a1a1a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-1"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(null);
                          onNewFolder?.(item.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#d4ff3f] hover:bg-white/5 rounded-lg transition-all"
                      >
                        <Plus size={12} />
                        Nova Pasta
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(null);
                          onRename?.(item);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <Edit2 size={12} />
                        Renomear
                      </button>
                      <div className="h-px bg-slate-800 my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(null);
                          onDelete?.(item);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={12} />
                        Excluir
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && item.children && item.children.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {item.children.map(child => renderItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      <div
        onClick={() => onItemClick?.({ id: 'root', nome: 'Todos os Documentos', type: 'folder' })}
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all border border-transparent",
          selectedId === 'root' ? "bg-[#d4ff3f]/10 border-[#d4ff3f]/20 text-[#d4ff3f]" : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
        )}
      >
        <Folder size={18} className={selectedId === 'root' ? "text-[#d4ff3f]" : "text-slate-500"} />
        <span className="text-xs font-medium">Todos os Documentos</span>
      </div>
      {data.map((item) => renderItem(item, 0))}
    </div>
  );
}
