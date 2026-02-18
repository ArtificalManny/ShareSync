// src/utils/api.js
// Legacy helper still used in parts of the app.
// Updated to use Vite env (VITE_API_URL) instead of hardcoding localhost:3000.

const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";
const API_BASE = RAW_BASE.replace(/\/$/, "") + "/api";

function getToken() {
  return localStorage.getItem("ss.token") || localStorage.getItem("ss.jwt") || "";
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  // Let callers decide how to handle non-2xx, but give useful text
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const err = new Error(`API ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Convenience wrappers
export const apiGet = (p) => apiFetch(p, { method: "GET" });
export const apiPost = (p, body) => apiFetch(p, { method: "POST", body: JSON.stringify(body) });
export const apiPut = (p, body) => apiFetch(p, { method: "PUT", body: JSON.stringify(body) });
export const apiPatch = (p, body) => apiFetch(p, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (p) => apiFetch(p, { method: "DELETE" });

