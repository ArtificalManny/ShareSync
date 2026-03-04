import axios from "axios";

const isDev = import.meta.env.DEV;
const envBaseURL = import.meta.env.VITE_API_URL;

// Prefer env, otherwise default dev/prod values
const baseURL = envBaseURL || (isDev ? "http://localhost:5050/api" : "/api");

console.log("[axios.js] 🔵 BaseURL:", baseURL);

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ss.jwt");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle Errors & PITCH MODE (Phase 9)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // ⭐ PHASE 9.2: Stealth Error Swallowing
    let isPitchMode = false;
    try {
      isPitchMode = localStorage.getItem("ss.pitchMode") === "true";
    } catch (e) {}

    // If Pitch Mode is ON, swallow 404s and 500s. (We still process 401s to ensure auth logic holds)
    if (isPitchMode && status !== 401) {
      console.warn(`🎭 [PITCH MODE] Swallowed API Error (${status}) at ${url}`);
      // Return a fake successful promise so the UI keeps rolling
      return Promise.resolve({ 
        data: { 
          success: true, 
          _pitchModeFallback: true, 
          data: [] 
        } 
      });
    }

    console.error("❌ API Error:", status, error.response?.data);

    if (status === 401 && !url.includes("/auth/")) {
      localStorage.removeItem("ss.jwt");
      localStorage.removeItem("ss.user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
