// src/hooks/useOnlineUsers.js
import { useState, useEffect } from "react";
import { useRealtime } from "../services/realtime";

export function useOnlineUsers({ limit = 5 } = {}) {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useRealtime();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = (data) => {
      if (!data?.users || !Array.isArray(data.users)) return;

      const active = data.users
        .filter(u => u.isOnline)
        .slice(0, limit)
        .map(u => ({
          id: u.userId || u.id,
          name: u.name || "User",
          avatar: u.avatar || null,
        }));

      setUsers(active);
      setCount(data.totalOnline || active.length);
      setIsLoading(false);
    };

    socket.emit("presence:subscribe");
    socket.on("presence:update", handleUpdate);

    socket.emit("presence:get", (response) => {
      if (response) handleUpdate(response);
    });

    return () => {
      socket.emit("presence:unsubscribe");
      socket.off("presence:update", handleUpdate);
    };
  }, [socket, isConnected, limit]);

  // Fallback mock
  useEffect(() => {
    if (!isConnected && isLoading) {
      setTimeout(() => {
        setUsers([
          { id: "1", name: "Alex", avatar: null },
          { id: "2", name: "Jordan", avatar: null },
        ]);
        setCount(2);
        setIsLoading(false);
      }, 800);
    }
  }, [isConnected, isLoading]);

  return { users, count, isLoading };
}