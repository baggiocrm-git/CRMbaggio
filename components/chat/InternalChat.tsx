'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  EllipsisVertical,
  FileAudio,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Paperclip,
  Settings2,
  Send,
  Smile,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  recipient_id: string | null;
  content: string | null;
  message_type: 'text' | 'image' | 'file' | 'audio';
  attachment_name: string | null;
  attachment_url: string | null;
  mime_type: string | null;
  created_at: string;
}

interface ChatUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface PresenceRow {
  user_id: string;
  user_name: string;
  user_email: string;
  is_online: boolean;
  last_seen: string;
  updated_at: string;
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

interface ChatUserPreferences {
  user_id: string;
  avatar_style: string;
  updated_at?: string;
}

const EMOJIS = ['\u{1F600}', '\u{1F602}', '\u{1F60D}', '\u{1F525}', '\u{1F44D}', '\u{1F44F}', '\u{1F64F}', '\u2705', '\u{1F389}', '\u{1F680}', '\u{1F4AC}', '\u{1F4CE}', '\u{1F4CC}', '\u{1F440}', '\u2764\uFE0F', '\u{1F605}'];
const ACCEPTED_ATTACHMENTS = 'image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';
const PRESENCE_TIMEOUT_MS = 90000;
const DEFAULT_AVATAR_STYLE = 'homem_moreno';
const AVATAR_STYLES: Record<
  string,
  {
    label: string;
    skin: string;
    hair: string;
    shirt: string;
    accent?: string;
    feminine?: boolean;
    elder?: boolean;
  }
> = {
  homem_moreno: { label: 'Homem Moreno', skin: '#c58c66', hair: '#2f241f', shirt: '#3b82f6' },
  homem_loiro: { label: 'Homem Loiro', skin: '#f0c7a4', hair: '#d9b44a', shirt: '#0ea5e9' },
  mulher_morena: { label: 'Mulher Morena', skin: '#c48a67', hair: '#3a251c', shirt: '#ec4899', feminine: true },
  mulher_loira: { label: 'Mulher Loira', skin: '#f2ceb1', hair: '#e5c158', shirt: '#f472b6', feminine: true },
  senhor_moreno: { label: 'Senhor Moreno', skin: '#b98260', hair: '#5c5c5c', shirt: '#6366f1', elder: true },
  senhor_loiro: { label: 'Senhor Loiro', skin: '#efc6a6', hair: '#d2d6db', shirt: '#8b5cf6', elder: true },
  senhora_morena: { label: 'Senhora Morena', skin: '#be8562', hair: '#6b7280', shirt: '#f43f5e', feminine: true, elder: true },
  senhora_loira: { label: 'Senhora Loira', skin: '#f1ccb0', hair: '#d8dce0', shirt: '#fb7185', feminine: true, elder: true },
};

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

function getFirstName(name: string) {
  return name.trim().split(' ')[0] || name;
}

function getAvatarPreset(styleKey?: string) {
  return AVATAR_STYLES[styleKey || DEFAULT_AVATAR_STYLE] || AVATAR_STYLES[DEFAULT_AVATAR_STYLE];
}

function renderAvatar(styleKey?: string, offline?: boolean) {
  const preset = getAvatarPreset(styleKey);

  return (
    <svg viewBox="0 0 64 64" className={cn('size-full', offline && 'opacity-65 grayscale')}>
      <circle cx="32" cy="32" r="31" fill="#f4f4f5" />
      <path d={preset.feminine ? 'M17 27c2-12 12-18 15-18s13 6 15 18v7H17z' : 'M18 24c3-10 11-15 14-15s11 5 14 15v8H18z'} fill={preset.hair} />
      <circle cx="32" cy="28" r={preset.elder ? '11.5' : '12'} fill={preset.skin} />
      {preset.elder && <path d="M24 30c2 2 5 3 8 3s6-1 8-3" stroke="#f5f5f5" strokeWidth="1.6" strokeLinecap="round" />}
      {preset.feminine && <path d="M19 28c1 8 5 13 13 13s12-5 13-13" fill={preset.hair} opacity="0.3" />}
      <circle cx="27.5" cy="27.5" r="1.2" fill="#1f2937" />
      <circle cx="36.5" cy="27.5" r="1.2" fill="#1f2937" />
      <path d="M28.5 33.5c1.2 1 2.5 1.5 3.5 1.5s2.3-.5 3.5-1.5" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d={preset.feminine ? 'M18 58c1-10 7-15 14-15s13 5 14 15z' : 'M16 58c2-9 8-13 16-13s14 4 16 13z'} fill={preset.shirt} />
      {preset.feminine && <path d="M26 44l6 6 6-6" fill={preset.shirt} opacity="0.8" />}
    </svg>
  );
}

function getConversationKey(currentUserId: string, selectedUserId: string) {
  return `internal-chat-cleared-at:${currentUserId}:${selectedUserId}`;
}

function getConversationPartner(message: ChatMessage, currentUserId: string) {
  return message.user_id === currentUserId ? message.recipient_id : message.user_id;
}

function isPresenceActive(presence?: PresenceRow) {
  if (!presence?.is_online) return false;
  return Date.now() - new Date(presence.updated_at).getTime() <= PRESENCE_TIMEOUT_MS;
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
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [presenceByUser, setPresenceByUser] = useState<Record<string, PresenceRow>>({});
  const [preferencesByUser, setPreferencesByUser] = useState<Record<string, ChatUserPreferences>>({});
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('Usuario');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [clearCutoff, setClearCutoff] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  );

