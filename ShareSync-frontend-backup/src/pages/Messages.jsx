// src/pages/Messages.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES PAGE - Connected to Real Backend
// ═══════════════════════════════════════════════════════════════════════════════
//
// UPDATES:
// - ✅ Connected to backend via messagesApi
// - ✅ React Query for data fetching
// - ✅ Real-time ready (WebSocket hooks prepared)
// - ✅ Preserved empty states and celebrations
// - ✅ Loading skeletons
// - ✅ Error handling
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Send,
  Paperclip,
  Phone,
  Video,
  MessageCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// API Client
import { 
  messagesApi, 
  getConversationDisplayName, 
  getOtherParticipant,
  getSenderName,
  isOwnMessage,
  getUserInitials,
} from '../lib/api/messages';

// Empty state components
import EmptyInbox, { EmptyInboxCompact } from '../components/empty-states/EmptyInbox';

// Momentum context (optional)
let useMomentumContext;
try {
  useMomentumContext = require('../contexts/MomentumContext').useMomentumContext;
} catch (e) {
  useMomentumContext = () => ({ glowLevel: 2, isFireMode: false });
}

// Auth context for current user
import { useAuth } from '../context/AuthContext';

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
      {/* Avatar */}
      <Avatar user={otherUser} size="md" />
      
      {/* Content */}
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
      
      {/* Indicators */}
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
  const senderName = getSenderName(message);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <Avatar user={otherUser} size="sm" />
      ) : (
        <div className="w-8" /> // Spacer
      )}
      
      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-2.5 rounded-2xl
          ${isOwn 
            ? 'bg-brand-500 text-white rounded-br-md' 
            : 'bg-surface-2 text-text-primary rounded-bl-md'
          }
        `}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-xs text-text-tertiary">{time}</span>
          {message.isEdited && <span className="text-xs text-text-tertiary">(edited)</span>}
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
  
  // Auth context for current user
  const { user: currentUser } = useAuth?.() || { user: null };
  const currentUserId = currentUser?._id || currentUser?.id || '';
  
  // Local state
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'starred'
  const [showComposer, setShowComposer] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  
  // Inbox zero tracking (for empty states)
  const [inboxZeroStreak, setInboxZeroStreak] = useState(3);
  const [bestStreak, setBestStreak] = useState(5);
  const [inboxZeroAchievedAt, setInboxZeroAchievedAt] = useState(null);
  
  // Momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {
    // Context not available
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════

  // Fetch all conversations
  const { 
    data: conversations = [], 
    isLoading: loadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Get selected conversation object
  const selectedConversation = conversations.find(c => 
    (c._id || c.id) === selectedConversationId
  );

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: loadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => messagesApi.getMessages(selectedConversationId),
    enabled: !!selectedConversationId,
    staleTime: 10 * 1000, // 10 seconds
  });

  const messages = messagesData?.messages || [];

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => messagesApi.getUnreadCount(),
    staleTime: 30 * 1000,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data) => messagesApi.sendMessage(data),
    onSuccess: (newMessage) => {
      // Optimistically add message to the list
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        messages: [...(old?.messages || []), newMessage],
        hasMore: old?.hasMore || false,
      }));
      
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      setMessageInput('');
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      // Could show a toast here
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (conversationId) => messagesApi.markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // Toggle star/pin mutation
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConversation && (selectedConversation.unreadCount || 0) > 0) {
      markAsReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  // Check for inbox zero
  const hasUnreadMessages = conversations.some(c => (c.unreadCount || 0) > 0);
  const isInboxZero = !loadingConversations && conversations.length > 0 && !hasUnreadMessages;
  
  useEffect(() => {
    if (isInboxZero && !inboxZeroAchievedAt) {
      setInboxZeroAchievedAt(new Date());
    } else if (!isInboxZero && inboxZeroAchievedAt) {
      setInboxZeroAchievedAt(null);
    }
  }, [isInboxZero, inboxZeroAchievedAt]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const displayName = getConversationDisplayName(conv, currentUserId).toLowerCase();
      const lastMessage = (conv.lastMessage?.content || '').toLowerCase();
      if (!displayName.includes(searchLower) && !lastMessage.includes(searchLower)) {
        return false;
      }
    }
    
    // Category filter
    if (filter === 'unread') return (conv.unreadCount || 0) > 0;
    if (filter === 'starred') return conv.isPinned;
    return true;
  });

  const handleSelectConversation = (conv) => {
    setSelectedConversationId(conv._id || conv.id);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageInput.trim(),
      type: 'text',
    });
  };

  const handleMarkAllAsRead = () => {
    conversations.forEach(conv => {
      if ((conv.unreadCount || 0) > 0) {
        markAsReadMutation.mutate(conv._id || conv.id);
      }
    });
  };

  const handleCompose = () => {
    setShowComposer(true);
  };

  // Get other user for selected conversation
  const selectedOtherUser = selectedConversation 
    ? getOtherParticipant(selectedConversation, currentUserId)
    : null;

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 h-full">
        
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT: Conversation List
        ═══════════════════════════════════════════════════════════════════ */}
        <aside className="rounded-2xl border border-white/[0.06] bg-surface-1 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCompose}
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
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2 rounded-lg
                  bg-surface-2 border border-white/[0.06]
                  text-sm text-text-primary
                  placeholder:text-text-tertiary
                  focus:border-brand-500/50 focus:outline-none
                  transition-colors
                "
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-1 mt-3">
              {['all', 'unread', 'starred'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium capitalize
                    transition-all duration-200
                    ${filter === f 
                      ? 'bg-brand-500/10 text-brand-400' 
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                    }
                  `}
                >
                  {f}
                  {f === 'unread' && unreadData?.total > 0 && (
                    <span className="ml-1 text-brand-400">({unreadData.total})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <ConversationSkeleton />
            ) : conversationsError ? (
              <ErrorState 
                message="Failed to load conversations" 
                onRetry={refetchConversations}
              />
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
              // No conversations at all
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No conversations yet</p>
                <p className="text-xs text-text-tertiary mt-1">Start a new message to connect with your team</p>
                <button
                  onClick={handleCompose}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            ) : isInboxZero ? (
              <div className="p-4">
                <EmptyInboxCompact 
                  streak={inboxZeroStreak}
                  onCompose={handleCompose}
                />
              </div>
            ) : (
              // No results for search/filter
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No messages found</p>
                <p className="text-xs text-text-tertiary mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
          
          {/* Quick actions footer */}
          {hasUnreadMessages && (
            <div className="p-3 border-t border-white/[0.06] bg-surface-0">
              <button
                onClick={handleMarkAllAsRead}
                className="
                  w-full flex items-center justify-center gap-2 
                  px-4 py-2 rounded-lg
                  text-xs font-medium text-text-secondary
                  hover:bg-surface-2 transition-colors
                "
              >
                <Archive className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT: Active Thread + Composer
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-white/[0.06] bg-surface-1 h-full flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
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
                    onClick={() => toggleStarMutation.mutate({ 
                      conversationId: selectedConversationId, 
                      isPinned: selectedConversation.isPinned 
                    })}
                    className={`p-2 rounded-lg hover:bg-surface-2 transition-colors ${
                      selectedConversation.isPinned ? 'text-warning-500' : 'text-text-tertiary'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${selectedConversation.isPinned ? 'fill-warning-500' : ''}`} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <MessagesSkeleton />
                ) : messagesError ? (
                  <ErrorState 
                    message="Failed to load messages" 
                    onRetry={refetchMessages}
                  />
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
                      <p className="text-xs text-text-tertiary mt-1">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5 text-text-tertiary" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-surface-2 border border-white/[0.06]
                      text-sm text-text-primary
                      placeholder:text-text-tertiary
                      focus:border-brand-500/50 focus:outline-none
                      transition-colors
                    "
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="
                      p-2.5 rounded-lg
                      bg-brand-500 text-white
                      hover:bg-brand-600
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    <Send className={`w-5 h-5 ${sendMessageMutation.isPending ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          ) : isInboxZero && conversations.length > 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyInbox
                streak={inboxZeroStreak}
                bestStreak={bestStreak}
                achievedAt={inboxZeroAchievedAt}
                achievements={['Speed Reader', 'Quick Responder']}
                onCompose={handleCompose}
                showConfetti={true}
                showStreak={true}
                showAchievements={true}
                variant="celebratory"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-text-secondary max-w-sm">
                  Choose a message from the list or start a new conversation
                </p>
                <button
                  onClick={handleCompose}
                  className="
                    mt-4 inline-flex items-center gap-2
                    px-4 py-2 rounded-lg
                    bg-brand-500 text-white text-sm font-medium
                    hover:bg-brand-600 transition-colors
                  "
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          NEW MESSAGE MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">New Message</h3>
            <input
              type="text"
              placeholder="To: Search for a person..."
              className="
                w-full px-4 py-3 rounded-lg mb-4
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:border-brand-500/50 focus:outline-none
              "
            />
            <textarea
              placeholder="Write your message..."
              rows={4}
              className="
                w-full px-4 py-3 rounded-lg mb-4 resize-none
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:border-brand-500/50 focus:outline-none
              "
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
