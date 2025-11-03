// src/hooks/useStreak.js
import { useState, useEffect, useRef } from "react";
import { useRealtime } from "../services/realtime";

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [hoursUntilReset, setHoursUntilReset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useRealtime();

  const lastUpdateRef = useRef(null);

  // Initial fetch + real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStreakUpdate = (data) => {
      if (!data || typeof data.streak !== "number") return;

      const newStreak = data.streak;
      const resetAt = data.resetAt ? new Date(data.resetAt) : null;
      const now = Date.now();

      // Prevent stale updates
      if (lastUpdateRef.current && lastUpdateRef.current >= now) return;
      lastUpdateRef.current = now;

      setStreak(newStreak);

      if (resetAt && resetAt > now) {
        const diffMs = resetAt - now;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        setHoursUntilReset(Math.max(0, hours));
      } else {
        setHoursUntilReset(0);
      }

      setIsLoading(false);
    };

    // Subscribe
    socket.emit("streak:subscribe");
    socket.on("streak:update", handleStreakUpdate);

    // Initial request
    socket.emit("streak:get", (response) => {
      if (response) handleStreakUpdate(response);
    });

    return () => {
      socket.emit("streak:unsubscribe");
      socket.off("streak:update", handleStreakUpdate);
    };
  }, [socket, isConnected]);

  // Countdown timer
  useEffect(() => {
    if (hoursUntilReset <= 0 || isLoading) return;

    const interval = setInterval(() => {
      setHoursUntilReset((h) => (h > 0 ? h - 1 : 0));
    }, 3600000); // every hour

    return () => clearInterval(interval);
  }, [hoursUntilReset, isLoading]);

  // Fallback mock data
  useEffect(() => {
    if (!isConnected && isLoading) {
      // Mock fallback
      setTimeout(() => {
        setStreak(7);
        setHoursUntilReset(3);
        setIsLoading(false);
      }, 600);
    }
  }, [isConnected, isLoading]);

  return { streak, hoursUntilReset, isLoading };
}