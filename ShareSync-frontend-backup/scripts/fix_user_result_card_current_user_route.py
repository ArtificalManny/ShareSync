#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/search/cards/UserResultCard.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_user_result_card_current_user_route] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = '''import React from "react";
import { Link } from "react-router-dom";
import { Flame, Award, ShieldCheck } from "lucide-react";
import { formatProfilePicture } from "../../../utils/imageUtils";
import { useAuth } from "../../../context/AuthContext";

const DEFAULT_PIC = "/default-profile.png";

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

export default function UserResultCard({ user = {} }) {
  const { user: authUser } = useAuth();

  const username = user.username || user.handle || user.slug || user.id;
  const profileKey = user.username || user.handle || user.slug || user._id || user.id;

  const resultUsername = normalizeComparable(user.username || user.handle || user.slug);
  const resultId = normalizeId(user._id || user.id || user.userId);

  const authUsername = normalizeComparable(
    authUser?.username || authUser?.handle || authUser?.slug
  );
  const authId = normalizeId(authUser?._id || authUser?.id || authUser?.userId);

  const isCurrentUser =
    Boolean(resultUsername && authUsername && resultUsername === authUsername) ||
    Boolean(resultId && authId && resultId === authId);

  const href = isCurrentUser
    ? "/profile"
    : profileKey
      ? `/profile/${encodeURIComponent(String(profileKey))}`
      : "/profile";

  const name =
    user.name ||
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    username ||
    "User";

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
'''


def main():
    print("[fix_user_result_card_current_user_route] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        'import React from "react";',
        'import { Link } from "react-router-dom";',
        'import { formatProfilePicture } from "../../../utils/imageUtils";',
        "export default function UserResultCard({ user = {} })",
        "const profileKey = user.username || user.handle || user.slug || user._id || user.id;",
        "const href = profileKey",
        "to={href}",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected marker before rewrite: {marker}")

    required_after = [
        'import { useAuth } from "../../../context/AuthContext";',
        "function normalizeComparable(value)",
        "function normalizeId(value)",
        "const { user: authUser } = useAuth();",
        "const isCurrentUser =",
        'const href = isCurrentUser',
        '? "/profile"',
        "`/profile/${encodeURIComponent(String(profileKey))}`",
        '[user.firstName, user.lastName].filter(Boolean).join(" ").trim()',
        "to={href}",
    ]

    for marker in required_after:
        if marker not in NEW_CONTENT:
            fail(f"Internal safety check failed. Missing marker in new content: {marker}")

    forbidden_after = [
        "`/user/${",
        "`/users/${",
    ]

    for marker in forbidden_after:
        if marker in NEW_CONTENT:
            fail(f"Internal safety check failed. Forbidden marker in new content: {marker}")

    if original == NEW_CONTENT:
        print("[fix_user_result_card_current_user_route] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-current-user-route-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_user_result_card_current_user_route] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[fix_user_result_card_current_user_route] patched: {TARGET}")

    print("")
    print("[fix_user_result_card_current_user_route] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"useAuth|isCurrentUser|profileKey|normalizeComparable|normalizeId|/profile/|/user/|/users/\" src/components/search/cards/UserResultCard.jsx -C 8")
    print("  git diff -- src/components/search/cards/UserResultCard.jsx")


if __name__ == "__main__":
    main()
