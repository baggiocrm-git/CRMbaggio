'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { EllipsisVertical, FileAudio, FileText, Image as ImageIcon, MessageCircle, Mic, Paperclip, Send, Smile, Square, Trash2, Volume2, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  content: string | null;
  message_type: 'text' | 'image' | 'file' | 'audio';
  attachment_name: string | null;
  attachment_url: string | null;
  mime_type: string | null;
  created_at: string;
}

interface UserLike {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

interface UploadResponse {
  name: string;
  url: string;
  mimeType: string;
  messageType: 'image' | 'file' | 'audio';
}

const EMOJIS = ['\u{1F600}', '\u{1F602}', '\u{1F60D}', '\u{1F525}', '\u{1F44D}', '\u{1F44F}', '\u{1F64F}', '\u2705', '\u{1F389}', '\u{1F680}', '\u{1F4AC}', '\u{1F4CE}', '\u{1F4CC}', '\u{1F440}', '\u2764\uFE0F', '\u{1F605}'];
const ACCEPTED_ATTACHMENTS = 'image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getUserDisplayName(user: UserLike) {
  const metadata = user.user_metadata || {};
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : null;
  const name = typeof metadata.name === 'string' ? metadata.name : null;
  return fullName || name || user.email?.split('@')[0] || 'Usuario';
}

function playNotificationSound() {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
    oscillator.onended = () => {
      audioContext.close().catch(() => undefined);
    };
  } catch (error) {
    console.warn('Chat interno: falha ao reproduzir audio.', error);
  }
}

