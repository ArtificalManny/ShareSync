// src/api/client.js
import axios from "axios";

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: isDev ? "http://localhost:3000/api" : "/api",  // ← CHANGED TO 3000
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ss.jwt");
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("ss.jwt");
      localStorage.removeItem("ss.user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;