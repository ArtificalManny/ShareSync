// src/api/integrations/jira.js
// Minimal stubs for Jira (cloud) integration with graceful fallbacks.

import { track } from "../../utils/telemetry";

const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const CLIENT_ID = import.meta?.env?.VITE_JIRA_CLIENT_ID || "";

/** Begin OAuth (stubbed). Returns { accessToken } */
export async function beginOAuth() {
  try {
    if (!CLIENT_ID) {
      track("import_started", { provider: "jira", configured: false });
      return { accessToken: "demo-jira-token" };
    }
    track("import_started", { provider: "jira", configured: true });
    return { accessToken: "demo-jira-token" };
  } catch (e) {
    throw new Error(e?.message || "Jira auth failed.");
  }
}

/** Fetch issues from provider or backend proxy. Returns array of {id,title,assignee,due} */
export async function fetchIssues(accessToken) {
  const url = API_BASE ? `${API_BASE}/api/integrations/jira/issues` : "";
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
  return mockIssues(10, "JIRA");
}

/** Optional: POST selected items to backend to import */
export async function importItems({ projectId, items = [], accessToken }) {
  const url = API_BASE ? `${API_BASE}/api/integrations/jira/import` : "";
  if (!url) {
    // Local demo
    track("import_confirmed", { provider: "jira", selected: items.length, mode: "demo" });
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
    throw new Error(msg || "Jira import failed.");
  }
  return res.json();
}

// ----- helpers ----------------------------------------------------------------

function normalize(arr) {
  // Jira shapes vary; try sensible defaults
  return arr.map((it, i) => ({
    id: it.id || it.key || `JIRA-${i + 1}`,
    title: it.title || it.fields?.summary || it.name || "Untitled",
    assignee: it.assignee?.displayName || it.fields?.assignee?.displayName || it.assigneeName || "",
    due: it.fields?.duedate || it.dueDate || it.due || "",
  }));
}

function mockIssues(count = 8, prefix = "JIRA") {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    title: `Sample ${prefix} Issue ${i + 1}`,
    assignee: i % 2 === 0 ? "You" : "Teammate",
    due: i % 4 === 0 ? new Date(Date.now() + i * 864e5).toISOString().slice(0, 10) : "",
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
