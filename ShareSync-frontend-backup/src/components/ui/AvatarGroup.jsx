// src/components/ui/AvatarGroup.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// Presence-aware AvatarGroup (stacked avatars with optional +N overflow)
// FIXED: animate-pulse on online indicator → static dot (quiet confidence)
// FIXED: Hardcoded slate/emerald colors → Design tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Avatar from "./Avatar.jsx";
import "../../styles/presence.css";

export default function AvatarGroup({
  members = [],
  isOnline,
  max = 6,
  size = 28,
  overlap = true,
  showOverflow = true,
  className = "",
  showPresence = true,
}) {
  const clean = Array.isArray(members) ? members.filter(Boolean) : [];
  const visibleCount = Math.max(0, Math.min(clean.length, max));
  const overflow = Math.max(0, clean.length - visibleCount);
  const visible = useMemo(() => clean.slice(0, visibleCount), [clean, visibleCount]);

  const style = useMemo(
    () => ({ width: `${size}px`, height: `${size}px` }),
    [size]
  );

  const containerCls = [overlap ? "flex -space-x-2" : "flex gap-1", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerCls} role="list" aria-label="Project members">
      {visible.map((m, i) => {
        const uid = String(m.userId || m.id || i);
        const name = m.name || m.username || "User";
        const src = m.avatar || m.avatarUrl || m.profilePicture;
        const online = isOnline?.(uid);

        return (
          <div
            className="relative inline-block"
            role="listitem"
            key={uid}
            title={name}
          >
            <Avatar
              name={name}
              src={src}
              size={size}
              className="ring-2 ring-white dark:ring-surface-0"
            />
            {showPresence && (
              <span
                className={[
                  "absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white dark:border-surface-0 transition-colors duration-300",
                  online ? "bg-success" : "bg-text-tertiary",
                ].join(" ")}
                aria-label={online ? "Online" : "Away"}
                aria-hidden={!online}
              />
            )}
          </div>
        );
      })}

      {showOverflow && overflow > 0 && (
        <div
          className="inline-grid place-items-center rounded-full ring-2 ring-white dark:ring-surface-0 bg-surface-2 text-text-secondary text-xs"
          style={{ ...style, fontSize: Math.max(10, Math.round(size * 0.42)) }}
          title={`${overflow} more`}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
