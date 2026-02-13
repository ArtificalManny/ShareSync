// src/lib/api/messages.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES API CLIENT - Self-contained with axios setup
// ═══════════════════════════════════════════════════════════════════════════════

import axios, { AxiosInstance } from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT SETUP
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('ss.jwt') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken'); // legacy key (optional)

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[messagesApi] Authentication error (401) - token may be expired');
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (matching backend schemas)
// ─────────────────────────────────────────────────────────────────────────────

export type ConversationType = 'direct' | 'group' | 'project' | 'task';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  username?: string;
}

export interface ConversationParticipant {
  userId: string | User;
  joinedAt: string;
  lastReadAt?: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  notificationsEnabled: boolean;
}

export interface LastMessagePreview {
  messageId?: string;
  content?: string;
  senderId?: string;
  senderName?: string;
  sentAt?: string;
}

export interface Conversation {
  _id: string;
  id?: string;
  type: ConversationType;
  name?: string;
  description?: string;
  icon?: string;
  participants: ConversationParticipant[];
  createdBy?: string;
  projectId?: string;
  taskId?: string;
  lastMessage?: LastMessagePreview;
  lastActivityAt?: string;
  isActive?: boolean;
  messageCount?: number;
  unreadCount?: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface MessageReadBy {
  userId: string;
  readAt: string;
}

export interface Message {
  _id: string;
  id?: string;
  conversationId: string;
  senderId: string | User;
  content: string;
  type: 'text' | 'system' | 'file' | 'image';
  energy?: 'async' | 'normal' | 'urgent' | 'critical';
  energyCost?: number;
  threadParentId?: string;
  threadReplyCount?: number;
  lastReplyAt?: string;
  mentions?: string[];
  reactions?: MessageReaction[];
  readBy?: MessageReadBy[];
  linkedTaskId?: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS + MESSAGES API
// ─────────────────────────────────────────────────────────────────────────────

export const messagesApi = {
  async getConversations(includeArchived = false): Promise<Conversation[]> {
    const res = await api.get('/messages/conversations', {
      params: { includeArchived: includeArchived.toString() },
    });
    return res.data?.data || [];
  },

  async getOrCreateDirect(recipientId: string): Promise<Conversation> {
    const res = await api.post('/messages/conversations/direct', { recipientId });
    return res.data?.data;
  },

  async createConversation(data: {
    type: ConversationType;
    participantIds: string[];
    name?: string;
    description?: string;
    projectId?: string;
    taskId?: string;
  }): Promise<Conversation> {
    const res = await api.post('/messages/conversations', data);
    return res.data?.data;
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const res = await api.get(`/messages/conversations/${conversationId}`);
    return res.data?.data;
  },

  async updateSettings(
    conversationId: string,
    settings: {
      isMuted?: boolean;
      isPinned?: boolean;
      isArchived?: boolean;
      notificationsEnabled?: boolean;
    }
  ): Promise<Conversation> {
    const res = await api.patch(`/messages/conversations/${conversationId}/settings`, settings);
    return res.data?.data;
  },

  async addParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const res = await api.post(`/messages/conversations/${conversationId}/participants`, { userId });
    return res.data?.data;
  },

  async removeParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const res = await api.delete(`/messages/conversations/${conversationId}/participants/${userId}`);
    return res.data?.data;
  },

  async leaveConversation(conversationId: string): Promise<void> {
    await api.post(`/messages/conversations/${conversationId}/leave`);
  },

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string; after?: string }
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const res = await api.get(`/messages/conversations/${conversationId}/messages`, {
      params: options,
    });
    return {
      messages: res.data?.data || [],
      hasMore: res.data?.meta?.hasMore || false,
    };
  },

  async sendMessage(data: {
    conversationId: string;
    content: string;
    type?: 'text' | 'file' | 'image';
    energy?: 'async' | 'normal' | 'urgent' | 'critical';
    threadParentId?: string;
    mentions?: string[];
    linkedTaskId?: string;
    clientMessageId?: string;
  }): Promise<Message> {
    const res = await api.post('/messages', data);
    return res.data?.data;
  },

  async editMessage(messageId: string, content: string): Promise<Message> {
    const res = await api.put(`/messages/${messageId}`, { content });
    return res.data?.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },

  async getThread(threadParentId: string): Promise<{ parent: Message; replies: Message[] }> {
    const res = await api.get(`/messages/threads/${threadParentId}`);
    return res.data?.data;
  },

  async addReaction(messageId: string, emoji: string): Promise<Message> {
    const res = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return res.data?.data;
  },

  async removeReaction(messageId: string, emoji: string): Promise<Message> {
    const res = await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    return res.data?.data;
  },

  async markMessageRead(messageId: string): Promise<void> {
    await api.patch(`/messages/${messageId}/read`);
  },

  async markConversationRead(conversationId: string): Promise<void> {
    await api.patch(`/messages/conversations/${conversationId}/read`);
  },

  async getUnreadCount(): Promise<{ total: number; byConversation: Record<string, number> }> {
    const res = await api.get('/messages/unread-count');
    return res.data?.data || { total: 0, byConversation: {} };
  },

  async search(query: string, conversationId?: string, limit?: number): Promise<Message[]> {
    const res = await api.get('/messages/search', {
      params: { q: query, conversationId, limit },
    });
    return res.data?.data || [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getParticipantUser(participant: ConversationParticipant): User | null {
  if (!participant?.userId) return null;
  if (typeof participant.userId === 'string') return null;
  return participant.userId;
}

export function getOtherParticipant(conversation: Conversation, currentUserId: string): User | null {
  if (!conversation || conversation.type !== 'direct') return null;

  const other = (conversation.participants || []).find((p) => {
    const id = typeof p.userId === 'string' ? p.userId : p.userId?._id;
    return id && id !== currentUserId;
  });

  return other ? getParticipantUser(other) : null;
}

export function getConversationDisplayName(conversation: Conversation, currentUserId: string): string {
  if (!conversation) return 'Conversation';
  if (conversation.name) return conversation.name;

  if (conversation.type === 'direct') {
    const other = getOtherParticipant(conversation, currentUserId);
    if (other) {
      const name = `${other.firstName || ''} ${other.lastName || ''}`.trim();
      return name || other.email || 'Unknown User';
    }
    return 'Direct Message';
  }

  if (conversation.type === 'group') {
    const names = (conversation.participants || [])
      .slice(0, 3)
      .map((p) => {
        const user = getParticipantUser(p);
        return user?.firstName || 'User';
      })
      .join(', ');
    return names + ((conversation.participants || []).length > 3 ? '...' : '');
  }

  return 'Conversation';
}

export function getMessageSender(message: Message): User | null {
  if (!message || typeof message.senderId === 'string') return null;
  return message.senderId;
}

export function getSenderName(message: Message): string {
  const sender = getMessageSender(message);
  if (!sender) return 'Unknown';
  const name = `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
  return name || sender.email || 'Unknown';
}

export function isOwnMessage(message: Message, currentUserId: string): boolean {
  const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
  return !!senderId && senderId === currentUserId;
}

export function getUserAvatar(user: User | null): string | undefined {
  return user?.avatar;
}

export function getUserInitials(user: User | null): string {
  if (!user) return '?';
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}

export default messagesApi;
