// src/hooks/useMomentumScore.js
import { useState, useEffect } from "react";
import { useRealtime } from "../services/realtime";

export function useMomentumScore() {
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("Building");
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useRealtime();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = (data) => {
      if (typeof data?.score !== "number") return;

      const newScore = Math.max(0, Math.min(100, data.score));
      setScore(newScore);
      setLabel(
        newScore >= 90 ? "Elite" :
        newScore >= 70 ? "Strong" :
        newScore >= 50 ? "Solid" : "Building"
      );
      setIsLoading(false);
    };

    socket.emit("momentum:subscribe");
    socket.on("momentum:update", handleUpdate);

    socket.emit("momentum:get", (response) => {
      if (response?.score) handleUpdate(response);
    });

    return () => {
      socket.emit("momentum:unsubscribe");
      socket.off("momentum:update", handleUpdate);
    };
  }, [socket, isConnected]);

  // Fallback mock
  useEffect(() => {
    if (!isConnected && isLoading) {
      setTimeout(() => {
        setScore(78);
        setLabel("Strong");
        setIsLoading(false);
      }, 1000);
    }
  }, [isConnected, isLoading]);

  return { score, label, isLoading };
}