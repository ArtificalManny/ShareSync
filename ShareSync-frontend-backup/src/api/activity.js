// src/api/activity.js
import client from './client';

export async function getActivity({ scope, projectId, userId, range = '7d', cursor, limit = 20 }) {
  const params = new URLSearchParams();
  params.set('scope', scope);
  if (projectId) params.set('projectId', projectId);
  if (userId) params.set('userId', userId);
  if (range) params.set('range', range);
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const { data } = await client.get(`/activity?${params.toString()}`);
  return data; // { items, nextCursor }
}