// src/context/SocketProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client"; // named import
import { SOCKET_EVENTS } from "../types/events";

type SocketContextValue = { socket: Socket | null };

const SocketCtx = createContext<SocketContextValue>({ socket: null });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io("/", { withCredentials: true });
    setSocket(s);
    // ✅ cleanup must disconnect (return void), not the socket instance
    return () => { s.disconnect(); };
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketCtx);
  return ctx.socket; // will be null until connected
}

// Optional typed event helper (safe no-op when socket isn't ready)
export function useSocketEvent<T = any>(
  eventKey: keyof typeof SOCKET_EVENTS,
  handler: (payload: T) => void
) {
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const evt = SOCKET_EVENTS[eventKey];
    socket.on(evt, handler);
    return () => { socket.off(evt, handler); };
  }, [socket, eventKey, handler]);
}