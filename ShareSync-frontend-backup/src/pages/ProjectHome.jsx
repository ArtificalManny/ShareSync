// /src/pages/ProjectHome.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import {
  getProject,
  getProjectFeed,
  postProjectUpdate,
  createTask,
  patchTask,
} from "../api/projects";

import { getProjectStats } from "../api/stats";
import ActivityOverTimeLive from "../components/analytics/ActivityOverTimeLive";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectKpis from "../components/project/ProjectKpis";
import ProjectActivityFeed from "../components/project/ProjectActivityFeed";
import MyNextActions from "../components/project/MyNextActions";
import RisksPanel from "../components/project/RisksPanel";
import MembersPanel from "../components/project/MembersPanel";
import AuditList from "../components/audit/AuditList.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import useSocket from "../hooks/useSocket";

const mark = (name) => { try { performance?.mark?.(name); } catch {} };
const measure = (name, start, end) => { try { performance?.measure?.(name, start, end); } catch {} };

async function perfLogDev(name, start) {
  if (import.meta.env.MODE === 'production') return;
  try {
    const mod = await import("../utils/perfLog.js");
    mod.perfLog?.(name, start);
  } catch {}
}

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  const [project, setProject] = useState(null);
  const [feed, setFeed] = useState({ items: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => { mark("ss:projecthome:mounted"); }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await getProject(id);
        if (!ignore) setProject(data);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load project");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const start = performance.now();
    (async () => {
      setStatsLoading(true); setStatsError("");
      try {
        const data = await getProjectStats(id, { range: 30 });
        if (!ignore) setStats(data || null);
        perfLogDev('perf:project:kpi-tti', start);
      } catch (e) {
        if (!ignore) setStatsError(e?.message || "Failed to load stats");
      } finally {
        if (!ignore) setStatsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  useEffect(() => {
    if (!loading && project) {
      mark("ss:projecthome:data-ready");
      measure("perf:projecthome:data", "ss:nav-project-click", "ss:projecthome:data-ready");
    }
  }, [loading, project]);

  const loadFeed = async (cursor) => {
    setFeedLoading(true);
    try {
      const res = await getProjectFeed(id, { limit: 20, cursor });
      setFeed((prev) =>
        cursor
          ? { items: [...prev.items, ...res.items], nextCursor: res.nextCursor }
          : { items: res.items, nextCursor: res.nextCursor }
      );
    } catch (e) {
      console.error("[ProjectHome] feed load error", e);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadFeed();
  }, [id]);

  useEffect(() => {
    if (!feedLoading && feed.items.length > 0) {
      mark("ss:projecthome:first-activity");
      measure("perf:projecthome:first-activity", "ss:nav-project-click", "ss:projecthome:first-activity");
    }
  }, [feedLoading, feed.items.length]);

  // 🔴 Realtime via shared hook (auth + room join)
  useSocket(id ? `project:${id}` : null, {
    onEvents: {
      "activity:new": (evt) => {
        if (String(evt?.projectId) === String(id)) {
          setFeed((prev) => ({ ...prev, items: [evt, ...prev.items] }));
        }
      },
      "project:statsUpdated": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          // Optional live refresh:
          // getProjectStats(id, { range: 30 }).then(setStats).catch(() => {});
        }
      },
    },
  });

  const handlePostUpdate = async (text) => {
    if (!text.trim()) return;
    const optimistic = { _id: `tmp-${Date.now()}`, text, userId: user?._id, createdAt: new Date().toISOString() };
    setFeed((prev) => ({ ...prev, items: [optimistic, ...prev.items] }));
    try {
      const created = await postProjectUpdate(id, { text, mentions: [], files: [] });
      setFeed((prev) => ({ ...prev, items: prev.items.map((it) => (it._id === optimistic._id ? created : it)) }));
    } catch {
      setFeed((prev) => ({ ...prev, items: prev.items.filter((it) => it._id !== optimistic._id) }));
      throw new Error('Failed to post update');
    }
  };

  const tasks = useMemo(() => project?.tasks ?? [], [project]);

  // ✅ Optimistic task add
  const handleAddTask = async (title) => {
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      title,
      status: "Not Started",
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };
    setProject((p) => ({ ...p, tasks: [optimistic, ...(p?.tasks || [])] }));
  
    try {
      const created = await createTask(id, { title, status: "Not Started" });
      setProject((p) => ({
        ...p,
        tasks: (p?.tasks || []).map((t) => (t._id === optimistic._id ? created : t)),
      }));
    } catch (e) {
      // roll back optimistic
      setProject((p) => ({
        ...p,
        tasks: (p?.tasks || []).filter((t) => t._id !== optimistic._id),
      }));
      throw e;
    }
  };  

  const handlePatchTask = async (taskId, patch) => {
    const updated = await patchTask(id, taskId, patch);
    setProject((p) => ({
      ...p,
      tasks: (p?.tasks || []).map((t) => (String(t._id) === String(taskId) ? updated : t)),
    }));
  };

  if (loading) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-slate-200/60" />
            <div className="h-24 rounded-2xl bg-slate-200/60" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-rose-200/60 bg-white p-6">
            <h1 className="text-lg font-semibold text-rose-600">Failed to load project</h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white">
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!project) return null;

  const KpiCards = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 animate-pulse h-[88px]" />
          ))}
        </div>
      );
    }
    if (statsError || !stats) return null;

    const fmtPct = (v) => `${Math.round((v ?? 0) * 100)}%`;
    const card = (label, value, sub) => (
      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
      </div>
    );

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {card("Cadence (14d)", stats?.cadence?.value ?? 0, "Rolling, recency-weighted")}
        {card("Throughput / wk", stats?.throughputPerWeek?.value ?? 0, "Completed tasks / 7d")}
        {card("Active Days (28d)", stats?.activeDays?.value ?? 0)}
        {card("On-time (30d)", fmtPct(stats?.onTimeCompletion?.value))}
      </div>
    );
  };

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-ink-100 dark:bg-gray-900 min-h-screen max-w-6xl mx-auto">
        <ProjectHeader project={project} onAddTask={handleAddTask} />

        {/* Project KPIs */}
        <div className="mt-4 card accent-kpi rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-4">
          <SectionHeader icon="Gauge">Project KPIs</SectionHeader>
          <div className="mt-3">
            <ProjectKpis project={project} />
          </div>
          <div className="mt-4">
            <KpiCards />
          </div>
        </div>

        {/* Activity Over Time */}
        <div className="mt-6 card accent-activity rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-4">
          <SectionHeader icon="ActivitySquare">Activity Over Time</SectionHeader>
          <ActivityOverTimeLive projectId={project._id} defaultRange="30" />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main feed (keeps composer + optimistic posting) */}
          <div className="lg:col-span-8">
            <ProjectActivityFeed
              items={feed.items}
              loading={feedLoading}
              onLoadMore={() => feed.nextCursor && loadFeed(feed.nextCursor)}
              hasMore={!!feed.nextCursor}
              onPostUpdate={handlePostUpdate}
              onRefetch={() => loadFeed()}
            />
          </div>

          {/* Right rail with filtered audit feed, risks, members */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card accent-risk rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <SectionHeader icon="AlertTriangle">Risks &amp; Blockers</SectionHeader>
              <div className="mt-3">
                <RisksPanel project={project} />
              </div>
            </div>

            <MembersPanel members={project.members || []} />

            <div className="card accent-activity rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <SectionHeader icon="History">Recent Activity</SectionHeader>
              <div className="mt-2">
                <AuditList scope="project" projectId={project._id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
