// /src/components/AvatarGroup.jsx
import React, { useMemo } from "react";

/**
 * AvatarGroup
 * Compact overlapping avatars with "+N" overflow.
 *
 * props:
 *  - users: Array<{ id: string, name: string, avatarUrl?: string }>
 *  - max?: number (default 4)
 *  - size?: number (px, default 28)
 *  - overlap?: number (px, default -8)
 *  - ring?: boolean (default true) — white ring around each avatar
 */
export default function AvatarGroup({
  users = [],
  max = 4,
  size = 28,
  overlap = -8,
  ring = true,
}) {
  const shown = users.slice(0, max);
  const extra = Math.max(0, users.length - shown.length);

  const title = useMemo(() => {
    const names = users.map((u) => u?.name).filter(Boolean);
    return names.length ? names.join(", ") : "No members";
  }, [users]);

  const ringCls = ring ? "ring-2 ring-white dark:ring-slate-900" : "";

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label="Project members"
      title={title}
    >
      {shown.map((u, i) => (
        <div
          key={u.id || i}
          className={`relative rounded-full overflow-hidden bg-slate-200 text-slate-700 grid place-items-center ${ringCls}`}
          style={{
            width: size,
            height: size,
            marginLeft: i ? overlap : 0,
            fontSize: Math.max(10, Math.round(size * 0.4)),
          }}
          aria-label={u?.name || "Member"}
        >
          {u?.avatarUrl ? (
            <img
              src={u.avatarUrl}
              alt={u?.name || ""}
              width={size}
              height={size}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>
              {initialsFromName(u?.name)}
            </span>
          )}
        </div>
      ))}

      {extra > 0 && (
        <div
          className={`ml-[-8px] rounded-full bg-slate-100 text-slate-700 grid place-items-center font-medium ${ringCls}`}
          style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.45)) }}
          aria-label={`${extra} more member${extra > 1 ? "s" : ""}`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

function initialsFromName(name) {
  if (!name || typeof name !== "string") return "•";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "•";
}
