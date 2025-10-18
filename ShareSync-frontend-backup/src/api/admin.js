// src/api/admin.js
import client from "./client";

export async function listUsers(params) {
    return safeList("/api/admin/users", params);
  }
  export async function listProjects(params) {
    return safeList("/api/admin/projects", params);
  }
  export async function listInvites(params) {
    return safeList("/api/admin/invites", params);
  }  
// Normalize various server shapes to { items: [], total: number }
function normalizeListResponse(data) {
    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }
    const items = Array.isArray(data?.items) ? data.items : [];
    const total =
      typeof data?.total === "number"
        ? data.total
        : typeof data?.count === "number"
        ? data.count
        : items.length;
    return { items, total };
  }
  
  async function safeList(url, params) {
    try {
      const { data } = await client.get(url, { params });
      return normalizeListResponse(data);
    } catch (e) {
      // Soft-fail: keep the Admin Console usable even if backend is missing
      if (import.meta?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[admin api] fallback", url, e?.message);
      }
      return { items: [], total: 0 };
    }
  }
  