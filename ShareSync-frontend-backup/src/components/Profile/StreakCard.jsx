import React from "react";
import { Flame } from "lucide-react";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * StreakCard
 * Props:
 *  - current: number
 *  - longest: number
 *  - lastActiveAt?: string|number|Date
 *  - className?: string
 *  - motionEnabled?: boolean (default true)
 */
export default function StreakCard({
  current = 0,
  longest = 0,
  lastActiveAt,
  className = "",
  motionEnabled = true,
}) {
  const prefersReduced = useReducedMotion();
  const animate = motionEnabled && !prefersReduced && current > 0;

  const last =
    lastActiveAt ? new Date(lastActiveAt).toLocaleDateString() : null;

  return (
    <div className={["profile-card", className].filter(Boolean).join(" ")}>
      <div className="text-xs text-muted">Streak</div>
      <div className={["mt-2 flex items-center gap-2", animate ? "streak-pulse" : ""].join(" ")}>
        <Flame className="w-5 h-5 text-amber-500" />
        <div className="text-2xl font-semibold">{current}</div>
        <span className="text-sm text-muted">days</span>
      </div>
      <div className="mt-2 text-xs text-muted">
        Longest: <span className="font-medium">{longest}</span> days
      </div>
      {last && (
        <div className="mt-1 text-xs text-muted">Last active: {last}</div>
      )}
    </div>
  );
}
