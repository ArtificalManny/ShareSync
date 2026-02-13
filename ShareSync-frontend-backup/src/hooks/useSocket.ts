import { useEffect, useMemo, useRef } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "/";

export type SocketEventHandler<T = any> = (payload: T) => void;
export type SocketEventMap = Record<string, SocketEventHandler<any>>;

export type UseSocketOptions = {
  onEvents?: SocketEventMap;
  onAny?: (eventName: string, ...args: any[]) => void;
  poller?: () => void;
  userId?: string | null;
};

type AnyWrapper = ((event: string, ...args: any[]) => void) | null;

export default function useSocket(
  roomsInput: string | string[] | null | undefined,
  { onEvents = {}, onAny, poller, userId }: UseSocketOptions = {}
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<SocketEventMap>(onEvents);
  const onAnyRef = useRef<UseSocketOptions["onAny"]>(onAny);
  const anyWrapperRef = useRef<AnyWrapper>(null);

  handlersRef.current = onEvents;
  onAnyRef.current = onAny;

  const roomsKey = useMemo(() => {
    const baseRooms = Array.isArray(roomsInput)
      ? Array.from(new Set(roomsInput.filter(Boolean).map(String)))
      : roomsInput
      ? [String(roomsInput)]
      : [];

    const userRooms = userId ? [`user:${String(userId)}`] : [];
    const rooms = Array.from(new Set([...baseRooms, ...userRooms]));

    return rooms.slice().sort().join("|");
  }, [roomsInput, userId]);

  useEffect(() => {
    const baseRooms = Array.isArray(roomsInput)
      ? Array.from(new Set(roomsInput.filter(Boolean).map(String)))
      : roomsInput
      ? [String(roomsInput)]
      : [];

    const userRooms = userId ? [`user:${String(userId)}`] : [];
    const rooms = Array.from(new Set([...baseRooms, ...userRooms]));

    const hasListeners =
      (typeof onAnyRef.current === "function") ||
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

    // Catch-all
    if (typeof onAnyRef.current === "function") {
      anyWrapperRef.current = (event, ...args) => onAnyRef.current?.(event, ...args);
      socket.onAny(anyWrapperRef.current);
    }

    // Specific handlers
    const bindHandlers = (handlers: SocketEventMap) => {
      Object.entries(handlers || {}).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.on(event, fn as (...args: any[]) => void);
      });
    };

    bindHandlers(handlersRef.current);

    let pollTimer: number | null = null;
    if (typeof poller === "function") {
      pollTimer = window.setInterval(() => poller?.(), 30000);
    }

    return () => {
      try {
        rooms.forEach((room) => socket.emit("leave", { room }));
      } catch {}

      Object.entries(handlersRef.current || {}).forEach(([event, fn]) => {
        if (typeof fn === "function") socket.off(event, fn as (...args: any[]) => void);
      });

      if (anyWrapperRef.current) {
        try { socket.offAny(anyWrapperRef.current); } catch {}
        anyWrapperRef.current = null;
      }

      try { socket.disconnect(); } catch {}
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [roomsKey, roomsInput, poller, userId]);

  // Rebind when onEvents changes identity
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const prev = handlersRef.current;

    Object.entries(prev || {}).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.off(event, fn as (...args: any[]) => void);
    });

    Object.entries(onEvents || {}).forEach(([event, fn]) => {
      if (typeof fn === "function") socket.on(event, fn as (...args: any[]) => void);
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
