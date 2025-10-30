// src/utils/http.js
// Minimal fetch wrapper with a safe /api base (prevents "/api/api" double-prefix)

const BASE = "/api";

function joinUrl(base, path) {
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // If caller passes "/api/…" already, don't prepend base again
  if (path.startsWith("/api/")) return path;
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

function toQuery(params) {
  const sp = new URLSearchParams();
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) v.forEach((it) => sp.append(k, String(it)));
      else sp.append(k, String(v));
    });
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function request(method, path, opts = {}) {
  const { params, body, headers } = opts;
  const url = joinUrl(BASE, path) + toQuery(params);
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    credentials: "include",
  };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);

  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { ok: true, status: res.status, data };
}

const http = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, opts) => request("POST", path, opts),
  put: (path, opts) => request("PUT", path, opts),
  patch: (path, opts) => request("PATCH", path, opts),
  delete: (path, opts) => request("DELETE", path, opts),
};

export default http;
export { request, toQuery };
