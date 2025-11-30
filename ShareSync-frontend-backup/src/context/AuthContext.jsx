// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

// ====================================================================
// GLOBAL AUTH STATE — injected by server-side render or main.jsx
// This is the magic that fixes soft/hard refresh auth loss
// ====================================================================
const initialAuth = window.__INITIAL_AUTH_STATE__ || {
  token: null,
  user: null,
  hasToken: false,
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialAuth.user);
  const [loading, setLoading] = useState(initialAuth.hasToken); // Only verify if we had a token

  console.log("[AuthContext] RENDER", {
    user: !!user,
    loading,
    hasToken: initialAuth.hasToken,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    if (!initialAuth.hasToken) {
      setLoading(false);
      return;
    }

    console.log("[AUTH] Verifying token on mount...");
    client
      .get("/auth/me")
      .then((res) => {
        console.log("[AUTH] Token valid → user loaded", res.data);
        setUser(res.data);
        localStorage.setItem("ss.user", JSON.stringify(res.data));
      })
      .catch((err) => {
        console.error("[AUTH] Token invalid or expired → logging out", err);
        localStorage.removeItem("ss.jwt");
        localStorage.removeItem("ss.user");
        window.__INITIAL_AUTH_STATE__ = { token: null, user: null, hasToken: false };
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // ← Runs exactly once on mount — survives HMR, soft/hard refresh

  const login = async (credentials) => {
    const res = await client.post("/auth/login", credentials);
    const { token, user } = res.data;

    localStorage.setItem("ss.jwt", token);
    localStorage.setItem("ss.user", JSON.stringify(user));

    // Critical: Update global state for next refresh
    window.__INITIAL_AUTH_STATE__ = { token, user, hasToken: true };

    setUser(user);
    return user;
  };

  const logout = () => {
    console.trace("[AUTH] LOGOUT CALLED — Full stack trace:");
    // ↑ This will show you EXACTLY who triggered logout (401 interceptor? button? bug?)

    localStorage.removeItem("ss.jwt");
    localStorage.removeItem("ss.user");

    // Reset global state
    window.__INITIAL_AUTH_STATE__ = { token: null, user: null, hasToken: false };

    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export context itself (rarely needed but safe)
export { AuthContext };

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};