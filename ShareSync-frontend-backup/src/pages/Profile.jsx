// /src/pages/Profile.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser } from "../api/user";
import AuditList from "../components/audit/AuditList.jsx";
import { Lock } from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import SkeletonBlock from "../components/skeleton/SkeletonBlock.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import useReducedMotion from "../hooks/useReducedMotion";
import { SOCIAL_MINI_V1 } from "../config/flags.js";

// NEW shared profile pieces (public-safe)
import ProfileHeader from "../components/Profile/ProfileHeader.jsx";
import Streak from "../components/Profile/Streak.jsx";
import Badges from "../components/Profile/Badges.jsx";

//SOcial (follow + reactions)
import FollowButton from "../components/social/FollowButton.jsx";
import ReactionBar from "../components/social/ReactionBar.jsx";
import { track } from "../utils/telemetry.js";

// NEW: global user context (will emit user:updated so avatars refresh everywhere)
import { UserContext } from "../context/UserContext";

// Owner-only helpers
import AvatarUploader from "../components/profile/AvatarUploader";
import XpRing from "../components/Profile/XpRing";

// ---------------- XP / Level helpers (client-side fallback) ----------------
function xpForLevel(level) {
  if (level <= 1) return 0;
  let sum = 0;
  for (let i = 1; i < level; i++) {
    sum += Math.round(75 + Math.pow(i, 1.35) * 35);
  }
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
// --------------------------------------------------------------------------

export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();
  const userCtx = useContext(UserContext) || {};
  const prefersReduced = useReducedMotion();

  const isPublicRoute = useMemo(
    () =>
      Boolean(routeUsername) &&
      (location.pathname.startsWith("/u/") ||
        location.pathname.startsWith("/profile/")),
    [routeUsername, location.pathname]
  );

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);

  const [pubAuditLoading, setPubAuditLoading] = useState(true);
  const [pubAuditCount, setPubAuditCount] = useState(0);

  const [ownerAuditLoading, setOwnerAuditLoading] = useState(true);
  const [ownerAuditCount, setOwnerAuditCount] = useState(0);

  const load = async () => {
    setLoading(true);
    setLocked(false);
    setError("");
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        if (u?.publicProfile === false) {
          setLocked(true);
          setPublicUser(null);
        } else {
          setPublicUser(u || null);
        }
      } else {
        const data = await getMe();
        setMe(data || null);
      }
    } catch (e) {
      if (isPublicRoute) {
        setLocked(true);
      } else {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError("Please sign in to view your profile.");
        } else {
          setError(String(e?.message || "Could not load your profile from the server."));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isPublicRoute, routeUsername]);

  const handleAvatarUploaded = async (file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const up = await client.post("/api/uploads/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const rawUrl = up?.data?.url || up?.data?.avatarUrl || "";
      if (!rawUrl) throw new Error("Upload did not return a URL.");

      const version = Date.now();
      const cacheBusted = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}v=${version}`;

      await client.patch("/api/users/me", {
        avatarUrl: rawUrl,
        avatarVersion: version,
        blurhash: up?.data?.blurhash,
      });

      setMe((prev) =>
        prev ? { ...prev, profilePicture: cacheBusted, avatarUrl: cacheBusted } : prev
      );

      if (typeof userCtx.updateUser === "function") {
        userCtx.updateUser({ avatarUrl: cacheBusted, avatarVersion: version });
      }
      if (typeof userCtx.emitUserUpdated === "function") {
        userCtx.emitUserUpdated({ avatarUrl: cacheBusted, avatarVersion: version });
      } else {
        window.dispatchEvent(
          new CustomEvent("user:updated", {
            detail: { user: { avatarUrl: cacheBusted, avatarVersion: version } },
          })
        );
      }
    } catch (e) {
      alert(`Failed to update avatar. ${e?.response?.data?.message || e?.message || ""}`);
    }
  };

  const LockedCard = () => (
    <div className="card accent-activity rounded-2xl border border-border bg-surface p-6 text-center">
      <div className="flex items-center justify-center mb-2">
        <Lock size={24} className="text-muted" />
      </div>
      <h2 className="text-lg font-semibold text-text">This profile is private</h2>
      <p className="mt-1 text-sm text-muted">The owner hasn’t made their profile public.</p>
    </div>
  );

  const userForPublic = publicUser;
  const publicUserId = userForPublic?._id || userForPublic?.id || null;
  const publicFollowers = 
    userForPublic?.followersCount ??
    (Array.isArray(userForPublic?.followers) ? userForPublic.followers.length : 0);
  const publicFollowing =
    userForPublic?.followingCount ??
    (Array.isArray(userForPublic?.followers) ? userForPublic.followers.length : 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <h1 className="h-hero">Profile</h1>
      <p className="h-sub mt-1">XP, Streaks, Badges</p>

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="animate-pulse flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--surface-200)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--surface-200)] w-40" />
              <div className="h-3 bg-[var(--surface-200)] w-64" />
              <div className="h-3 bg-[var(--surface-200)] w-48" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="font-medium">Profile failed to load.</div>
          <div className="text-sm opacity-80">{String(error)}</div>
          <button onClick={load} className="mt-2 btn btn-primary text-sm">
            Retry
          </button>
        </div>
      ) : isPublicRoute ? (
        locked ? (
          <LockedCard />
        ) : (
          <>
            {/* XP Ring */}
            <div className="card glass text-center p-8">
              <XpRing
                level={(() => {
                  const xp = Number(userForPublic?.xp ?? 0);
                  const { level } = progressToNext(xp);
                  return level;
                })()}
                progress={(() => {
                  const xp = Number(userForPublic?.xp ?? 0);
                  const { progress } = progressToNext(xp);
                  return progress;
                })()}
                size={160}
                thickness={14}
                motionEnabled={!prefersReduced}
                label="XP"
                sublabel={(() => {
                  const xp = Number(userForPublic?.xp ?? 0);
                  const { cur, next } = progressToNext(xp);
                  return `${xp - cur}/${next - cur}`;
                })()}
              />
              <div className="mt-4 text-sm text-muted">
                Level {(() => {
                  const xp = Number(userForPublic?.xp ?? 0);
                  return levelForXp(xp);
                })()}
              </div>
            </div>

            {/* Streak + Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Streak user={userForPublic} className="card glass p-6" />
              <Badges user={userForPublic} className="card glass p-6" />
            </div>
          </>
        )
      ) : (
        <>
          {/* XP Ring */}
          <div className="card glass text-center p-8">
            <XpRing
              level={(() => {
                const xp = Number(me?.xp ?? 0);
                const { level } = progressToNext(xp);
                return level;
              })()}
              progress={(() => {
                const xp = Number(me?.xp ?? 0);
                const { progress } = progressToNext(xp);
                return progress;
              })()}
              size={160}
              thickness={14}
              motionEnabled={!prefersReduced}
              label="XP"
              sublabel={(() => {
                const xp = Number(me?.xp ?? 0);
                const { cur, next } = progressToNext(xp);
                return `${xp - cur}/${next - cur}`;
              })()}
            />
            <div className="mt-4 text-sm text-muted">
              Level {(() => {
                const xp = Number(me?.xp ?? 0);
                return levelForXp(xp);
              })()}
            </div>
          </div>

          {/* Streak + Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Streak user={me} className="card glass p-6" />
            <Badges user={me} className="card glass p-6" />
          </div>
        </>
      )}
    </div>
  );
}