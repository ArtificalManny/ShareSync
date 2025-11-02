// src/components/momentum/StreakFlame.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStreak } from "../../hooks/useStreak";

const FLAME_SVG = [
  // Level 0 (no streak)
  <path key="0" d="M12 2C8.13 2 5 5.13 5 9c0 2.5 1.5 4.5 3 6v3H8v2h8v-2h-3v-3c1.5-1.5 3-3.5 3-6 0-3.87-3.13-7-7-7z" fill="#666" />,
  // Level 1
  <path key="1" d="M12 1c-4.42 0-8 3.58-8 8 0 3 2 5.5 4 7v3H7v3h10v-3h-3v-3c2-1.5 4-4 4-7 0-4.42-3.58-8-8-8z" fill="#ff6b35" />,
  // Level 2
  <path key="2" d="M12 0c-5.52 0-10 4.48-10 10 0 3.5 2 6.5 5 8v4H6v4h12v-4h-3v-4c3-1.5 5-4.5 5-8 0-5.52-4.48-10-10-10z" fill="#ff8c00" />,
  // Level 3+
  <path key="3" d="M12 -1c-6.62 0-12 5.38-12 12 0 4 2.5 7.5 6 9v5H5v5h14v-5h-3v-5c3.5-1.5 6-5 6-9 0-6.62-5.38-12-12-12z" fill="#ff4500" />,
];

export default function StreakFlame({ size = 48, showCountdown = true }) {
  const { streak, hoursUntilReset } = useStreak();
  const [pulse, setPulse] = useState(false);

  // Trigger pulse on streak increase
  useEffect(() => {
    if (streak > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [streak]);

  const level = streak === 0 ? 0 : Math.min(Math.floor(streak / 3) + 1, 3);
  const flamePath = FLAME_SVG[level];

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        animate={pulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="drop-shadow-lg"
      >
        {flamePath}
      </motion.svg>

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