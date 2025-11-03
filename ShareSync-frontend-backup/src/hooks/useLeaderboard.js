// src/hooks/useLeaderboard.js
import { useState, useEffect } from "react";
import { useRealtime } from "../services/realtime";

export function useLeaderboard({ limit = 10 } = {}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected, userId } = useRealtime();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = (data) => {
      if (!Array.isArray(data)) return;

      const ranked = data.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isMe: String(entry.userId || entry.id) === String(userId),
      }));

      setLeaderboard(ranked);
      setLoading(false);
      setError(null);
    };

    const handleError = (err) => {
      console.error("Leaderboard error:", err);
      setError(err.message || "Failed to load leaderboard");
      setLoading(false);
    };

    // Subscribe
    socket.emit("leaderboard:subscribe", { limit });
    socket.on("leaderboard:update", handleUpdate);
    socket.on("leaderboard:error", handleError);

    // Initial fetch
    socket.emit("leaderboard:get", { limit }, (response) => {
      if (response?.data) {
        handleUpdate(response.data);
      } else if (response?.error) {
        handleError(response.error);
      }
    });

    return () => {
      socket.emit("leaderboard:unsubscribe");
      socket.off("leaderboard:update", handleUpdate);
      socket.off("leaderboard:error", handleError);
    };
  }, [socket, isConnected, userId, limit]);

  // Fallback mock data
  useEffect(() => {
    if (!isConnected && loading) {
      setTimeout(() => {
        setLeaderboard([
          { id: "1", name: "Alex", streak: 12, xp: 2450, isMe: false, rank: 1 },
          { id: "2", name: "Jordan", streak: 10, xp: 2200, isMe: false, rank: 2 },
          { id: "3", name: "You", streak: 7, xp: 1800, isMe: true, rank: 3 },
          { id: "4", name: "Sam", streak: 6, xp: 1600, isMe: false, rank: 4 },
          { id: "5", name: "Taylor", streak: 5, xp: 1400, isMe: false, rank: 5 },
        ]);
        setLoading(false);
      }, 800);
    }
  }, [isConnected, loading]);

  return { leaderboard, loading, error, isConnected };
}