  const currentAvatarStyle = preferencesByUser[currentUserId || '']?.avatar_style || DEFAULT_AVATAR_STYLE;

  const orderedUsers = useMemo(() => {
    return users
      .filter((user) => user.id !== currentUserId)
      .sort((a, b) => {
        const aOnline = isPresenceActive(presenceByUser[a.id]);
        const bOnline = isPresenceActive(presenceByUser[b.id]);
        if (aOnline !== bOnline) return aOnline ? -1 : 1;

        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [currentUserId, presenceByUser, users]);

  const currentConversationMessages = useMemo(() => {
    if (!currentUserId || !selectedUserId) return [];

    const filtered = messages.filter((item) => {
      const isOutgoing = item.user_id === currentUserId && item.recipient_id === selectedUserId;
      const isIncoming = item.user_id === selectedUserId && item.recipient_id === currentUserId;
      return isOutgoing || isIncoming;
    });

    if (!clearCutoff) return filtered;
    const cutoff = new Date(clearCutoff).getTime();
    return filtered.filter((item) => new Date(item.created_at).getTime() > cutoff);
  }, [clearCutoff, currentUserId, messages, selectedUserId]);

  const unreadCount = useMemo(
    () => Object.values(unreadByUser).reduce((total, value) => total + value, 0),
    [unreadByUser]
  );

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith('audio/')) {
      setSelectedFilePreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return previewUrl;
    });

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!canUseChat) return;

