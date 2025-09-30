import client from './client';

/**
 * Create a post in a project
 * @param {string} projectId
 * @param {{ body: string, attachments?: string[]|object[], mentions?: string[] }} payload
 */
export async function createPost(projectId, payload = {}) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.post(`/projects/${encodeURIComponent(projectId)}/posts`, payload);
  return data;
}

/**
 * List posts for a project
 * @param {string} projectId
 * @param {{ cursor?: string, limit?: number }} params
 */
export async function listPosts(projectId, params = {}) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/projects/${encodeURIComponent(projectId)}/posts`, { params });
  return data; // { items, nextCursor }
}

/** Get a single post */
export async function getPost(projectId, postId) {
  if (!projectId) throw new Error('projectId is required');
  if (!postId) throw new Error('postId is required');
  const { data } = await client.get(`/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}`);
  return data;
}

/** Update a post */
export async function updatePost(projectId, postId, patch = {}) {
  if (!projectId) throw new Error('projectId is required');
  if (!postId) throw new Error('postId is required');
  const { data } = await client.patch(`/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}`, patch);
  return data;
}

/** Delete a post */
export async function deletePost(projectId, postId) {
  if (!projectId) throw new Error('projectId is required');
  if (!postId) throw new Error('postId is required');
  const { data } = await client.delete(`/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}`);
  return data;
}

/**
 * Add a comment to a post
 * @param {string} projectId
 * @param {string} postId
 * @param {{ text: string, mentions?: string[] }} payload
 */
export async function addComment(projectId, postId, payload = {}) {
  if (!projectId) throw new Error('projectId is required');
  if (!postId) throw new Error('postId is required');
  const { data } = await client.post(
    `/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}/comments`,
    payload
  );
  return data;
}

/** List comments on a post */
export async function listComments(projectId, postId, params = {}) {
  if (!projectId) throw new Error('projectId is required');
  if (!postId) throw new Error('postId is required');
  const { data } = await client.get(
    `/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}/comments`,
    { params }
  );
  return data; // { items, nextCursor }
}

/**
 * Toggle a reaction (emoji/shortcode) on a post
 * @param {string} projectId
 * @param {string} postId
 * @param {string} reaction e.g. '👍' or 'heart'
 */
export async function toggleReaction(projectId, postId, reaction) {
  if (!projectId) throw new Error('projectId is required');
  if (!postId) throw new Error('postId is required');
  if (!reaction) throw new Error('reaction is required');
  const safe = encodeURIComponent(reaction);
  const { data } = await client.post(
    `/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}/reactions/${safe}/toggle`
  );
  return data;
}

export default {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  addComment,
  listComments,
  toggleReaction,
};
