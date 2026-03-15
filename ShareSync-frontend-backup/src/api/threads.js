// src/api/threads.js
import client from './client';

export const getProjectThreads = async (projectId, options = {}) => {
  const params = new URLSearchParams();
  if (options.category) params.append('category', options.category);
  if (options.isPinned !== undefined) params.append('isPinned', options.isPinned);
  const response = await client.get(`/threads/project/${projectId}?${params.toString()}`);
  return response.data?.data || response.data || [];
};

export const getThread = async (threadId) => {
  const response = await client.get(`/threads/${threadId}`);
  return response.data?.data || response.data;
};

export const createThread = async (data) => {
  const response = await client.post('/threads', data);
  return response.data?.data || response.data;
};

export const updateThread = async (threadId, data) => {
  const response = await client.put(`/threads/${threadId}`, data);
  return response.data?.data || response.data;
};

export const deleteThread = async (threadId) => {
  const response = await client.delete(`/threads/${threadId}`);
  return response.data?.data || response.data;
};

// Messages — matches ThreadMessagesController: @Controller('thread-messages')
// GET /api/thread-messages/:threadId
// POST /api/thread-messages/:threadId
export const getThreadMessages = async (threadId) => {
  try {
    const res = await client.get(`/thread-messages/${threadId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data.reverse() : [];
  } catch {
    return [];
  }
};

export const postThreadMessage = async (threadId, content) => {
  const res = await client.post(`/thread-messages/${threadId}`, { content });
  return res.data?.data || res.data;
};

export default { getProjectThreads, getThread, createThread, updateThread, deleteThread, getThreadMessages, postThreadMessage };
