// /src/components/ui/Avatar.jsx
import React, { useMemo } from "react";

/**
 * Avatar (UI)
 * Fallback order: image → emoji → initials.
 *
 * Props:
 *  - src?: string
 *  - emoji?: string   (e.g. "🧑‍🚀")
 *  - name?: string    (for initials + aria-label)
 *  - size?: number    (px, default 64)
 *  - className?: string
 *  - onClick?: () => void (button behavior if provided)
 */
export default function Avatar({
  src,
  emoji,
  name = "",
  size = 64,
  className = "",
  onClick,
  ...rest
}) {
  const initials = useMemo(() => {
    const n = (name || "").trim();
    if (!n) return "•";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[1]?.[0] || "" : "";
    return (a + b).toUpperCase();
  }, [name]);

  const commonStyle = { width: size, height: size };

  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { type: "button", onClick, "aria-label": `${name || "avatar"} (change avatar)` }
    : { "aria-label": name || "avatar" };

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        "relative rounded-full overflow-hidden border border-border bg-slate-100 dark:bg-slate-800 grid place-content-center",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className,
      ].join(" ")}
      style={commonStyle}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={src}
          style={{ width: "Available", height: "Available", objectFit: "cover" }}
          draggable={false}
        />
      ) : emoji ? (
        <span role="img" aria-label="avatar-emoji" style={{ fontSize: Math.floor(size * 0.6) }}>
          {emoji}
        </span>
      ) : (
        <span style={{ fontSize: Math.max(12, Math.floor(size * 0.36)) }} className="font-semibold">
          {initials}
        </span>
      )}
    </Wrapper>
  );
}
