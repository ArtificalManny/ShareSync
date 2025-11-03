// src/components/momentum/StreakFlame.jsx
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useStreak } from "../../hooks/useStreak";
import { trackStreakViewed } from "../../utils/telemetry";

export default function StreakFlame({ size = 48, showCountdown = true }) {
  const { streak, hoursUntilReset, isLoading } = useStreak();
  const [pulse, setPulse] = useState(false);

  // Track view
  useEffect(() => {
    if (!isLoading && streak > 0) {
      trackStreakViewed({ streak });
    }
  }, [isLoading, streak]);

  // Pulse on streak increase
  useEffect(() => {
    if (streak > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [streak]);

  // Dynamic flame level (1–10)
  const level = useMemo(() => {
    if (streak === 0) return 0;
    return Math.min(Math.floor((streak - 1) / 3) + 1, 10);
  }, [streak]);

  // Load SVG dynamically
  const flameSvg = useMemo(() => {
    if (level === 0) {
      return <path d="M12 2C8.13 2 5 5.13 5 9c0 2.5 1.5 4.5 3 6v3H8v2h8v-2h-3v-3c1.5-1.5 3-3.5 3-6 0-3.87-3.13-7-7-7z" fill="#666" />;
    }
    return <image href={`/assets/flame-level-${level}.svg`} width="24" height="24" />;
  }, [level]);

  if (isLoading) {
    return <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse" />;
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <motion.div
        animate={pulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="drop-shadow-lg"
      >
        <svg width={size} height={size} viewBox="0 0 24 24">
          {flameSvg}
        </svg>
      </motion.div>

      {showCountdown && streak > 0 && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-white bg-red-600 px-1 rounded-full animate-pulse">
          {hoursUntilReset}h
        </div>
      )}

      {streak > 0 && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[9px] font-bold px-1 rounded-full shadow-md">
          {streak}
        </div>
      )}
    </div>
  );
}