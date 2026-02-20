import client from './client';

/**
 * Fetch all threads for a specific project
 */
export const getProjectThreads = async (projectId, options = {}) => {
  const params = new URLSearchParams();
  if (options.category) params.append('category', options.category);
  if (options.isPinned !== undefined) params.append('isPinned', options.isPinned);

  const response = await client.get(`/threads/project/${projectId}?${params.toString()}`);
  return response.data?.data || [];
};

/**
 * Create a new thread
 */
export const createThread = async (data) => {
  const response = await client.post('/threads', data);
  return response.data?.data;
};

export default { getProjectThreads, createThread };
