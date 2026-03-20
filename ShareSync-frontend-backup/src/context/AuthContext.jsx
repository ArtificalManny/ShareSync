// src/context/AuthContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT — Complete authentication state management
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
import { identifyUser, resetUser, track } from "../utils/telemetry"; // ✅ PHASE 2: Telemetry Integration

const AuthContext = createContext();

/**
 * ✅ SAFETY LAYER (frontend-only)
 * Your codebase has been toggling whether axios baseURL already includes "/api".
 * This helper ensures AuthContext hits the correct backend route in BOTH cases:
 * - baseURL ends with "/api"  -> "/auth/login"
 * - baseURL missing "/api"    -> "/api/auth/login"
 *
 * This prevents the "404 Not Found" route mismatch without touching backend.
 */
function withApiPrefix(path) {
  const base = String(api?.defaults?.baseURL || "");
  const baseHasApi = /\/api\/?$/.test(base); // ends with "/api" or "/api/"
  if (baseHasApi) return path; // already under /api
  return path.startsWith("/api") ? path : `/api${path}`;
}

// ✅ Compatibility bridge for older code paths (services, sockets, interceptors)
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
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Derived state
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
        console.log("[AuthContext] No token found");
        setLoading(false);
        return;
      }

      try {
        console.log("[AuthContext] Token found, verifying...");
        const response = await api.post(withApiPrefix("/auth/verify"), { token });
        console.log("[AuthContext] Verify response:", response.data);

        // ✅ Unwrap TransformInterceptor format: { success, data, timestamp }
        const payload = response.data?.data ?? response.data;

        if (payload && payload.user) {
          console.log("[AuthContext] Token valid, user:", payload.user.email);
          setUser(payload.user);
          localStorage.setItem("ss.user", JSON.stringify(payload.user));
          
          // ✅ PHASE 2: Re-identify user on page reload
          identifyUser(payload.user._id || payload.user.id || payload.user.sub, { 
            email: payload.user.email,
            username: payload.user.username 
          });

          // keep compatibility keys in sync
          writeTokenEverywhere(token);

          // ═══════════════════════════════════════════════════════════════════
          // ⭐ PHASE 1 FIX: Fetch full user profile after token verification
          //    The /auth/verify endpoint only returns decoded JWT payload
          //    (sub, email, firstName, lastName, username, tokenVersion).
          //    The /auth/me endpoint returns the FULL user document from MongoDB
          //    (including xp, level, streakDays, profilePicture, achievements, etc.)
          //
          //    This ensures the AuthContext user object has ALL fields so any
          //    component reading from context gets complete data — not just
          //    the minimal JWT payload that was causing "Anonymous" fallbacks.
          //
          //    Wrapped in try-catch: if /auth/me fails, we gracefully keep
          //    the basic JWT data — the app still works, just with less info.
          // ═══════════════════════════════════════════════════════════════════
          try {
            // Ensure Authorization header is set for the /auth/me call
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const meResponse = await api.get(withApiPrefix("/auth/me"));
            const mePayload = meResponse.data?.data ?? meResponse.data;

            if (mePayload && typeof mePayload === 'object' && (mePayload._id || mePayload.email)) {
              console.log("[AuthContext] ✅ Full profile loaded:", mePayload.email || mePayload.username);
              setUser(mePayload);
              localStorage.setItem("ss.user", JSON.stringify(mePayload));
              
              // ✅ PHASE 2: Update identity with full profile
              identifyUser(mePayload._id || mePayload.id, { 
                email: mePayload.email,
                username: mePayload.username,
                level: mePayload.level
              });
            }
          } catch (meError) {
            console.warn("[AuthContext] Could not fetch full profile, using JWT data:", meError?.message);
            // Graceful degradation — keep the basic JWT user data
          }
        } else {
          console.log("[AuthContext] Token invalid");
          clearTokenEverywhere();
          localStorage.removeItem("ss.user");
          resetUser(); // ✅ PHASE 2: Clear telemetry identity
        }
      } catch (error) {
        console.error("[AuthContext] Token verification failed:", error);
        clearTokenEverywhere();
        localStorage.removeItem("ss.user");
        resetUser(); // ✅ PHASE 2: Clear telemetry identity
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  const login = async ({ email, password }) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] 🔵 Attempting login for:", email);

      // ✅ Safe route regardless of whether baseURL includes "/api"
      const response = await api.post(withApiPrefix("/auth/login"), {
        email,
        password,
      });

      console.log("[AuthContext] 🔵 Login response:", response.data);

      // ✅ Unwrap TransformInterceptor format: { success, data, timestamp }
      const payload = response.data?.data ?? response.data;

      // Handle unverified user case
      if (payload?.needsVerification) {
        return {
          success: false,
          needsVerification: true,
          userId: payload.userId,
          error: payload.message || "Please verify your email",
        };
      }

      const token = payload?.access_token || payload?.token;
      const userData = payload?.user;

      if (!token || !userData) {
        throw new Error("Invalid response from server");
      }

      // ✅ Write token in all expected keys
      writeTokenEverywhere(token);

      // ⭐ PHASE 1 FIX: Set Authorization header immediately after login
      //    so subsequent API calls (like fetching full profile) work.
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      localStorage.setItem("ss.user", JSON.stringify(userData));
      setUser(userData);
      
      // ✅ PHASE 2: Identify user on explicit login
      identifyUser(userData._id || userData.id || userData.sub, { email: userData.email, username: userData.username });
      track("user_logged_in", { method: "email" });

      console.log("[AuthContext] 🎉 Login successful!");
      return { success: true };
    } catch (error) {
      console.error("[AuthContext] ❌ Login error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Login failed";
      setAuthError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════════════════
  const register = async ({ email, username, firstName, lastName, password }) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] 🔵 Attempting registration for:", email);

      const response = await api.post(withApiPrefix("/auth/register"), {
        email,
        username,
        firstName,
        lastName,
        password,
      });

      console.log("[AuthContext] 🔵 Registration response:", response.data);

      // ✅ Unwrap TransformInterceptor format: { success, data, timestamp }
      const payload = response.data?.data ?? response.data;

      // New flow returns { userId } for verification
      if (payload?.userId) {
        console.log("[AuthContext] 🎉 Registration successful, needs verification");
        track("registration_initiated", { email }); // ✅ PHASE 2 tracking
        return {
          success: true,
          userId: payload.userId,
          message: payload.message || "Verification code sent",
        };
      }

      // Legacy flow returns { access_token, user }
      const token = payload?.access_token || payload?.token;
      const userData = payload?.user;

      if (token && userData) {
        writeTokenEverywhere(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem("ss.user", JSON.stringify(userData));
        setUser(userData);
        
        // ✅ PHASE 2: Identify user and track Golden Path event
        identifyUser(userData._id || userData.id, { email: userData.email, username: userData.username });
        track("user_signed_up", { flow: "legacy" });
        
        console.log("[AuthContext] 🎉 Registration successful (legacy flow)!");
        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      console.error("[AuthContext] ❌ Registration error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Registration failed";
      setAuthError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY EMAIL
  // ═══════════════════════════════════════════════════════════════════════════
  const verifyEmail = async (userId, code) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] 🔵 Verifying email for userId:", userId);

      const response = await api.post(withApiPrefix("/auth/verify-email"), {
        userId,
        code,
      });

      console.log("[AuthContext] 🔵 Verify response:", response.data);

      const payload = response.data?.data ?? response.data;

      const token = payload?.token;
      const userData = payload?.user;

      if (token && userData) {
        writeTokenEverywhere(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem("ss.user", JSON.stringify(userData));
        setUser(userData);
        
        // ✅ PHASE 2: Golden Path tracked
        identifyUser(userData._id || userData.id, { email: userData.email, username: userData.username });
        track("user_signed_up", { flow: "verified_email" });

        console.log("[AuthContext] 🎉 Email verified!");
        return { success: true };
      }

      return { success: false, error: "Verification failed" };
    } catch (error) {
      console.error("[AuthContext] ❌ Verification error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Verification failed";
      setAuthError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  const forgotPassword = async (email) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] 🔵 Requesting password reset for:", email);

      await api.post(withApiPrefix("/auth/forgot-password"), { email });

      // Always returns success for security
      return true;
    } catch (error) {
      console.error("[AuthContext] ❌ Forgot password error:", error);
      // Still return true for security (don't reveal if email exists)
      return true;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  const resetPassword = async (token, newPassword) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] 🔵 Resetting password");

      const response = await api.post(withApiPrefix("/auth/reset-password"), {
        token,
        newPassword,
      });

      console.log("[AuthContext] 🔵 Reset password response:", response.data);

      const payload = response.data?.data ?? response.data;

      if (payload?.success) {
        console.log("[AuthContext] 🎉 Password reset successful!");
        return true;
      }

      return false;
    } catch (error) {
      console.error("[AuthContext] ❌ Reset password error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Password reset failed";
      setAuthError(errorMsg);
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════
  const logout = () => {
    console.log("[AuthContext] 🔴 Logging out...");
    clearTokenEverywhere();
    localStorage.removeItem("ss.user");
    // ⭐ PHASE 1 FIX: Also clear the Authorization header on logout
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setAuthError(null);
    
    resetUser(); // ✅ PHASE 2: Clear telemetry identity so next user is clean
    
    window.location.href = "/login";
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════
  const value = {
    // State
    user,
    loading,
    isLoading, // Alias for loading
    isAuthenticated,
    authError,
    setAuthError,

    // Methods
    login,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Export both named and default for compatibility
export { AuthContext };
export default AuthContext;
