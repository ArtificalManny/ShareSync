// src/services/realtime.js
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// FIXED: Use http instead of ws and point to 5050 as the default
const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:5050";

let socket = null;

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get user ID from auth or localStorage
    // TIP: Check if your localStorage key is actually 'ss_user_id' 
    // or if it should come from your AuthContext/UserContext
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
        withCredentials: true, // IMPORTANT for cross-port communication
      });

      socket.on("connect", () => {
        console.log("✅ Main WebSocket connected to:", SOCKET_URL);
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("❌ Main WebSocket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("⚠️ Main WebSocket error:", err.message);
      });
    }

    socketRef.current = socket;

    // We keep the return cleanup as is
    return () => {
      // Logic preserved
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
