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
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  return (socketUrl || apiUrl || window.location.origin).replace(/\/+$/, "");
}

function getTokenAny() {
  try {
    return (
      localStorage.getItem("ss.jwt") ||
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

  // Keep refs updated WITHOUT forcing the main socket effect to restart.
  useEffect(() => {
    roomsRef.current = initialRooms || [];
  }, [initialRooms]);

  useEffect(() => {
    onEventsRef.current = onEvents || {};
  }, [onEvents]);

  // Create socket ONCE
  useEffect(() => {
    const baseUrl = getSocketBaseUrl();

    if (!socketRef.current) {
      socketRef.current = io(baseUrl, {
        autoConnect: false,
        withCredentials: true,
        transports: ["websocket", "polling"],
        path: "/socket.io",
        auth: {
          token: getTokenAny(),
          userId,
        },
      });
    }

    const socket = socketRef.current;

    const onConnect = () => {
      setState({ isConnected: true, isConnecting: false, error: null });

      // Join any rooms we already know about
      for (const room of roomsRef.current || []) {
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

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
    // IMPORTANT: do NOT depend on onEvents/initialRooms objects here.
    // We manage them via refs above to avoid infinite render loops.
  }, [userId]);

  // Attach/detach dynamic event listeners (safe + isolated)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handlers = onEventsRef.current || {};
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [onEvents]);

  // Connect/disconnect logic (stable)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const hasRoomsToJoin = (roomsRef.current || []).length > 0;
    const shouldConnect = Boolean(enabled && (userId || hasRoomsToJoin));

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
  }, [enabled, userId, initialRooms]);

  const emit = useCallback((event: string, payload?: any) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit(event, payload);
  }, []);

  const joinRoom = useCallback(
    (room: string) => {
      const socket = socketRef.current;
      if (!socket || !room) return;

      if (!roomsRef.current.includes(room)) {
        roomsRef.current = [...roomsRef.current, room];
      }

      if (socket.connected) {
        socket.emit("room:join", { room });
        socket.emit("joinRoom", room);
        socket.emit("join", room);
      } else if (enabled) {
        try {
          socket.auth = { token: getTokenAny(), userId };
          socket.connect();
        } catch {
          // no-op
        }
      }
    },
    [enabled, userId]
  );

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
