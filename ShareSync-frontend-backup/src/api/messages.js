// src/api/messages.js
import api from './axios';

/**
 * Get all messages for a project
 * @param {string} projectId - Project ID
 * @param {object} params - Query parameters (page, limit, type, resolved)
 * @returns {Promise} Messages data
 */
export const getMessages = async (projectId, params = {}) => {
  const response = await api.get(`/projects/${projectId}/messages`, { params });
  return response.data;
};

/**
 * Send a new message
 * @param {string} projectId - Project ID
 * @param {object} messageData - { content, type }
 * @returns {Promise} Created message
 */
export const sendMessage = async (projectId, messageData) => {
  const response = await api.post(`/projects/${projectId}/messages`, messageData);
  return response.data;
};

/**
 * Update a message
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @param {object} updates - { content }
 * @returns {Promise} Updated message
 */
export const updateMessage = async (projectId, messageId, updates) => {
  const response = await api.put(`/projects/${projectId}/messages/${messageId}`, updates);
  return response.data;
};

/**
 * Delete a message
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @returns {Promise}
 */
export const deleteMessage = async (projectId, messageId) => {
  const response = await api.delete(`/projects/${projectId}/messages/${messageId}`);
  return response.data;
};

/**
 * Add reaction to message
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji to add
 * @returns {Promise} Updated message
 */
export const addReaction = async (projectId, messageId, emoji) => {
  const response = await api.post(`/projects/${projectId}/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

/**
 * Remove reaction from message
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji to remove
 * @returns {Promise} Updated message
 */
export const removeReaction = async (projectId, messageId, emoji) => {
  const response = await api.delete(`/projects/${projectId}/messages/${messageId}/reactions/${emoji}`);
  return response.data;
};

/**
 * Mark message as resolved
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @returns {Promise} Updated message
 */
export const resolveMessage = async (projectId, messageId) => {
  const response = await api.post(`/projects/${projectId}/messages/${messageId}/resolve`);
  return response.data;
};

/**
 * Mark message as unresolved
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @returns {Promise} Updated message
 */
export const unresolveMessage = async (projectId, messageId) => {
  const response = await api.delete(`/projects/${projectId}/messages/${messageId}/resolve`);
  return response.data;
};

/**
 * Get unread message count
 * @param {string} projectId - Project ID
 * @returns {Promise} { unreadCount: number }
 */
export const getUnreadCount = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/messages/unread`);
  return response.data;
};

/**
 * Mark message as read
 * @param {string} projectId - Project ID
 * @param {string} messageId - Message ID
 * @returns {Promise}
 */
export const markAsRead = async (projectId, messageId) => {
  const response = await api.post(`/projects/${projectId}/messages/${messageId}/read`);
  return response.data;
};
