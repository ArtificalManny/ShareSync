// src/api/messages.js
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES API CLIENT
// Matches backend MessagesController endpoints exactly
// DEBUG PATCH: avatar/payload diagnostics for /messages route
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DEBUG_MESSAGES_AVATARS =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.DEV;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null;

const extractComparableId = (value) => {
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
        value.userId ||
        value.senderId?._id ||
        value.senderId?.id ||
        value.senderId ||
        ''
    );
  }

  return '';
};

const unwrapParticipantUser = (participant) => {
  if (!participant) return null;

  if (participant.userId && typeof participant.userId === 'object') {
    return participant.userId;
  }

  return participant;
};

const snapshotUser = (user) => {
  if (!user) return null;

  return {
    id: user._id || user.id || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    username: user.username || null,
    email: user.email || null,
    profilePicture:
      typeof user.profilePicture === 'object'
        ? JSON.stringify(user.profilePicture)
        : user.profilePicture || null,
    avatarUrl:
      typeof user.avatarUrl === 'object'
        ? JSON.stringify(user.avatarUrl)
        : user.avatarUrl || null,
    avatar:
      typeof user.avatar === 'object'
        ? JSON.stringify(user.avatar)
        : user.avatar || null,
    photoUrl:
      typeof user.photoUrl === 'object'
        ? JSON.stringify(user.photoUrl)
        : user.photoUrl || null,
    image:
      typeof user.image === 'object'
        ? JSON.stringify(user.image)
        : user.image || null,
  };
};

const logConversationAvatarSnapshot = (conversations) => {
  if (!DEBUG_MESSAGES_AVATARS) return;

  const list = safeArray(conversations);

  console.groupCollapsed(
    `[messagesApi.getConversations] avatar snapshot (${list.length} conversations)`
  );

  list.slice(0, 10).forEach((conversation, index) => {
    const participants = safeArray(conversation?.participants).map((participant) =>
      snapshotUser(unwrapParticipantUser(participant))
    );

    const otherUser = snapshotUser(
      conversation?.otherUser ||
        conversation?.otherParticipant ||
        conversation?.recipient ||
        conversation?.recipientId ||
        null
    );

    console.log(`conversation[${index}]`, {
      id: conversation?._id || conversation?.id || null,
      type: conversation?.type || null,
      name: conversation?.name || null,
      otherUser,
      participants,
      lastMessage: safeObject(conversation?.lastMessage)
        ? {
            content: conversation.lastMessage.content || null,
            senderId:
              conversation.lastMessage.senderId?._id ||
              conversation.lastMessage.senderId?.id ||
              conversation.lastMessage.senderId ||
              null,
          }
        : null,
    });
  });

  console.groupEnd();
};

const logMessagesAvatarSnapshot = (conversationId, messages, rawResponse) => {
  if (!DEBUG_MESSAGES_AVATARS) return;

  const list = safeArray(messages);

  console.groupCollapsed(
    `[messagesApi.getMessages] avatar snapshot (conversation=${conversationId}, messages=${list.length})`
  );

  console.log('raw response', rawResponse);

  list.slice(0, 12).forEach((message, index) => {
    console.log(`message[${index}]`, {
      id: message?._id || message?.id || null,
      content: message?.content || message?.text || null,
      sender: snapshotUser(message?.senderId || message?.sender || message?.user || null),
      recipient: snapshotUser(message?.recipientId || message?.recipient || null),
    });
  });

  console.groupEnd();
};

const normalizeMessagesResponse = (responseData) => {
  const dataLayer = responseData?.data ?? responseData;

  // Shape A: { data: { messages: [...], hasMore } }
  if (Array.isArray(dataLayer?.messages)) {
    return {
      messages: dataLayer.messages,
      hasMore: Boolean(dataLayer.hasMore ?? responseData?.meta?.hasMore),
    };
  }

  // Shape B: { messages: [...], hasMore }
  if (Array.isArray(responseData?.messages)) {
    return {
      messages: responseData.messages,
      hasMore: Boolean(responseData.hasMore ?? responseData?.meta?.hasMore),
    };
  }

  // Shape C: { data: [...] }
  if (Array.isArray(dataLayer)) {
    return {
      messages: dataLayer,
      hasMore: Boolean(responseData?.meta?.hasMore),
    };
  }

  // Shape D: raw [...]
  if (Array.isArray(responseData)) {
    return {
      messages: responseData,
      hasMore: false,
    };
  }

  return {
    messages: [],
    hasMore: Boolean(dataLayer?.hasMore ?? responseData?.hasMore ?? responseData?.meta?.hasMore),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Get all conversations for current user
export const getConversations = async (includeArchived = false) => {
  const response = await client.get('/messages/conversations', {
    params: { includeArchived },
  });

  const payload = response.data?.data || response.data || [];

  logConversationAvatarSnapshot(payload);

  return payload;
};

// Get a specific conversation by ID
export const getConversation = async (conversationId) => {
  const response = await client.get(`/messages/conversations/${conversationId}`);
  const payload = response.data?.data || response.data;

  if (DEBUG_MESSAGES_AVATARS) {
    console.groupCollapsed(`[messagesApi.getConversation] ${conversationId}`);
    console.log('payload', payload);
    console.groupEnd();
  }

  return payload;
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

  const payload = response.data?.data || response.data;

  if (DEBUG_MESSAGES_AVATARS) {
    console.groupCollapsed(
      `[messagesApi.getOrCreateDirectConversation] recipient=${recipientId}`
    );
    console.log('payload', payload);
    console.groupEnd();
  }

  return payload;
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

  const normalized = normalizeMessagesResponse(response.data);

  logMessagesAvatarSnapshot(conversationId, normalized.messages, response.data);

  return normalized;
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
  if (!conversation) return null;

  const explicitOther =
    conversation.otherUser ||
    conversation.otherParticipant ||
    conversation.recipient ||
    conversation.recipientId ||
    null;

  if (explicitOther) return explicitOther;

  if (!conversation.participants) return null;

  const currentId = String(currentUserId || '');

  const participant = conversation.participants.find((p) => {
    const candidate = unwrapParticipantUser(p);
    const userId = extractComparableId(candidate);
    return userId && userId !== currentId;
  });

  return unwrapParticipantUser(participant) || participant || null;
};

// Get sender name from message
export const getSenderName = (message) => {
  const sender = message?.senderId || message?.sender || message?.user;
  if (!sender) return 'Unknown';

  if (sender.firstName || sender.lastName) {
    return `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
  }
  return sender.username || sender.email || 'Unknown';
};

// Check if message is from current user
export const isOwnMessage = (message, currentUserId) => {
  const sender = message?.senderId || message?.sender || message?.user;
  const senderId = extractComparableId(sender);
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
