import axios from "axios";

const isDev = import.meta.env.DEV;

function ensureApiSuffix(url) {
  if (!url) return null;
  let out = String(url).trim().replace(/\/+$/, "");
  if (!out.endsWith("/api")) out = `${out}/api`;
  return out;
}

const envRaw = import.meta.env.VITE_API_URL; // e.g. http://localhost:5050 or http://localhost:5050/api
const envBase = ensureApiSuffix(envRaw);

// Default dev fallback (correct for your backend)
const baseURL = envBase || (isDev ? "http://localhost:5050/api" : "/api");

console.log("[API Client] 🔵 BaseURL:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ss.jwt");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
