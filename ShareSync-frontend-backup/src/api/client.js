// /src/api/client.js
import axios from "axios";
import { getAccessToken } from "../utils/tokenUtils";

// All requests go to /api (Vite dev proxy forwards to http://localhost:5000)
const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = getAccessToken?.();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const resp = err?.response;
    if (resp?.data && typeof resp.data === "object") {
      err.message =
        resp.data.error || resp.data.message || err.message || "Request failed";
    }
    return Promise.reject(err);
  }
);

export default client;
