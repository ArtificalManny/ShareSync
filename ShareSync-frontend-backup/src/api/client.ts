// src/api/client.ts
import axios from 'axios';

const client = axios.create({
  // Use Vite env (fallback to /api for dev proxy)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

// ──────────────────────────────────────────────────────────────
// 1. REQUEST INTERCEPTOR – attach JWT
// ──────────────────────────────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ss.jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────────────────────
// 2. RESPONSE INTERCEPTOR – handle 401 globally
// ──────────────────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clean up stale auth
      localStorage.removeItem('ss.jwt');
      localStorage.removeItem('ss.user');
      // Redirect to login (preserve current path)
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?return=${redirect}`;
    }
    return Promise.reject(error);
  }
);

export default client;