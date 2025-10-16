// src/components/profile/Badges.jsx
import React from "react";

export default function Badges({ user, isPublic = false, className = "" }) {
  const items = Array.isArray(user?.badges) ? user.badges : [];
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 h-full ${className}`}>
      <div className="text-xs text-muted">Badges</div>
      {items.length === 0 ? (
        <div className="mt-2 text-sm text-muted">No badges yet.</div>
      ) : (
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((b, i) => {
            const name = typeof b === "string" ? b : b?.name || `Badge ${i + 1}`;
            const emoji = typeof b === "object" && b?.emoji ? b.emoji : "🏅";
            return (
              <div
                key={`${name}-${i}`}
                className="rounded-lg border border-border bg-surface px-2 py-2 text-center text-xs"
                title={name}
              >
                <div className="text-lg leading-none">{emoji}</div>
                <div className="mt-1 truncate">{name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
