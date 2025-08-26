// /src/components/AvatarGroup.jsx
import React, { useMemo } from "react";

/**
 * AvatarGroup
 * - Consistent, accessible avatar stack with overlap +N overflow
 * - Props:
 *    users: Array<{ id?, name?, avatarUrl? }>
 *    max: number (default 4)
 *    size: number px (default 28)
 *    overlap: boolean (default true)
 *    showOverflow: boolean (default true) – show "+N"
 *    className: string
 */
export default function AvatarGroup({
  users = [],
  max = 4,
  size = 28,
  overlap = true,
  showOverflow = true,
  className = "",
  "aria-label": ariaLabel,
}) {
  const clean = Array.isArray(users) ? users.filter(Boolean) : [];
  const visibleCount = Math.max(0, Math.min(clean.length, max));
  const overflow = Math.max(0, clean.length - visibleCount);

  const visible = useMemo(() => clean.slice(0, visibleCount), [clean, visibleCount]);

  const style = useMemo(
    () => ({
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.round(size * 0.42))}px`,
    }),
    [size]
  );

  const containerCls = [
    "avatar-stack",
    overlap ? "" : "gap-1",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerCls} role="list" aria-label={ariaLabel || "Participants"}>
      {visible.map((u, i) => (
        <AvatarCircle key={u.id || i} user={u} style={style} />
      ))}
      {showOverflow && overflow > 0 && (
        <OverflowCircle count={overflow} style={style} />
      )}
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function AvatarCircle({ user, style }) {
  const name = user?.name || "User";
  const urlRaw = user?.avatarUrl || user?.avatar || user?.profilePicture || "";
  const url = cacheBusted(urlRaw);
  const initial = initialFromName(name);
  const bg = colorFromString(user?.id || name);

  return (
    <span className="avatar" role="listitem" title={name} style={{ ...style, background: bg }}>
      {url ? (
        <img src={url} alt={name} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

function OverflowCircle({ count, style }) {
  return (
    <span
      className="avatar"
      title={`${count} more`}
      style={{ ...style, background: "rgba(2,6,23,0.18)", color: "#fff" }}
    >
      <span aria-hidden="true">+{count}</span>
    </span>
  );
}

/* ---------- helpers ---------- */

function initialFromName(name) {
  const n = String(name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last || first).toUpperCase();
}

/** deterministic pastel-ish color from a string */
function colorFromString(str) {
  const s = String(str || "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  const sat = 55; // %
  const light = 55; // %
  return `hsl(${hue}deg ${sat}% ${light}%)`;
}

/** bust avatar caches when user updates picture (AuthContext sets window.__SS_AVATAR_VERSION__) */
function cacheBusted(url) {
  if (!url) return "";
  try {
    const ver = window.__SS_AVATAR_VERSION__;
    if (!ver) return url;
    const hasQ = url.includes("?");
    return `${url}${hasQ ? "&" : "?"}v=${ver}`;
  } catch {
    return url;
  }
}