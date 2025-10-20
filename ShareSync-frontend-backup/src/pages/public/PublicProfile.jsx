// Public profile (read-only): avatar, streak, velocity, public projects grid
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../../api/client";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import PublicShareBar from "../../components/public/PublicShareBar.jsx";
import FollowButton from "../../components/social/FollowButton.jsx";
import ReactionBar from "../../components/social/ReactionBar.jsx";
import { track } from "../../utils/telemetry";
import { User, Flame, Gauge, FolderKanban } from "lucide-react";

const DEFAULT_PIC = "/default-profile.png";

export default function PublicProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    track("public_page_viewed", { type: "profile", username });
  }, [username]);

  useEffect(() => {
    async function load() {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true); setErr(""); setUser(null); setProjects([]);

      // Try several user endpoints (public → private)
      const userEndpoints = [
        `/public/users/${encodeURIComponent(username)}`,
        `/users/by-username/${encodeURIComponent(username)}`,
        `/users/${encodeURIComponent(username)}`,
      ];

      let userData = null;
      for (const url of userEndpoints) {
        try {
          const res = await client.get(url, { signal: ctrl.signal });
          if (res?.data) { userData = res.data; break; }
        } catch (_) {}
      }
      if (!userData) {
        if (!ctrl.signal.aborted) { setErr("This profile is not public or does not exist."); setLoading(false); }
        return;
      }
      setUser(userData);

      // Projects: prefer public list
      const uid = userData._id || userData.id || userData.userId || username;
      const projectEndpoints = [
        `/public/users/${encodeURIComponent(uid)}/projects`,
        `/projects?owner=${encodeURIComponent(uid)}&public=1`,
        `/projects?owner=${encodeURIComponent(uid)}`,
      ];

      for (const url of projectEndpoints) {
        try {
          const res = await client.get(url, { signal: ctrl.signal });
          if (Array.isArray(res?.data)) { setProjects(res.data); break; }
        } catch (_) {}
      }

      if (!ctrl.signal.aborted) setLoading(false);
    }
    load();
    return () => abortRef.current?.abort?.();
  }, [username]);

  const kpis = useMemo(() => {
    const stats = user?.stats || {};
    return {
      velocity: Number(stats?.throughputPerWeek?.value ?? stats?.velocity ?? 0),
      streak: Number(stats?.streak ?? 0),
      ontime: Number(stats?.onTimePct ?? stats?.onTime ?? 0),
    };
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="card rounded-2xl border border-border bg-surface shine accent-bar relative">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="px-4 sm:px-6 md:px-8 py-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user?.profilePicture || DEFAULT_PIC}
                alt={user?.displayName || user?.firstName || username}
                className="h-12 w-12 rounded-full border border-border object-cover"
              />
              <div className="min-w-0">
                <h1 className="h1 truncate">{user?.displayName || user?.firstName || user?.username || username}</h1>
                <div className="text-sm text-muted truncate">@{user?.username || username}</div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <FollowButton
                targetId={user?._id || user?.id || user?.userId || username}
                targetType="user"
                initialFollowing={false}
                size="sm"
              />
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <TinyKpi icon={Gauge} label="Velocity" value={`${kpis.velocity.toFixed ? kpis.velocity.toFixed(1) : kpis.velocity}×`} />
            <TinyKpi icon={Flame} label="Streak" value={`${kpis.streak}d`} />
            <TinyKpi icon={FolderKanban} label="On-time" value={`${kpis.ontime}%`} />
          </div>

          {/* Share + reactions */}
          <div className="mt-4">
            <PublicShareBar />
          </div>
          <div className="mt-3">
            <ReactionBar
              targetId={user?._id || user?.id || user?.userId || username}
              targetType="user"
              compact
            />
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="mt-6 card rounded-2xl border border-border bg-surface shine accent-bar relative">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="px-4 sm:px-6 md:px-8 py-4">
          <SectionHeader icon="FolderKanban">Public Projects</SectionHeader>
          {loading ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-border bg-surface animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-3 text-sm text-muted">No public projects yet.</div>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <Link
                  key={p._id || p.id}
                  className="rounded-xl border border-border bg-white/60 dark:bg-slate-900/40 p-3 hover:shadow focus-ring"
                  to={`/p/${p._id || p.id}`}
                >
                  <div className="font-medium truncate">{p.title || "Untitled"}</div>
                  <div className="text-xs text-muted truncate mt-0.5">{p.description || "—"}</div>
                  <div className="text-[11px] text-muted mt-2">Updated {labelled(p.updatedAt || p.lastActivityAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {!!err && !loading && (
        <div className="mt-4 rounded-2xl border border-rose-200/60 bg-surface p-4 text-sm text-rose-600">
          {err}
        </div>
      )}
    </div>
  );
}

function TinyKpi({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white/60 dark:bg-slate-900/40 px-3 py-2 flex items-center gap-2">
      <Icon className="w-4 h-4 text-indigo-500" />
      <div>
        <div className="text-[11px] text-muted">{label}</div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function labelled(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(+d)) return "—";
  const diff = Date.now() - +d;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  return d.toLocaleDateString();
}
