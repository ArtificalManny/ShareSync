// src/components/ui/AvatarGroup.jsx
import React, { useMemo } from "react";
import Avatar from "./Avatar.jsx";
import "../../styles/presence.css";

/**
 * Presence-aware AvatarGroup (stacked avatars with optional +N overflow)
 *
 * Props:
 *  - members: Array<{ id|userId, name, username?, avatar|avatarUrl|profilePicture, role? }>
 *  - isOnline?: (id: string) => boolean   // from usePresence(roomId)
 *  - max?: number            // default 6
 *  - size?: number           // px, default 28
 *  - overlap?: boolean       // stacked if true, spaced if false
 *  - showOverflow?: boolean  // render +N bubble if overflow
 *  - className?: string
 *  - showPresence?: boolean  // render dot overlay, default true
 */
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

        return (
          <div className="relative inline-block" role="listitem" key={uid} title={name}>
            <Avatar name={name} src={src} size={size} className="ring-2 ring-white dark:ring-slate-900" />
            {showPresence && (
              <span
                className={[
                  "presence-dot",
                  isOnline?.(uid) ? "is-online" : "is-away",
                ].join(" ")}
                aria-hidden
              />
            )}
          </div>
        );
      })}

      {showOverflow && overflow > 0 && (
        <div
          className="inline-grid place-items-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-800/50 text-white text-xs"
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
