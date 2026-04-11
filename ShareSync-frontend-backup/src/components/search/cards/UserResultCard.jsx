import React from "react";
import { Link } from "react-router-dom";
import { Flame, Award, ShieldCheck } from "lucide-react";
import { formatProfilePicture } from "../../../utils/imageUtils";

const DEFAULT_PIC = "/default-profile.png";

export default function UserResultCard({ user = {} }) {
  const username = user.username || user.handle || user.slug || user.id;
  const uid = user._id || user.id; const href = uid ? `/user/${uid}` : "/profile";
  const name = user.name || user.firstName || user.fullName || username || "User";
  const xp = user.xp ?? user.points ?? null;
  const streak = user.streak ?? user.currentStreak ?? null;
  const isPublic = !!(user.discoverable || user.public || user.isPublic);

  const pic = formatProfilePicture?.(user.profilePicture) || user.avatarUrl || DEFAULT_PIC;

  return (
    <Link
      to={href}
      className="block rounded-xl border border-border bg-surface p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      role="listitem"
      aria-label={`User: ${name}`}
    >
      <div className="flex items-center gap-3">
        <img
          src={pic}
          alt={name}
          className="h-8 w-8 rounded-full border border-border object-cover"
        />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          {username && <div className="text-[11px] text-muted truncate">@{username}</div>}
        </div>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted">
          {typeof xp === "number" && (
            <span className="inline-flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              {xp} XP
            </span>
          )}
          {typeof streak === "number" && streak > 0 && (
            <span className="inline-flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-600" />
              {streak}d
            </span>
          )}
          {isPublic && (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Public
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
