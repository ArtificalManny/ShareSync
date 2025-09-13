import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "/"; // same origin by default

/**
 * useSocket(room, { onEvents, poller })
 * - Joins the given room.
 * - Binds provided event handlers.
 * - Re-binds when handlers change.
 * - Re-joins on reconnect.
 * - Optional poller runs every 30s.
 *
 * Works for any custom event, e.g. "project:publicChanged".
 */
export default function useSocket(room, { onEvents = {}, poller } = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(onEvents);
  handlersRef.current = onEvents;

  useEffect(() => {
    if (!room) return;

    const token = localStorage.getItem("ss.jwt") || undefined;
    const socket = io(WS_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    const join = () => {
      try {
        socket.emit("join", { room });
      } catch {}
    };

    socket.on("connect", join);
    socket.io.on("reconnect", join);

    const bindHandlers = (handlers) => {
      Object.entries(handlers || {}).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.on(event, fn);
      });
    };
    const unbindHandlers = (handlers) => {
      Object.entries(handlers || {}).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.off(event, fn);
      });
    };

    bindHandlers(handlersRef.current);

    let pollTimer = null;
    if (typeof poller === "function") {
      pollTimer = setInterval(() => poller?.(), 30000);
    }

    return () => {
      unbindHandlers(handlersRef.current);
      try { socket.emit("leave", { room }); } catch {}
      try { socket.disconnect(); } catch {}
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [room]);

  // Rebind when onEvents object identity changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const oldHandlers = handlersRef.current;
    Object.entries(oldHandlers || {}).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.off(event, fn);
    });
    Object.entries(onEvents || {}).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.on(event, fn);
    });

    handlersRef.current = onEvents;
  }, [onEvents]);
}
