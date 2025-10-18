// /src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "/"; // same origin by default

/**
 * useSocket(rooms, { onEvents, onAny, poller, userId })
 *
 * rooms: string | string[] | null
 *  - Join one or many rooms (e.g. ["project:1","project:2"])
 *
 * onEvents: { [eventName]: (payload) => void }
 *  - Map of specific event handlers to bind to the socket
 *
 * onAny: (eventName, ...args) => void
 *  - Optional catch-all listener (great for a global "activity:new")
 *
 * poller: () => void
 *  - Optional poller runs every 30s while hook is mounted
 *
 * userId: string (optional)
 *  - If provided, automatically joins `user:${userId}` for profile live updates
 *
 * Notes:
 *  - Re-joins rooms on reconnect.
 *  - Re-binds handlers when `onEvents` changes.
 *  - Cleans up on unmount.
 *
 * Optional presence (keep OFF by default):
 *  - You can pass an onEvents handler for "presence:update" from your server:
 *      useSocket(`project:${id}`, {
 *        onEvents: {
 *          "presence:update": ({ onlineCount }) => {
 *            window.dispatchEvent(new CustomEvent("presence:count", { detail: { count: onlineCount }}));
 *          }
 *        }
 *      })
 */
export default function useSocket(roomsInput, { onEvents = {}, onAny, poller, userId } = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(onEvents);
  const onAnyRef = useRef(onAny);
  const anyWrapperRef = useRef(null);

  handlersRef.current = onEvents;
  onAnyRef.current = onAny;

  // Normalize base rooms to a stable, sorted array of unique strings
  const baseRooms = Array.isArray(roomsInput)
    ? Array.from(new Set(roomsInput.filter(Boolean).map(String)))
    : roomsInput
      ? [String(roomsInput)]
      : [];

  // Optionally include a user room for live profile updates
  const userRooms = userId ? [`user:${String(userId)}`] : [];
  const rooms = Array.from(new Set([...baseRooms, ...userRooms]));

  const roomsKey = rooms.slice().sort().join("|"); // effect dep key

  useEffect(() => {
    // If no rooms and no listeners at all, skip opening a socket
    const hasListeners =
      (onAnyRef.current && typeof onAnyRef.current === "function") ||
      Object.keys(handlersRef.current || {}).length > 0;
    if (!rooms.length && !hasListeners) return;

    const token = localStorage.getItem("ss.jwt") || undefined;
    const socket = io(WS_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    const joinAll = () => {
      try {
        rooms.forEach((room) => socket.emit("join", { room }));
      } catch {}
    };

    socket.on("connect", joinAll);
    socket.io.on("reconnect", joinAll);

    // Bind catch-all if provided (wrap to have a stable offAny cleanup)
    if (typeof onAnyRef.current === "function") {
      anyWrapperRef.current = (event, ...args) => onAnyRef.current?.(event, ...args);
      socket.onAny(anyWrapperRef.current);
    }

    // Bind specific handlers
    const bindHandlers = (handlers) => {
      Object.entries(handlers || {}).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.on(event, fn);
      });
    };
    bindHandlers(handlersRef.current);

    let pollTimer = null;
    if (typeof poller === "function") {
      pollTimer = setInterval(() => poller?.(), 30000);
    }

    return () => {
      // Leave rooms
      try {
        rooms.forEach((room) => socket.emit("leave", { room }));
      } catch {}

      // Unbind specific handlers
      Object.entries(handlersRef.current || {}).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.off(event, fn);
      });

      // Unbind catch-all
      if (anyWrapperRef.current) {
        try { socket.offAny(anyWrapperRef.current); } catch {}
        anyWrapperRef.current = null;
      }

      // Disconnect
      try { socket.disconnect(); } catch {}

      if (pollTimer) clearInterval(pollTimer);
    };
  }, [roomsKey]);

  // Rebind when onEvents object identity changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const prev = handlersRef.current;
    Object.entries(prev || {}).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.off(event, fn);
    });
    Object.entries(onEvents || {}).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.on(event, fn);
    });

    handlersRef.current = onEvents;
  }, [onEvents]);

  // Rebind catch-all when onAny changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (anyWrapperRef.current) {
      try { socket.offAny(anyWrapperRef.current); } catch {}
      anyWrapperRef.current = null;
    }
    if (typeof onAny === "function") {
      anyWrapperRef.current = (event, ...args) => onAny?.(event, ...args);
      socket.onAny(anyWrapperRef.current);
    }
    onAnyRef.current = onAny;
  }, [onAny]);
}
