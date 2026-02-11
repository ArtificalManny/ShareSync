import React from "react";

function initialsFromName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function UserAvatar({
  avatarUrl,
  name = "User",
  size = 40,
  className = "",
  ringClassName = "ring-2 ring-white/10",
}) {
  const initials = initialsFromName(name);

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-surface-2 flex items-center justify-center ${ringClassName} ${className}`}
      style={{ width: size, height: size }}
      title={name}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name} avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="text-xs font-semibold text-text-secondary">{initials}</span>
      )}
    </div>
  );
}
