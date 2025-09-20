import React from "react";

/**
 * BadgesGrid
 * Props:
 *  - badges: Array<string | { name, emoji?, description?, locked?, earnedAt? }>
 *  - columns?: number (default 4)
 *  - showLocked?: boolean (default true)
 *  - className?: string
 */
export default function BadgesGrid({
  badges = [],
  columns = 4,
  showLocked = true,
  className = "",
}) {
  const items = (Array.isArray(badges) ? badges : []).map((b, i) => {
    if (typeof b === "string") return { name: b, emoji: "🏅", locked: false };
    const name = b?.name || `Badge ${i + 1}`;
    const emoji = b?.emoji || "🏅";
    const description = b?.description || name;
    const locked = !!b?.locked;
    const earnedAt = b?.earnedAt || null;
    return { name, emoji, description, locked, earnedAt };
  });

  const visible = showLocked ? items : items.filter((b) => !b.locked);

  return (
    <div className={["profile-card", className].filter(Boolean).join(" ")}>
      <div className="text-xs text-muted">Badges</div>
      {visible.length === 0 ? (
        <div className="mt-2 text-sm text-muted">No badges yet.</div>
      ) : (
        <div
          className="mt-3 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
        >
          {visible.map((b, i) => (
            <div
              key={`${b.name}-${i}`}
              className={["badge-tile", b.locked ? "badge-locked" : ""].join(" ")}
              title={b.description}
              aria-label={`${b.name}${b.locked ? " (locked)" : ""}`}
            >
              <div className="text-xl leading-none">{b.emoji}</div>
              <div className="mt-1 truncate text-[11px]">{b.name}</div>
              {b.earnedAt && (
                <div className="mt-0.5 text-[10px] text-muted">
                  {new Date(b.earnedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
