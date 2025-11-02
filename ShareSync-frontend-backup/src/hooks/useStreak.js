// src/hooks/useStreak.js
import { useState, useEffect } from "react";

export function useStreak() {
  const [streak, setStreak] = useState(7);
  const [hoursUntilReset, setHoursUntilReset] = useState(3);

  useEffect(() => {
    // Mock real-time countdown
    const interval = setInterval(() => {
      setHoursUntilReset((h) => (h > 0 ? h - 1 : 23));
    }, 3600000); // every hour

    return () => clearInterval(interval);
  }, []);

  return { streak, hoursUntilReset };
}