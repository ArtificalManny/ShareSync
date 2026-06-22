import React, { useMemo, useState } from "react";

function initialsFromName(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function clean(value) {
  if (!value) return "";
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return "";
  return text;
}

function getBackendBaseUrl() {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://openshare-backend.onrender.com";

  return String(raw).replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function normalizeAvatarUrl(value) {
  const raw = clean(value);
  if (!raw) return "";

  const backendBase = getBackendBaseUrl();

  if (/^https?:\/\/(localhost|127\.0\.0\.1):5050/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5050/i, backendBase);
  }

  if (raw.startsWith("/uploads/")) {
    return `${backendBase}${raw}`;
  }

  if (raw.startsWith("uploads/")) {
    return `${backendBase}/${raw}`;
  }

  return raw;
}

export function resolveUserAvatar(userLike = {}, explicitAvatarUrl = "") {
  const user = userLike || {};

  let override = "";
  try {
    override = clean(localStorage.getItem("ss.avatarOverride"));
  } catch {
    override = "";
  }

  const candidate =
    clean(explicitAvatarUrl) ||
    clean(user.avatarUrl) ||
    clean(user.profilePicture) ||
    clean(user.profileImage) ||
    clean(user.avatar) ||
    clean(user.photoUrl) ||
    clean(user.imageUrl) ||
    clean(user.image) ||
    clean(user.picture) ||
    clean(user.profile?.avatarUrl) ||
    clean(user.profile?.profilePicture) ||
    clean(user.profile?.photoUrl) ||
    override ||
    "";

  return normalizeAvatarUrl(candidate);
}

export default function UserAvatar({
  user,
  avatarUrl,
  src,
  name = "User",
  size = 32,
  className = "",
  ringClassName = "ring-2 ring-white/10",
}) {
  const resolvedName =
    name ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.email ||
    "User";

  const resolvedAvatarUrl = useMemo(
    () => resolveUserAvatar(user, avatarUrl || src),
    [user, avatarUrl, src]
  );

  const [imageFailed, setImageFailed] = useState(false);
  const initials = initialsFromName(resolvedName);
  const shouldShowImage = resolvedAvatarUrl && !imageFailed;

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-surface-2 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-brand hover:ring-offset-2 hover:z-10 ${ringClassName} ${className}`}
      style={{ width: size, height: size }}
      title={resolvedName}
    >
      {shouldShowImage ? (
        <img
          src={resolvedAvatarUrl}
          alt={`${resolvedName} avatar`}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-text-secondary">{initials}</span>
      )}
    </div>
  );
}
