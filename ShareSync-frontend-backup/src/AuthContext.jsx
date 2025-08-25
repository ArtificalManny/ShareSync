// src/AuthContext.jsx (your current simple version)
import React, { createContext, useEffect, useMemo, useState } from "react";
import api from "./api/client";
// ADD:
import { io } from "socket.io-client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ss.user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // 🔄 Live avatar/name updates with almost no extra code
  useEffect(() => {
    const token = localStorage.getItem("ss.jwt");
    if (!token || !user) return;

    const socket = io("/", {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });

    socket.on("connect", () => {
      const me = user._id || user.id;
      if (me) socket.emit("join", { room: `user:${me}` });
    });

    socket.on("user:updated", (payload) => {
      setUser((prev) => {
        if (!prev) return prev;
        if (String(prev._id || prev.id) !== String(payload.userId)) return prev;
        const nextPic = payload.profilePicture
          ? `${payload.profilePicture}${payload.profilePicture.includes("?") ? "&" : "?"}v=${Date.now()}`
          : prev.profilePicture;
        const merged = { ...prev, ...payload, profilePicture: nextPic };
        try { localStorage.setItem("ss.user", JSON.stringify(merged)); } catch {}
        return merged;
      });
      // nudge components that cache avatars
      try { window.__SS_AVATAR_VERSION__ = Date.now(); } catch {}
    });

    return () => { try { socket.disconnect(); } catch {} };
  }, [user]);
  // END minimal socket

  async function refreshMe() {
    try {
      const { data } = await api.get("/users/me");
      setUser(data || null);
      localStorage.setItem("ss.user", JSON.stringify(data || null));
      return data;
    } catch {
      setUser(null);
      localStorage.removeItem("ss.user");
      return null;
    }
  }

  async function login({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password });
    const token = data?.token;
    const me = data?.user;
    if (token) localStorage.setItem("ss.jwt", token);
    if (me) {
      setUser(me);
      localStorage.setItem("ss.user", JSON.stringify(me));
    } else {
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
  }

  const value = useMemo(() => ({ user, ready, login, logout, refreshMe }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}