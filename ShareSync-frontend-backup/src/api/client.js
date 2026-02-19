// src/api/client.js
// ═══════════════════════════════════════════════════════════════════════════════
// AXIOS CLIENT (API-SAFE)
// Ensures ALL requests go to /api/* even if VITE_API_URL is set to:
//   - http://localhost:5050
//   - http://localhost:5050/api
// Prevents 404s like: Cannot GET /messages/... or /projects
// ═══════════════════════════════════════════════════════════════════════════════

import axios from "axios";

function normalizeBaseURL(raw) {
  const base = String(raw || "").replace(/\/+$/, "");

  // If env missing, default to localhost backend
  if (!base) return "http://localhost:5050/api";

  // If already ends with /api, keep it
  if (/\/api$/.test(base)) return base;

  // Otherwise, append /api
  return `${base}/api`;
}

const baseURL = normalizeBaseURL(import.meta.env.VITE_API_URL);

const client = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach Authorization token to every request (if present)
client.interceptors.request.use(
  (config) => {
    try {
      const token =
        localStorage.getItem("ss.jwt") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

      if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {}

    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: unwrap common backend wrapper automatically
client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default client;
