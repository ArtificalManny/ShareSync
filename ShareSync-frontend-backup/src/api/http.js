// /src/api/http.js
import axios from "axios";

// Use Vite dev-server proxy: baseURL '/api' → proxied to http://localhost:5000
const BASE_URL = "/api";

function getToken() {
  try {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      null
    );
  } catch {
    return null;
  }
}

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const resp = err?.response;
    if (resp?.data && typeof resp.data === "object") {
      err.normalizedMessage =
        resp.data.error || resp.data.message || err.message || "Request failed";
    } else {
      err.normalizedMessage = err.message || "Request failed";
    }
    return Promise.reject(err);
  }
);
