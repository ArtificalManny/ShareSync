// src/api/integrations/linear.js
// Minimal stubs for Linear integration with graceful fallbacks.

import { track } from "../../utils/telemetry";

const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const CLIENT_ID = import.meta?.env?.VITE_LINEAR_CLIENT_ID || "";

/** Begin OAuth (stubbed). Returns { accessToken } */
export async function beginOAuth() {
  try {
    if (!CLIENT_ID) {
      // Demo path
      track("import_started", { provider: "linear", configured: false });
      return { accessToken: "demo-linear-token" };
    }
    // Real wiring would redirect to your backend OAuth start.
    // For now return a demo token but flag as configured.
    track("import_started", { provider: "linear", configured: true });
    return { accessToken: "demo-linear-token" };
  } catch (e) {
    throw new Error(e?.message || "Linear auth failed.");
  }
}

/** Fetch issues from provider or backend proxy. Returns array of {id,title,assignee,due} */
export async function fetchIssues(accessToken) {
  // Attempt backend first if available, else return mock
  const url = API_BASE ? `${API_BASE}/api/integrations/linear/issues` : "";
  if (url) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) return normalize(data);
      }
    } catch { /* fallthrough to mock */ }
  }
  // Mock
  return mockIssues(10, "LIN");
}

/** Optional: POST selected items to backend to import */
export async function importItems({ projectId, items = [], accessToken }) {
  const url = API_BASE ? `${API_BASE}/api/integrations/linear/import` : "";
  if (!url) {
    // Local demo
    track("import_confirmed", { provider: "linear", selected: items.length, mode: "demo" });
    return { ok: true, count: items.length };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken || ""}`,
    },
    body: JSON.stringify({ projectId, items }),
  });
  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(msg || "Linear import failed.");
  }
  return res.json();
}

// ----- helpers ----------------------------------------------------------------

function normalize(arr) {
  // Accept either provider-like objects or already normalized
  return arr.map((it, i) => ({
    id: it.id || it.identifier || `LIN-${i + 1}`,
    title: it.title || it.name || "Untitled",
    assignee: it.assignee?.name || it.assigneeName || "",
    due: it.dueDate || it.due || "",
  }));
}

function mockIssues(count = 8, prefix = "LIN") {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    title: `Sample ${prefix} Issue ${i + 1}`,
    assignee: i % 2 === 0 ? "You" : "Teammate",
    due: i % 3 === 0 ? new Date(Date.now() + i * 864e5).toISOString().slice(0, 10) : "",
  }));
}

async function safeText(res) {
  try { return await res.text(); } catch { return ""; }
}

export default {
  beginOAuth,
  fetchIssues,
  importItems,
};
