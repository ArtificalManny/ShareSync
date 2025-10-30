import axios from "axios";

const api = axios.create({
  baseURL: "/api", // dev proxy or same origin
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ss.jwt");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Surface 401s and common errors
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem("ss.jwt");
        localStorage.removeItem("ss.user");
      } catch {}
    }
    return Promise.reject(err);
  }
);

export default api;
