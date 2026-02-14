// src/hooks/useSocket.ts
// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET HOOK - Enhanced for ShareSync real-time features
// ⭐ PHASE 2A: Added emit capability and connection state tracking
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "/";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SocketEventHandler<T = any> = (payload: T) => void;
export type SocketEventMap = Record<string, SocketEventHandler<any>>;

export type UseSocketOptions = {
  onEvents?: SocketEventMap;
  onAny?: (eventName: string, ...args: any[]) => void;
  poller?: () => void;
  userId?: string | null;
  enabled?: boolean; // ⭐ NEW: Allow disabling
};

export type SocketState = {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
};

export type UseSocketReturn = {
  socket: Socket | null;
  state: SocketState;
  emit: (event: string, payload: any) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
};

type AnyWrapper = ((event: string, ...args: any[]) => void) | null;

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export default function useSocket(
  roomsInput: string | string[] | null | undefined,
  { onEvents = {}, onAny, poller, userId, enabled = true }: UseSocketOptions = {}
): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<SocketEventMap>(onEvents);
  const onAnyRef = useRef<UseSocketOptions["onAny"]>(onAny);
  const anyWrapperRef = useRef<AnyWrapper>(null);

  // ⭐ NEW: Track connection state
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

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

  // ⭐ NEW: Emit function
  const emit = useCallback((event: string, payload: any) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(event, payload);
    } else {
      console.warn('[useSocket] Cannot emit, socket not connected');
    }
  }, []);

  // ⭐ NEW: Join room function
  const joinRoom = useCallback((room: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('join', { room });
    }
  }, []);

  // ⭐ NEW: Leave room function
  const leaveRoom = useCallback((room: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('leave', { room });
    }
  }, []);

  useEffect(() => {
    // ⭐ NEW: Skip if disabled
    if (!enabled) {
      return;
    }

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

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    const socket = io(WS_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    const joinAll = () => {
      try {
        rooms.forEach((room) => socket.emit("join", { room }));
      } catch {}
    };

    // ⭐ Connection state handlers
    socket.on("connect", () => {
      setState({ isConnected: true, isConnecting: false, error: null });
      joinAll();
    });

    socket.on("disconnect", (reason) => {
      setState(prev => ({ ...prev, isConnected: false }));
      console.debug('[useSocket] Disconnected:', reason);
    });

    socket.on("connect_error", (error) => {
      setState({ isConnected: false, isConnecting: false, error });
      console.warn('[useSocket] Connection error:', error.message);
    });

    socket.io.on("reconnect", () => {
      setState({ isConnected: true, isConnecting: false, error: null });
      joinAll();
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      setState(prev => ({ ...prev, isConnecting: true }));
      console.debug('[useSocket] Reconnect attempt:', attempt);
    });

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

      socketRef.current = null;
      setState({ isConnected: false, isConnecting: false, error: null });
    };
  }, [roomsKey, roomsInput, poller, userId, enabled]);

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

  return {
    socket: socketRef.current,
    state,
    emit,
    joinRoom,
    leaveRoom,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE HOOK FOR COMPONENTS THAT JUST NEED SOCKET ACCESS
// ═══════════════════════════════════════════════════════════════════════════════

export function useSocketEmit() {
  const socketRef = useRef<Socket | null>(null);

  const emit = useCallback((event: string, payload: any) => {
    // Try to get socket from context if available
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(event, payload);
      return true;
    }
    return false;
  }, []);

  return { emit, setSocket: (s: Socket | null) => { socketRef.current = s; } };
}
