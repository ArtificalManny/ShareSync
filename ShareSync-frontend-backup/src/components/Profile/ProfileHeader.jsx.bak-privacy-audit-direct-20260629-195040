// src/components/Profile/ProfileHeader.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROFILE HEADER v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Personal Gallery"
//
// COLOR MAP:
// - Text Primary: #1E293B (slate-800)
// - Text Secondary: #64748B (slate-500)
// - Avatar Ring: Aurora Gradient
// - Edit Button: #3B82F6 (blue)
// - Badges: Soft tints with borders
//
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

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
  onAvatarUploaded,
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
      {/* Avatar with Aurora ring effect */}
      <div className="relative">
        <div 
          className="p-0.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)'
          }}
        >
          <div className="bg-white rounded-full p-0.5">
            <Avatar src={pic} emoji={emoji} name={name} size={64} />
          </div>
        </div>
        
        {isOwner && !isPublic && typeof onAvatarUploaded === "function" && (
          <button
            className="absolute -bottom-2 left-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            onClick={() => onAvatarUploaded(null)}
          >
            Change
          </button>
        )}
      </div>

      {/* User info */}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-800">{name}</h1>
          {at && <span className="text-slate-500">{at}</span>}
          
          {/* Privacy badge */}
          <span
            className={`
              px-2 py-0.5 text-[11px] font-medium rounded-full ml-2
              ${user?.publicProfile 
                ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
              }
            `}
            title={privacy}
          >
            {privacy}
          </span>
        </div>

        {user?.bio && (
          <p className="mt-1 text-slate-500">{user.bio}</p>
        )}

        {/* Owner-only controls */}
        {isOwner && !isPublic && (
          <div className="mt-3 flex items-center gap-2">
            <Link 
              to="/settings" 
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              Edit profile
            </Link>
            <Link 
              to="/projects" 
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              View projects
            </Link>
          </div>
        )}
      </div>

      {/* XP ring */}
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
