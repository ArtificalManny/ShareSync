import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "/"; // same origin by default

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

    socket.on("connect", () => socket.emit("join", { room }));

    const handlers = handlersRef.current;
    Object.entries(handlers).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.on(event, fn);
    });

    let pollTimer = null;
    if (typeof poller === "function") {
      pollTimer = setInterval(() => poller?.(), 30000);
    }

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.off(event, fn);
      });
      try { socket.emit("leave", { room }); } catch {}
      try { socket.disconnect(); } catch {}
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [room]);
}
