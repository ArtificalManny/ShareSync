import React, { createContext, useEffect, useMemo, useState } from "react";
import api from "./api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ss.user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // Fetch /api/users/me to verify token & hydrate user
  async function refreshMe() {
    try {
      const { data } = await api.get("/users/me");
      setUser(data || null);
      localStorage.setItem("ss.user", JSON.stringify(data || null));
      return data;
    } catch (e) {
      // token might be invalid; client interceptor will redirect on 401
      setUser(null);
      localStorage.removeItem("ss.user");
      return null;
    }
  }

  async function login({ email, password }) {
    // Your backend’s /api/auth/login should return { token, user }
    const { data } = await api.post("/auth/login", { email, password });
    const token = data?.token;
    const me = data?.user;
    if (token) localStorage.setItem("ss.jwt", token);
    if (me) {
      setUser(me);
      localStorage.setItem("ss.user", JSON.stringify(me));
    } else {
      // fall back to fetching /users/me if backend didn’t include user
      await refreshMe();
    }
    return data;
  }

  function logout() {
    try {
      localStorage.removeItem("ss.jwt");
      localStorage.removeItem("ss.user");
    } catch {}
    setUser(null);
    // We don’t navigate here because Auth-aware routes or Navbar will.
  }

  const value = useMemo(
    () => ({ user, ready, login, logout, refreshMe }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
