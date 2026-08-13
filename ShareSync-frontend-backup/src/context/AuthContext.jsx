// src/context/AuthContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT — Complete authentication state management
// FIXED: Added updateLiveUser for zero-latency identity hot-swapping
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
import { touchActivation } from "../api/activation";

const AuthContext = createContext();

function withApiPrefix(path) {
  const base = String(api?.defaults?.baseURL || "");
  const baseHasApi = /\/api\/?$/.test(base);
  if (baseHasApi) return path;
  return path.startsWith("/api") ? path : `/api${path}`;
}

function writeTokenEverywhere(token) {
  try {
    localStorage.setItem("ss.jwt", token);
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("accessToken", token);
  } catch {}
}

function clearTokenEverywhere() {
  try {
    localStorage.removeItem("ss.jwt");
    localStorage.removeItem("ss.token");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isAuthenticated = !!user;
  const isLoading = loading;

  useEffect(() => {
    async function checkAuth() {
      const token =
        localStorage.getItem("ss.jwt") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.post(withApiPrefix("/auth/verify"), { token });
        const payload = response.data?.data ?? response.data;

        if (payload && payload.user) {
          setUser(payload.user);
          localStorage.setItem("ss.user", JSON.stringify(payload.user));
          writeTokenEverywhere(token);

          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const meResponse = await api.get(withApiPrefix("/auth/me"));
            const mePayload = meResponse.data?.data ?? meResponse.data;

            if (mePayload && typeof mePayload === 'object' && (mePayload._id || mePayload.email)) {
              setUser(mePayload);
              localStorage.setItem("ss.user", JSON.stringify(mePayload));
            }
          } catch (meError) {
            console.warn("[AuthContext] Could not fetch full profile, using JWT data");
          }
        } else {
          clearTokenEverywhere();
          localStorage.removeItem("ss.user");
        }
      } catch (error) {
        clearTokenEverywhere();
        localStorage.removeItem("ss.user");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // activation-funnel-return-touch-v2
  // Record a return only after authentication has resolved.
  // The backend decides whether this visit qualifies as a
  // later-day return and stores the milestone only once.
  useEffect(() => {
    if (loading || !user) {
      return;
    }

    void touchActivation().catch(() => {});
  }, [
    loading,
    user?._id,
    user?.id,
    user?.userId,
    user?.sub,
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY HOT-SWAP (Zero-Latency Updates)
  // ═══════════════════════════════════════════════════════════════════════════
  const updateLiveUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("ss.user", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage")); // Force cross-tab sync
      return updated;
    });
  };

  const login = async ({ email, password }) => {
    try {
      setAuthError(null);
      const response = await api.post(withApiPrefix("/auth/login"), { email, password });
      const payload = response.data?.data ?? response.data;

      if (payload?.needsVerification) {
        return { success: false, needsVerification: true, userId: payload.userId, error: payload.message || "Please verify your email" };
      }

      const token = payload?.access_token || payload?.token;
      const userData = payload?.user;

      if (!token || !userData) throw new Error("Invalid response from server");

      writeTokenEverywhere(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem("ss.user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errorPayload = error.response?.data?.data ?? error.response?.data;

      if (errorPayload?.needsVerification) {
        const message =
          errorPayload.message ||
          errorPayload.error ||
          "Please verify your email";

        setAuthError(message);

        return {
          success: false,
          needsVerification: true,
          userId: errorPayload.userId,
          error: message,
          message,
        };
      }

      const errorMsg =
        errorPayload?.error ||
        errorPayload?.message ||
        error.message ||
        "Login failed";

      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async ({ email, username, firstName, lastName, password }) => {
    try {
      setAuthError(null);
      const response = await api.post(withApiPrefix("/auth/register"), { email, username, firstName, lastName, password });
      const payload = response.data?.data ?? response.data;

      if (payload?.userId) {
        return { success: true, userId: payload.userId, message: payload.message || "Verification code sent" };
      }

      const token = payload?.access_token || payload?.token;
      const userData = payload?.user;

      if (token && userData) {
        writeTokenEverywhere(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem("ss.user", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Registration failed" };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Registration failed";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const verifyEmail = async (userId, code) => {
    try {
      setAuthError(null);
      const response = await api.post(withApiPrefix("/auth/verify-email"), { userId, code });
      const payload = response.data?.data ?? response.data;
      const token = payload?.token;
      const userData = payload?.user;

      if (token && userData) {
        writeTokenEverywhere(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem("ss.user", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Verification failed" };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Verification failed";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setAuthError(null);
      await api.post(withApiPrefix("/auth/forgot-password"), { email });
      return true;
    } catch (error) {
      return true;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setAuthError(null);
      const response = await api.post(withApiPrefix("/auth/reset-password"), { token, newPassword });
      const payload = response.data?.data ?? response.data;
      return !!payload?.success;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Password reset failed";
      setAuthError(errorMsg);
      return false;
    }
  };

  const logout = () => {
    clearTokenEverywhere();
    localStorage.removeItem("ss.user");
    localStorage.removeItem("user");
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setAuthError(null);
    window.location.href = "/login";
  };

  const value = {
    user, loading, isLoading, isAuthenticated, authError, setAuthError,
    updateLiveUser, // NEW: Exported for the Profile modal to use
    login, register, verifyEmail, forgotPassword, resetPassword, logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export { AuthContext };
export default AuthContext;
