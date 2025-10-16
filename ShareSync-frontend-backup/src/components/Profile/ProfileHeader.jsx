// src/components/profile/ProfileHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import XpRing from "../Profile/XpRing";

function xpForLevel(level) {
  if (level <= 1) return 0;
  let sum = 0;
  for (let i = 1; i < level; i++) sum += Math.round(75 + Math.pow(i, 1.35) * 35);
  return sum;
}
function levelForXp(xp = 0) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}
function progressToNext(xp = 0) {
  const lvl = levelForXp(xp);
  const cur = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const span = Math.max(1, next - cur);
  return { level: lvl, progress: Math.max(0, Math.min(1, (xp - cur) / span)), cur, next };
}

export default function ProfileHeader({
  user,
  isOwner = false,
  isPublic = false,
  onAvatarUploaded, // optional callback to open uploader in owner mode
  prefersReduced = false,
}) {
  const name = user?.firstName || user?.name || user?.displayName || "User";
  const at = user?.username ? `@${user.username}` : "";
  const emoji = user?.avatarEmoji || null;
  const pic = user?.avatarUrl || user?.profilePicture || "";

  const privacy = isOwner
    ? user?.publicProfile
      ? "Public profile"
      : "Private profile"
    : user?.publicProfile
    ? "Public"
    : "Private";

  const xp = Number(user?.xp ?? 0);
  const { level, progress, cur, next } = progressToNext(xp);

  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        <Avatar src={pic} emoji={emoji} name={name} size={64} />
        {isOwner && !isPublic && typeof onAvatarUploaded === "function" && (
          <button
            className="absolute -bottom-2 left-0 rounded-full btn btn-primary text-[11px] px-2 py-0.5"
            onClick={() => {
              // Let parent open its uploader (keeps uploads centralized)
              onAvatarUploaded(null);
            }}
          >
            Change
          </button>
        )}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-text">{name}</h1>
          {at && <span className="text-muted">{at}</span>}
          <span
            className={`chip ${user?.publicProfile ? "is-selected" : ""} px-2 py-0.5 text-[11px] ml-2`}
            title={privacy}
          >
            {privacy}
          </span>
        </div>

        {user?.bio && <p className="mt-1 text-muted">{user.bio}</p>}

        {/* Owner-only controls hidden in public */}
        {isOwner && !isPublic && (
          <div className="mt-3 flex items-center gap-2">
            <Link to="/settings" className="btn btn-primary text-sm">
              Edit profile
            </Link>
            <Link to="/projects" className="btn btn-ghost text-sm border border-border">
              View projects
            </Link>
          </div>
        )}
      </div>

      {/* XP ring (read-only visual; safe to show publicly) */}
      <div className="hidden sm:block">
        <XpRing
          level={level}
          progress={progress}
          size={96}
          thickness={10}
          motionEnabled={!prefersReduced}
          label="XP"
          sublabel={`${xp - cur}/${next - cur}`}
        />
      </div>
    </div>
  );
}
