import axios from "axios";

// Supports either:
// VITE_API_URL=http://localhost:5050
// OR leaving it blank and defaulting to 5050
const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

// IMPORTANT:
// Your backend uses global prefix "api", so your real base is:
// http://localhost:5050/api
const API_BASE = RAW_API_URL.replace(/\/$/, "") + "/api";

// Token keys (support both, since your app has used both historically)
function getLocalToken() {
  return (
    localStorage.getItem("ss.token") ||
    localStorage.getItem("ss.jwt") ||
    ""
  );
}

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

client.interceptors.request.use(
  (config) => {
    const token = getLocalToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;
