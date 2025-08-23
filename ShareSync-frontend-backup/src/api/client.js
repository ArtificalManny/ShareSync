// /src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ss.jwt");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";
    // ❗️Do NOT redirect for auth endpoints so the form can show errors
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/verify");

    if ((status === 401 || status === 403) && !isAuthRoute) {
      try {
        localStorage.removeItem("ss.jwt");
        localStorage.removeItem("ss.user");
      } catch {}
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export default api;