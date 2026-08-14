// src/pages/Messages.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC MESSAGES PAGE v4.4 - Resolved Current User + Safe Participant Logic
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
  ArrowLeft,
} from 'lucide-react';

// API (Removed getUserInitials and getOtherParticipant - we use local pure functions now)
import {
  messagesApi,
  isOwnMessage,
  generateClientMessageId,
} from '../lib/api/messages';

// WebSocket & Auth context
import { useSocketContext, useSocketEvent } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import useDocumentTitle from "../hooks/useDocumentTitle";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

/* ─────────────────────────────────────────────────────────────────────────
   ⭐ LOCAL PURE HELPERS (safe current-user resolution + safe participant logic)
───────────────────────────────────────────────────────────────────────── */

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readStoredUser = () => {
  try {
    const raw =
      localStorage.getItem('ss.user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('auth.user');

    if (!raw) return null;

    const parsed = safeParseJSON(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const readAvatarOverride = () => {
  try {
    return localStorage.getItem('ss.avatarOverride') || null;
  } catch {
    return null;
  }
};

const resolveAvatarUrl = (u) => {
  if (!u) return null;
  return (
    u.avatarUrl ||
    u.profilePicture ||
    u.avatar ||
    u.photoUrl ||
    u.profile?.avatarUrl ||
    u.profile?.photoUrl ||
    null
  );
};

const extractId = (value) => {
  if (!value) return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    return String(
      value._id ||
      value.id ||
      value.userId?._id ||
      value.userId?.id ||
      value.user?._id ||
      value.user?.id ||
      value.member?._id ||
      value.member?.id ||
      value.sub ||
      ''
    );
  }

  return '';
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

// account-deletion-deleted-user-presentation-v1
//
// Mongoose populate replaces a User ref with null when the referenced User
// document no longer exists. Permanent account deletion deliberately retains
// some historical shared content, so represent that state explicitly in the
// UI without creating a fake/live User account.
const DELETED_USER_PLACEHOLDER = Object.freeze({
  firstName: 'Deleted',
  lastName: 'user',
  displayName: 'Deleted user',
  username: null,
  email: null,
  avatar: null,
  avatarUrl: null,
  profilePicture: null,
  deleted: true,
});

const unwrapParticipantUser = (participant) => {
  if (!participant) return null;

  // A populated User reference becomes null when that User document has been
  // permanently deleted. The participant wrapper survives in a direct
  // conversation so the other person can retain the conversation history.
  if (
    typeof participant === 'object' &&
    Object.prototype.hasOwnProperty.call(participant, 'userId') &&
    participant.userId === null
  ) {
    return DELETED_USER_PLACEHOLDER;
  }

  if (participant.userId && typeof participant.userId === 'object') return participant.userId;
  if (participant.user && typeof participant.user === 'object') return participant.user;
  if (participant.member && typeof participant.member === 'object') return participant.member;

  return participant;
};

const isSameUser = (a, b) => {
  if (!a || !b) return false;

  const aId = extractId(a);
  const bId = extractId(b);
  if (aId && bId) return aId === bId;

  const aEmail = normalizeText(a.email);
  const bEmail = normalizeText(b.email);
  if (aEmail && bEmail) return aEmail === bEmail;

  const aUsername = normalizeText(a.username || a.handle);
  const bUsername = normalizeText(b.username || b.handle);
  if (aUsername && bUsername) return aUsername === bUsername;

  return false;
};

const resolveCurrentUser = (authUser) => {
  const storedUser = readStoredUser();
  const avatarOverride = readAvatarOverride();

  const merged = {
    ...(storedUser || {}),
    ...(authUser || {}),
  };

  const resolvedAvatar =
    avatarOverride ||
    resolveAvatarUrl(authUser) ||
    resolveAvatarUrl(storedUser) ||
    null;

  return {
    ...merged,
    _resolvedId: extractId(authUser) || extractId(storedUser),
    avatarUrl: resolvedAvatar || merged.avatarUrl || merged.profilePicture || null,
    profilePicture: resolvedAvatar || merged.profilePicture || merged.avatarUrl || null,
  };
};

const getSafeOtherParticipant = (conversation, currentUser) => {
  const participants = (conversation?.participants || [])
    .map(unwrapParticipantUser)
    .filter(Boolean);

  if (!participants.length) return null;

  const other = participants.find((participant) => !isSameUser(participant, currentUser));

  if (other) {
    if (typeof window !== 'undefined') {
      console.log('[AVATAR DEBUG] other participant raw fields:', {
        id: other._id || other.id,
        firstName: other.firstName,
        profilePicture: other.profilePicture,
        avatarUrl: other.avatarUrl,
        avatar: other.avatar,
        photoUrl: other.photoUrl,
        image: other.image,
        allKeys: Object.keys(other),
      });
    }
    return {
      ...other,
      avatarUrl: resolveAvatarUrl(other),
      profilePicture: other.profilePicture || resolveAvatarUrl(other),
    };
  }

  const fallback = participants[0] || null;

  return fallback
    ? {
        ...fallback,
        avatarUrl: resolveAvatarUrl(fallback),
        profilePicture: fallback.profilePicture || resolveAvatarUrl(fallback),
      }
    : null;
};

const getSafeDisplayName = (conversation, currentUser) => {
  if (!conversation) return 'Unknown';

  if (conversation.type === 'direct') {
    const other = getSafeOtherParticipant(conversation, currentUser);

    if (other) {
      const first = (other.firstName || '').trim();
      const last = (other.lastName || '').trim();
      const full = [first, last].filter(Boolean).join(' ').trim();

      if (full) return full;
      if (other.username) return other.username;
      if (other.email) return other.email;
    }

    return 'Unknown User';
  }

  if (conversation.name) return conversation.name;
  return conversation.type === 'group' ? 'Group Chat' : 'Conversation';
};

const getInitialsLocal = (user) => {
  if (!user) return '?';

  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();

  if (first || last) {
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  }

  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();

  return '?';
};

const getMessageSenderCandidate = (message) => {
  if (!message) return null;

  // Same populated-null rule as conversation participants. This is
  // presentation-only and deliberately carries no deleted account identity.
  if (
    Object.prototype.hasOwnProperty.call(message, 'senderId') &&
    message.senderId === null
  ) {
    return DELETED_USER_PLACEHOLDER;
  }

  return message.senderId || message.sender || message.user || null;
};

const isOwnMessageSafe = (message, currentUser) => {
  const sender = getMessageSenderCandidate(message);
  const currentId = extractId(currentUser);

  if (sender && isSameUser(sender, currentUser)) {
    return true;
  }

  const senderId = extractId(sender);
  if (senderId && currentId) {
    return senderId === currentId;
  }

  return isOwnMessage(message, currentId);
};

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
      return [];
    }
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   LOADING SKELETONS - Adaptive
───────────────────────────────────────────────────────────────────────── */
const ConversationSkeleton = () => (
  <div className="p-4 space-y-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const MessagesSkeleton = () => (
  <div className="p-4 space-y-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
        {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />}
        <div className={`space-y-1 ${i % 2 === 0 ? 'items-end' : ''}`}>
          <div className={`h-16 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
          <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-16 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   ERROR STATE - Adaptive
───────────────────────────────────────────────────────────────────────── */
const ErrorState = ({ message, onRetry }) => (
  <div className="p-8 text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
    <p className="text-sm text-slate-500 dark:text-zinc-400 mb-2">{message || 'Something went wrong'}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#1f1f23] hover:bg-slate-200 dark:hover:bg-[#27272a] text-sm transition-colors text-slate-900 dark:text-white"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   AVATAR COMPONENT - Adaptive
───────────────────────────────────────────────────────────────────────── */
const Avatar = ({ user, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = getInitialsLocal(user);
  const avatarUrl = resolveAvatarUrl(user);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={`${user?.firstName || user?.username || 'User'} avatar`}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="font-medium text-violet-700 dark:text-violet-400">{initials}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   TYPING INDICATOR - Adaptive
───────────────────────────────────────────────────────────────────────── */
const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const text = users.length === 1
    ? `${users[0]} is typing...`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing...`
    : `${users[0]} and ${users.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 dark:text-zinc-400">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   CONVERSATION LIST ITEM - Adaptive
───────────────────────────────────────────────────────────────────────── */
const ConversationItem = ({ conversation, isSelected, onClick, currentUser }) => {
  const otherUser = getSafeOtherParticipant(conversation, currentUser);
  const displayName = conversation.type === 'direct'
    ? getSafeDisplayName(conversation, currentUser)
    : (conversation.name || 'Conversation');

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
          ? 'bg-violet-50 dark:bg-violet-500/10 border-l-2 border-l-violet-500'
          : 'hover:bg-slate-50 dark:hover:bg-[#1f1f23] border-l-2 border-l-transparent'
        }
      `}
    >
      <Avatar user={otherUser} size="md" />

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
            {displayName}
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-500 ml-2 flex-shrink-0">
            {formatTime(lastMessageAt)}
          </span>
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-500 dark:text-zinc-500'}`}>
          {lastMessage}
        </p>
      </div>

      <div className="flex flex-col items-center gap-1">
        {isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
        {unreadCount > 0 && (
          <div className="min-w-[18px] h-[18px] rounded-full bg-violet-500 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </div>
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MESSAGE BUBBLE - Adaptive
───────────────────────────────────────────────────────────────────────── */
const MessageBubble = ({ message, isOwn, showAvatar, currentUser, otherUser }) => {
  const timeSource = message.createdAt || message.sentAt || message.timestamp || new Date().toISOString();
  const time = new Date(timeSource).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const bubbleUser = isOwn ? currentUser : otherUser;

  if (isOwn) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[70%]">
          <div className={`
            px-4 py-2.5 rounded-2xl
            bg-violet-600 text-white rounded-br-md shadow-sm
            ${message.__optimistic ? 'opacity-70' : ''}
          `}>
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="text-xs text-slate-500 dark:text-zinc-500">{time}</span>
            {message.isEdited && <span className="text-xs text-slate-500 dark:text-zinc-500">(edited)</span>}
            {message.__optimistic && <span className="text-xs text-slate-500 dark:text-zinc-500">Sending...</span>}
          </div>
        </div>

        {showAvatar ? (
          <Avatar user={bubbleUser} size="sm" />
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      {showAvatar ? (
        <Avatar user={bubbleUser} size="sm" />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className="max-w-[70%]">
        <div className={`
          px-4 py-2.5 rounded-2xl
          bg-slate-100 dark:bg-[#1f1f23] text-slate-800 dark:text-zinc-200 rounded-bl-md border border-slate-200 dark:border-[#27272a] shadow-sm dark:shadow-none
          ${message.__optimistic ? 'opacity-70' : ''}
        `}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500 dark:text-zinc-500">{time}</span>
          {message.isEdited && <span className="text-xs text-slate-500 dark:text-zinc-500">(edited)</span>}
          {message.__optimistic && <span className="text-xs text-slate-500 dark:text-zinc-500">Sending...</span>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   NEW MESSAGE MODAL - Adaptive
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
      const filtered = results.filter(u => extractId(u) !== String(currentUserId));
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
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
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#111113] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-[#1f1f23] shadow-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#1f1f23]">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Message</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f23] text-slate-500 dark:text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">To:</label>
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-500/10 rounded-lg border border-violet-200 dark:border-violet-500/20">
                <Avatar user={selectedUser} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-500/20 text-slate-500 dark:text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#1f1f23] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                  autoFocus
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 animate-spin" />}
              </div>
            )}

            {searchResults.length > 0 && !selectedUser && (
              <div className="mt-2 bg-white dark:bg-[#111113] border border-slate-200 dark:border-[#1f1f23] rounded-lg overflow-hidden max-h-48 overflow-y-auto shadow-lg">
                {searchResults.map((user) => (
                  <button
                    key={user._id || user.id}
                    onClick={() => { setSelectedUser(user); setSearchQuery(''); setSearchResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-[#1f1f23] transition-colors text-left"
                  >
                    <Avatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedUser && (
              <div className="mt-2 p-4 bg-slate-50 dark:bg-[#09090B] rounded-lg text-center border border-slate-200 dark:border-[#1f1f23]">
                <User className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-zinc-500">No users found</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">Message:</label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg resize-none bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#1f1f23] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B]">
          <button onClick={onClose} disabled={isSending} className="px-4 py-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-[#1f1f23] transition-colors disabled:opacity-50 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedUser || !messageContent.trim() || isSending}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm font-medium"
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
  useDocumentTitle("Messages");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectMobile = () => {
      const layoutWidth = window.innerWidth || 9999;
      const visualWidth = window.visualViewport?.width || layoutWidth;
      const screenWidth = window.screen?.width || layoutWidth;
      const narrowestWidth = Math.min(layoutWidth, visualWidth, screenWidth);

      const ua = navigator.userAgent || '';
      const isTouchPhone =
        navigator.maxTouchPoints > 0 &&
        /iPhone|iPod|Android|Mobile/i.test(ua);

      return narrowestWidth <= 900 || isTouchPhone;
    };

    const update = () => setIsMobileView(detectMobile());

    update();

    const query = window.matchMedia('(max-width: 900px)');
    query.addEventListener?.('change', update);
    window.visualViewport?.addEventListener?.('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      query.removeEventListener?.('change', update);
      window.visualViewport?.removeEventListener?.('resize', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Auth
  const { user: authUser } = useAuth?.() || { user: null };
  const currentUser = React.useMemo(() => resolveCurrentUser(authUser), [authUser]);
  const currentUserId = currentUser?._resolvedId || '';

  // WebSocket integration
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

  const selectedConversation = conversations.find(c => String(c._id || c.id) === String(selectedConversationId));

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
  // WEBSOCKET EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  useSocketEvent?.('message:new', useCallback((data) => {
    if (String(data.conversationId) === String(selectedConversationId)) {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        messages: [...(old?.messages || []), data.message],
        hasMore: old?.hasMore || false,
      }));
    }
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  }, [selectedConversationId, queryClient]));

  useSocketEvent?.('typing:user', useCallback((data) => {
    if (String(data.conversationId) !== String(selectedConversationId)) return;

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

  useSocketEvent?.('message:edited', useCallback((data) => {
    if (String(data.conversationId) === String(selectedConversationId)) {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).map(m =>
          String(m._id || m.id) === String(data.messageId)
            ? { ...m, content: data.content, isEdited: true, editedAt: data.editedAt }
            : m
        ),
      }));
    }
  }, [selectedConversationId, queryClient]));

  useSocketEvent?.('message:deleted', useCallback((data) => {
    if (String(data.conversationId) === String(selectedConversationId)) {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).map(m =>
          String(m._id || m.id) === String(data.messageId)
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
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).map(m =>
          String(m._id || m.id) === String(variables.clientMessageId) ? newMessage : m
        ),
      }));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['messages', selectedConversationId], (old) => ({
        ...old,
        messages: (old?.messages || []).filter(m => String(m._id || m.id) !== String(variables.clientMessageId)),
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && (selectedConversation.unreadCount || 0) > 0) {
      markAsReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

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
      const displayName = getSafeDisplayName(conv, currentUser).toLowerCase();
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

  const selectedOtherUser = selectedConversation
    ? getSafeOtherParticipant(selectedConversation, currentUser)
    : null;

  const hasUnreadMessages = conversations.some(c => (c.unreadCount || 0) > 0);

  return (
    <div className="h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-slate-50 dark:bg-[#09090B] transition-colors duration-300 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 h-full min-h-0">

        {/* LEFT: Conversation List */}
        <aside className={`messages-mobile-list ${selectedConversation ? 'messages-hide-on-mobile' : ''} flex rounded-2xl border border-slate-200 dark:border-[#1f1f23] bg-white dark:bg-[#111113] overflow-hidden flex-col shadow-sm dark:shadow-none transition-colors duration-300 min-h-0`}>
          <div className="p-4 border-b border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Messages</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Direct and private conversations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComposer(true)}
                  className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition-colors"
                  title="New message"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f23] text-slate-500 dark:text-zinc-400 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search direct messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#1f1f23] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
              />
            </div>

            <div className="flex gap-1 mt-3">
              {['all', 'unread', 'starred'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                    filter === f ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1f1f23]'
                  }`}
                >
                  {f}
                  {f === 'unread' && unreadData?.total > 0 && <span className="ml-1 text-violet-600 dark:text-violet-400">({unreadData.total})</span>}
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
              <div className="divide-y divide-slate-100 dark:divide-[#1f1f23]">
                {filteredConversations.map(conv => (
                  <ConversationItem
                    key={conv._id || conv.id}
                    conversation={conv}
                    isSelected={String(selectedConversationId) === String(conv._id || conv.id)}
                    onClick={() => handleSelectConversation(conv)}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-zinc-500">No direct messages yet</p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-zinc-500">No direct messages found</p>
              </div>
            )}
          </div>

          {hasUnreadMessages && (
            <div className="p-3 border-t border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B]">
              <button
                onClick={handleMarkAllAsRead}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-[#1f1f23] transition-colors"
              >
                <Archive className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}
        </aside>

        {/* RIGHT: Message Thread */}
        <section className={`messages-mobile-thread ${selectedConversation ? '' : 'messages-hide-on-mobile'} flex rounded-2xl border border-slate-200 dark:border-[#1f1f23] bg-white dark:bg-[#111113] shadow-sm dark:shadow-none h-full flex-col overflow-hidden transition-colors duration-300 min-h-0`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-[#1f1f23] flex items-center justify-between bg-slate-50 dark:bg-[#09090B] transition-colors duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConversationId(null)}
                    className="messages-mobile-back hidden p-2 -ml-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1f1f23] text-slate-500 dark:text-zinc-400 transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar user={selectedOtherUser} size="md" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {getSafeDisplayName(selectedConversation, currentUser)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">
                      {selectedConversation.type === 'direct' ? 'Direct message' : selectedConversation.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStarMutation.mutate({ conversationId: selectedConversationId, isPinned: selectedConversation.isPinned })}
                    className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1f1f23] transition-colors ${selectedConversation.isPinned ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'}`}
                  >
                    <Star className={`w-4 h-4 ${selectedConversation.isPinned ? 'fill-amber-500' : ''}`} />
                  </button>
                  {!isMobileView && (
                    <>
                      <button className="max-[900px]:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1f1f23] text-slate-400 dark:text-zinc-500 transition-colors"><Phone className="w-4 h-4" /></button>
                      <button className="max-[900px]:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1f1f23] text-slate-400 dark:text-zinc-500 transition-colors"><Video className="w-4 h-4" /></button>
                      <button className="max-[900px]:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1f1f23] text-slate-400 dark:text-zinc-500 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#111113] transition-colors duration-300">
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
                        isOwn={isOwnMessageSafe(msg, currentUser)}
                        showAvatar={i === 0 || !isOwnMessageSafe(messages[i - 1], currentUser)}
                        currentUser={currentUser}
                        otherUser={selectedOtherUser}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-zinc-500">No messages yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Typing Indicator */}
              <TypingIndicator users={typingUsers} />

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B] transition-colors duration-300">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-[#1f1f23] rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5 text-slate-500 dark:text-zinc-500" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-[#111113] border border-slate-200 dark:border-[#1f1f23] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors shadow-sm dark:shadow-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="p-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    <Send className={`w-5 h-5 ${sendMessageMutation.isPending ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#111113]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Select a direct message</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-500 max-w-sm">Choose a direct message from the list or start a new one</p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors"
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
