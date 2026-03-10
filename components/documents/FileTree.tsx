'use client';

import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface FileSystemItem {
  id: string;
  nome: string;
  type: 'file' | 'folder';
  children?: FileSystemItem[];
  isOpen?: boolean;
}

interface FileTreeProps {
  initialData: FileSystemItem[];
  onItemClick?: (item: FileSystemItem) => void;
  onMoveItem?: (sourceId: string, targetId: string | null) => void;
}

export function FileTree({ initialData, onItemClick, onMoveItem }: FileTreeProps) {
  const [data, setData] = useState<FileSystemItem[]>(initialData);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    const updateItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    setData(updateItems(data));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'folder' && item.id !== draggedItemId) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (sourceId === targetId) return;
    
    // Check if target is not a descendant of source
    const isDescendant = (parent: FileSystemItem, targetId: string): boolean => {
      if (!parent.children) return false;
      return parent.children.some(child => child.id === targetId || isDescendant(child, targetId));
    };

    const findItem = (items: FileSystemItem[], id: string): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const sourceItem = findItem(data, sourceId);
    if (sourceItem && targetId && isDescendant(sourceItem, targetId)) {
      console.warn('Cannot move a folder into its own descendant');
      return;
    }

    if (onMoveItem) {
      onMoveItem(sourceId, targetId);
    }

    // Local update for immediate feedback
    const moveItem = (items: FileSystemItem[], sId: string, tId: string | null): FileSystemItem[] => {
      let itemToMove: FileSystemItem | null = null;

      // Remove item from its current position
      const removeItem = (list: FileSystemItem[]): FileSystemItem[] => {
        return list.filter(item => {
          if (item.id === sId) {
            itemToMove = item;
            return false;
          }
          if (item.children) {
            item.children = removeItem(item.children);
          }
          return true;
        });
      };

      const newList = removeItem([...items]);

      if (!itemToMove) return newList;

      // Add item to its new position
      if (tId === null) {
        return [...newList, itemToMove];
      }

      const addItem = (list: FileSystemItem[]): FileSystemItem[] => {
        return list.map(item => {
          if (item.id === tId && item.type === 'folder') {
            return {
              ...item,
              children: [...(item.children || []), itemToMove!],
              isOpen: true
            };
          }
          if (item.children) {
            return { ...item, children: addItem(item.children) };
          }
          return item;
        });
      };

      return addItem(newList);
    };

    setData(moveItem(data, sourceId, targetId));
    setDraggedItemId(null);
  };

  const renderItem = (item: FileSystemItem, depth: number = 0) => {
    const isFolder = item.type === 'folder';
    const isDragged = draggedItemId === item.id;

    return (
      <div key={item.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item)}
          onDrop={(e) => handleDrop(e, isFolder ? item.id : null)}
          onClick={() => {
            if (isFolder) toggleFolder(item.id);
            if (onItemClick) onItemClick(item);
          }}
          className={cn(
            "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all border border-transparent",
            isDragged ? "opacity-40 bg-white/5 border-dashed border-slate-700" : "hover:bg-white/5",
            "active:scale-[0.98]"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isFolder ? (
              <>
                <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
                  {item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <Folder 
                  size={18} 
                  className={cn(
                    "transition-colors",
                    item.isOpen ? "text-[#d4ff3f] fill-[#d4ff3f]/10" : "text-slate-400"
                  )} 
                />
              </>
            ) : (
              <>
                <div className="w-[14px]" /> {/* Spacer for alignment */}
                <File size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
              </>
            )}
            <span className={cn(
              "text-xs font-medium truncate",
              isFolder ? "text-slate-200" : "text-slate-400 group-hover:text-slate-200"
            )}>
              {item.nome}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isFolder && item.isOpen && item.children && (
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
    <div 
      className="space-y-0.5"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => handleDrop(e, null)}
    >
      {data.map(item => renderItem(item))}
    </div>
  );
}
