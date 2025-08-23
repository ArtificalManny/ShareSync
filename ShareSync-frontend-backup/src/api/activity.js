// /src/api/activity.js
import client from './client';

/**
 * Get activity feed.
 * @param {Object} opts
 * @param {'user'|'project'} opts.scope
 * @param {string=} opts.projectId
 * @param {string=} opts.cursor
 * @param {number=} opts.limit
 */
export async function getActivity({ scope = 'user', projectId, cursor, limit = 20 } = {}) {
  const { data } = await client.get('/activity', {
    params: { scope, projectId, cursor, limit },
  });
  // expected shape:
  // { items: ActivityItem[], nextCursor: string|null }
  return data || { items: [], nextCursor: null };
}
