// Read-only public project view (neon card stack + lightweight KPIs)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../../api/client";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import PublicShareBar from "../../components/public/PublicShareBar.jsx";
import ReactionBar from "../../components/social/ReactionBar.jsx";
import FollowButton from "../../components/social/FollowButton.jsx";
import { track } from "../../utils/telemetry";
import { CalendarDays, Users, Activity, Shield } from "lucide-react";

export default function PublicProject() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    track("public_page_viewed", { type: "project", projectId });
  }, [projectId]);

  useEffect(() => {
    async function load() {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true); setErr(""); setProject(null);

      // Try public-first endpoints, then private fallback if user is authed.
      const endpoints = [
        `/public/projects/${encodeURIComponent(projectId)}`,
        `/projects/${encodeURIComponent(projectId)}?public=1`,
        `/projects/${encodeURIComponent(projectId)}`
      ];

      for (const url of endpoints) {
        try {
          const res = await client.get(url, { signal: ctrl.signal });
          if (res?.data) { setProject(res.data); break; }
        } catch (_) { /* keep trying */ }
      }

      if (!ctrl.signal.aborted) {
        setLoading(false);
        if (!project) {
          setErr("This project is not public or could not be found.");
        }
      }
    }
    load();
    return () => abortRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const metrics = useMemo(() => {
    const m = project?.metrics || {};
    return {
      onTime: m.onTimePct ?? m.onTime ?? "—",
      tputWk: m.throughputPerWeek?.value ?? m.tputWk ?? "—",
      active: m.activeDays?.last14 ?? m.activeDays?.value ?? "—",
      streak: m.streak ?? "—",
    };
  }, [project]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="card rounded-2xl border border-border bg-surface shine accent-bar relative">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="px-4 sm:px-6 md:px-8 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="h1 truncate">{project?.title || (loading ? "Loading…" : "Project")}</h1>
              <div className="text-sm text-muted mt-1 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Read-only public view</span>
              </div>
              {!!project?.description && (
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
                  {project.description}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <FollowButton
                targetId={projectId}
                targetType="project"
                initialFollowing={false}
                size="sm"
              />
            </div>
          </div>

          {/* KPI row */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <KpiTile label="On-time %" value={metrics.onTime} />
            <KpiTile label="Throughput / wk" value={metrics.tputWk} />
            <KpiTile label="Active (14d)" value={metrics.active} />
            <KpiTile label="Streak" value={metrics.streak ? `${metrics.streak}d` : "—"} />
          </div>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              Updated {labelled(project?.updatedAt || project?.lastActivityAt)}
            </span>
            {Array.isArray(project?.members) && project.members.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4" />
                {project.members.length} member{project.members.length === 1 ? "" : "s"}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Activity className="w-4 h-4" />
              {project?.status || "In Progress"}
            </span>
          </div>

          {/* Reactions */}
          <div className="mt-4">
            <ReactionBar
              targetId={projectId}
              targetType="project"
              compact
            />
          </div>

          <div className="mt-5">
            <PublicShareBar />
          </div>

          {/* Links back */}
          <div className="mt-4 text-xs text-muted">
            <Link className="underline" to="/discover">Explore more public projects</Link>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 animate-pulse text-sm text-muted">
          Loading project…
        </div>
      )}
      {!!err && !loading && (
        <div className="mt-4 rounded-2xl border border-rose-200/60 bg-surface p-4 text-sm text-rose-600">
          {err}
        </div>
      )}
    </div>
  );
}

function KpiTile({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white/60 dark:bg-slate-900/40 px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value ?? "—"}</div>
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
