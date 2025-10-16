// src/components/profile/Streak.jsx
import React from "react";

export default function Streak({ user, isPublic = false, className = "" }) {
  const streak = {
    current: Number(user?.streak?.current ?? user?.streakCurrent ?? 0),
    longest: Number(user?.streak?.longest ?? user?.streakLongest ?? 0),
    lastActiveAt: user?.streak?.lastActiveAt || user?.lastActiveAt || null,
  };
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 h-full ${className}`}>
      <div className="text-xs text-muted">Streak</div>
      <div className="mt-1 text-2xl font-semibold">{streak.current}🔥</div>
      <div className="mt-1 text-xs text-muted">
        Longest: <span className="font-medium">{streak.longest}</span> days
      </div>
      {streak.lastActiveAt && (
        <div className="mt-1 text-xs text-muted">
          Last active: {new Date(streak.lastActiveAt).toLocaleDateString()}
        </div>
      )}
      {/* Nothing special to hide here; this block is safe for public */}
    </div>
  );
}