export default function InternalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('Usuario');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [clearCutoff, setClearCutoff] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasDraft = message.trim().length > 0 || !!selectedFile;

  const canUseChat =
    typeof supabase?.auth?.getUser === 'function' &&
    typeof supabase?.auth?.getSession === 'function' &&
    typeof supabase?.from === 'function' &&
    typeof supabase?.channel === 'function' &&
    typeof supabase?.removeChannel === 'function';

  const groupedMessages = useMemo(() => {
    if (!clearCutoff) return messages;
    const cutoff = new Date(clearCutoff).getTime();
    return messages.filter((item) => new Date(item.created_at).getTime() > cutoff);
  }, [clearCutoff, messages]);

  useEffect(() => {
    if (!canUseChat) return;

    const bootstrap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario nao autenticado.');
          setIsLoading(false);
          return;
        }

        setCurrentUserId(user.id);
        setCurrentUserName(getUserDisplayName(user as UserLike));
        setCurrentUserEmail(user.email || '');
        if (typeof window !== 'undefined') {
          setClearCutoff(localStorage.getItem(`internal-chat-cleared-at:${user.id}`));
        }

        const { data, error: fetchError } = await supabase
          .from('internal_chat_messages')
          .select('id,user_id,user_name,content,message_type,attachment_name,attachment_url,mime_type,created_at')
          .order('created_at', { ascending: true })
          .limit(100);

        if (fetchError) throw fetchError;
        setMessages((data || []) as ChatMessage[]);
      } catch (fetchError) {
        console.error('Chat interno: erro ao carregar mensagens.', fetchError);
        setError('Chat indisponivel. Falta configurar a tabela no Supabase.');
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [canUseChat]);

  useEffect(() => {
    if (!canUseChat || !currentUserId) return;

    const channel = supabase
      .channel('internal-chat-room-files')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_chat_messages' },
        (payload) => {
          const incoming = payload.new as ChatMessage;

          setMessages((current) => {
            if (current.some((item) => item.id === incoming.id)) return current;
            return [...current, incoming];
          });

          if (incoming.user_id !== currentUserId) {
            setUnreadCount((value) => value + 1);
            if (soundEnabled) playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canUseChat, currentUserId, soundEnabled]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!openMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuContainerRef.current) return;
      if (!menuContainerRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!isHeaderMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!headerMenuRef.current) return;
      if (!headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isHeaderMenuOpen]);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (isRecording || typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Microfone nao disponivel neste dispositivo ou navegador.');
      return;
    }

    try {
      setError(null);
      setShowEmojiPicker(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopRecordingTimer();
        setIsRecording(false);

        const blobType = recorder.mimeType || 'audio/webm';
        const extension = blobType.includes('mp4') ? 'm4a' : 'webm';
        const audioBlob = new Blob(recordingChunksRef.current, { type: blobType });
        const recordedFile = new File([audioBlob], `gravacao-${Date.now()}.${extension}`, { type: blobType });

        if (audioBlob.size > 0) {
          setSelectedFile(recordedFile);
        }

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
        setRecordingSeconds(0);
      };

      recorder.start();
      setSelectedFile(null);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
    } catch (recordingError) {
      console.error('Chat interno: erro ao iniciar gravacao.', recordingError);
      setError('Nao foi possivel acessar o microfone.');
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      stopRecordingTimer();
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
  };

  const handleUpload = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessao invalida para upload.');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/internal-chat/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const payload = (await response.json()) as UploadResponse & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Falha ao enviar o anexo.');
    }

    return payload;
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if ((!trimmed && !selectedFile) || !currentUserId || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      let uploadResult: UploadResponse | null = null;
      if (selectedFile) {
        uploadResult = await handleUpload(selectedFile);
      }

      const { data: insertedMessage, error: insertError } = await supabase
        .from('internal_chat_messages')
        .insert({
          user_id: currentUserId,
          user_name: currentUserName,
          user_email: currentUserEmail,
          content: trimmed || null,
          message_type: uploadResult?.messageType || 'text',
          attachment_name: uploadResult?.name || null,
          attachment_url: uploadResult?.url || null,
          mime_type: uploadResult?.mimeType || null,
        })
        .select('id,user_id,user_name,content,message_type,attachment_name,attachment_url,mime_type,created_at')
        .single();

      if (insertError) throw insertError;

      if (insertedMessage) {
        setMessages((current) => {
          if (current.some((item) => item.id === insertedMessage.id)) return current;
          return [...current, insertedMessage as ChatMessage];
        });
      }

      setMessage('');
      setSelectedFile(null);
      setShowEmojiPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (sendError) {
      console.error('Chat interno: erro ao enviar mensagem.', sendError);
      setError(sendError instanceof Error ? sendError.message : 'Nao foi possivel enviar a mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessao invalida para excluir a mensagem.');

      const response = await fetch('/api/internal-chat/message', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messageId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel apagar a mensagem.');
      }

      setMessages((current) => current.filter((item) => item.id !== messageId));
      setOpenMenuId(null);
    } catch (deleteError) {
      console.error('Chat interno: erro ao apagar mensagem.', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Nao foi possivel apagar a mensagem.');
    }
  };

  const handleClearForCurrentUser = () => {
    if (!currentUserId || typeof window === 'undefined') return;
    const cutoff = new Date().toISOString();
    localStorage.setItem(`internal-chat-cleared-at:${currentUserId}`, cutoff);
    setClearCutoff(cutoff);
    setOpenMenuId(null);
    setIsHeaderMenuOpen(false);
  };

  const renderAttachment = (chatMessage: ChatMessage) => {
    if (!chatMessage.attachment_url) return null;

    if (chatMessage.message_type === 'image') {
      return (
        <a href={chatMessage.attachment_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-black/10">
          <img src={chatMessage.attachment_url} alt={chatMessage.attachment_name || 'Imagem do chat'} className="max-h-64 w-full object-cover" />
        </a>
      );
    }

    if (chatMessage.message_type === 'audio') {
      return (
        <div className="rounded-2xl bg-black/10 p-3">
          <audio controls className="w-full">
            <source src={chatMessage.attachment_url} type={chatMessage.mime_type || 'audio/mpeg'} />
          </audio>
          {chatMessage.attachment_name && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">{chatMessage.attachment_name}</p>
          )}
        </div>
      );
    }

    return (
      <a href={chatMessage.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-black/10 px-4 py-3 transition hover:bg-black/15">
        <FileText size={18} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{chatMessage.attachment_name || 'Documento enviado'}</p>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{chatMessage.mime_type || 'Arquivo'}</p>
        </div>
      </a>
    );
  };

  if (!canUseChat) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[100] flex h-[min(78vh,720px)] w-[min(92vw,430px)] flex-col overflow-hidden rounded-[2rem] border border-slate-700/60 bg-[#101010] shadow-2xl shadow-black/35"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d0d0d] px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4ff3f]">Chat Interno</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-white">Imagens, documentos e audio</h3>
              </div>
              <div className="flex items-center gap-2">
                <div ref={headerMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsHeaderMenuOpen((current) => !current)}
                    className="flex size-10 items-center justify-center rounded-2xl border border-slate-700 bg-[#161616] text-slate-400 transition hover:text-white"
                    title="Opcoes da conversa"
                  >
                    <EllipsisVertical size={16} />
                  </button>

                  {isHeaderMenuOpen && (
                    <div className="absolute right-0 top-12 z-20 min-w-56 rounded-2xl border border-slate-700 bg-[#161616] p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={handleClearForCurrentUser}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black uppercase tracking-widest text-rose-400 transition hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                        Limpar mensagens pra mim
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((value) => !value)}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-2xl border transition-all',
                    soundEnabled ? 'border-[#d4ff3f]/30 bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'border-slate-700 bg-[#161616] text-slate-500'
                  )}
                >
                  <Volume2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex size-10 items-center justify-center rounded-2xl border border-slate-700 bg-[#161616] text-slate-400 transition hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div ref={scrollAreaRef} className="flex-1 space-y-4 overflow-y-auto bg-[#121212] px-4 py-5 custom-scrollbar">
              <div className="flex justify-center">
                <span className="rounded-full border border-slate-800 bg-[#181818] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Etapa 3
                </span>
              </div>

              {isLoading && (
                <div className="rounded-3xl border border-slate-800 bg-[#151515] px-4 py-5 text-center text-sm font-bold text-slate-400">
                  Carregando mensagens...
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm font-bold text-rose-400">
                  {error}
                </div>
              )}

              {!isLoading && !error && groupedMessages.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-[#151515] px-5 py-8 text-center">
                  <p className="text-sm font-black text-white">Nenhuma mensagem ainda.</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">Texto, imagens, documentos e audio ja estao ativos.</p>
                </div>
              )}

              {groupedMessages.map((chatMessage) => {
                const isOwn = chatMessage.user_id === currentUserId;

                return (
                  <div key={chatMessage.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'relative max-w-[86%] rounded-[1.75rem] px-4 py-3 shadow-lg',
                        isOwn ? 'rounded-br-md bg-[#d4ff3f] text-black shadow-[#d4ff3f]/15' : 'rounded-bl-md bg-white text-black shadow-black/10'
                      )}
                    >
                      {isOwn && (
                        <div ref={openMenuId === chatMessage.id ? menuContainerRef : null} className="absolute right-2 top-2">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId((current) => current === chatMessage.id ? null : chatMessage.id)}
                            className="rounded-xl p-1 text-black/50 transition hover:bg-black/10 hover:text-black"
                            title="Opcoes da mensagem"
                          >
                            <EllipsisVertical size={14} />
                          </button>

                          {openMenuId === chatMessage.id && (
                            <div className="absolute right-0 top-8 z-10 min-w-40 rounded-2xl border border-black/10 bg-white p-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => void handleDeleteMessage(chatMessage.id)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black uppercase tracking-widest text-rose-500 transition hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                                Apagar item
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-65">
                          {isOwn ? 'Voce' : chatMessage.user_name}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-45">
                          {formatTime(chatMessage.created_at)}
                        </span>
                      </div>

                      {renderAttachment(chatMessage)}

                      {chatMessage.content && (
                        <p className={cn('whitespace-pre-wrap text-sm font-semibold', chatMessage.attachment_url && 'mt-3')}>
                          {chatMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 bg-[#0d0d0d] p-4">
              {selectedFile && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-700 bg-[#171717] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-slate-300">
                    {selectedFile.type.startsWith('image/') ? <ImageIcon size={16} /> : selectedFile.type.startsWith('audio/') ? <FileAudio size={16} /> : <FileText size={16} />}
                    <span className="truncate text-sm font-bold">{selectedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-slate-500 transition hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {isRecording && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2">
                  <div className="flex items-center gap-3 text-rose-400">
                    <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-sm font-black">Gravando audio</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    <Square size={12} fill="currentColor" />
                    Parar
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="mb-3 rounded-3xl border border-slate-700 bg-[#171717] p-3">
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessage((value) => `${value}${emoji}`)}
                        className="rounded-2xl bg-[#202020] py-2 text-lg transition hover:bg-[#2a2a2a]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3 rounded-2xl border border-slate-700 bg-[#151515] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Audio liberado. Voce pode anexar ou gravar pelo microfone.
              </div>

              <div className="flex items-end gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((value) => !value)}
                    className="flex size-11 items-center justify-center rounded-2xl border border-slate-700 bg-[#171717] text-slate-400 transition hover:text-[#d4ff3f]"
                  >
                    <Smile size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-11 items-center justify-center rounded-2xl border border-slate-700 bg-[#171717] text-slate-400 transition hover:text-[#d4ff3f]"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : () => void startRecording()}
                    className={cn(
                      'flex size-11 items-center justify-center rounded-2xl border transition',
                      isRecording
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-slate-700 bg-[#171717] text-slate-400 hover:text-[#d4ff3f]'
                    )}
                    title={isRecording ? 'Parar gravacao' : 'Gravar audio'}
                  >
                    {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_ATTACHMENTS}
                    onChange={handleSelectFile}
                  />
                </div>

                <div className="min-h-[52px] flex-1 rounded-[1.6rem] border border-slate-700 bg-[#171717] px-4 py-3">
                  <textarea
                    rows={1}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem..."
                    className="max-h-32 w-full resize-none bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!hasDraft || isSending || !!error || isRecording}
                  className="flex size-12 items-center justify-center rounded-2xl bg-[#d4ff3f] text-black transition hover:bg-[#c4ef2f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className={cn(
            'group relative flex size-16 items-center justify-center rounded-full border transition-all',
            unreadCount > 0 ? 'border-[#d4ff3f] bg-[#d4ff3f] text-black shadow-2xl shadow-[#d4ff3f]/25' : 'border-slate-700 bg-[#111111] text-[#d4ff3f] shadow-xl shadow-black/25'
          )}
        >
          <MessageCircle size={24} className="transition-transform group-hover:scale-110" />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex min-w-7 items-center justify-center rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
              <span className="absolute inset-0 rounded-full border-4 border-[#d4ff3f]/40 animate-ping" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
