import React, { useMemo } from "react";

/**
 * XpRing
 * SVG circular progress ring with a level label.
 *
 * Props:
 *  - level: number (displayed in the center)
 *  - progress: number in [0,1]
 *  - size?: number (px, default 120)
 *  - thickness?: number (px, default 10)
 *  - label?: string ("XP")
 *  - sublabel?: string (e.g., "45/120")
 *  - motionEnabled?: boolean (default true)
 */
export default function XpRing({
  level = 1,
  progress = 0,
  size = 120,
  thickness = 10,
  label = "XP",
  sublabel = "",
  motionEnabled = true,
}) {
  const radius = useMemo(() => (size - thickness) / 2, [size, thickness]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = clamped * circumference;
  const remainder = circumference - dash;

  // Use motion tokens for timing
  const transition = motionEnabled
    ? "stroke-dasharray var(--motion-normal, 240ms) var(--easing-standard, cubic-bezier(.2,.8,.2,1))"
    : "none";

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: Level ${level}, ${Math.round(clamped * 100)}% to next level`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={thickness}
        />

        {/* Progress (uses signature gradient via tokens) */}
        <defs>
          <linearGradient id="xp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            {/* Signature gradient from tokens.css; resolves at runtime */}
            <stop offset="0%"  style={{ stopColor: "rgb(var(--grad-pandora-a, 124 58 237))" }} />
            <stop offset="Available" style={{ stopColor: "rgb(var(--grad-pandora-b, 34 211 238))" }} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#xp-ring-grad)"
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${remainder}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none select-none">
        <div className="text-center leading-tight">
          <div className="text-[11px] text-muted">{label}</div>
          <div className="text-xl font-bold">Lv {level}</div>
          {sublabel ? <div className="text-[11px] text-muted mt-0.5">{sublabel}</div> : null}
        </div>
      </div>
    </div>
  );
}
