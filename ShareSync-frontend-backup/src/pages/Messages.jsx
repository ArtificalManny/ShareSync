// src/pages/Messages.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES PAGE - Connected to Real Backend + WebSocket
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Star,
  Archive,
  Send,
  Paperclip,
  Phone,
  Video,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  User,
} from 'lucide-react';

// API
import { 
  messagesApi, 
  getConversationDisplayName, 
  getOtherParticipant,
  isOwnMessage,
  getUserInitials,
  generateClientMessageId,
} from '../lib/api/messages';

// WebSocket context (Phase 2A)
import { useSocketContext, useSocketEvent } from '../context/SocketContext';

// Auth context
import { useAuth } from '../contexts/AuthContext';

// Axios for user search
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

/* ─────────────────────────────────────────────────────────────────────────
   USER SEARCH API
───────────────────────────────────────────────────────────────────────── */
const searchUsers = async (query) => {
  if (!query || query.length < 2) return [];
  
  const token = localStorage.getItem('ss.jwt') || localStorage.getItem('token');
  
  try {
    const res = await axios.get(`${API_BASE_URL}/users/search`, {
      params: { q: query, limit: 10 },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data || res.data || [];
  } catch (err) {
    console.warn('User search endpoint not available, trying fallback...');
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = res.data.data || res.data || [];
      const queryLower = query.toLowerCase();
      return users.filter(u => 
        u.firstName?.toLowerCase().includes(queryLower) ||
        u.lastName?.toLowerCase().includes(queryLower) ||
        u.email?.toLowerCase().includes(queryLower) ||
        u.username?.toLowerCase().includes(queryLower)
      ).slice(0, 10);
    } catch (fallbackErr) {
      console.error('User search failed:', fallbackErr);
      return [];
    }
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   LOADING SKELETONS
───────────────────────────────────────────────────────────────────────── */
const ConversationSkeleton = () => (
  <div className="p-4 space-y-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const MessagesSkeleton = () => (
  <div className="p-4 space-y-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
        {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />}
        <div className={`space-y-1 ${i % 2 === 0 ? 'items-end' : ''}`}>
          <div className={`h-16 bg-white/10 rounded-xl animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
          <div className="h-3 bg-white/10 rounded w-16 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────────────────────────────────── */
const ErrorState = ({ message, onRetry }) => (
  <div className="p-8 text-center">
    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
    <p className="text-sm text-text-secondary mb-2">{message || 'Something went wrong'}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   AVATAR COMPONENT
───────────────────────────────────────────────────────────────────────── */
const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = getUserInitials(user);
  
  if (user?.avatar) {
    return (
      <img 
        src={user.avatar} 
        alt={`${user.firstName || 'User'}'s avatar`}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="font-medium text-brand-400">{initials}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   TYPING INDICATOR
───────────────────────────────────────────────────────────────────────── */
const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;
  
  const text = users.length === 1 
    ? `${users[0]} is typing...`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing...`
    : `${users[0]} and ${users.length - 1} others are typing...`;
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-text-tertiary">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   CONVERSATION LIST ITEM
───────────────────────────────────────────────────────────────────────── */
const ConversationItem = ({ conversation, isSelected, onClick, currentUserId }) => {
  const displayName = getConversationDisplayName(conversation, currentUserId);
  const otherUser = getOtherParticipant(conversation, currentUserId);
  const unreadCount = conversation.unreadCount || 0;
  const isStarred = conversation.isPinned || false;
  const lastMessage = conversation.lastMessage?.content || 'No messages yet';
  const lastMessageAt = conversation.lastMessage?.sentAt || conversation.lastActivityAt;
  
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60 * 60) {
      const mins = Math.floor(diff / (1000 * 60));
      return mins <= 0 ? 'now' : `${mins}m`;
    }
    if (diff < 1000 * 60 * 60 * 24) {
      return `${Math.floor(diff / (1000 * 60 * 60))}h`;
    }
    if (diff < 1000 * 60 * 60 * 24 * 7) {
      return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d`;
    }
    return date.toLocaleDateString();
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 p-4
        transition-all duration-200
        ${isSelected 
          ? 'bg-brand-500/10 border-l-2 border-l-brand-500' 
          : 'hover:bg-surface-2 border-l-2 border-l-transparent'
        }
        ${unreadCount > 0 ? 'bg-surface-1/50' : ''}
      `}
    >
      <Avatar user={otherUser} size="md" />
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
            {displayName}
          </span>
          <span className="text-xs text-text-tertiary ml-2 flex-shrink-0">
            {formatTime(lastMessageAt)}
          </span>
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-text-secondary' : 'text-text-tertiary'}`}>
          {lastMessage}
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        {isStarred && <Star className="w-3 h-3 text-warning-500 fill-warning-500" />}
        {unreadCount > 0 && (
          <div className="min-w-[18px] h-[18px] rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </div>
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────────────────────────────────────── */
const MessageBubble = ({ message, isOwn, showAvatar, otherUser }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {showAvatar && !isOwn ? (
        <Avatar user={otherUser} size="sm" />
      ) : (
        <div className="w-8" />
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-2.5 rounded-2xl
          ${isOwn 
            ? 'bg-brand-500 text-white rounded-br-md' 
            : 'bg-surface-2 text-text-primary rounded-bl-md'
          }
          ${message.__optimistic ? 'opacity-70' : ''}
        `}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-xs text-text-tertiary">{time}</span>
          {message.isEdited && <span className="text-xs text-text-tertiary">(edited)</span>}
          {message.__optimistic && <span className="text-xs text-text-tertiary">Sending...</span>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   NEW MESSAGE MODAL
───────────────────────────────────────────────────────────────────────── */
const NewMessageModal = ({ isOpen, onClose, onConversationCreated, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchUsers(searchQuery);
      const filtered = results.filter(u => (u._id || u.id) !== currentUserId);
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, currentUserId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setMessageContent('');
      setError('');
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!selectedUser || !messageContent.trim()) {
      setError('Please select a recipient and enter a message');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const conversation = await messagesApi.getOrCreateDirect(selectedUser._id || selectedUser.id);
      await messagesApi.sendMessage({
        conversationId: conversation._id || conversation.id,
        content: messageContent.trim(),
        type: 'text',
        clientMessageId: generateClientMessageId(),
      });
      onConversationCreated(conversation);
      onClose();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-1 rounded-2xl border border-white/[0.06] w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold text-text-primary">New Message</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">To:</label>
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
                <Avatar user={selectedUser} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1 rounded hover:bg-white/10 text-text-tertiary">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-2 border border-white/[0.06] text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none transition-colors"
                  autoFocus
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary animate-spin" />}
              </div>
            )}

            {searchResults.length > 0 && !selectedUser && (
              <div className="mt-2 bg-surface-2 border border-white/[0.06] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user._id || user.id}
                    onClick={() => { setSelectedUser(user); setSearchQuery(''); setSearchResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <Avatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedUser && (
              <div className="mt-2 p-4 bg-surface-2 rounded-lg text-center">
                <User className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No users found</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Message:</label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg resize-none bg-surface-2 border border-white/[0.06] text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-white/[0.06]">
          <button onClick={onClose} disabled={isSending} className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedUser || !messageContent.trim() || isSending}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Message</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN MESSAGES PAGE
───────────────────────────────────────────────────────────────────────── */
export default function Messages() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  // Auth
  const { user: currentUser } = useAuth?.() || { user: null };
  const currentUserId = currentUser?._id || currentUser?.id || '';
  
  // ⭐ WebSocket integration
  const { joinConversationRoom, leaveConversationRoom, sendTypingStart, sendTypingStop } = useSocketContext?.() || {};
  
  // Local state
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════

  const { 
    data: conversations = [], 
    isLoading: loadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const selectedConversation = conversations.find(c => (c._id || c.id) === selectedConversationId);

  const {
    data: messagesData,
    isLoading: loadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => messagesApi.getMessages(selectedConversationId),
    enabled: !!selectedConversationId,
    staleTime: 10 * 1000,
  });

  const messages = messagesData?.messages || [];

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => messagesApi.getUnreadCount(),
    staleTime: 30 * 1000,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ⭐ WEBSOCKET EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  // Handle new message from WebSocket
  useSocketEvent?.('message:new', useCallback((data) => {
    if (data.conversationId === selectedConversationId) {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        messages: [...(old?.messages || []), data.message],
        hasMore: old?.hasMore || false,
      }));
    }
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  }, [selectedConversationId, queryClient]));

  // Handle typing indicators
  useSocketEvent?.('typing:user', useCallback((data) => {
    if (data.conversationId !== selectedConversationId) return;
    
    setTypingUsers(prev => {
      if (data.isTyping) {
        if (!prev.includes(data.username)) {
          return [...prev, data.username];
        }
      } else {
        return prev.filter(u => u !== data.username);
      }
      return prev;
    });
  }, [selectedConversationId]));

  // Handle message edited
  useSocketEvent?.('message:edited', useCallback((data) => {
    if (data.conversationId === selectedConversationId) {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).map(m => 
          (m._id || m.id) === data.messageId 
            ? { ...m, content: data.content, isEdited: true, editedAt: data.editedAt }
            : m
        ),
      }));
    }
  }, [selectedConversationId, queryClient]));

  // Handle message deleted
  useSocketEvent?.('message:deleted', useCallback((data) => {
    if (data.conversationId === selectedConversationId) {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).map(m => 
          (m._id || m.id) === data.messageId 
            ? { ...m, isDeleted: true, content: '[Message deleted]' }
            : m
        ),
      }));
    }
  }, [selectedConversationId, queryClient]));

  // ═══════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════

  const sendMessageMutation = useMutation({
    mutationFn: (data) => messagesApi.sendMessage(data),
    onMutate: async (newMessage) => {
      // Optimistic update
      const optimisticMessage = {
        _id: newMessage.clientMessageId,
        content: newMessage.content,
        senderId: { _id: currentUserId },
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };
      
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        messages: [...(old?.messages || []), optimisticMessage],
        hasMore: old?.hasMore || false,
      }));
      
      return { optimisticMessage };
    },
    onSuccess: (newMessage, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).map(m => 
          m._id === variables.clientMessageId ? newMessage : m
        ),
      }));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
    },
    onError: (error, variables, context) => {
      // Remove optimistic message on error
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).filter(m => m._id !== variables.clientMessageId),
      }));
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId) => messagesApi.markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: ({ conversationId, isPinned }) => 
      messagesApi.updateSettings(conversationId, { isPinned: !isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversation && (selectedConversation.unreadCount || 0) > 0) {
      markAsReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  // ⭐ Join/leave conversation room for WebSocket
  useEffect(() => {
    if (selectedConversationId && joinConversationRoom) {
      joinConversationRoom(selectedConversationId);
      return () => {
        if (leaveConversationRoom) {
          leaveConversationRoom(selectedConversationId);
        }
      };
    }
  }, [selectedConversationId, joinConversationRoom, leaveConversationRoom]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const displayName = getConversationDisplayName(conv, currentUserId).toLowerCase();
      const lastMessage = (conv.lastMessage?.content || '').toLowerCase();
      if (!displayName.includes(searchLower) && !lastMessage.includes(searchLower)) return false;
    }
    if (filter === 'unread') return (conv.unreadCount || 0) > 0;
    if (filter === 'starred') return conv.isPinned;
    return true;
  });

  const handleSelectConversation = (conv) => {
    setSelectedConversationId(conv._id || conv.id);
    setTypingUsers([]);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // ⭐ Send typing indicator (throttled)
    if (sendTypingStart && selectedConversationId) {
      const now = Date.now();
      if (now - lastTypingRef.current > 2000) {
        sendTypingStart(selectedConversationId);
        lastTypingRef.current = now;
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (sendTypingStop) sendTypingStop(selectedConversationId);
      }, 3000);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    
    // Stop typing indicator
    if (sendTypingStop) sendTypingStop(selectedConversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageInput.trim(),
      type: 'text',
      clientMessageId: generateClientMessageId(),
    });
  };

  const handleMarkAllAsRead = () => {
    conversations.forEach(conv => {
      if ((conv.unreadCount || 0) > 0) {
        markAsReadMutation.mutate(conv._id || conv.id);
      }
    });
  };

  const handleConversationCreated = (conversation) => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setSelectedConversationId(conversation._id || conversation.id);
  };

  const selectedOtherUser = selectedConversation ? getOtherParticipant(selectedConversation, currentUserId) : null;
  const hasUnreadMessages = conversations.some(c => (c.unreadCount || 0) > 0);

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 h-full">
        
        {/* LEFT: Conversation List */}
        <aside className="rounded-2xl border border-white/[0.06] bg-surface-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComposer(true)}
                  className="p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                  title="New message"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-2 border border-white/[0.06] text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="flex gap-1 mt-3">
              {['all', 'unread', 'starred'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                    filter === f ? 'bg-brand-500/10 text-brand-400' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  {f}
                  {f === 'unread' && unreadData?.total > 0 && <span className="ml-1 text-brand-400">({unreadData.total})</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <ConversationSkeleton />
            ) : conversationsError ? (
              <ErrorState message="Failed to load conversations" onRetry={refetchConversations} />
            ) : filteredConversations.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {filteredConversations.map(conv => (
                  <ConversationItem
                    key={conv._id || conv.id}
                    conversation={conv}
                    isSelected={selectedConversationId === (conv._id || conv.id)}
                    onClick={() => handleSelectConversation(conv)}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No conversations yet</p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No messages found</p>
              </div>
            )}
          </div>
          
          {hasUnreadMessages && (
            <div className="p-3 border-t border-white/[0.06] bg-surface-0">
              <button
                onClick={handleMarkAllAsRead}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-2 transition-colors"
              >
                <Archive className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}
        </aside>

        {/* RIGHT: Message Thread */}
        <section className="rounded-2xl border border-white/[0.06] bg-surface-1 h-full flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar user={selectedOtherUser} size="md" />
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">
                      {getConversationDisplayName(selectedConversation, currentUserId)}
                    </h3>
                    <p className="text-xs text-text-tertiary">
                      {selectedConversation.type === 'direct' ? 'Direct message' : selectedConversation.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStarMutation.mutate({ conversationId: selectedConversationId, isPinned: selectedConversation.isPinned })}
                    className={`p-2 rounded-lg hover:bg-surface-2 transition-colors ${selectedConversation.isPinned ? 'text-warning-500' : 'text-text-tertiary'}`}
                  >
                    <Star className={`w-4 h-4 ${selectedConversation.isPinned ? 'fill-warning-500' : ''}`} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"><Phone className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"><Video className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <MessagesSkeleton />
                ) : messagesError ? (
                  <ErrorState message="Failed to load messages" onRetry={refetchMessages} />
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble
                        key={msg._id || msg.id || i}
                        message={msg}
                        isOwn={isOwnMessage(msg, currentUserId)}
                        showAvatar={i === 0 || !isOwnMessage(messages[i-1], currentUserId)}
                        otherUser={selectedOtherUser}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">No messages yet</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Typing Indicator */}
              <TypingIndicator users={typingUsers} />
              
              {/* Input */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5 text-text-tertiary" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.06] text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className={`w-5 h-5 ${sendMessageMutation.isPending ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Select a conversation</h3>
                <p className="text-sm text-text-secondary max-w-sm">Choose a message from the list or start a new conversation</p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      
      <NewMessageModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        onConversationCreated={handleConversationCreated}
        currentUserId={currentUserId}
      />
    </div>
  );
}
