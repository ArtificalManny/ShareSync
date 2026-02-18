import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketState = {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
};

type UseSocketOptions = {
  userId?: string | null;
  onEvents?: Record<string, (data: any) => void>;
  enabled?: boolean;
};

function getSocketBaseUrl() {
  // Prefer explicit socket URL, otherwise fall back to API URL, otherwise fall back to current origin
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  return socketUrl || apiUrl || window.location.origin;
}

function getTokenAny() {
  try {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

export default function useSocket(
  initialRooms: string[] = [],
  options: UseSocketOptions = {}
) {
  const { userId = null, onEvents = {}, enabled = true } = options;

  const socketRef = useRef<Socket | null>(null);
  const roomsRef = useRef<string[]>(initialRooms);
  const onEventsRef = useRef(onEvents);

  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Keep refs updated
  useEffect(() => {
    roomsRef.current = initialRooms;
  }, [initialRooms]);

  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

  // Create socket once (but connect only when enabled)
  useEffect(() => {
    const baseUrl = getSocketBaseUrl();

    // If socket already exists, don’t recreate
    if (!socketRef.current) {
      const token = getTokenAny();

      socketRef.current = io(baseUrl, {
        // Don’t connect until we decide below
        autoConnect: false,

        // Helpful when dev server is different origin than backend
        withCredentials: true,

        // Allow fallback if WS blocked
        transports: ["websocket", "polling"],

        // If your backend uses a custom path, change this
        path: "/socket.io",

        auth: {
          token,
          userId,
        },
      });
    }

    const socket = socketRef.current;

    const onConnect = () => {
      setState({ isConnected: true, isConnecting: false, error: null });

      // Join any rooms we already know about
      for (const room of roomsRef.current || []) {
        // Back-compat: try multiple common join patterns
        socket.emit("room:join", { room });
        socket.emit("joinRoom", room);
        socket.emit("join", room);
      }
    };

    const onDisconnect = () => {
      setState((prev) => ({ ...prev, isConnected: false, isConnecting: false }));
    };

    const onConnectError = (err: any) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ isConnected: false, isConnecting: false, error });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Attach event listeners from context (can change over time)
    const handlers = onEventsRef.current || {};
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // ✅ IMPORTANT:
    // Connect if enabled AND (userId exists OR we have rooms to join).
    // This allows public spectator pages to connect even when not signed in.
    const hasRoomsToJoin = (roomsRef.current || []).length > 0;
    const shouldConnect = Boolean(enabled && (userId || hasRoomsToJoin));

    // Always refresh auth payload before connecting (no backend change required)
    socket.auth = {
      token: getTokenAny(),
      userId,
    };

    if (shouldConnect) {
      if (!socket.connected) {
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));
        socket.connect();
      }
    } else {
      if (socket.connected) socket.disconnect();
      setState((prev) => ({ ...prev, isConnected: false, isConnecting: false }));
    }

    return () => {
      // Remove event listeners
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);

      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [enabled, userId, onEvents, initialRooms]);

  const emit = useCallback((event: string, payload?: any) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit(event, payload);
  }, []);

  const joinRoom = useCallback((room: string) => {
    const socket = socketRef.current;
    if (!socket || !room) return;

    // If not connected yet, the room will be joined on connect via roomsRef
    if (!roomsRef.current.includes(room)) {
      roomsRef.current = [...roomsRef.current, room];
    }

    if (socket.connected) {
      socket.emit("room:join", { room });
      socket.emit("joinRoom", room);
      socket.emit("join", room);
    } else {
      // Best effort: if we are enabled, try connecting now (public pages)
      // NOTE: this does not force auth; it simply allows the connection so rooms can be joined.
      // The main effect will also connect on the next render cycle.
      try {
        socket.auth = { token: getTokenAny(), userId };
        socket.connect();
      } catch {
        // no-op
      }
    }
  }, [userId]);

  const leaveRoom = useCallback((room: string) => {
    const socket = socketRef.current;
    if (!socket || !room) return;

    roomsRef.current = roomsRef.current.filter((r) => r !== room);

    if (socket.connected) {
      socket.emit("room:leave", { room });
      socket.emit("leaveRoom", room);
      socket.emit("leave", room);
    }
  }, []);

  return useMemo(
    () => ({
      socket: socketRef.current,
      state,
      emit,
      joinRoom,
      leaveRoom,
    }),
    [state, emit, joinRoom, leaveRoom]
  );
}
