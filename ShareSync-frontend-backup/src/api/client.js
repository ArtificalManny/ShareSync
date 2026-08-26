// src/api/client.js
// ═══════════════════════════════════════════════════════════════════════════════
// AXIOS CLIENT (API-SAFE)
// openshare-persistent-session-frontend-v1
// - Normalizes /api
// - Attaches access JWT
// - Silently rotates persistent refresh sessions on 401
// - Retries the original request exactly once
// ═══════════════════════════════════════════════════════════════════════════════

import axios from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../utils/tokenUtils";

function normalizeBaseURL(raw) {
  const base = String(raw || "").replace(/\/+$/, "");

  if (!base) return "http://localhost:5050/api";
  if (/\/api$/.test(base)) return base;

  return `${base}/api`;
}

const baseURL = normalizeBaseURL(import.meta.env.VITE_API_URL);

const client = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise = null;

function isRefreshExempt(url = "") {
  const value = String(url || "");

  return (
    /\/auth\/login(?:\?|$)/.test(value) ||
    /\/auth\/refresh(?:\?|$)/.test(value) ||
    /\/auth\/logout(?:\?|$)/.test(value) ||
    /\/auth\/register(?:\?|$)/.test(value) ||
    /\/auth\/verify-email(?:\?|$)/.test(value) ||
    /\/auth\/forgot-password(?:\?|$)/.test(value) ||
    /\/auth\/reset-password(?:\?|$)/.test(value) ||
    /\/auth\/verify(?:\?|$)/.test(value)
  );
}

async function rotatePersistentSession() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    const error = new Error("No persistent refresh session");
    error.code = "NO_REFRESH_TOKEN";
    throw error;
  }

  const response = await axios.post(
    `${baseURL}/auth/refresh`,
    {
      refresh_token: refreshToken,
    },
    {
      withCredentials: true,
      timeout: 10000,
    },
  );

  const payload = response.data?.data ?? response.data;

  const accessToken =
    payload?.access_token ||
    payload?.token;

  const nextRefreshToken =
    payload?.refresh_token;

  const user = payload?.user;

  if (!accessToken || !nextRefreshToken) {
    const error = new Error("Invalid refresh response");
    error.code = "INVALID_REFRESH_RESPONSE";
    throw error;
  }

  setTokens(
    accessToken,
    nextRefreshToken,
    user,
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("openshare:session-refreshed", {
        detail: {
          user: user || null,
        },
      }),
    );
  }

  return accessToken;
}

// Attach Authorization token to every request.
client.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers || {};

      if (!config.headers.Authorization) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Automatically recover from an expired access JWT.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._openshareSessionRetry ||
      isRefreshExempt(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      return Promise.reject(error);
    }

    originalRequest._openshareSessionRetry = true;

    try {
      if (!refreshPromise) {
        refreshPromise =
          rotatePersistentSession()
            .finally(() => {
              refreshPromise = null;
            });
      }

      const accessToken =
        await refreshPromise;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${accessToken}`;

      return client(originalRequest);
    } catch (refreshError) {
      const refreshStatus =
        refreshError?.response?.status;

      const sessionIsInvalid =
        refreshError?.code === "NO_REFRESH_TOKEN" ||
        refreshError?.code === "INVALID_REFRESH_RESPONSE" ||
        refreshStatus === 400 ||
        refreshStatus === 401 ||
        refreshStatus === 403;

      // Do not destroy a valid stored session merely because
      // the network or backend was temporarily unavailable.
      if (sessionIsInvalid) {
        clearTokens();

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new Event("openshare:session-expired"),
          );
        }
      }

      return Promise.reject(error);
    }
  },
);

export default client;
