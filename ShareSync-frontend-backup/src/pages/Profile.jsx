// /src/pages/Profile.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser } from "../api/user";
import AuditList from "../components/audit/AuditList.jsx";
import { Lock } from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import useReducedMotion from "../hooks/useReducedMotion";
import Page from "../components/layout/Page.jsx";

// NEW: global user context (will emit user:updated so avatars refresh everywhere)
import { UserContext } from "../context/UserContext";

// NEW: avatar components
import Avatar from "../components/ui/Avatar";
import AvatarUploader from "../components/profile/AvatarUploader";
import XpRing from "../components/Profile/XpRing";

// ---------------- XP / Level helpers (client-side fallback) ----------------
function xpForLevel(level) {
  // Mildly exponential curve; tune as you like
  // L1=0, L2=100, L3≈250, L4≈450, L5≈700, etc.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicRoute, routeUsername]);

  // --- Avatar change pipeline (client -> uploads -> user patch -> global propagate) ---
  const handleAvatarUploaded = async (file) => {
    if (!file) return;
    try {
      // 1) upload the binary to /api/uploads/avatar → { url, blurhash? }
      const fd = new FormData();
      fd.append("avatar", file);
      const up = await client.post("/api/uploads/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const rawUrl = up?.data?.url || up?.data?.avatarUrl || "";
      if (!rawUrl) throw new Error("Upload did not return a URL.");

      const version = Date.now();
      const cacheBusted = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}v=${version}`;

      // 2) PATCH user profile with new avatar (and optional blurhash)
      await client.patch("/api/users/me", {
        avatarUrl: rawUrl, // store clean URL server-side
        avatarVersion: version,
        blurhash: up?.data?.blurhash,
      });

      // 3) Update local state and propagate globally
      setMe((prev) => (prev ? { ...prev, profilePicture: cacheBusted, avatarUrl: cacheBusted } : prev));

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

  const Header = ({ user, isOwner }) => {
    const name = user?.firstName || user?.name || user?.displayName || "User";
    const at = user?.username ? `@${user.username}` : "";
    const emoji = user?.avatarEmoji || null;
    const pic = user?.avatarUrl || user?.profilePicture || ""; // prefer avatarUrl with cache-bust
    const privacy = isOwner
      ? user?.publicProfile
        ? "Public profile"
        : "Private profile"
      : user?.publicProfile
      ? "Public"
      : "Private";

    // XP ring data
    const xp = Number(user?.xp ?? 0);
    const { level, progress, cur, next } = progressToNext(xp);

    // Streak + badges (tolerant to missing fields)
    const streak = {
      current: Number(user?.streak?.current ?? user?.streakCurrent ?? 0),
      longest: Number(user?.streak?.longest ?? user?.streakLongest ?? 0),
      lastActiveAt: user?.streak?.lastActiveAt || user?.lastActiveAt || null,
    };
    const badges = Array.isArray(user?.badges) ? user.badges : [];

    return (
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar src={pic} emoji={emoji} name={name} size={64} />
          {/* Owner-only: small “Change” pill overlay on avatar (click opens uploader) */}
          {isOwner && (
            <div className="absolute -bottom-2 left-0">
              <AvatarUploader
                size="sm"
                onUploaded={handleAvatarUploaded}
                buttonClassName="rounded-full btn btn-primary text-[11px] px-2 py-0.5"
                buttonLabel="Change"
              />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-text">{name}</h1>
            {at && <span className="text-muted">{at}</span>}
            <span
              className={[
                "ml-2 rounded-full border px-2 py-0.5 text-xs",
                user?.publicProfile
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : "border-border text-muted bg-surface",
              ].join(" ")}
              title={privacy}
            >
              {privacy}
            </span>
          </div>

        {user?.bio && <p className="mt-1 text-muted">{user.bio}</p>}

          {isOwner && (
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

        {/* XP ring on the right (collapses on small screens) */}
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

  // ---- Small UI helpers for streak/badges (owner & public) ----
  function StreakCard({ user }) {
    const streak = {
      current: Number(user?.streak?.current ?? user?.streakCurrent ?? 0),
      longest: Number(user?.streak?.longest ?? user?.streakLongest ?? 0),
      lastActiveAt: user?.streak?.lastActiveAt || user?.lastActiveAt || null,
    };
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 h-full">
        <div className="text-xs text-muted">Streak</div>
        <div className="mt-1 text-2xl font-semibold">{streak.current}🔥</div>
        <div className="mt-1 text-xs text-muted">
          Longest: <span className="font-medium">{streak.longest}</span> days
        </div>
        {streak.lastActiveAt && (
          <div className="mt-1 text-xs text-muted">
            Last active: {new Date(streak.lastActiveAt).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  }

  function BadgesPanel({ user }) {
    const items = Array.isArray(user?.badges) ? user.badges : [];
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 h-full">
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

  return (
    <div className="with-sidebar px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-5xl mx-auto space-y-6">
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="animate-pulse flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--surface-200)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--surface-200)] w-40" />
              <div className="h-3 bg-[var(--surface-200)] w-64" />
              <div className="h-3 bg-[var(--surface-200)] w-48" />
            </div>
            <div className="hidden sm:block h-[96px] w-[96px] rounded-full bg-[var(--surface-200)]" />
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
            <Header user={userForPublic} isOwner={false} />

            {/* Public: XP/Streak/Badges summary */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <SectionHeader icon="Trophy">XP</SectionHeader>
                <div className="mt-3 flex justify-center">
                  {(() => {
                    const xp = Number(userForPublic?.xp ?? 0);
                    const { level, progress, cur, next } = progressToNext(xp);
                    return (
                      <XpRing
                        level={level}
                        progress={progress}
                        size={120}
                        thickness={10}
                        motionEnabled={!prefersReduced}
                        label="XP"
                        sublabel={`${xp - cur}/${next - cur}`}
                      />
                    );
                  })()}
                </div>
              </div>
              <StreakCard user={userForPublic} />
              <BadgesPanel user={userForPublic} />
            </section>

            <section className="card accent-activity rounded-2xl border border-border bg-surface p-6">
              <SectionHeader icon="Megaphone">Recent public activity</SectionHeader>
              <div className="mt-2">
                {publicUserId ? (
                  <AuditList scope="user" userId={publicUserId} />
                ) : (
                  <div className="text-sm text-muted">This user was not found.</div>
                )}
              </div>
            </section>
          </>
        )
      ) : (
        <>
          <Header user={me} isOwner />

          {/* Owner: Profile Photo editor */}
          <section className="card rounded-2xl border border-border bg-surface p-6">
            <SectionHeader icon="UserRoundCog">Profile Photo</SectionHeader>
            <p className="text-sm text-muted mt-1">
              Upload a clear, professional-looking avatar. Changes propagate everywhere instantly.
            </p>
            <div className="mt-3">
              <AvatarUploader onUploaded={handleAvatarUploaded} />
            </div>
          </section>

          {/* Owner: XP / Streak / Badges */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <SectionHeader icon="Trophy">Your XP</SectionHeader>
              <div className="mt-3 flex justify-center">
                {(() => {
                  const xp = Number(me?.xp ?? 0);
                  const { level, progress, cur, next } = progressToNext(xp);
                  return (
                    <XpRing
                      level={level}
                      progress={progress}
                      size={140}
                      thickness={12}
                      motionEnabled={!prefersReduced}
                      label="XP"
                      sublabel={`${xp - cur}/${next - cur}`}
                    />
                  );
                })()}
              </div>
            </div>
            <StreakCard user={me} />
            <BadgesPanel user={me} />
          </section>

          {/* Highlights & Notifications */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card accent-activity rounded-2xl border border-border bg-surface p-6">
              <SectionHeader icon="UserRoundSearch">Recent highlights</SectionHeader>
              <div className="mt-2">
                {/* Reuse AuditList for now; you can swap to a dedicated Highlights list later */}
                <AuditList scope="user" />
              </div>
            </div>
            <div className="card accent-kpi rounded-2xl border border-border bg-surface p-6">
              <SectionHeader icon="Bell">Notifications</SectionHeader>
              <p className="text-sm text-muted">
                Manage in{" "}
                <Link to="/settings" className="text-brand underline">
                  Settings
                </Link>
                .
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
