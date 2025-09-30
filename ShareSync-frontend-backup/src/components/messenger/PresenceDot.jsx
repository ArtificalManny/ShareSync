import React from "react";

/**
 * PresenceDot
 * Tiny status indicator for avatars.
 *
 * Props:
 * - status: 'online' | 'away' | 'busy' | 'offline'
 * - size: number (px)  — default 10
 * - className: string  — extra classes
 * - title: string      — tooltip text override
 */
export default function PresenceDot({ status = "offline", size = 10, className = "", title }) {
  const color =
    status === "online" ? "bg-emerald-500"
    : status === "away"   ? "bg-amber-500"
    : status === "busy"   ? "bg-rose-500"
    :                      "bg-slate-400";

  const ring =
    status === "offline" ? "ring-2 ring-slate-300/50 dark:ring-slate-600/60"
    : "ring-2 ring-white dark:ring-slate-900";

  const label =
    title ||
    (status === "online" ? "Online"
      : status === "away" ? "Away"
      : status === "busy" ? "Do not disturb"
      : "Offline");

  return (
    <span
      className={`inline-block rounded-full ${color} ${ring} ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
      title={label}
    />
  );
}