    const bootstrap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario nao autenticado.');
          return;
        }

        setCurrentUserId(user.id);
        setCurrentUserName(getUserDisplayName(user as UserLike));
        setCurrentUserEmail(user.email || '');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Sessao nao encontrada.');
          return;
        }

        const usersResponse = await fetch('/api/internal-chat/users', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const usersPayload = (await usersResponse.json()) as { error?: string; users?: ChatUser[] };
        if (!usersResponse.ok) {
          throw new Error(usersPayload.error || 'Nao foi possivel carregar os usuarios do chat.');
        }

        const availableUsers = usersPayload.users || [];
        setUsers(availableUsers);

        const initialSelectedUser =
          availableUsers.find((item) => item.id !== user.id)?.id ||
          availableUsers.find((item) => item.id === user.id)?.id ||
          null;
        setSelectedUserId(initialSelectedUser);

        const { data: messagesData, error: messagesError } = await supabase
          .from('internal_chat_messages')
          .select('id,user_id,user_name,recipient_id,content,message_type,attachment_name,attachment_url,mime_type,created_at')
          .order('created_at', { ascending: true })
          .limit(300);

        if (messagesError) throw messagesError;
        setMessages((messagesData || []) as ChatMessage[]);

        const { data: presenceData, error: presenceError } = await supabase
          .from('internal_chat_presence')
          .select('user_id,user_name,user_email,is_online,last_seen,updated_at');

        if (presenceError) throw presenceError;

        const mappedPresence = ((presenceData || []) as PresenceRow[]).reduce<Record<string, PresenceRow>>((acc, row) => {
          acc[row.user_id] = row;
          return acc;
        }, {});
        setPresenceByUser(mappedPresence);

        const { data: preferencesData, error: preferencesError } = await supabase
          .from('internal_chat_user_preferences')
          .select('user_id,avatar_style,updated_at');

        if (preferencesError) throw preferencesError;

        const mappedPreferences = ((preferencesData || []) as ChatUserPreferences[]).reduce<Record<string, ChatUserPreferences>>((acc, row) => {
          acc[row.user_id] = row;
          return acc;
        }, {});
        setPreferencesByUser(mappedPreferences);
      } catch (fetchError) {
        console.error('Chat interno: erro ao inicializar conversa privada.', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Chat indisponivel no momento.');
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [canUseChat]);

  useEffect(() => {
    if (!currentUserId || !selectedUserId || typeof window === 'undefined') return;
    setClearCutoff(localStorage.getItem(getConversationKey(currentUserId, selectedUserId)));
    setUnreadByUser((current) => ({ ...current, [selectedUserId]: 0 }));
  }, [currentUserId, selectedUserId]);

  useEffect(() => {
    if (!currentUserId || !currentUserEmail) return;

    const upsertPresence = async (isOnline: boolean) => {
      const now = new Date().toISOString();
      const payload: PresenceRow = {
        user_id: currentUserId,
        user_name: currentUserName,
        user_email: currentUserEmail,
        is_online: isOnline,
        last_seen: now,
        updated_at: now,
      };

      const { error: presenceError } = await supabase
        .from('internal_chat_presence')
        .upsert(payload, { onConflict: 'user_id' });

      if (!presenceError) {
        setPresenceByUser((current) => ({ ...current, [currentUserId]: payload }));
      }
    };

    void upsertPresence(true);

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void upsertPresence(true);
      }
    }, 45000);

    const handleVisibilityChange = () => {
      void upsertPresence(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void upsertPresence(false);
    };
  }, [currentUserEmail, currentUserId, currentUserName]);

  useEffect(() => {
    if (!canUseChat || !currentUserId) return;

    const messagesChannel = supabase
      .channel(`internal-chat-private-messages-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_chat_messages' },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          const isRelevant =
            incoming.user_id === currentUserId ||
            incoming.recipient_id === currentUserId;

          if (!isRelevant) return;

          setMessages((current) => {
            if (current.some((item) => item.id === incoming.id)) return current;
            return [...current, incoming];
          });

          if (incoming.user_id !== currentUserId) {
            const partnerId = getConversationPartner(incoming, currentUserId);

            if (partnerId && (!isOpen || selectedUserId !== partnerId)) {
              setUnreadByUser((current) => ({
                ...current,
                [partnerId]: (current[partnerId] || 0) + 1,
              }));
            }

            if (soundEnabled) playNotificationSound();
          }
        }
      )
      .subscribe();

    const presenceChannel = supabase
      .channel(`internal-chat-private-presence-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'internal_chat_presence' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldPresence = payload.old as PresenceRow;
            setPresenceByUser((current) => {
              const next = { ...current };
              delete next[oldPresence.user_id];
              return next;
            });
            return;
          }

          const nextPresence = payload.new as PresenceRow;
          setPresenceByUser((current) => ({
            ...current,
            [nextPresence.user_id]: nextPresence,
          }));
        }
      )
      .subscribe();

    const preferencesChannel = supabase
      .channel(`internal-chat-private-preferences-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'internal_chat_user_preferences' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const previous = payload.old as ChatUserPreferences;
            setPreferencesByUser((current) => {
              const next = { ...current };
              delete next[previous.user_id];
              return next;
            });
            return;
          }

          const nextPreference = payload.new as ChatUserPreferences;
          setPreferencesByUser((current) => ({
            ...current,
            [nextPreference.user_id]: nextPreference,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(preferencesChannel);
    };
  }, [canUseChat, currentUserId, isOpen, selectedUserId, soundEnabled]);

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
  }, [currentConversationMessages, isOpen]);

  useEffect(() => {
    return () => {
      setSelectedFilePreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setShowEmojiPicker(false);
    setOpenMenuId(null);
    setIsHeaderMenuOpen(false);
  };

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFilePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if ((!trimmed && !selectedFile) || !currentUserId || !selectedUserId || isSending) return;
    if (selectedUserId === currentUserId) {
      setError('Selecione outro usuario para iniciar uma conversa privada.');
      return;
    }

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
          recipient_id: selectedUserId,
          content: trimmed || null,
          message_type: uploadResult?.messageType || 'text',
          attachment_name: uploadResult?.name || null,
          attachment_url: uploadResult?.url || null,
          mime_type: uploadResult?.mimeType || null,
        })
        .select('id,user_id,user_name,recipient_id,content,message_type,attachment_name,attachment_url,mime_type,created_at')
        .single();

      if (insertError) throw insertError;

      if (insertedMessage) {
        setMessages((current) => {
          if (current.some((item) => item.id === insertedMessage.id)) return current;
          return [...current, insertedMessage as ChatMessage];
        });
      }

      setMessage('');
      clearSelectedFile();
      setShowEmojiPicker(false);
    } catch (sendError) {
      console.error('Chat interno: erro ao enviar mensagem privada.', sendError);
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
    if (!currentUserId || !selectedUserId || typeof window === 'undefined') return;
    const cutoff = new Date().toISOString();
    localStorage.setItem(getConversationKey(currentUserId, selectedUserId), cutoff);
    setClearCutoff(cutoff);
    setOpenMenuId(null);
    setIsHeaderMenuOpen(false);
  };

  const handleSaveAvatarStyle = async (avatarStyle: string) => {
    if (!currentUserId || isSavingPreferences || !AVATAR_STYLES[avatarStyle]) return;

    try {
      setIsSavingPreferences(true);
      setError(null);

      const payload: ChatUserPreferences = {
        user_id: currentUserId,
        avatar_style: avatarStyle,
        updated_at: new Date().toISOString(),
      };

      const { error: preferencesError } = await supabase
        .from('internal_chat_user_preferences')
        .upsert(payload, { onConflict: 'user_id' });

      if (preferencesError) throw preferencesError;

      setPreferencesByUser((current) => ({
        ...current,
        [currentUserId]: payload,
      }));
      setIsSettingsOpen(false);
    } catch (preferencesError) {
      console.error('Chat interno: erro ao salvar avatar.', preferencesError);
      setError(preferencesError instanceof Error ? preferencesError.message : 'Nao foi possivel salvar o avatar.');
    } finally {
      setIsSavingPreferences(false);
    }
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
            key="chat-window"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[100] flex h-[min(78vh,720px)] w-[min(96vw,860px)] overflow-hidden rounded-[2rem] border border-slate-700/60 bg-[#101010] shadow-2xl shadow-black/35"
          >
            <aside className="flex w-[92px] shrink-0 flex-col border-r border-slate-800 bg-[#0d0d0d]">
              <div className="border-b border-slate-800 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4ff3f]">Usuarios</p>
                <p className="mt-1 text-[10px] font-bold text-slate-500">Chat</p>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
                <div className="space-y-1">
                  {orderedUsers.map((user, index) => {
                    const isSelf = user.id === currentUserId;
                    const isSelected = user.id === selectedUserId;
                    const isOnline = isSelf ? true : isPresenceActive(presenceByUser[user.id]);
                    const unread = unreadByUser[user.id] || 0;

                    return (
                      <button
                        key={`chat-user-${user.id || index}`}
                        type="button"
                        onClick={() => !isSelf && handleSelectConversation(user.id)}
                        disabled={isSelf}
                        title={isSelf ? `${user.name} (voce)` : user.name}
                        className={cn(
                          'group relative flex w-full flex-col items-center rounded-[1.1rem] px-1.5 py-2 transition',
                          isSelected ? 'bg-[#d4ff3f]/14' : 'bg-transparent hover:bg-white/5',
                          isSelf && 'cursor-default bg-[#d4ff3f]/10'
                        )}
                      >
                        <div className="relative">
                          <div
                            className="size-11 overflow-hidden rounded-full border border-white/10 bg-[#f4f4f5]"
                          >
                            {renderAvatar(preferencesByUser[user.id]?.avatar_style, !isOnline)}
                          </div>
                          <span
                            className={cn(
                              'absolute bottom-1 right-1 size-2.5 rounded-full border border-[#0d0d0d]',
                              isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            )}
                          />
                          {unread > 0 && !isSelf && (
                            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-1 text-[9px] font-black text-white">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                        <span className={cn('mt-3 max-w-full truncate text-center text-[9px] font-black uppercase tracking-[0.08em]', isSelf || isSelected ? 'text-white' : 'text-slate-500')}>
                          {isSelf ? 'Voce' : getFirstName(user.name)}
                        </span>
                        <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden -translate-y-1/2 rounded-2xl border border-slate-700 bg-[#161616] px-3 py-2 text-left text-[11px] font-bold text-white shadow-xl group-hover:block">
                          {user.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d0d0d] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4ff3f]">Chat Interno</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="size-9 overflow-hidden rounded-full border border-white/10 bg-[#f4f4f5]"
                      >
                        {selectedUser
                          ? renderAvatar(
                              preferencesByUser[selectedUser.id]?.avatar_style,
                              !isPresenceActive(presenceByUser[selectedUser.id])
                            )
                          : null}
                      </div>
                      {selectedUser && (
                        <span
                          className={cn(
                            'absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-[#0d0d0d]',
                            isPresenceActive(presenceByUser[selectedUser.id]) ? 'bg-emerald-500' : 'bg-slate-500'
                          )}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black tracking-tight text-white">
                        {selectedUser ? selectedUser.name : 'Selecione um usuario'}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500">
                        {selectedUser
                          ? isPresenceActive(presenceByUser[selectedUser.id])
                            ? 'Online'
                            : 'Offline'
                          : 'Conversa privada por usuario'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-[#161616] text-slate-400 transition hover:text-white"
                    title="Configuracoes do chat"
                  >
                    <Settings2 size={14} />
                  </button>
                  <div ref={headerMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsHeaderMenuOpen((current) => !current)}
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-[#161616] text-slate-400 transition hover:text-white"
                      title="Opcoes da conversa"
                    >
                      <EllipsisVertical size={14} />
                    </button>

                    {isHeaderMenuOpen && (
                      <div className="absolute right-0 top-12 z-20 min-w-56 rounded-2xl border border-slate-700 bg-[#161616] p-1 shadow-xl">
                        <button
                          type="button"
                          onClick={handleClearForCurrentUser}
                          disabled={!selectedUserId || selectedUserId === currentUserId}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black uppercase tracking-widest text-rose-400 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
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
                      'flex size-9 items-center justify-center rounded-xl border transition-all',
                      soundEnabled ? 'border-[#d4ff3f]/30 bg-[#d4ff3f]/10 text-[#d4ff3f]' : 'border-slate-700 bg-[#161616] text-slate-500'
                    )}
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-[#161616] text-slate-400 transition hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div ref={scrollAreaRef} className="flex-1 space-y-4 overflow-y-auto bg-[#121212] px-4 py-5 custom-scrollbar">
                {isLoading && (
                  <div className="rounded-3xl border border-slate-800 bg-[#151515] px-4 py-5 text-center text-[13px] font-bold text-slate-400">
                    Carregando usuarios e mensagens...
                  </div>
                )}

                {!isLoading && error && (
                  <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-[13px] font-bold text-rose-400">
                    {error}
                  </div>
                )}

                {!isLoading && !error && (!selectedUserId || selectedUserId === currentUserId) && (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-[#151515] px-5 py-8 text-center">
                    <p className="text-[13px] font-black text-white">Selecione um usuario na lateral.</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">As conversas agora sao privadas entre usuarios logados.</p>
                  </div>
                )}

                {!isLoading && !error && selectedUserId && selectedUserId !== currentUserId && currentConversationMessages.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-[#151515] px-5 py-8 text-center">
                    <p className="text-[13px] font-black text-white">Nenhuma mensagem nesta conversa.</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">Envie texto, imagem, documento ou audio para iniciar.</p>
                  </div>
                )}

                {currentConversationMessages.map((chatMessage, index) => {
                  const isOwn = chatMessage.user_id === currentUserId;

                  return (
                    <div key={`chat-message-${chatMessage.id || index}`} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'relative max-w-[86%] rounded-[1.6rem] px-4 py-3 shadow-lg',
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
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-65">
                            {isOwn ? 'Voce' : chatMessage.user_name}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-[0.12em] opacity-45">
                            {formatTime(chatMessage.created_at)}
                          </span>
                        </div>

                        {renderAttachment(chatMessage)}

                        {chatMessage.content && (
                          <p className={cn('whitespace-pre-wrap text-[13px] font-semibold', chatMessage.attachment_url && 'mt-3')}>
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
                  <div className="mb-3 rounded-2xl border border-slate-700 bg-[#171717] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-slate-300">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={16} /> : selectedFile.type.startsWith('audio/') ? <FileAudio size={16} /> : <FileText size={16} />}
                        <span className="truncate text-[13px] font-bold">{selectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="text-slate-500 transition hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {selectedFile.type.startsWith('audio/') && selectedFilePreviewUrl && (
                      <div className="mt-3 rounded-2xl bg-black/10 p-3">
                        <audio controls className="w-full">
                          <source src={selectedFilePreviewUrl} type={selectedFile.type || 'audio/webm'} />
                        </audio>
                      </div>
                    )}
                  </div>
                )}

                {isRecording && (
                  <div className="mb-3 flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2">
                    <div className="flex items-center gap-3 text-rose-400">
                      <span className="size-2 animate-pulse rounded-full bg-rose-500" />
                      <span className="text-[13px] font-black">Gravando audio</span>
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

                {!isRecording && selectedFile?.type.startsWith('audio/') && (
                  <div className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
                    Audio pronto para envio.
                  </div>
                )}

                {showEmojiPicker && (
                  <div className="mb-3 rounded-3xl border border-slate-700 bg-[#171717] p-3">
                    <div className="grid grid-cols-8 gap-2">
                      {EMOJIS.map((emoji, index) => (
                        <button
                          key={`chat-emoji-${index}`}
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

                <div className="flex items-end gap-3">
                  <div className="min-h-[92px] flex-1 rounded-[1.6rem] border border-slate-700 bg-[#171717] px-4 py-3">
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={selectedUserId && selectedUserId !== currentUserId ? 'Digite uma mensagem...' : 'Selecione um usuario para conversar'}
                      disabled={!selectedUserId || selectedUserId === currentUserId}
                      className="min-h-[66px] max-h-40 w-full resize-none bg-transparent text-[13px] font-semibold leading-5 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((value) => !value)}
                        className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-[#d4ff3f]"
                      >
                        <Smile size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-[#d4ff3f]"
                      >
                        <Paperclip size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : () => void startRecording()}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-xl transition',
                          isRecording
                            ? 'bg-rose-500 text-white'
                            : 'text-slate-400 hover:bg-white/5 hover:text-[#d4ff3f]'
                        )}
                        title={isRecording ? 'Parar gravacao' : 'Gravar audio'}
                      >
                        {isRecording ? <Square size={13} fill="currentColor" /> : <Mic size={14} />}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={ACCEPTED_ATTACHMENTS}
                        onChange={handleSelectFile}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!hasDraft || isSending || !!error || isRecording || !selectedUserId || selectedUserId === currentUserId}
                    className="flex size-12 items-center justify-center rounded-2xl bg-[#d4ff3f] text-black transition hover:bg-[#c4ef2f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isOpen && isSettingsOpen && (
          <motion.div
            key="chat-avatar-settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] flex items-center justify-center bg-black/45 px-4"
          >
            <div className="w-full max-w-[420px] rounded-[1.5rem] border border-slate-700 bg-[#101010] p-4 shadow-2xl shadow-black/35">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4ff3f]">Configuracoes</p>
                  <h3 className="mt-2 text-sm font-black text-white">Seu avatar do chat</h3>
                  <p className="mt-1 text-[10px] font-bold text-slate-500">Escolha como quer aparecer.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-[#161616] text-slate-400 transition hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#151515] px-3 py-2.5">
                <div
                  className="size-10 overflow-hidden rounded-full border border-white/10 bg-[#f4f4f5]"
                >
                  {renderAvatar(currentAvatarStyle)}
                </div>
                <div>
                  <p className="text-[13px] font-black text-white">{currentUserName}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Preview do avatar</p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Homens</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(AVATAR_STYLES)
                      .filter(([key]) => key.startsWith('homem_') || key.startsWith('senhor_'))
                      .map(([key, style], index) => (
                        <button
                          key={`male-avatar-${key || index}`}
                          type="button"
                          onClick={() => void handleSaveAvatarStyle(key)}
                          disabled={isSavingPreferences}
                          className={cn(
                            'rounded-2xl border px-2 py-2 transition',
                            currentAvatarStyle === key ? 'border-[#d4ff3f] bg-[#d4ff3f]/10' : 'border-slate-700 bg-[#151515] hover:bg-[#1b1b1b]',
                            isSavingPreferences && 'cursor-not-allowed opacity-60'
                          )}
                        >
                          <div className="mx-auto size-9 overflow-hidden rounded-full border border-white/10 bg-[#f4f4f5]">
                            {renderAvatar(key)}
                          </div>
                          <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.04em] text-white">{style.label}</p>
                        </button>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Mulheres</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(AVATAR_STYLES)
                      .filter(([key]) => key.startsWith('mulher_') || key.startsWith('senhora_'))
                      .map(([key, style], index) => (
                        <button
                          key={`female-avatar-${key || index}`}
                          type="button"
                          onClick={() => void handleSaveAvatarStyle(key)}
                          disabled={isSavingPreferences}
                          className={cn(
                            'rounded-2xl border px-2 py-2 transition',
                            currentAvatarStyle === key ? 'border-[#d4ff3f] bg-[#d4ff3f]/10' : 'border-slate-700 bg-[#151515] hover:bg-[#1b1b1b]',
                            isSavingPreferences && 'cursor-not-allowed opacity-60'
                          )}
                        >
                          <div className="mx-auto size-9 overflow-hidden rounded-full border border-white/10 bg-[#f4f4f5]">
                            {renderAvatar(key)}
                          </div>
                          <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.04em] text-white">{style.label}</p>
                        </button>
                      ))}
                  </div>
                </div>
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
              <span className="absolute -right-1 -top-1 flex min-w-7 items-center justify-center rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
              <span className="absolute inset-0 animate-ping rounded-full border-4 border-[#d4ff3f]/40" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
