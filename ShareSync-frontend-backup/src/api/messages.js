import client from './client';

/**
 * Message API Client
 * Handles all REST API calls for messaging
 */

// Get all conversations for current user
export const getConversations = async () => {
  const response = await client.get('/messages/conversations');
  return response.data;
};

// Get messages in a specific conversation
export const getMessages = async (conversationId, limit = 50) => {
  const response = await client.get(`/messages/conversation/${conversationId}`, {
    params: { limit },
  });
  return response.data;
};

// Get thread messages
export const getThread = async (threadParentId) => {
  const response = await client.get(`/messages/thread/${threadParentId}`);
  return response.data;
};

// Send a new message
export const sendMessage = async (data) => {
  const response = await client.post('/messages/send', data);
  return response.data;
};

// Mark message as read
export const markMessageAsRead = async (messageId) => {
  const response = await client.patch(`/messages/${messageId}/read`);
  return response.data;
};

// Mark all messages in conversation as read
export const markConversationAsRead = async (conversationId) => {
  const response = await client.patch(`/messages/conversation/${conversationId}/read`);
  return response.data;
};

// Get unread message count
export const getUnreadCount = async () => {
  const response = await client.get('/messages/unread-count');
  return response.data;
};

// Delete a message
export const deleteMessage = async (messageId) => {
  const response = await client.delete(`/messages/${messageId}`);
  return response.data;
};

// Create a new conversation (helper function)
export const createConversation = async (recipientId) => {
  // Generate a unique conversation ID (timestamp + recipient)
  const conversationId = `dm_${recipientId}_${Date.now()}`;
  return conversationId;
};
