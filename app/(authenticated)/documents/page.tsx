'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Move,
  Edit2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  Sparkles,
  Loader2,
  Mic,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/auth-fetch';
import { FileTree, FileSystemItem } from '@/components/documents/FileTree';
import { DocumentModals } from '@/components/documents/DocumentModals';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { DocumentSidebar } from '@/components/documents/DocumentSidebar';

import { useDocuments, Document, Folder } from '@/hooks/useDocuments';

type SortKey = 'nome' | 'tamanho_arquivo' | 'data' | 'Ano' | 'folder';

// Types
type DocumentCategory = 
  | 'Geral' 
  | 'Projetos' 
  | 'Outros';

type DocumentStatus = 'Vigente' | 'Vencido' | 'Arquivado';

const CATEGORIES: DocumentCategory[] = [
  'Geral',
  'Projetos',
  'Outros'
];

const AREAS = ['Todas', 'Engenharia', 'Obras', 'Outros'];
const STATUSES = ['Todos', 'Vigente', 'Vencido', 'Arquivado'];
const YEARS = [2026, 2025, 2024, 2023];

export default function DocumentManagementPage() {
  const localDocumentHelperUrl = 'http://127.0.0.1:43125';
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>('Todos');
  const [currentPath, setCurrentPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Todos os Documentos'}]);
  const currentFolderId = currentPath[currentPath.length - 1].id;
  
  const { 
    documents, 
    setDocuments, 
    folders, 
    setFolders, 
    allFolders, 
    setAllFolders, 
    isLoading, 
    setIsLoading, 
    fetchDocuments, 
    folderTree 
  } = useDocuments(currentFolderId);

  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [isServiceAccount, setIsServiceAccount] = useState(false);
  const [isLocalHelperConnected, setIsLocalHelperConnected] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  }>({ key: 'data', direction: 'desc' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState(false);
  const [docRenameForm, setDocRenameForm] = useState({ id: '', nome: '' });
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [docToMove, setDocToMove] = useState<Document | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | 'root'>('root');
  const [activeDocMenu, setActiveDocMenu] = useState<string | null>(null);
  
  // Multi-select State
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Notification State
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };
  
  // Form State
  const [newDoc, setNewDoc] = useState({
    name: '',
    pasta_id: 'root' as string | 'root',
    file: null as File | null
  });
  const [uploadFolderHistory, setUploadFolderHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Raiz'}]);
  const currentUploadFolderId = uploadFolderHistory[uploadFolderHistory.length - 1].id;

  const uploadFolders = useMemo(() => {
    const source = allFolders.length > 0 ? allFolders : folders;
    return source.filter(f => {
      if (currentUploadFolderId === 'root') return !f.parent_id || f.parent_id === 'root';
      return f.parent_id === currentUploadFolderId;
    });
  }, [allFolders, folders, currentUploadFolderId]);

  const [folderForm, setFolderForm] = useState({
    id: '',
    nome: '',
    parent_id: null as string | null,
    mode: 'create' as 'create' | 'edit'
  });
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);
  const [isGeneratingAiDocument, setIsGeneratingAiDocument] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListeningToAiPrompt, setIsListeningToAiPrompt] = useState(false);
  const [aiDocForm, setAiDocForm] = useState({
    name: '',
    documentType: 'livre',
    category: 'Geral' as DocumentCategory,
    format: 'markdown' as 'markdown' | 'text' | 'docx',
    pasta_id: 'root' as string | 'root',
    prompt: '',
  });
  const aiSpeechRecognitionRef = useRef<{
    start: () => void;
    stop: () => void;
    abort?: () => void;
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
    onresult?: ((event: {
      resultIndex: number;
      results: ArrayLike<ArrayLike<{ transcript: string }>>;
    }) => void) | null;
    onerror?: ((event: { error?: string }) => void) | null;
    onend?: (() => void) | null;
  } | null>(null);

  useEffect(() => {
    if (newDoc.file && !newDoc.name) {
      setNewDoc(prev => ({ ...prev, name: prev.file?.name?.split('.')[0] || '' }));
    }
  }, [newDoc.file, newDoc.name]);

  useEffect(() => {
    if (isModalOpen) {
      setUploadFolderHistory(currentPath);
      setNewDoc(prev => ({ ...prev, pasta_id: currentFolderId }));
    }
  }, [isModalOpen, currentPath, currentFolderId]);

  useEffect(() => {
    if (isAiGenerateModalOpen) {
      setAiDocForm((prev) => ({
        ...prev,
        pasta_id: currentFolderId,
      }));
    }
  }, [isAiGenerateModalOpen, currentFolderId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const speechWindow = window as Window & {
      SpeechRecognition?: new () => {
        start: () => void;
        stop: () => void;
        abort?: () => void;
        continuous?: boolean;
        interimResults?: boolean;
        lang?: string;
        onresult?: ((event: {
          resultIndex: number;
          results: ArrayLike<ArrayLike<{ transcript: string }>>;
        }) => void) | null;
        onerror?: ((event: { error?: string }) => void) | null;
        onend?: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        start: () => void;
        stop: () => void;
        abort?: () => void;
        continuous?: boolean;
        interimResults?: boolean;
        lang?: string;
        onresult?: ((event: {
          resultIndex: number;
          results: ArrayLike<ArrayLike<{ transcript: string }>>;
        }) => void) | null;
        onerror?: ((event: { error?: string }) => void) | null;
        onend?: (() => void) | null;
      };
    };

    const RecognitionConstructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!RecognitionConstructor) {
      setIsVoiceSupported(false);
      aiSpeechRecognitionRef.current = null;
      return;
    }

    setIsVoiceSupported(true);
    const recognition = new RecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || '';
      }

      const cleanedTranscript = transcript.trim();
      if (!cleanedTranscript) return;

      setAiDocForm((prev) => ({
        ...prev,
        prompt: prev.prompt.trim() ? `${prev.prompt.trim()} ${cleanedTranscript}`.trim() : cleanedTranscript,
      }));
    };

    recognition.onerror = (event) => {
      setIsListeningToAiPrompt(false);
      if (event?.error && event.error !== 'no-speech' && event.error !== 'aborted') {
        showNotification(`Microfone: ${event.error}`, 'error');
      }
    };

    recognition.onend = () => {
      setIsListeningToAiPrompt(false);
    };

    aiSpeechRecognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort?.();
      aiSpeechRecognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isAiGenerateModalOpen && isListeningToAiPrompt) {
      aiSpeechRecognitionRef.current?.stop();
      setIsListeningToAiPrompt(false);
    }
  }, [isAiGenerateModalOpen, isListeningToAiPrompt]);

  const fetchFolders = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const response = await authFetch('/api/auth/google/status');
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Falha ao verificar Google Drive (${response.status}). ${responseText.slice(0, 120)}`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao verificar Google Drive.');
      }

      if (data.connected) {
        setConnectedAccount(data.email);
        setIsServiceAccount(data.isServiceAccount || false);
      } else {
        setConnectedAccount(null);
        setIsServiceAccount(false);
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        showNotification('Google Drive conectado com sucesso!', 'success');
        fetchAuthStatus();
        fetchDocuments();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        showNotification(`Erro ao conectar: ${event.data.message}`, 'error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchAuthStatus, fetchDocuments]);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  const checkLocalDocumentHelper = useCallback(async () => {
    try {
      const response = await fetch(`${localDocumentHelperUrl}/health`);
      if (!response.ok) {
        setIsLocalHelperConnected(false);
        return;
      }

      const payload = await response.json().catch(() => null);
      setIsLocalHelperConnected(Boolean(payload?.ok));
    } catch {
      setIsLocalHelperConnected(false);
    }
  }, []);

  useEffect(() => {
    checkLocalDocumentHelper();
    const intervalId = window.setInterval(checkLocalDocumentHelper, 15000);
    return () => window.clearInterval(intervalId);
  }, [checkLocalDocumentHelper]);

  const currentFolders = useMemo(() => {
    return folders;
  }, [folders]);

  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      const matchesSearch = doc.nome.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArea = selectedArea === 'Todas' || doc.area === selectedArea;
      const matchesStatus = selectedStatus === 'Todos' || doc.status === selectedStatus;
      const matchesYear = selectedYear === 'Todos' || Number(doc.Ano) === selectedYear;
      
      return matchesSearch && matchesArea && matchesStatus && matchesYear;
    });

    return [...filtered].sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      if (sortConfig.key === 'folder') {
        aValue = folders.find(f => f.id === a.pasta_id)?.nome || 'Raiz';
        bValue = folders.find(f => f.id === b.pasta_id)?.nome || 'Raiz';
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, searchQuery, selectedArea, selectedStatus, selectedYear, sortConfig, folders]);

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={10} className="ml-1" /> : <ArrowDown size={10} className="ml-1" />;
  };

  const getFileExtension = (doc: Document) => {
    if (doc?.nome) {
      const nameParts = String(doc.nome).split('.');
      if (nameParts.length > 1) {
        return `.${nameParts.pop()?.toLowerCase()}`;
      }
    }
    
    if (doc?.file_path) {
      const pathParts = String(doc.file_path).split('.');
      if (pathParts.length > 1) {
        return `.${pathParts.pop()?.toLowerCase()}`;
      }
    }

    if (doc?.tipo_arquivo) {
      const tipo = String(doc.tipo_arquivo);
      if (tipo.includes('pdf')) return '.pdf';
      if (tipo.includes('word') || tipo.includes('officedocument.wordprocessingml')) return '.docx';
      if (tipo.includes('excel') || tipo.includes('officedocument.spreadsheetml')) return '.xlsx';
      if (tipo.includes('image/jpeg')) return '.jpg';
      if (tipo.includes('image/png')) return '.png';
      if (tipo.includes('text/plain')) return '.txt';
    }
    
    return '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', newDoc.file);
      formData.append('name', newDoc.name || newDoc.file.name.split('.').slice(0, -1).join('.'));
      if (newDoc.pasta_id !== 'root') {
        formData.append('pasta_id', newDoc.pasta_id);
      }

      setUploadProgress(30);

      const response = await authFetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const result = await response.json();
      setUploadProgress(100);

      if (result.driveError) {
        showNotification(`Documento salvo no Supabase, mas erro no Google Drive: ${result.driveError}`, 'error');
      } else {
        showNotification('Documento enviado com sucesso');
      }
      
      fetchDocuments();

      setNewDoc({
        name: '',
        pasta_id: currentFolderId,
        file: null
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Upload error:', error);
      showNotification(message, 'error');
      setIsUploading(false);
    }
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = folderForm.mode === 'create' ? '/api/folders' : `/api/folders/${folderForm.id}`;
      const method = folderForm.mode === 'create' ? 'POST' : 'PATCH';
      
      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: folderForm.nome,
          parent_id: folderForm.parent_id
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar pasta');
      
      setIsFolderModalOpen(false);
      fetchFolders();
      showNotification(folderForm.id ? 'Pasta atualizada com sucesso' : 'Pasta criada com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification(message, 'error');
    }
  };

  const handleDeleteFolder = async (folder: FileSystemItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Pasta',
      message: `Deseja realmente excluir a pasta "${folder.nome}"? Isso não excluirá os arquivos dentro dela, mas eles ficarão sem pasta.`,
      onConfirm: async () => {
        try {
          const response = await authFetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Erro ao excluir pasta');
          fetchFolders();
          if (currentFolderId === folder.id) setCurrentPath([{id: 'root', name: 'Drive Root'}]);
          showNotification('Pasta excluída com sucesso');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          showNotification(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRenameDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authFetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docRenameForm.id, nome: docRenameForm.nome }),
      });

      if (!response.ok) throw new Error('Falha ao renomear documento');

      setDocuments(docs => docs.map(d => d.id === docRenameForm.id ? { ...d, nome: docRenameForm.nome } : d));
      setIsDocRenameModalOpen(false);
      showNotification('Documento renomeado com sucesso');
    } catch (error) {
      console.error('Error renaming document:', error);
      showNotification('Erro ao renomear documento', 'error');
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Documento',
      message: `Deseja realmente excluir o documento "${doc.nome}"?`,
      onConfirm: async () => {
        try {
          const response = await authFetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Erro ao excluir documento');
          fetchDocuments();
          showNotification('Documento excluído com sucesso');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          showNotification(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSyncToDrive = async (doc: Document) => {
    try {
      showNotification('Sincronizando com Drive...', 'info');
      const response = await authFetch('/api/documents/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao sincronizar');
      }

      const result = await response.json();
      showNotification('Sincronizado com sucesso', 'success');
      fetchDocuments(); // Refresh to show the Drive icon
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification(message, 'error');
    }
  };

  const handleMoveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToMove || !targetFolderId) return;

    try {
      const response = await authFetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: docToMove.id, 
          pasta_id: targetFolderId === 'root' ? null : targetFolderId 
        }),
      });

      if (!response.ok) throw new Error('Falha ao mover documento');

      setIsMoveModalOpen(false);
      showNotification('Documento movido com sucesso');
      fetchDocuments();
    } catch (error) {
      console.error('Error moving document:', error);
      showNotification('Erro ao mover documento', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocs.size === 0 && selectedFolders.size === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Selecionados',
      message: `Deseja realmente excluir ${selectedDocs.size} documentos e ${selectedFolders.size} pastas selecionados?`,
      onConfirm: async () => {
        try {
          // Delete Documents
          for (const docId of selectedDocs) {
            await authFetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
          }
          // Delete Folders
          for (const folderId of selectedFolders) {
            await authFetch(`/api/folders/${folderId}`, { method: 'DELETE' });
          }
          
          setSelectedDocs(new Set());
          setSelectedFolders(new Set());
          fetchDocuments();
          showNotification('Itens excluídos com sucesso');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          showNotification(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleGenerateAiDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isListeningToAiPrompt) {
      aiSpeechRecognitionRef.current?.stop();
      setIsListeningToAiPrompt(false);
    }
    if (!aiDocForm.name.trim() || !aiDocForm.prompt.trim()) {
      showNotification('Preencha o nome do arquivo e as instruções da IA.', 'error');
      return;
    }

    try {
      setIsGeneratingAiDocument(true);
      const response = await authFetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiDocForm),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Falha ao gerar documento por IA.');
      }

      showNotification('Documento gerado com IA e salvo com sucesso.');
      setIsAiGenerateModalOpen(false);
      setAiDocForm({
        name: '',
        documentType: 'livre',
        category: 'Geral',
        format: 'markdown',
        pasta_id: currentFolderId,
        prompt: '',
      });
      fetchDocuments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao gerar documento.';
      showNotification(message, 'error');
    } finally {
      setIsGeneratingAiDocument(false);
    }
  };

  const toggleAiVoiceInput = () => {
    if (!isVoiceSupported || !aiSpeechRecognitionRef.current) {
      showNotification('Microfone não suportado neste navegador.', 'error');
      return;
    }

    if (isListeningToAiPrompt) {
      aiSpeechRecognitionRef.current.stop();
      setIsListeningToAiPrompt(false);
      return;
    }

    try {
      aiSpeechRecognitionRef.current.start();
      setIsListeningToAiPrompt(true);
    } catch {
      showNotification('Não foi possível iniciar o microfone agora.', 'error');
      setIsListeningToAiPrompt(false);
    }
  };


  const getFileUrl = (path?: string) => {
    if (!path) return '#';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/documentos/${path}`;
  };

  const openDocumentWithWindowsHelper = useCallback(async (doc: Document) => {
    if (!doc.file_path) return false;

    const url = getFileUrl(doc.file_path);
    if (!url || url === '#') return false;

    const response = await fetch(`${localDocumentHelperUrl}/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        filename: doc.nome,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || 'Helper local indisponível.');
    }

    return true;
  }, []);

  const handleViewDocument = async (doc: Document) => {
    if (!doc.is_drive_only && doc.file_path) {
      try {
        await openDocumentWithWindowsHelper(doc);
        setIsLocalHelperConnected(true);
        showNotification('Arquivo aberto no programa padrão do Windows.');
        return;
      } catch (error) {
        console.error('Windows helper error:', error);
        setIsLocalHelperConnected(false);
        showNotification('Helper local não encontrado. Inicie `npm run documents-helper` para abrir no Windows.', 'error');
      }
    }

    if (doc.webViewLink) {
      window.open(doc.webViewLink, '_blank');
    } else {
      const url = getFileUrl(doc.file_path);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Documentos</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Repositório Central de Arquivos</p>
          </div>

          {/* Google Drive Connection Status - Moved Here */}
          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-3 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-all",
                connectedAccount ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800/50 text-slate-500"
              )}>
                <Image 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  width={16} 
                  height={16} 
                  className={cn("rounded-full", !connectedAccount && "grayscale opacity-50")}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronização Google Drive</h4>
                <p className="text-[10px] font-bold text-white">
                  {connectedAccount ? connectedAccount : 'Não configurado'}
                </p>
              </div>
            </div>
            {!isServiceAccount && (
              <button 
                onClick={async () => {
                  try {
                    const res = await authFetch('/api/auth/google/url');
                    const contentType = res.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                      const responseText = await res.text();
                      throw new Error(`Falha ao iniciar conexão com Google (${res.status}). ${responseText.slice(0, 120)}`);
                    }

                    const { url, error } = await res.json();
                    if (!res.ok || !url) {
                      throw new Error(error || 'Não foi possível iniciar a autenticação com Google.');
                    }

                    window.open(url, 'google_auth', 'width=600,height=700');
                  } catch (error) {
                    console.error('Erro ao conectar Google Drive:', error);
                    showNotification(error instanceof Error ? error.message : 'Erro ao conectar Google Drive.', 'error');
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border",
                  connectedAccount 
                    ? "bg-white/5 border-slate-800/50 text-slate-400 hover:text-white hover:bg-white/10" 
                    : "bg-[#d4ff3f] border-[#d4ff3f] text-[#0a0a0a] hover:bg-[#c4ef2f]"
                )}
              >
                {connectedAccount ? 'Alterar' : 'Conectar'}
              </button>
            )}
            {isServiceAccount && (
              <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ativa</span>
              </div>
            )}
          </div>

          <div className="bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-3 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center transition-all",
                  isLocalHelperConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                )}
              >
                <FolderOpen size={16} />
              </div>
              <div>
                <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Helper Local Windows</h4>
                <p className="text-[10px] font-bold text-white">
                  {isLocalHelperConnected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={checkLocalDocumentHelper}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border",
                isLocalHelperConnected
                  ? "bg-white/5 border-slate-800/50 text-slate-400 hover:text-white hover:bg-white/10"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
              )}
            >
              Verificar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(selectedDocs.size > 0 || selectedFolders.size > 0) && (
            <button 
              onClick={handleDeleteSelected}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-rose-500/10 active:scale-95"
            >
              <Trash2 size={18} />
              Excluir ({selectedDocs.size + selectedFolders.size})
            </button>
          )}
          <button 
            onClick={() => setIsAiGenerateModalOpen(true)}
            className="bg-[#1a1a1a] hover:bg-[#222222] text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-800/50"
          >
            <Sparkles size={18} />
            Gerar com IA
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-[#d4ff3f]/10 active:scale-95"
          >
            <Upload size={18} />
            Upload para Drive
          </button>
        </div>
      </div>

      <DocumentModals 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        newDoc={newDoc}
        setNewDoc={setNewDoc}
        handleUpload={handleUpload}
        uploadFolderHistory={uploadFolderHistory}
        setUploadFolderHistory={setUploadFolderHistory}
        uploadFolders={uploadFolders}
        isDocRenameModalOpen={isDocRenameModalOpen}
        setIsDocRenameModalOpen={setIsDocRenameModalOpen}
        docRenameForm={docRenameForm}
        setDocRenameForm={setDocRenameForm}
        handleRenameDocument={handleRenameDocument}
        isMoveModalOpen={isMoveModalOpen}
        setIsMoveModalOpen={setIsMoveModalOpen}
        docToMove={docToMove}
        targetFolderId={targetFolderId}
        setTargetFolderId={setTargetFolderId}
        allFolders={allFolders}
        folders={folders}
        handleMoveDocument={handleMoveDocument}
        isFolderModalOpen={isFolderModalOpen}
        setIsFolderModalOpen={setIsFolderModalOpen}
        folderForm={folderForm}
        setFolderForm={setFolderForm}
        handleFolderSubmit={handleFolderSubmit}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
      />

      <AnimatePresence>
        {isAiGenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGeneratingAiDocument && setIsAiGenerateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl rounded-[32px] border border-slate-800/50 bg-[#1a1a1a] p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Gerar Documento com IA</h2>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    OpenRouter compatível com OpenAI integrado ao módulo de documentos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isGeneratingAiDocument && setIsAiGenerateModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleGenerateAiDocument} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Arquivo</label>
                    <input
                      type="text"
                      value={aiDocForm.name}
                      onChange={(e) => setAiDocForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                      placeholder="Ex.: comunicado-cliente-abril"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Documento</label>
                    <select
                      value={aiDocForm.documentType}
                      onChange={(e) => setAiDocForm((prev) => ({ ...prev, documentType: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                    >
                      <option value="livre">Livre</option>
                      <option value="oficio">Ofício</option>
                      <option value="comunicado">Comunicado</option>
                      <option value="ata">Ata</option>
                      <option value="relatorio">Relatório</option>
                      <option value="contrato">Minuta contratual</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</label>
                    <select
                      value={aiDocForm.category}
                      onChange={(e) => setAiDocForm((prev) => ({ ...prev, category: e.target.value as DocumentCategory }))}
                      className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Formato</label>
                    <select
                      value={aiDocForm.format}
                      onChange={(e) => setAiDocForm((prev) => ({ ...prev, format: e.target.value as 'markdown' | 'text' | 'docx' }))}
                      className="w-full rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                    >
                      <option value="markdown">Markdown (.md)</option>
                      <option value="text">Texto (.txt)</option>
                      <option value="docx">Word (.docx)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Instruções para a IA</label>
                    <button
                      type="button"
                      onClick={toggleAiVoiceInput}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                        isListeningToAiPrompt
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                          : "border-slate-800/50 bg-[#0a0a0a] text-slate-300 hover:border-[#d4ff3f]/30 hover:text-[#d4ff3f]"
                      )}
                      title={isVoiceSupported ? 'Ditado por voz com microfone' : 'Microfone não suportado neste navegador'}
                    >
                      {isListeningToAiPrompt ? <Square size={12} /> : <Mic size={12} />}
                      {isListeningToAiPrompt ? 'Parar microfone' : 'Falar com microfone'}
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={aiDocForm.prompt}
                    onChange={(e) => setAiDocForm((prev) => ({ ...prev, prompt: e.target.value }))}
                    className="w-full resize-none rounded-2xl border border-slate-800/50 bg-[#0a0a0a] px-4 py-3 text-sm leading-relaxed text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/20"
                    placeholder="Descreva o documento que a IA deve gerar. Ex.: Crie um comunicado formal informando paralisação da obra por chuva intensa entre 10 e 12 de abril, com orientação para remarcação do cronograma."
                  />
                  <p className="mt-2 ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {isVoiceSupported
                      ? isListeningToAiPrompt
                        ? 'Microfone ativo. Fale normalmente para preencher as instruções.'
                        : 'Você também pode ditar o comando de voz pelo microfone.'
                      : 'Seu navegador não oferece suporte ao ditado por voz nesta tela.'}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAiGenerateModalOpen(false)}
                    disabled={isGeneratingAiDocument}
                    className="flex-1 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingAiDocument}
                    className="flex-1 rounded-2xl bg-[#d4ff3f] px-6 py-4 text-xs font-black uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#c4ef2f] disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      {isGeneratingAiDocument ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isGeneratingAiDocument ? 'Gerando...' : 'Gerar Documento'}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>




        {/* Notification Toast */}
        <AnimatePresence>
          {notification.show && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={cn(
                "fixed bottom-8 left-1/2 z-[70] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]",
                notification.type === 'success'
                  ? "bg-emerald-500 text-white"
                  : notification.type === 'info'
                    ? "bg-blue-500 text-white"
                    : "bg-rose-500 text-white"
              )}
            >
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <DocumentSidebar 
          folderTree={folderTree}
          currentFolderId={currentFolderId}
          setCurrentPath={setCurrentPath}
          allFolders={allFolders}
          folders={folders}
          setFolderForm={setFolderForm}
          setIsFolderModalOpen={setIsFolderModalOpen}
          handleDeleteFolder={handleDeleteFolder}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          connectedAccount={connectedAccount}
          documentsCount={documents.length}
          foldersCount={folders.length}
          AREAS={AREAS}
          STATUSES={STATUSES}
          YEARS={YEARS}
        />

        {/* Document List Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Google Drive Connection Status - MOVED UP */}

          {/* Search and View Options */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {currentPath.map((crumb, index) => (
                <React.Fragment key={crumb.id ? `crumb-${crumb.id}-${index}` : `crumb-idx-${index}`}>
                  <button
                    onClick={() => {
                      if (index < currentPath.length - 1) {
                        setCurrentPath(prev => prev.slice(0, index + 1));
                      }
                    }}
                    className={cn(
                      "text-xs font-bold whitespace-nowrap transition-colors",
                      index === currentPath.length - 1 ? "text-white" : "text-slate-500 hover:text-[#d4ff3f]"
                    )}
                  >
                    {crumb.name}
                  </button>
                  {index < currentPath.length - 1 && (
                    <span className="text-slate-700">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar documentos por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-slate-800/50 rounded-2xl py-3 pl-12 pr-4 text-white font-bold text-sm focus:ring-2 focus:ring-[#d4ff3f]/20 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-1">
                <select 
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-');
                    setSortConfig({ 
                      key: key as SortKey, 
                      direction: direction as 'asc' | 'desc' 
                    });
                  }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 outline-none cursor-pointer hover:text-white transition-colors"
                >
                  <option value="nome-asc">Nome (A-Z)</option>
                  <option value="nome-desc">Nome (Z-A)</option>
                  <option value="data-desc">Data (Mais Recente)</option>
                  <option value="data-asc">Data (Mais Antigo)</option>
                  {currentFolderId === 'root' && <option value="folder-asc">Pasta</option>}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-800/50 rounded-2xl p-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    viewMode === 'list' ? "bg-[#0a0a0a] text-[#d4ff3f] shadow-inner" : "text-slate-500 hover:text-white"
                  )}
                  title="Visualização em Lista"
                >
                  <ListIcon size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    viewMode === 'grid' ? "bg-[#0a0a0a] text-[#d4ff3f] shadow-inner" : "text-slate-500 hover:text-white"
                  )}
                  title="Visualização em Grade"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Documents View */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-slate-800/50 rounded-3xl">
              <div className="size-12 border-4 border-[#d4ff3f]/20 border-t-[#d4ff3f] rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Carregando Documentos...</p>
            </div>
          ) : viewMode === 'list' ? (
            <DocumentList 
              currentFolders={currentFolders}
              filteredDocuments={filteredDocuments}
              currentFolderId={currentFolderId}
              folders={folders}
              sortConfig={sortConfig}
              toggleSort={toggleSort}
              getSortIcon={getSortIcon}
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
              setCurrentPath={setCurrentPath}
              setSearchQuery={setSearchQuery}
              setSelectedArea={setSelectedArea}
              setSelectedStatus={setSelectedStatus}
              setSelectedYear={setSelectedYear}
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
              selectedFolders={selectedFolders}
              setSelectedFolders={setSelectedFolders}
            />
          ) : (
            <DocumentGrid 
              folders={folders}
              filteredDocuments={filteredDocuments}
              currentFolderId={currentFolderId}
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
              setCurrentPath={setCurrentPath}
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
              selectedFolders={selectedFolders}
              setSelectedFolders={setSelectedFolders}
            />
          )}
        </div>
      </div>
    </div>
  );
}
