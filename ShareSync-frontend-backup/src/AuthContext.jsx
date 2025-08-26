// src/AuthContext.jsx
import React, { createContext, useEffect, useMemo, useState } from "react";
import api from "./api/client";
import { io } from "socket.io-client";
import { toast } from "./components/ui/toast";

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

  // ---- Live avatar/name updates (socket) ----
  useEffect(() => {
    // Only connect when we have a user & (optionally) a JWT
    const token = localStorage.getItem("ss.jwt");
    const me = user?._id || user?.id;
    if (!me) return;

    const socket = io("/", {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      // If your gateway reads auth from "auth.token" this helps;
      // harmless if the server ignores it.
      auth: token ? { token } : undefined,
    });

    socket.on("connect", () => {
      try {
        socket.emit("join", { room: `user:${me}` });
      } catch {}
    });

    socket.on("user:updated", (payload) => {
      // Only react if this event is for me
      const payloadUserId = String(payload?.userId ?? "");
      if (!payloadUserId || String(me) !== payloadUserId) return;

      setUser((prev) => {
        if (!prev) return prev;
        // cache-bust avatar
        const nextPic = payload?.profilePicture
          ? `${payload.profilePicture}${
              payload.profilePicture.includes("?") ? "&" : "?"
            }v=${Date.now()}`
          : prev.profilePicture;

        const merged = { ...prev, ...payload, profilePicture: nextPic };
        try {
          localStorage.setItem("ss.user", JSON.stringify(merged));
        } catch {}
        return merged;
      });

      socket.on("notify:new", (n) => {
        try {
          //minimal: message + optional link
          if (n?.href) {
            toast({
              title: n?.title || "Notification",
              description: n?.message || "",
              action: { label: "Open", href: n.href },         
            });
          } else {
            toast({
              title: n?.title || "Notification",
              description: n?.message || "",
            })
          }
        } catch {}
      });

      // Nudge components that memoize avatars
      try {
        window.__SS_AVATAR_VERSION__ = Date.now();
      } catch {}
    });

    return () => {
      try { socket.disconnect(); } catch {}
    };
  }, [user]);

  // ---- API helpers ----
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

  const value = useMemo(
    () => ({ user, ready, login, logout, refreshMe }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}