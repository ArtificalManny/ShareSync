import React from "react";

/**
 * FocusPresenceDot
 * Tiny status indicator with an optional *focus* glow.
 *
 * Props:
 * - isOnline?: boolean
 * - isFocusing?: boolean
 * - size?: number         // px, default 10
 * - title?: string
 */
export default function FocusPresenceDot({
  isOnline = true,
  isFocusing = false,
  size = 10,
  title,
}) {
  const base = isOnline ? "rgb(16, 185, 129)" : "rgba(148,163,184,.65)"; // emerald vs slate
  const ring = isFocusing
    ? "conic-gradient(from 0deg, #7c3aed, #22d3ee, #7c3aed)"
    : "none";

  const s = {
    width: size,
    height: size,
    borderRadius: size,
    backgroundColor: base,
    boxShadow: isOnline ? `0 0 0 1px rgba(255,255,255,.35) inset` : "none",
    position: "relative",
    display: "inline-block",
  };

  return (
    <span className="relative inline-block" title={title}>
      {/* outer ripple when focusing */}
      {isFocusing && (
        <>
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: `-${Math.ceil(size * 0.9)}px`,
              borderRadius: 999,
              backgroundImage: ring,
              filter: "blur(10px)",
              opacity: 0.85,
              animation: "fpd-rotate 3.5s linear infinite",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: `-${Math.ceil(size * 0.6)}px`,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 50% 50%, rgba(124,58,237,.45), rgba(34,211,238,.25) 45%, transparent 65%)",
              animation: "fpd-breathe 2.2s ease-in-out infinite",
            }}
          />
        </>
      )}
      <span style={s} />
      {/* keyframes inline so no extra CSS file needed */}
      <style>{`
        @keyframes fpd-rotate { to { transform: rotate(360deg); } }
        @keyframes fpd-breathe {
          0%, 100% { opacity: .55; transform: scale(.98); }
          50% { opacity: .95; transform: scale(1.06); }
        }
      `}</style>
    </span>
  );
}
