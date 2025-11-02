// src/hooks/useLeaderboard.js
import { useState, useEffect } from "react";

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setLeaderboard([
        { id: "1", name: "Alex", streak: 12, xp: 2450, isMe: false },
        { id: "2", name: "Jordan", streak: 10, xp: 2200, isMe: false },
        { id: "3", name: "You", streak: 7, xp: 1800, isMe: true },
        { id: "4", name: "Sam", streak: 6, xp: 1600, isMe: false },
        { id: "5", name: "Taylor", streak: 5, xp: 1400, isMe: false },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return { leaderboard, loading, error: null };
}