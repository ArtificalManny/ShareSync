import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketState = {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
};

type UseSocketOptions = {
  userId?: string | null;
  token?: string | null;
  onEvents?: Record<string, (data: any) => void>;
  enabled?: boolean;
};

function getSocketBaseUrl() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  const raw = socketUrl || apiUrl || window.location.origin;
  const normalized = raw
    .replace(/\/api\/?$/, "")
    .replace(/\/+$/, "");

  // production-socket-localhost-guard-v1
  //
  // Vite may fall back to a tracked development .env when a deployment
  // environment variable is missing. Never allow a production browser
  // or native WebView to connect to its own localhost.
  const isLocalhost =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized);

  if (import.meta.env.PROD && isLocalhost) {
    return "https://openshare-backend.onrender.com";
  }

  return normalized;
}

function getTokenAny() {
  try {
    return (
      localStorage.getItem("ss.token") ||
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

function resolveToken(explicitToken?: string | null) {
  return explicitToken || getTokenAny();
}

function emitJoinForRoom(
  socket: Socket,
  room: string,
  userId?: string | null,
  isInvisible: boolean = false
) {
  if (!room) return;

  if (room.startsWith("project:")) {
    const projectId = room.split(":")[1];
    if (!projectId) return;

    socket.emit("joinProject", {
      projectId,
      userId,
      isInvisible,
    });
    return;
  }

  if (room.startsWith("user:")) {
    const targetUserId = room.split(":")[1];
    if (!targetUserId) return;

    socket.emit("joinUser", {
      userId: targetUserId,
    });
    return;
  }

  socket.emit("room:join", { room });
  socket.emit("joinRoom", room);
  socket.emit("join", room);
}

function emitLeaveForRoom(
  socket: Socket,
  room: string,
  userId?: string | null
) {
  if (!room) return;

  if (room.startsWith("project:")) {
    const projectId = room.split(":")[1];
    if (!projectId) return;

    socket.emit("leaveProject", {
      projectId,
      userId,
    });
    return;
  }

  if (room.startsWith("user:")) {
    const targetUserId = room.split(":")[1];
    if (!targetUserId) return;

    socket.emit("leaveUser", {
      userId: targetUserId,
    });
    return;
  }

  socket.emit("room:leave", { room });
  socket.emit("leaveRoom", room);
  socket.emit("leave", room);
}

export default function useSocket(
  initialRooms: string[] = [],
  options: UseSocketOptions = {}
) {
  const { userId = null, token = null, onEvents = {}, enabled = true } = options;

  const socketRef = useRef<Socket | null>(null);
  const roomsRef = useRef<string[]>(initialRooms);
  const onEventsRef = useRef(onEvents);

  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    roomsRef.current = initialRooms || [];
  }, [initialRooms]);

  useEffect(() => {
    onEventsRef.current = onEvents || {};
  }, [onEvents]);

  useEffect(() => {
    const baseUrl = getSocketBaseUrl();

    if (!socketRef.current) {
      socketRef.current = io(baseUrl, {
        autoConnect: false,
        withCredentials: true,
        // Polling first is more stable in local dev/proxy setups; Socket.IO can upgrade later.
        transports: ["polling", "websocket"],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 750,
        path: "/socket.io",
        auth: {
          token: resolveToken(token),
          userId,
        },
      });
    }

    const socket = socketRef.current;

    const onConnect = () => {
      setState({ isConnected: true, isConnecting: false, error: null });

      for (const room of roomsRef.current || []) {
        emitJoinForRoom(socket, room, userId, false);
      }
    };

    const onDisconnect = () => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    };

    const onConnectError = (err: any) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({
        isConnected: false,
        isConnecting: false,
        error,
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [userId, token]);

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

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const hasRoomsToJoin = (roomsRef.current || []).length > 0;
    const shouldConnect = Boolean(enabled && (userId || hasRoomsToJoin));

    socket.auth = {
      token: resolveToken(token),
      userId,
    };

    if (shouldConnect) {
      if (!socket.connected) {
        setState((prev) => ({
          ...prev,
          isConnecting: true,
          error: null,
        }));
        socket.connect();
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    }
  }, [enabled, userId, token, initialRooms]);

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
        emitJoinForRoom(socket, room, userId, false);
      } else if (enabled) {
        try {
          socket.auth = {
            token: resolveToken(token),
            userId,
          };
          socket.connect();
        } catch {
          // no-op
        }
      }
    },
    [enabled, token, userId]
  );

  const leaveRoom = useCallback(
    (room: string) => {
      const socket = socketRef.current;
      if (!socket || !room) return;

      roomsRef.current = roomsRef.current.filter((r) => r !== room);

      if (socket.connected) {
        emitLeaveForRoom(socket, room, userId);
      }
    },
    [userId]
  );

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
