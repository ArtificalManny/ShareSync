// /src/api/search.js

/**
 * Lightweight search helpers for the Command Palette.
 * If a backend endpoint exists at GET /api/search?q=..., we'll use it.
 * Otherwise we gracefully return empty arrays so the palette
 * still works for routes + sprint actions.
 *
 * Expected backend response shape (flexible):
 * {
 *   projects: [{ _id, id, title, name }],
 *   tasks: [{ _id, id, title, projectId, projectTitle }]
 * }
 */

const API_BASE = "/api";

function toJsonSafe(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function coerceProject(p) {
  if (!p || typeof p !== "object") return null;
  return {
    _id: p._id ?? p.id ?? String(p.slug || ""),
    title: p.title ?? p.name ?? "Untitled project",
  };
}

function coerceTask(t) {
  if (!t || typeof t !== "object") return null;
  return {
    _id: t._id ?? t.id ?? String(t.slug || ""),
    title: t.title ?? "Untitled task",
    projectId: t.projectId ?? t.project_id ?? null,
    projectTitle: t.projectTitle ?? t.project_name ?? null,
  };
}

/**
 * Try backend search; fall back to empty arrays if not available.
 * @param {string} q
 * @returns {Promise<{projects: any[], tasks: any[]}>}
 */
export async function searchAll(q) {
  const query = (q ?? "").trim();
  if (!query) return { projects: [], tasks: [] };

  // Attempt a backend search endpoint if present.
  // If it 404s or errors, we swallow and return empty.
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    const data = await toJsonSafe(res);

    const projects = Array.isArray(data?.projects)
      ? data.projects.map(coerceProject).filter(Boolean)
      : [];
    const tasks = Array.isArray(data?.tasks)
      ? data.tasks.map(coerceTask).filter(Boolean)
      : [];

    return { projects, tasks };
  } catch {
    // Graceful fallback: palette still usable for routes & sprint actions
    return { projects: [], tasks: [] };
  }
}

/**
 * If you later add dedicated endpoints, you can wire these:
 * export async function searchProjects(q) { ... }
 * export async function searchTasks(q) { ... }
 */
