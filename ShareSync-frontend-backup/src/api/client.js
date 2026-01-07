import axios from "axios";

const isDev = import.meta.env.DEV;
const envBaseURL = import.meta.env.VITE_API_URL;

// Prefer env, otherwise default dev/prod values
const baseURL = envBaseURL || (isDev ? "http://localhost:3000/api" : "/api");

console.log("[API Client] 🔵 BaseURL:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// ====================================================================
// REQUEST INTERCEPTOR - Attach JWT to every request
// ====================================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ss.jwt");

    console.log("[API Client] 🔵 Request to:", config.url);
    console.log("[API Client] 🔵 Token exists:", !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API Client] ✅ Attached token to request:", config.url);
    } else {
      console.log("[API Client] ❌ No token found for request:", config.url);
    }

    return config;
  },
  (error) => {
    console.error("[API Client] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ====================================================================
// RESPONSE INTERCEPTOR - Only hard-logout on identity/auth checks
// ====================================================================
let isLoggingOut = false;

function hardLogout() {
  if (isLoggingOut) return;
  isLoggingOut = true;

  localStorage.removeItem("ss.jwt");
  localStorage.removeItem("ss.user");

  setTimeout(() => {
    isLoggingOut = false;
    window.location.href = "/login";
  }, 50);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // Network errors often have no response/status
    if (!status) {
      console.error("❌ API Network/Unknown Error:", error?.message || error);
      return Promise.reject(error);
    }

    console.error("❌ API Error:", status, error.response?.data);

    if (status === 401) {
      const isLogin = url.includes("/auth/login");
      const isRegister = url.includes("/auth/register");
      const isVerify = url.includes("/auth/verify");

      // Treat these as "identity checks" (customize if your backend differs)
      const isMe =
        url.includes("/users/me") ||
        url.includes("/user/me") ||
        url.includes("/me");

      const isRefresh = url.includes("/auth/refresh");

      // Only hard logout when our identity/auth validation fails
      const shouldHardLogout = !isLogin && !isRegister && (isVerify || isMe || isRefresh);

      if (shouldHardLogout) {
        console.warn("⚠️ 401 on identity endpoint -> logging out:", url);
        hardLogout();
      } else {
        console.warn("⚠️ 401 (not hard-logging-out). Caller should handle:", url);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
