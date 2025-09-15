import React, { useMemo } from "react";
import AnimatedRing from "./ui/AnimatedRing";
import useReducedMotion from "../hooks/useReducedMotion";

/**
 * AvatarGroup
 * - Accessible avatar stack with overlap +N overflow
 *
 * Props:
 *  - users: array of { id, name, avatarUrl, role? }
 *  - max, size, overlap, showOverflow, className
 *  - highlightFirstRecent?: boolean (adds ring to first/owner avatar)
 *  - ownerRecent?: boolean (alias for highlightFirstRecent)
 */
export default function AvatarGroup({
  users = [],
  max = 4,
  size = 28,
  overlap = true,
  showOverflow = true,
  className = "",
  "aria-label": ariaLabel,
  highlightFirstRecent = false,
  ownerRecent = false,
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
    overlap ? "flex -space-x-2" : "flex gap-1",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const prefersReduced = useReducedMotion();
  const showOwnerHighlight = !!(highlightFirstRecent || ownerRecent);

  return (
    <div className={containerCls} role="list" aria-label={ariaLabel || "Participants"}>
      {visible.map((u, i) => {
        const isOwner = u?.role === "owner" || i === 0; // heuristic: first/avatar with role
        const circle = <AvatarCircle key={u.id || i} user={u} style={style} />;

        if (!isOwner || !showOwnerHighlight) return circle;

        // Owner halo — small ring, respects reduced motion (falls back to static mini dot)
        if (!prefersReduced) {
          return (
            <AnimatedRing
              key={u.id || i}
              size={`${size + 6}px`}
              thickness="2px"
              animated
              className="inline-grid place-items-center rounded-full ring-2 ring-white dark:ring-slate-900"
            >
              {circle}
            </AnimatedRing>
          );
        }
        // Static tiny dot (top-right) when reduced motion preferred
        return (
          <span key={u.id || i} className="relative inline-grid place-items-center">
            {circle}
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
              aria-hidden
            />
          </span>
        );
      })}
      {showOverflow && overflow > 0 && <OverflowCircle count={overflow} style={style} />}
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
    <span
      className="inline-grid place-items-center rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden transition-transform duration-200"
      style={{ ...style, background: bg }}
      role="listitem"
      title={name}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true" className="text-white/95 font-semibold">{initial}</span>
      )}
    </span>
  );
}

function OverflowCircle({ count, style }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-800/50 text-white"
      style={style}
      title={`${count} more`}
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
  const sat = 55;
  const light = 55;
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
