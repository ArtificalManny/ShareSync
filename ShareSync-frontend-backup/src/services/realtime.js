// src/services/realtime.js
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

let socket = null;

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get user ID from auth or localStorage
    const id = localStorage.getItem("ss_user_id") || "anonymous";
    setUserId(id);

    // Initialize socket
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: { userId: id },
      });

      socket.on("connect", () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("WebSocket error:", err.message);
      });
    }

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    userId,
  };
}

// Helper to get socket outside React
export const getSocket = () => socket;