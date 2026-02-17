// src/api/messages.js
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES API CLIENT
// Matches backend MessagesController endpoints exactly
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Get all conversations for current user
export const getConversations = async (includeArchived = false) => {
  const response = await client.get('/messages/conversations', {
    params: { includeArchived },
  });
  return response.data?.data || response.data || [];
};

// Get a specific conversation by ID
export const getConversation = async (conversationId) => {
  const response = await client.get(`/messages/conversations/${conversationId}`);
  return response.data?.data || response.data;
};

// Create a new conversation
export const createConversation = async (data) => {
  // data: { type, participantIds, name?, description?, projectId?, taskId? }
  const response = await client.post('/messages/conversations', data);
  return response.data?.data || response.data;
};

// Get or create a direct conversation with a user
export const getOrCreateDirectConversation = async (recipientId) => {
  const response = await client.post('/messages/conversations/direct', {
    recipientId,
  });
  return response.data?.data || response.data;
};

// Update conversation settings (mute, pin, archive)
export const updateConversationSettings = async (conversationId, settings) => {
  // settings: { isMuted?, isPinned?, isArchived?, notificationsEnabled? }
  const response = await client.patch(
    `/messages/conversations/${conversationId}/settings`,
    settings
  );
  return response.data?.data || response.data;
};

// Add participant to conversation
export const addParticipant = async (conversationId, userId) => {
  const response = await client.post(
    `/messages/conversations/${conversationId}/participants`,
    { userId }
  );
  return response.data?.data || response.data;
};

// Remove participant from conversation
export const removeParticipant = async (conversationId, userId) => {
  const response = await client.delete(
    `/messages/conversations/${conversationId}/participants/${userId}`
  );
  return response.data?.data || response.data;
};

// Leave a conversation
export const leaveConversation = async (conversationId) => {
  const response = await client.post(`/messages/conversations/${conversationId}/leave`);
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

// Get messages in a conversation
export const getMessages = async (conversationId, options = {}) => {
  const { limit = 50, before, after } = options;
  const response = await client.get(`/messages/conversations/${conversationId}/messages`, {
    params: { limit, before, after },
  });
  return {
    messages: response.data?.data || response.data?.messages || [],
    hasMore: response.data?.meta?.hasMore || false,
  };
};

// Send a message
export const sendMessage = async (data) => {
  // data: { conversationId, content, type?, energy?, threadParentId?, mentions?, linkedTaskId?, clientMessageId? }
  const response = await client.post('/messages', data);
  return response.data?.data || response.data;
};

// Edit a message
export const editMessage = async (messageId, content) => {
  const response = await client.put(`/messages/${messageId}`, { content });
  return response.data?.data || response.data;
};

// Delete a message
export const deleteMessage = async (messageId) => {
  const response = await client.delete(`/messages/${messageId}`);
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// THREADS
// ─────────────────────────────────────────────────────────────────────────────

// Get thread messages
export const getThreadMessages = async (threadParentId) => {
  const response = await client.get(`/messages/threads/${threadParentId}`);
  return response.data?.data || response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// REACTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Add reaction to message
export const addReaction = async (messageId, emoji) => {
  const response = await client.post(`/messages/${messageId}/reactions`, { emoji });
  return response.data?.data || response.data;
};

// Remove reaction from message
export const removeReaction = async (messageId, emoji) => {
  const response = await client.delete(
    `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
  );
  return response.data?.data || response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// READ STATUS
// ─────────────────────────────────────────────────────────────────────────────

// Mark a specific message as read
export const markMessageAsRead = async (messageId) => {
  const response = await client.patch(`/messages/${messageId}/read`);
  return response.data;
};

// Mark all messages in conversation as read
export const markConversationAsRead = async (conversationId) => {
  const response = await client.patch(`/messages/conversations/${conversationId}/read`);
  return response.data;
};

// Get unread message count
export const getUnreadCount = async () => {
  const response = await client.get('/messages/unread-count');
  return response.data?.data || response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

// Search messages
export const searchMessages = async (query, conversationId, limit = 20) => {
  const response = await client.get('/messages/search', {
    params: { q: query, conversationId, limit },
  });
  return response.data?.data || response.data || [];
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Get display name for a conversation
export const getConversationDisplayName = (conversation, currentUserId) => {
  if (!conversation) return 'Unknown';

  if (conversation.name) return conversation.name;

  if (conversation.type === 'direct') {
    const otherParticipant = getOtherParticipant(conversation, currentUserId);
    if (otherParticipant) {
      const { firstName, lastName, username, email } = otherParticipant;
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
      return username || email || 'Unknown User';
    }
  }

  return conversation.type === 'group' ? 'Group Chat' : 'Conversation';
};

// Get the other participant in a direct conversation
export const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation?.participants) return null;

  const participant = conversation.participants.find((p) => {
    const userId = p.userId?._id || p.userId?.id || p.userId;
    return String(userId) !== String(currentUserId);
  });

  return participant?.userId || participant;
};

// Get sender name from message
export const getSenderName = (message) => {
  const sender = message?.senderId;
  if (!sender) return 'Unknown';

  if (sender.firstName || sender.lastName) {
    return `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
  }
  return sender.username || sender.email || 'Unknown';
};

// Check if message is from current user
export const isOwnMessage = (message, currentUserId) => {
  const senderId = message?.senderId?._id || message?.senderId?.id || message?.senderId;
  return String(senderId) === String(currentUserId);
};

// Get user initials for avatar
export const getUserInitials = (user) => {
  if (!user) return '?';

  const first = user.firstName?.[0] || user.username?.[0] || user.email?.[0] || '';
  const last = user.lastName?.[0] || '';

  return (first + last).toUpperCase() || '?';
};

// Generate client message ID for deduplication
export const generateClientMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

// IMPORTANT:
// Some parts of the app import { messagesApi } as a NAMED export.
// Others import default.
// To avoid breaking either, we export BOTH.

export const messagesApi = {
  // Conversations
  getConversations,
  getConversation,
  createConversation,
  getOrCreateDirect: getOrCreateDirectConversation,
  updateSettings: updateConversationSettings,
  addParticipant,
  removeParticipant,
  leaveConversation,

  // Messages
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,

  // Threads
  getThreadMessages,

  // Reactions
  addReaction,
  removeReaction,

  // Read Status
  markMessageAsRead,
  markConversationRead: markConversationAsRead,
  getUnreadCount,

  // Search
  searchMessages,
};

export default messagesApi;
