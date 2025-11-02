// src/hooks/useOnlineUsers.js
import { useState, useEffect } from "react";

export function useOnlineUsers() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Mock online users
    setUsers([
      { id: "1", name: "Alex", avatar: null },
      { id: "2", name: "Jordan", avatar: null },
    ]);
    setCount(2);

    // Simulate comings/goings
    const interval = setInterval(() => {
      setCount((c) => c + (Math.random() > 0.7 ? 1 : -1));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { users, count };
}