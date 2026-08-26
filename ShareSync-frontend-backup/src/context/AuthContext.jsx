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
    localStorage.setItem("access_token", token);
    localStorage.setItem("ss.jwt", token);
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("accessToken", token);
  } catch {}
}

function writeRefreshToken(token) {
  try {
    if (token) {
      localStorage.setItem("refresh_token", token);
    }
  } catch {}
}

function readRefreshToken() {
  try {
    return localStorage.getItem("refresh_token") || "";
  } catch {
    return "";
  }
}

function readCachedUser() {
  try {
    const raw =
      localStorage.getItem("ss.user") ||
      localStorage.getItem("user");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearTokenEverywhere() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("ss.jwt");
    localStorage.removeItem("ss.token");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh_token");
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isAuthenticated = !!user;
  const isLoading = loading;

  useEffect(() => {
    // openshare-persistent-session-authcontext-v1
    async function checkAuth() {
      const accessToken =
        localStorage.getItem("access_token") ||
        localStorage.getItem("ss.jwt") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

      const refreshToken =
        readRefreshToken();

      const cachedUser =
        readCachedUser();

      const applySession = (
        token,
        nextRefreshToken,
        userData,
      ) => {
        writeTokenEverywhere(token);

        if (nextRefreshToken) {
          writeRefreshToken(nextRefreshToken);
        }

        api.defaults.headers.common["Authorization"] =
          `Bearer ${token}`;

        if (userData) {
          setUser(userData);

          try {
            localStorage.setItem(
              "ss.user",
              JSON.stringify(userData),
            );
            localStorage.setItem(
              "user",
              JSON.stringify(userData),
            );
          } catch {}
        }
      };

      const hydrateProfile = () => {
        void api
          .get(
            withApiPrefix("/auth/me"),
            { timeout: 8000 },
          )
          .then((response) => {
            const payload =
              response.data?.data ??
              response.data;

            if (
              payload &&
              typeof payload === "object" &&
              (payload._id || payload.email)
            ) {
              setUser(payload);

              try {
                localStorage.setItem(
                  "ss.user",
                  JSON.stringify(payload),
                );
                localStorage.setItem(
                  "user",
                  JSON.stringify(payload),
                );
              } catch {}
            }
          })
          .catch(() => {
            console.warn(
              "[AuthContext] Full profile hydration skipped",
            );
          });
      };

      const refreshStoredSession = async () => {
        const currentRefreshToken =
          readRefreshToken();

        if (!currentRefreshToken) {
          return false;
        }

        const response = await api.post(
          withApiPrefix("/auth/refresh"),
          {
            refresh_token:
              currentRefreshToken,
          },
          {
            timeout: 10000,
          },
        );

        const payload =
          response.data?.data ??
          response.data;

        const nextAccessToken =
          payload?.access_token ||
          payload?.token;

        const nextRefreshToken =
          payload?.refresh_token;

        const userData =
          payload?.user ||
          cachedUser;

        if (
          !nextAccessToken ||
          !nextRefreshToken ||
          !userData
        ) {
          throw new Error(
            "Invalid persistent-session refresh response",
          );
        }

        applySession(
          nextAccessToken,
          nextRefreshToken,
          userData,
        );

        hydrateProfile();

        return true;
      };

      // No access JWT but a persistent refresh session exists.
      if (!accessToken) {
        if (!refreshToken) {
          setLoading(false);
          return;
        }

        try {
          await refreshStoredSession();
        } catch (error) {
          const status =
            error?.response?.status;

          if (
            status === 400 ||
            status === 401 ||
            status === 403
          ) {
            clearTokenEverywhere();

            localStorage.removeItem(
              "ss.user",
            );
            localStorage.removeItem(
              "user",
            );
          } else if (cachedUser) {
            // Temporary backend/network failure must
            // not erase a persistent login.
            setUser(cachedUser);
          }
        } finally {
          setLoading(false);
        }

        return;
      }

      try {
        const response = await api.post(
          withApiPrefix("/auth/verify"),
          {
            token: accessToken,
          },
          {
            timeout: 8000,
          },
        );

        const payload =
          response.data?.data ??
          response.data;

        if (payload?.user) {
          applySession(
            accessToken,
            refreshToken,
            payload.user,
          );

          setLoading(false);
          hydrateProfile();

          return;
        }

        throw new Error(
          "Token verification returned no user",
        );
      } catch (error) {
        const status =
          error?.response?.status;

        // Access JWT expired or became invalid.
        // Try the persistent session before logging out.
        if (
          (status === 401 ||
            status === 403) &&
          refreshToken
        ) {
          try {
            if (
              await refreshStoredSession()
            ) {
              return;
            }
          } catch (refreshError) {
            const refreshStatus =
              refreshError?.response?.status;

            if (
              refreshStatus === 400 ||
              refreshStatus === 401 ||
              refreshStatus === 403
            ) {
              clearTokenEverywhere();

              localStorage.removeItem(
                "ss.user",
              );
              localStorage.removeItem(
                "user",
              );

              return;
            }

            if (cachedUser) {
              setUser(cachedUser);
              return;
            }
          }
        }

        if (
          status === 401 ||
          status === 403
        ) {
          clearTokenEverywhere();

          localStorage.removeItem(
            "ss.user",
          );
          localStorage.removeItem(
            "user",
          );
        } else if (cachedUser) {
          // Offline/backend outage:
          // preserve local authenticated shell.
          setUser(cachedUser);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Synchronize AuthContext with automatic Axios
  // refresh-session rotation.
  useEffect(() => {
    const handleSessionRefreshed = (
      event,
    ) => {
      const nextUser =
        event?.detail?.user;

      if (!nextUser) {
        return;
      }

      setUser(nextUser);

      try {
        const serialized =
          JSON.stringify(nextUser);

        localStorage.setItem(
          "ss.user",
          serialized,
        );

        localStorage.setItem(
          "user",
          serialized,
        );
      } catch {}
    };

    const handleSessionExpired = () => {
      setUser(null);
      setAuthError(null);
    };

    window.addEventListener(
      "openshare:session-refreshed",
      handleSessionRefreshed,
    );

    window.addEventListener(
      "openshare:session-expired",
      handleSessionExpired,
    );

    return () => {
      window.removeEventListener(
        "openshare:session-refreshed",
        handleSessionRefreshed,
      );

      window.removeEventListener(
        "openshare:session-expired",
        handleSessionExpired,
      );
    };
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

      const response = await api.post(
        withApiPrefix("/auth/login"),
        {
          email,
          password,
        },
      );

      const payload =
        response.data?.data ??
        response.data;

      if (payload?.needsVerification) {
        return {
          success: false,
          needsVerification: true,
          userId: payload.userId,
          error:
            payload.message ||
            "Please verify your email",
        };
      }

      const token =
        payload?.access_token ||
        payload?.token;

      const refreshToken =
        payload?.refresh_token;

      const userData =
        payload?.user;

      if (!token || !userData) {
        throw new Error(
          "Invalid response from server",
        );
      }

      writeTokenEverywhere(token);

      if (refreshToken) {
        writeRefreshToken(refreshToken);
      }

      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const serialized =
        JSON.stringify(userData);

      localStorage.setItem(
        "ss.user",
        serialized,
      );

      localStorage.setItem(
        "user",
        serialized,
      );

      setUser(userData);

      return {
        success: true,
      };
    } catch (error) {
      const errorPayload =
        error.response?.data?.data ??
        error.response?.data;

      if (
        errorPayload?.needsVerification
      ) {
        const message =
          errorPayload.message ||
          errorPayload.error ||
          "Please verify your email";

        setAuthError(message);

        return {
          success: false,
          needsVerification: true,
          userId:
            errorPayload.userId,
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

      return {
        success: false,
        error: errorMsg,
      };
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

  const logout = async () => {
    const refreshToken =
      readRefreshToken();

    try {
      if (refreshToken) {
        await api.post(
          withApiPrefix("/auth/logout"),
          {
            refresh_token:
              refreshToken,
          },
          {
            timeout: 5000,
          },
        );
      }
    } catch {
      // Local logout must still complete if
      // the backend is temporarily unavailable.
    }

    clearTokenEverywhere();

    localStorage.removeItem(
      "ss.user",
    );

    localStorage.removeItem(
      "user",
    );

    delete api.defaults.headers.common[
      "Authorization"
    ];

    setUser(null);
    setAuthError(null);

    window.location.href =
      "/login";
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
