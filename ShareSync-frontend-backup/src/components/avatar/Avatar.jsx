import React, { useMemo } from "react";
import AnimatedRing from "../ui/AnimatedRing";

/**
 * Avatar
 * Props:
 *  - src?: string
 *  - name?: string
 *  - size?: number (px)
 *  - status?: 'online' | 'away' | 'offline'
 *  - ringColor?: 'blue'|'purple'|'emerald'|string (CSS color or gradient token)
 *  - pulseOnOnline?: boolean (default true)
 *  - className?: string
 */
export default function Avatar({
  src,
  name = "",
  size = 36,
  status = "offline",
  ringColor,
  pulseOnOnline = true,
  className = "",
  ...rest
}) {
  const initials = useMemo(() => {
    const n = (name || "").trim();
    if (!n) return "•";
    const parts = n.split(/\s+/);
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  }, [name]);

  const online = status === "online";
  const showRing = Boolean(ringColor) || (pulseOnOnline && online);

  const avatar = (
    <div
      className={[
        "relative rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 grid place-content-center",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      aria-label={name || "avatar"}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: Math.max(10, Math.floor(size * 0.42)) }}>{initials}</span>
      )}

      {/* status dot */}
      <span
        className="absolute rounded-full border border-white dark:border-slate-900"
        style={{
          width: Math.max(6, Math.floor(size * 0.24)),
          height: Math.max(6, Math.floor(size * 0.24)),
          right: Math.max(1, Math.floor(size * 0.06)),
          bottom: Math.max(1, Math.floor(size * 0.06)),
          background:
            status === "online"
              ? "rgb(16 185 129)" // emerald-500
              : status === "away"
              ? "rgb(234 179 8)"   // amber-500
              : "rgb(148 163 184)", // slate-400
        }}
        aria-hidden="true"
      />
    </div>
  );

  if (!showRing) return avatar;

  return (
    <AnimatedRing
      size={size + 10}
      thickness={2}
      color={ringColor || "emerald"}
      animated={pulseOnOnline && online}
      className="avatar-ring"
    >
      {avatar}
    </AnimatedRing>
  );
}
