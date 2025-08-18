// /src/components/MomentumRing.jsx
import React, { useMemo, useState } from "react";

/**
 * Lightweight MomentumRing
 * - no framer-motion
 * - on-demand confetti via dynamic import (only on click)
 */
export default function MomentumRing({ streakDays = 0, xp = 0, tier = "Newcomer", onClick }) {
  const [animPct, setAnimPct] = useState(0);

  const { xpToNext, tip } = useMemo(() => {
    const xpToNext = getXpToNextTier(tier);
    return { xpToNext, tip: getTierTip(tier) };
  }, [tier]);

  const percent = Math.min((xp / xpToNext) * 100, 100);

  // simple animate-in on mount
  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 800;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setAnimPct(percent * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  const handleClick = async () => {
    try {
      // lazy-load confetti only when interacted with
      const mod = await import("../utils/confetti.js");
      mod.fireConfetti?.();
    } catch {}
    onClick?.();
  };

  const arc = useMemo(() => {
    // convert percentage (0..100) to strokeDasharray in [0..100]
    return `${animPct},100`;
  }, [animPct]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      className="relative w-full max-w-xs mx-auto p-6 rounded-3xl shadow-xl border bg-white dark:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      style={{
        background: "radial-gradient(circle at center, #f3e8ff, #e0f2fe)",
        backgroundBlendMode: "soft-light",
      }}
      aria-label={`Momentum ring, ${streakDays} day cadence, ${xp} XP, ${tier} tier`}
    >
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{xp} XP</h3>
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          <span className="font-bold">{tier} Tier</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(percent)}% to next level
        </p>
      </div>

      <div className="relative w-32 h-32 mx-auto">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <defs>
            <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#tierGradient)"
            strokeWidth="8"
            strokeDasharray={arc}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold text-indigo-700 dark:text-indigo-200">
            {streakDays}d
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm italic text-center text-gray-600 dark:text-gray-400">{tip}</p>
    </div>
  );
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function getXpToNextTier(tier) {
  switch (tier) {
    case "Veteran": return 1000;
    case "Pro": return 750;
    case "Advanced": return 500;
    case "Intermediate": return 250;
    default: return 100;
  }
}
function getTierTip(tier) {
  switch (tier) {
    case "Veteran": return "You’ve built elite momentum. Inspire others!";
    case "Pro": return "You’re performing like a pro. Keep pushing forward.";
    case "Advanced": return "Advanced stage — sharpen your consistency.";
    case "Intermediate": return "You’re gaining traction. Stay on course.";
    default: return "Welcome aboard! Every click builds momentum.";
  }
}