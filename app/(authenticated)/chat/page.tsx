'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  X, 
  FileText, 
  Download, 
  Play, 
  Pause,
  User,
  Search,
  MoreVertical,
  Smile,
  Loader2,
  Check,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'audio' | 'file';
  file_url?: string;
  file_name?: string;
  created_at: string;
  read: boolean;
}

interface ChatUser {
  id: string;
  nome: string;
  url_imagem?: string;
  cargo?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export default function ChatPage() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [showNotification, setShowNotification] = useState<{ name: string; content: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('equipe')
        .select('id, nome, url_imagem, cargo')
        .eq('status', 'Ativo')
        .neq('id', currentUser.id);

      if (staffError) {
        console.error('Error fetching staff (detailed):', JSON.stringify(staffError, null, 2));
        throw staffError;
      }

      // Fetch last messages for each user from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const usersWithLastMessage = await Promise.all((staffData || []).map(async (u) => {
        const { data: lastMsgData, error: lastMsgError } = await supabase
          .from('chat_messages')
          .select('content, created_at, type')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${currentUser.id})`)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsgError) {
          console.warn(`Error fetching last message for user ${u.id}:`, JSON.stringify(lastMsgError, null, 2));
        }

        const { count: unreadCount, error: unreadError } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', u.id)
          .eq('receiver_id', currentUser.id)
          .eq('read', false);

        if (unreadError) {
          console.warn(`Error fetching unread count for user ${u.id}:`, JSON.stringify(unreadError, null, 2));
        }

        return {
          ...u,
          last_message: lastMsgData?.type === 'text' ? lastMsgData.content : lastMsgData?.type === 'audio' ? '🎵 Áudio' : lastMsgData?.type === 'file' ? '📎 Arquivo' : '',
          last_message_time: lastMsgData?.created_at,
          unread_count: unreadCount || 0
        };
      }));

      setUsers(usersWithLastMessage);
    } catch (error: any) {
      console.error('Error fetching users (full):', error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async (receiverId: string) => {
    if (!currentUser) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "chat_messages" does not exist')) {
          console.warn('Table chat_messages does not exist yet. Please create it in Supabase.');
          setMessages([]);
          return;
        }
        throw error;
      }

      setMessages(data || []);
      
      // Mark as read
      await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('receiver_id', currentUser.id)
        .eq('sender_id', receiverId)
        .eq('read', false);

    } catch (error: any) {
      console.error('Error fetching messages (full):', error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      if (error.message) console.error('Error message:', error.message);
      if (error.details) console.error('Error details:', error.details);
    }
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      console.log('ChatPage: Iniciando...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('ChatPage: Erro ao buscar usuário:', JSON.stringify(userError, null, 2));
      }
      setCurrentUser(user);
      
      // Initialize notification sound
      notificationAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

      // Check tables
      try {
        console.log('ChatPage: Verificando tabelas...');
        const { error: equipeCheckError } = await supabase.from('equipe').select('id').limit(1);
        if (equipeCheckError) console.error('ChatPage: Erro na tabela equipe:', JSON.stringify(equipeCheckError, null, 2));
        else console.log('ChatPage: Tabela equipe OK');

        const { error: chatCheckError } = await supabase.from('chat_messages').select('id').limit(1);
        if (chatCheckError) console.error('ChatPage: Erro na tabela chat_messages:', JSON.stringify(chatCheckError, null, 2));
        else console.log('ChatPage: Tabela chat_messages OK');
      } catch (e) {
        console.error('ChatPage: Erro ao verificar tabelas:', e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();

      // Global Message Channel for notifications
      const globalChannel = supabase
        .channel('global-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id.eq.${currentUser.id}`
        }, async (payload) => {
          const newMsg = payload.new as Message;
          
          // Play sound
          if (notificationAudioRef.current) {
            notificationAudioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
          }

          // Show notification balloon if not currently chatting with this user
          if (!selectedUser || selectedUser.id !== newMsg.sender_id) {
            const { data: sender } = await supabase
              .from('equipe')
              .select('nome')
              .eq('id', newMsg.sender_id)
              .single();
            
            setShowNotification({
              name: sender?.nome || 'Nova Mensagem',
              content: newMsg.type === 'text' ? newMsg.content : 'Enviou um anexo'
            });

            setTimeout(() => setShowNotification(null), 5000);
          }
          
          // Refresh user list to show unread count/last message
          fetchUsers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(globalChannel);
      };
    }
  }, [currentUser, selectedUser, fetchUsers]);

  // Separate Presence Effect to avoid loops
  useEffect(() => {
    if (currentUser) {
      const presenceChannel = supabase.channel('online-users');
      
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const online: Record<string, any> = {};
          Object.keys(state).forEach((key) => {
            const userPresence = state[key][0] as any;
            if (userPresence.user_id) {
              online[userPresence.user_id] = userPresence;
            }
          });
          setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: currentUser.id,
              online_at: new Date().toISOString(),
            });
          }
        });

      return () => {
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.id);

      // Subscribe to new messages for current chat
      const channel = supabase
        .channel(`chat:${selectedUser.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`
        }, (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates from optimistic updates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUser, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser || isSending) return;

    const msgContent = newMessage.trim();
    setNewMessage('');
    
    // Optimistic update
    const tempId = Math.random().toString();
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: msgContent,
      type: 'text',
      created_at: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          content: msgContent,
          type: 'text'
        }]);

      if (error) {
        console.error('Error inserting message (detailed):', JSON.stringify(error, null, 2));
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending message (full):', error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Erro ao enviar mensagem: ' + (error.message || JSON.stringify(error) || 'Erro desconhecido'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser || !currentUser) return;

    setIsSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const messageData = {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: `Arquivo: ${file.name}`,
        type: 'file',
        file_url: publicUrl,
        file_name: file.name,
        created_at: new Date().toISOString(),
        read: false
      };

      const { error: dbError } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erro ao enviar arquivo. Verifique se o bucket "chat-attachments" existe no Supabase Storage.');
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Erro ao acessar microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    if (!selectedUser || !currentUser) return;

    setIsSending(true);
    try {
      const fileName = `${Math.random()}.webm`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const messageData = {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: 'Mensagem de áudio',
        type: 'audio',
        file_url: publicUrl,
        file_name: 'audio.webm',
        created_at: new Date().toISOString(),
        read: false
      };

      const { error: dbError } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error uploading audio:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.cargo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#0a0a0a] flex flex-col h-screen overflow-hidden">
      <Header 
        title="Chat Interno" 
        subtitle="Comunicação em tempo real entre a equipe."
      />

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Sidebar - User List */}
        <div className="w-80 bg-[#1a1a1a] rounded-3xl border border-slate-800/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#d4ff3f]/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 size={24} className="text-[#d4ff3f] animate-spin" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando contatos...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-bold">
                Nenhum contato encontrado.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "w-full p-4 flex items-center gap-3 hover:bg-[#2a2a2a]/30 transition-all border-b border-slate-800/30 text-left group",
                    selectedUser?.id === user.id && "bg-[#d4ff3f]/5 border-l-4 border-l-[#d4ff3f]"
                  )}
                >
                  <div className="relative">
                    <div className="size-12 rounded-full bg-slate-800 overflow-hidden border border-slate-700 relative">
                      <Image 
                        src={user.url_imagem || `https://picsum.photos/seed/${user.id}/100/100`} 
                        alt={user.nome} 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {onlineUsers[user.id] && (
                      <div className="absolute bottom-0 right-0 size-3 bg-[#d4ff3f] border-2 border-[#1a1a1a] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className={cn(
                        "font-black text-sm truncate transition-colors",
                        onlineUsers[user.id] ? "text-[#d4ff3f]" : "text-slate-500"
                      )}>
                        {user.nome}
                      </p>
                      {user.last_message_time && (
                        <span className="text-[8px] font-bold text-slate-500 uppercase">
                          {format(new Date(user.last_message_time), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate">
                      {user.last_message || user.cargo || 'Membro da Equipe'}
                    </p>
                  </div>
                  {user.unread_count ? (
                    <div className="size-5 bg-[#d4ff3f] text-[#0a0a0a] text-[10px] font-black rounded-full flex items-center justify-center">
                      {user.unread_count}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-[#1a1a1a] rounded-3xl border border-slate-800/50 flex flex-col overflow-hidden relative">
          {/* Notification Balloon */}
          <AnimatePresence>
            {showNotification && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-20 right-6 z-50 bg-[#d4ff3f] text-black p-4 rounded-2xl shadow-2xl border border-black/10 flex items-center gap-3 min-w-[250px]"
              >
                <div className="size-10 bg-black/10 rounded-full flex items-center justify-center">
                  <Smile size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest">{showNotification.name}</p>
                  <p className="text-[10px] font-bold truncate opacity-80">{showNotification.content}</p>
                </div>
                <button onClick={() => setShowNotification(null)}>
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-[#1a1a1a]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 relative">
                    <Image 
                      src={selectedUser.url_imagem || `https://picsum.photos/seed/${selectedUser.id}/100/100`} 
                      alt={selectedUser.nome} 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className={cn(
                      "font-black text-sm",
                      onlineUsers[selectedUser.id] ? "text-[#d4ff3f]" : "text-slate-500"
                    )}>
                      {selectedUser.nome}
                    </p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      onlineUsers[selectedUser.id] ? "text-[#d4ff3f]" : "text-slate-500"
                    )}>
                      {onlineUsers[selectedUser.id] ? 'Online agora' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <Search size={20} />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative"
              >
                {/* Background with 50% opacity */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-50 pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 opacity-50">
                      <div className="size-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                        <Smile size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest">Inicie uma conversa</p>
                        <p className="text-[10px] font-bold text-slate-500">Diga oi para {selectedUser.nome.split(' ')[0]}!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine = msg.sender_id === currentUser?.id;
                      const showDate = idx === 0 || 
                        format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(messages[idx-1].created_at), 'yyyy-MM-dd');

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-6">
                              <span className="px-3 py-1 bg-black/40 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500 border border-slate-800/50">
                                {format(new Date(msg.created_at), "d 'de' MMMM", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "flex w-full",
                            isMine ? "justify-end" : "justify-start"
                          )}>
                            <div className={cn(
                              "max-w-[70%] rounded-2xl p-3 shadow-lg relative group",
                              isMine 
                                ? "bg-[#d4ff3f] text-black rounded-tr-none" 
                                : "bg-white text-black rounded-tl-none border border-slate-200"
                            )}>
                              {msg.type === 'text' && (
                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                              )}

                              {msg.type === 'file' && (
                                <div className="flex items-center gap-3 p-2 bg-black/5 rounded-xl border border-black/5 text-black">
                                  <div className="size-10 bg-black/10 rounded-lg flex items-center justify-center">
                                    <FileText size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate">{msg.file_name}</p>
                                    <p className="text-[8px] font-bold uppercase opacity-50">Documento</p>
                                  </div>
                                  <a 
                                    href={msg.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-black/10 rounded-lg transition-all"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              )}

                              {msg.type === 'audio' && (
                                <div className="flex items-center gap-3 min-w-[200px] text-black">
                                  <button className="size-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-all">
                                    <Play size={16} fill="currentColor" />
                                  </button>
                                  <div className="flex-1 h-1 bg-black/10 rounded-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-current opacity-30 w-1/3" />
                                  </div>
                                  <span className="text-[10px] font-black">0:12</span>
                                </div>
                              )}

                              <div className={cn(
                                "flex items-center gap-1 mt-1 justify-end",
                                isMine ? "text-black/40" : "text-black/40"
                              )}>
                                <span className="text-[8px] font-black uppercase">
                                  {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                                {isMine && (
                                  msg.read ? <CheckCheck size={12} /> : <Check size={12} />
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#1a1a1a] border-t border-slate-800/50">
                {isRecording ? (
                  <div className="flex items-center gap-4 bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 animate-pulse">
                    <div className="size-3 bg-rose-500 rounded-full animate-ping" />
                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest flex-1">
                      Gravando áudio... {formatTime(recordingTime)}
                    </p>
                    <button 
                      onClick={() => setIsRecording(false)}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                    <button 
                      onClick={stopRecording}
                      className="size-10 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors cursor-pointer">
                        <Paperclip size={20} />
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                      <button 
                        type="button"
                        onClick={startRecording}
                        className="p-2 text-slate-500 hover:text-[#d4ff3f] transition-colors"
                      >
                        <Mic size={20} />
                      </button>
                    </div>
                    
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#d4ff3f]/50 transition-all"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#d4ff3f] transition-colors"
                      >
                        <Smile size={20} />
                      </button>
                    </div>

                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className={cn(
                        "size-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                        newMessage.trim() 
                          ? "bg-[#d4ff3f] text-[#0a0a0a] shadow-[#d4ff3f]/10" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="size-32 relative">
                <Image 
                  src="https://github.com/baggiocrm-git/imagens/blob/main/LOGO%20CBSL_sem%20escrita_Pequeno.png?raw=true" 
                  alt="Logo" 
                  fill
                  sizes="128px"
                  className="object-contain opacity-20 grayscale"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="max-w-xs space-y-2">
                <h3 className="text-xl font-black tracking-tight">DocuFlow Chat</h3>
                <p className="text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-tighter">
                  Selecione um colega de equipe para iniciar uma conversa segura e em tempo real.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                  Criptografia de Ponta a Ponta
                </span>
                <span className="px-3 py-1 bg-[#d4ff3f]/10 text-[#d4ff3f] text-[8px] font-black uppercase tracking-widest rounded-full border border-[#d4ff3f]/20">
                  Arquivos Ilimitados
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
