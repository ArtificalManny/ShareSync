// src/hooks/useMomentumScore.js
import { useState, useEffect } from "react";

export function useMomentumScore() {
  const [score, setScore] = useState(78);
  const [label, setLabel] = useState("Strong");

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setScore((s) => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newScore = Math.max(0, Math.min(100, s + change));
        setLabel(
          newScore >= 90 ? "Elite" :
          newScore >= 70 ? "Strong" :
          newScore >= 50 ? "Solid" : "Building"
        );
        return newScore;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { score, label };
}