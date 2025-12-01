// src/api/client.js
import axios from "axios";

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: isDev ? "http://localhost:3000/api" : "/api",
  withCredentials: true,
});

// ====================================================================
// REQUEST INTERCEPTOR - Attach JWT to every request
// ====================================================================
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ss.jwt");
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ====================================================================
// RESPONSE INTERCEPTOR - Smart 401 handling
// ====================================================================
let isLoggingOut = false; // Prevent multiple logout calls

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const config = err?.config;

    // Only handle 401s that indicate ACTUAL auth failures
    if (status === 401 && !isLoggingOut) {
      // Ignore 401s from:
      // 1. /auth/login (wrong password is expected)
      // 2. /auth/me when checking if token is valid (expected during logout)
      const isLoginEndpoint = config?.url?.includes('/auth/login');
      const isMeEndpoint = config?.url?.includes('/auth/me');
      
      if (isLoginEndpoint) {
        // Login failed - don't clear tokens (user might be retrying)
        console.log("[CLIENT] Login failed (wrong credentials) - not clearing tokens");
        return Promise.reject(err);
      }

      if (isMeEndpoint) {
        // Token verification failed - this is handled by AuthContext
        console.log("[CLIENT] Token verification failed - AuthContext will handle cleanup");
        return Promise.reject(err);
      }

      // All other 401s = genuine auth failure (token expired mid-session)
      console.warn("[CLIENT] 401 Unauthorized on", config?.url, "- clearing auth");
      
      isLoggingOut = true;
      localStorage.removeItem("ss.jwt");
      localStorage.removeItem("ss.user");
      window.__INITIAL_AUTH_STATE__ = { token: null, user: null, hasToken: false };
      
      // Use replace to avoid history pollution
      window.location.replace("/login");
    }

    return Promise.reject(err);
  }
);

export default api;