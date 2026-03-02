// src/services/api.js
// Canonical client-side API surface (uses utils/http; safe against "/api/api")

import http from "../utils/http";

// ⭐ TASK 1.4: Global API Error Interceptor
if (http.interceptors) {
  http.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response ? error.response.status : null;
      const originalRequest = error.config;

      if (!status) {
        // Network error / Offline
        console.warn('[API] Connection lost.');
        window.dispatchEvent(new CustomEvent('toast:show', { 
          detail: { type: 'error', message: 'Connection lost. Reconnecting...' } 
        }));
      } else if (status === 401) {
        // Unauthorized - Trigger logout or redirect
        console.warn('[API] 401 Unauthorized');
        window.dispatchEvent(new Event('auth:unauthorized'));
      } else if (status === 404) {
        // Not Found
        console.warn('[API] 404 Not Found:', originalRequest.url);
        window.dispatchEvent(new CustomEvent('toast:show', { 
          detail: { type: 'info', message: 'This feature is coming soon.' } 
        }));
      } else if (status >= 500) {
        // Server Error
        console.error('[API] 500 Server Error:', originalRequest.url);
        window.dispatchEvent(new CustomEvent('toast:show', { 
          detail: { type: 'error', message: 'Something went wrong. Retrying...' } 
        }));
        
        // Auto-retry logic for 500 errors (1 retry max)
        if (originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          return http(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );
}

// --- AUDIT ---
async function listAudit({ scope = "user", userId, projectId, limit = 20, cursor } = {}) {
  const { data } = await http.get("/audit", {
    params: { scope, userId, projectId, limit, cursor },
  });
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return { items, nextCursor: data?.nextCursor ?? null };
}

// --- PROJECTS (minimal, used by ProjectHome) ---
async function getProject(projectId) {
  const { data } = await http.get(`/projects/${projectId}`);
  return data;
}

async function getProjectStats(projectId, { range = 30 } = {}) {
  const { data } = await http.get(`/projects/${projectId}/stats`, { params: { range } });
  return data;
}

export const api = {
  audit: { list: listAudit },
  projects: { get: getProject, stats: getProjectStats },
};

export default api;
