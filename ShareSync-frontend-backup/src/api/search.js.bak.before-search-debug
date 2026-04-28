// src/api/search.js
// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED SEARCH — Calls existing endpoints in parallel, merges results
// ─────────────────────────────────────────────────────────────────────────────
// No dedicated /api/search endpoint needed. We query:
//   1. GET /discovery?q=...         → public/listed projects
//   2. GET /projects?search=...     → user's own projects
//   3. GET /users/search?q=...      → users by name/username
//   4. GET /tasks?search=...        → tasks across user's projects
//
// All calls run in parallel via Promise.allSettled for resilience.
// Results are normalized into a unified { id, type, title, description, url } shape.
// ═══════════════════════════════════════════════════════════════════════════════

import api from "./client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function unwrap(res) {
  return res?.data?.data ?? res?.data;
}

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val?.items && Array.isArray(val.items)) return val.items;
  if (val?.projects && Array.isArray(val.projects)) return val.projects;
  if (val?.tasks && Array.isArray(val.tasks)) return val.tasks;
  if (val?.results && Array.isArray(val.results)) return val.results;
  return [];
}

// ─── Individual search functions ────────────────────────────────────────────

/**
 * Search public/listed projects via discovery endpoint
 */
export async function searchPublicListedProjects(query, limit = 10) {
  if (!query || query.length < 2) return [];

  try {
    const res = await api.get('/discovery', { params: { q: query, limit } });
    const data = unwrap(res);
    const items = safeArray(data);

    return items.map((p) => ({
      id: String(p._id || p.id),
      type: 'project',
      title: p.name || p.title || 'Untitled Project',
      description: p.description || (Array.isArray(p.tags) && p.tags.length ? `Tags: ${p.tags.join(', ')}` : 'Public project'),
      url: `/projects/${p._id || p.id}`,
      raw: p,
    }));
  } catch (err) {
    console.warn('[search] Discovery search failed:', err?.message);
    return [];
  }
}

/**
 * Search user's own projects
 */
async function searchUserProjects(query, limit = 10) {
  if (!query || query.length < 2) return [];

  try {
    const res = await api.get('/projects', { params: { search: query, limit } });
    const data = unwrap(res);
    const items = safeArray(data);

    return items.map((p) => ({
      id: String(p._id || p.id),
      type: 'project',
      title: p.name || p.title || 'Untitled Project',
      description: p.description || 'Your project',
      url: `/projects/${p._id || p.id}`,
      raw: p,
    }));
  } catch (err) {
    console.warn('[search] User projects search failed:', err?.message);
    return [];
  }
}

/**
 * Search users by name/username/email
 */
async function searchUsers(query, limit = 10) {
  if (!query || query.length < 2) return [];

  try {
    const res = await api.get('/users/search', { params: { q: query, limit } });
    const data = unwrap(res);
    const items = safeArray(data);

    return items.map((u) => {
      const name = u.firstName
        ? `${u.firstName} ${u.lastName || ''}`.trim()
        : u.username || u.email || 'User';
      const desc = u.username
        ? `@${u.username}`
        : u.email || 'Member';

      return {
        id: String(u._id || u.id),
        type: 'person',
        title: name,
        description: desc,
        url: `/users/${u.username || u._id || u.id}`,
        raw: u,
      };
    });
  } catch (err) {
    console.warn('[search] User search failed:', err?.message);
    return [];
  }
}

/**
 * Search tasks across all user's projects
 */
async function searchTasks(query, limit = 10) {
  if (!query || query.length < 2) return [];

  try {
    const res = await api.get('/tasks', { params: { search: query, limit, sortBy: 'updatedAt', sortOrder: 'desc' } });
    const data = unwrap(res);
    const items = safeArray(data);

    return items.map((t) => {
      const projectName = t.projectId?.name || t.project?.name || null;
      const desc = [
        t.status ? `Status: ${t.status}` : null,
        projectName ? `in ${projectName}` : null,
      ].filter(Boolean).join(' · ') || 'Task';

      return {
        id: String(t._id || t.id),
        type: 'task',
        title: t.title || 'Untitled Task',
        description: desc,
        url: `/projects/${t.projectId?._id || t.projectId || 'unknown'}`,
        raw: t,
      };
    });
  } catch (err) {
    console.warn('[search] Task search failed:', err?.message);
    return [];
  }
}

// ─── Unified search ─────────────────────────────────────────────────────────

/**
 * searchAll — Run all search types in parallel, merge and dedupe results
 *
 * Supports:
 *   searchAll("query")
 *   searchAll({ q: "query", types: ["project", "task", "person"], limit: 25 })
 */
export async function searchAll(payloadOrQuery) {
  const isString = typeof payloadOrQuery === 'string';
  const q = isString ? payloadOrQuery : (payloadOrQuery?.q ?? '');
  const limit = isString ? 10 : (payloadOrQuery?.limit ?? 10);
  const requestedTypes = isString
    ? ['project', 'task', 'person']
    : (payloadOrQuery?.types ?? ['project', 'task', 'person']);

  if (!q || q.length < 2) return [];

  // Build parallel fetch list based on requested types
  const fetchers = [];

  if (requestedTypes.includes('project')) {
    fetchers.push(searchPublicListedProjects(q, limit));
    fetchers.push(searchUserProjects(q, limit));
  }
  if (requestedTypes.includes('person') || requestedTypes.includes('user')) {
    fetchers.push(searchUsers(q, limit));
  }
  if (requestedTypes.includes('task')) {
    fetchers.push(searchTasks(q, limit));
  }

  // Run all in parallel — resilient to individual failures
  const settled = await Promise.allSettled(fetchers);

  // Merge results
  const allResults = [];
  for (const result of settled) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allResults.push(...result.value);
    }
  }

  // Dedupe by id+type (prefer first occurrence)
  const seen = new Set();
  const deduped = [];
  for (const item of allResults) {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export const search = searchAll;

export default {
  searchAll,
  search: searchAll,
  searchPublicListedProjects,
};
