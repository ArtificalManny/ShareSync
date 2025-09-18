import React, { useEffect, useMemo, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import {
  getProject,
  getProjectFeed,
  postProjectUpdate,
} from "../api/projects";
import { createTask, patchTask } from "../api/tasks";

import { uploadFiles } from "../api/uploads";
import { getProjectStats } from "../api/stats";
import ActivityOverTimeLive from "../components/analytics/ActivityOverTimeLive";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectKpis from "../components/project/ProjectKpis";
import ProjectActivityFeed from "../components/project/ProjectActivityFeed";
import RisksPanel from "../components/project/RisksPanel";
import MembersPanel from "../components/project/MembersPanel";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import useSocket from "../hooks/useSocket";
import {
  MoreHorizontal,
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  Plus,
  UserPlus,
  Settings as SettingsIcon,
  RefreshCcw,
  Trophy,
  Files as FilesIcon,
  CheckSquare,
} from "lucide-react";
import { buildPublicStatusUrl } from "../api/public";

import TaskSheet from "../components/tasks/TaskSheet";
import InviteModal from "../components/project/InviteModal";
import ProjectSettingsModal from "../components/project/ProjectSettingsModal";
import FileGrid from "../components/files/FileGrid";
import InsightsBlock from "../components/insights/InsightsBlock";

// NEW: KPI graphs
import KpiGroup from "../components/analytics/KpiGroup";
// NEW: series hook + chart styles
import useKpiSeries from "../hooks/useKpiSeries";
import "../styles/charts.css";

// 🔷 Unified feed normalizers
import {
  fromApiList,
  fromSocketEvent,
  mergeRealtime,
} from "../utils/feed/normalizeActivity";
// 🔷 Dedupe helper (shared)
import { dedupeById } from "../utils/feed/dedupe";

// 🔔 Telemetry
import { track } from "../utils/telemetry";

// ---- small helpers ----
const mark = (name) => { try { performance?.mark?.(name); } catch {} };
const measure = (name, start, end) => { try { performance?.measure?.(name, start, end); } catch {} };

async function perfLogDev(name, start) {
  if (import.meta.env.MODE === "production") return;
  try {
    const mod = await import("../utils/perfLog.js");
    mod.perfLog?.(name, start);
  } catch {}
}

// --- Feature flags ---
const ENABLE_PUBLIC_STATUS = (() => {
  const v = import.meta?.env?.VITE_FEATURE_PUBLIC_STATUS ?? "";
  return /^(1|true|on|yes)$/i.test(String(v));
})();

// --- Role helpers (mirror logic used in ProjectHeader) ---
function getRoleForUser(project, userId) {
  if (!project || !userId) return "viewer";
  if (String(project.userId || "") === String(userId)) return "owner";
  const hit =
    Array.isArray(project.members) &&
    project.members.find(
      (m) => m?.userId && String(m.userId) === String(userId)
    );
  return (hit?.role === "owner" || hit?.role === "member" || hit?.role === "viewer")
    ? hit.role
    : "viewer";
}

/* ---------------- Milestones (files & tasks) ---------------- */
function nextThreshold(count, thresholds = [1, 5, 10, 25, 50, 100]) {
  for (const t of thresholds) if (count < t) return t;
  return null; // maxed
}
function MilestoneBar({ icon, label, count, unit }) {
  const next = nextThreshold(count);
  const prev = next ? (count >= 1 ? thresholdsBelow(next).slice(-1)[0] || 0 : 0) : count;
  function thresholdsBelow(t) { return [1,5,10,25,50,100].filter((x) => x < t); }
  const target = next ?? count;
  const base = prev ?? 0;
  const span = Math.max(1, target - base);
  const progress = Math.max(0, Math.min(1, (count - base) / span));
  const pct = Math.round(progress * 100);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          {icon}
          <div className="text-xs text-muted">{label}</div>
        </div>
        <div className="text-sm font-semibold">
          {count} <span className="text-muted">{unit}</span>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, rgb(var(--accent)) 16%, transparent)" }}>
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--info)) 100%)",
          }}
          aria-label={`${label} ${pct}%`}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted">
        {next
          ? <>Next milestone: <span className="font-medium">{next} {unit}</span></>
          : <>Milestones complete — keep going! 🎉</>}
      </div>
    </div>
  );
}
/* ----------------------------------------------------------- */

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  const meId = user?._id || user?.id;

  const [project, setProject] = useState(null);
  const [feed, setFeed] = useState({ items: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // Modal/drawer state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [showTaskSheet, setShowTaskSheet] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Files (used by Files section)
  const [files, setFiles] = useState([]);

  useEffect(() => { mark("ss:projecthome:mounted"); }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await getProject(id);
        if (!ignore) {
          setProject(data);
          if (Array.isArray(data?.files)) setFiles(data.files);
        }
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
        perfLogDev("perf:project:kpi-tti", start);
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
      const rawItems = Array.isArray(res?.items) ? res.items : [];
      const items = fromApiList(rawItems); // 🔹 normalize API items
      const nextCursor = res?.nextCursor || null;

      setFeed((prev) => ({
        items: dedupeById(cursor ? [...prev.items, ...items] : items),
        nextCursor,
      }));
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
        if (String(evt?.projectId) !== String(id)) return;
        const norm = fromSocketEvent("activity:new", evt);
        setFeed((prev) => ({ ...prev, items: dedupeById(mergeRealtime(prev.items, norm)) }));
      },
      "project:statsUpdated": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          // Optional: could refetch KPIs here
        }
      },
      "project:membersUpdated": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          setProject((p) => ({
            ...p,
            members: payload.members || p?.members || [],
            invites: payload.invites || p?.invites || [],
          }));
        }
      },
      "project:filesAdded": (payload) => {
        if (String(payload?.projectId) !== String(id) || !Array.isArray(payload?.files)) return;
        setFiles((prev) => dedupeById([...payload.files, ...prev]));
        const norm = fromSocketEvent("project:filesAdded", payload);
        if (!norm.freshUntil) norm.freshUntil = Date.now() + 10_000;
        setFeed((prev) => ({ ...prev, items: dedupeById(mergeRealtime(prev.items, norm)) }));
      },
      "project:updated": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.patch) return;
        if (Object.prototype.hasOwnProperty.call(payload.patch, "icon")) {
          setProject((p) => ({ ...p, icon: payload.patch.icon }));
        } else {
          setProject((p) => ({ ...p, ...payload.patch }));
        }
        const norm = fromSocketEvent("project:updated", payload);
        setFeed((prev) => ({ ...prev, items: dedupeById(mergeRealtime(prev.items, norm)) }));
      },
      "tasks:created": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.task) return;
        setProject((p) => ({ ...p, tasks: [payload.task, ...(p?.tasks || [])] }));
        const norm = fromSocketEvent("tasks:created", payload);
        if (!norm.freshUntil) norm.freshUntil = Date.now() + 10_000;
        setFeed((prev) => ({ ...prev, items: dedupeById(mergeRealtime(prev.items, norm)) }));
      },
      "tasks:updated": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.task) return;
        setProject((p) => ({
          ...p,
          tasks: (p?.tasks || []).map((t) =>
            String(t._id) === String(payload.task._id) ? payload.task : t
          ),
        }));
        const norm = fromSocketEvent("tasks:updated", payload);
        setFeed((prev) => ({ ...prev, items: dedupeById(mergeRealtime(prev.items, norm)) }));
      },
      "project:publicChanged": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          setProject((p) => ({ ...p, publicToken: payload?.publicToken || "" }));
        }
      },
    },
  });

  // --- Role + permissions ---
  const myRole = useMemo(() => getRoleForUser(project, meId), [project, meId]);
  const canEdit = myRole === "owner" || myRole === "member";
  const canManage = myRole === "owner";

  // Composer
  const handlePostUpdate = async (payload) => {
    if (!canEdit) return;
    const text = typeof payload === "string" ? payload : payload?.text || "";
    const attachments = typeof payload === "string" ? [] : payload?.attachments || [];
    const mentions = Array.isArray(payload?.mentions) ? payload.mentions : [];
    const visibility = (payload && payload.visibility) === "public" ? "public" : "private";
    if (!text.trim() && attachments.length === 0) return;

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      type: "update.posted",
      text,
      attachments,
      mentions,
      visibility,
      userId: user?._id,
      projectId: id,
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };

    setFeed((prev) => ({ ...prev, items: [optimistic, ...prev.items] }));

    try {
      const created = await postProjectUpdate(id, {
        text,
        mentions,
        visibility,
        files: attachments.map((a) => a.id || a.tempId).filter(Boolean),
        clientTempId: optimistic._id,
      });
      setFeed((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it._id === optimistic._id ? created : it)),
      }));
      track("update_posted", { projectId: id, visibility });
    } catch {
      setFeed((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it._id !== optimistic._id),
      }));
      throw new Error("Failed to post update");
    }
  };

  const tasks = useMemo(() => project?.tasks ?? [], [project]);

  // Tasks
  const handleAddTask = async (payload) => {
    if (!canEdit) return;
    const created = await createTask(id, payload);
    setProject((p) => ({ ...p, tasks: [created, ...(p?.tasks || [])] }));
    try { track("task_created", { projectId: id, taskId: created?._id || created?.id }); } catch {}
  };

  const handlePatchTask = async (taskId, patch) => {
    if (!canEdit) return;
    const updated = await patchTask(id, taskId, patch);
    setProject((p) => ({
      ...p,
      tasks: (p?.tasks || []).map((t) => (String(t._id) === String(taskId) ? updated : t)),
    }));
    try { track("task_updated", { projectId: id, taskId }); } catch {}
  };

  // --- Public status helpers (flagged) ---
  const publicToken = project?.publicToken || "";
  const publicEnabled = !!publicToken;
  const publicStatusPath = ENABLE_PUBLIC_STATUS && publicEnabled ? buildPublicStatusUrl(publicToken) : null;
  const fullPublicUrl =
    typeof window !== "undefined" && publicStatusPath
      ? `${window.location.origin}${publicStatusPath}`
      : publicStatusPath || "";

  const copyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullPublicUrl);
      } else {
        const el = document.createElement("input");
        el.value = fullPublicUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleTogglePublic = useCallback(async (nextEnabled) => {
    if (!ENABLE_PUBLIC_STATUS) return;
    if (!canManage || !project?._id) return;

    let mod = {};
    try { mod = await import("../api/public"); } catch {}

    try {
      if (nextEnabled) {
        let token = null;
        if (typeof mod.enablePublic === "function") {
          const res = await mod.enablePublic(project._id);
          token = res?.token || res?.publicToken || null;
        } else {
          const res = await fetch(`/api/public/projects/${project._id}/enable`, { method: "POST" });
          const json = await res.json();
          token = json?.token || json?.publicToken || null;
        }
        setProject((p) => ({ ...p, publicToken: token || p?.publicToken || "" }));
        try {
          track("public_status_changed", {
            projectId: project._id,
            action: "enabled",
            tokenPresent: Boolean(token),
          });
        } catch {}
      } else {
        if (typeof mod.disablePublic === "function") {
          await mod.disablePublic(project._id);
        } else {
          await fetch(`/api/public/projects/${project._id}/disable`, { method: "POST" });
        }
        setProject((p) => ({ ...p, publicToken: "" }));
        try {
          track("public_status_changed", {
            projectId: project._id,
            action: "disabled",
          });
        } catch {}
      }
    } catch (e) {
      alert(e?.message || "Failed to update public status.");
    }
  }, [canManage, project?._id]);

  const handleRegenerate = async () => {
    if (!ENABLE_PUBLIC_STATUS) return;
    if (!canManage || !project?._id) return;
    setRegenLoading(true);
    let mod = {};
    try { mod = await import("../api/public"); } catch {}
    try {
      let token = null;
      if (typeof mod.regeneratePublicToken === "function") {
        const res = await mod.regeneratePublicToken(project._id);
        token = res?.token || res?.publicToken || null;
      } else {
        const res = await fetch(`/api/public/projects/${project._id}/regenerate`, { method: "POST" });
        const json = await res.json();
        token = json?.token || json?.publicToken || null;
      }
      if (token) {
        setProject((p) => ({ ...p, publicToken: token }));
        try { track("public_status_changed", { projectId: project._id, action: "regenerated" }); } catch {}
      }
    } catch (e) {
      alert(e?.message || "Failed to regenerate link.");
    } finally {
      setRegenLoading(false);
    }
  };

  const kpiTrends = useKpiSeries(stats);

  if (loading) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-surface" />
            <div className="h-24 rounded-2xl bg-surface" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-rose-200/60 bg-surface p-6">
            <h1 className="text-lg font-semibold text-rose-600">Failed to load project</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-grad-blue"
            >
              Retry
              <span className="shine pointer-events-none" aria-hidden="true" />
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
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-dashed border-border bg-surface p-4 animate-pulse h-[88px]"
            />
          ))}
        </div>
      );
    }
    if (statsError || !stats) return null;

    const fmtPct = (v) => `${Math.round((v ?? 0) * 100)}%`;
    const card = (label, value, sub) => (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 shadow-sm">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-xl font-semibold text-text">{value}</div>
        {sub ? <div className="text-xs text-muted mt-1">{sub}</div> : null}
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

  const disabledBtn =
    "opacity-60 cursor-not-allowed hover:bg-transparent hover:opacity-60";

  // Milestone numbers
  const filesCount = Array.isArray(files) ? files.length : 0;
  const completedTasks = (project?.tasks || []).filter(
    (t) =>
      t?.completed === true ||
      String(t?.status || "").toLowerCase() === "done" ||
      String(t?.state || "").toLowerCase() === "done" ||
      Boolean(t?.completedAt)
  ).length;

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto">
        {/* Header (public toggle gated by flag) */}
        <ProjectHeader
          project={project}
          onAddTask={() => canEdit && setShowTaskSheet(true)}
          onTogglePublic={ENABLE_PUBLIC_STATUS ? handleTogglePublic : undefined}
        />

        {/* Action Bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => canEdit && setShowTaskSheet(true)}
            disabled={!canEdit}
            className={[
              "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              "bg-grad-blue hover:opacity-[.96]",
              !canEdit ? disabledBtn : "",
            ].join(" ")}
            title={!canEdit ? "Viewers cannot add tasks" : "Add task"}
          >
            <Plus className="w-4 h-4" />
            Add task
            <span className="shine pointer-events-none" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => canManage && setShowInvite(true)}
            disabled={!canManage}
            className={[
              "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              !canManage ? disabledBtn : "",
            ].join(" ")}
            title={!canManage ? "Only owners can invite" : "Invite"}
          >
            <UserPlus className="w-4 h-4" />
            Invite
            <span className="shine pointer-events-none" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => canManage && setShowSettings(true)}
            disabled={!canManage}
            className={[
              "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              !canManage ? disabledBtn : "",
            ].join(" ")}
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
            <span className="shine pointer-events-none" aria-hidden="true" />
          </button>

          {ENABLE_PUBLIC_STATUS && (
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Share public status link"
            >
              <Share2 className="w-4 h-4" />
              Public status
              <span className="shine pointer-events-none" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Project KPIs */}
        <section
          className="mt-4 card accent-kpi rounded-2xl border border-dashed border-border bg-surface p-4"
          role="region"
          aria-label="Project KPIs"
          aria-busy={statsLoading ? "true" : "false"}
        >
          <div className="flex items-start justify-between">
            <SectionHeader icon="Gauge">Project KPIs</SectionHeader>
            <button
              type="button"
              className="rounded-lg p-1.5 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="KPI options"
              title="KPI options"
            >
              <MoreHorizontal className="w-5 h-5 text-muted" />
            </button>
          </div>

          <div className="mt-3">
            <ProjectKpis project={project} />
          </div>
          <div className="mt-4">
            <KpiCards />
          </div>
        </section>

        {/* NEW: KPI Trends */}
        {kpiTrends.length > 0 && (
          <section
            className="mt-6 card accent-activity rounded-2xl border border-border bg-surface p-4"
            role="region"
            aria-label="KPI Trends"
          >
            <div className="flex items-start justify-between">
              <SectionHeader icon="Activity">KPI Trends</SectionHeader>
              <button
                type="button"
                className="rounded-lg p-1.5 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="KPI chart options"
                title="KPI chart options"
              >
                <MoreHorizontal className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="mt-3">
              <KpiGroup
                data={kpiTrends}
                height={160}
                showLegend={false}
              />
            </div>
          </section>
        )}

        {/* Unified Activity Feed (upgraded normalizer + realtime merge) */}
        <section
          className="mt-6 card rounded-2xl border border-border bg-surface p-4"
          role="region"
          aria-label="Activity"
        >
          <div className="flex items-start justify-between">
            <SectionHeader icon="History">Activity</SectionHeader>
            <button
              type="button"
              className="rounded-lg p-1.5 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Activity options"
              title="Activity options"
              onClick={() => loadFeed()}
            >
              <MoreHorizontal className="w-5 h-5 text-muted" />
            </button>
          </div>

          <div className="mt-3">
            <ProjectActivityFeed
              projectId={id}
              items={feed.items}
              loading={feedLoading}
              onLoadMore={() => feed.nextCursor && loadFeed(feed.nextCursor)}
              hasMore={!!feed.nextCursor}
              onPostUpdate={canEdit ? handlePostUpdate : undefined}
              onRefetch={() => loadFeed()}
            />
          </div>
        </section>

        {/* NEW: Files & Tasks Milestones */}
        <section
          className="mt-6 card rounded-2xl border border-border bg-surface p-4"
          role="region"
          aria-label="Milestones"
        >
          <div className="flex items-start justify-between">
            <SectionHeader icon="Flag">Milestones</SectionHeader>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <MilestoneBar
              icon={<FilesIcon className="w-4 h-4 text-indigo-600" />}
              label="Files uploaded"
              count={filesCount}
              unit="files"
            />
            <MilestoneBar
              icon={<Trophy className="w-4 h-4 text-emerald-600" />}
              label="Tasks completed"
              count={completedTasks}
              unit="tasks"
            />
          </div>
        </section>

        {/* Files */}
        <section
          className="mt-6 card rounded-2xl border border-border bg-surface p-4"
          role="region"
          aria-label="Files"
        >
          <div className="flex items-start justify-between">
            <SectionHeader icon="Folder">Files</SectionHeader>
          </div>
          <div className="mt-3">
            <FileGrid
              projectId={project._id}
              initialFiles={files}
              canEdit={canEdit}
              canManage={canManage}
            />
          </div>
        </section>

        {/* Activity Over Time */}
        <section
          className="mt-6 card accent-activity rounded-2xl border border-border bg-surface p-4"
          role="region"
          aria-label="Activity over time"
        >
          <div className="flex items-start justify-between">
            <SectionHeader icon="ActivitySquare">Activity Over Time</SectionHeader>
            <button
              type="button"
              className="rounded-lg p-1.5 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Activity section options"
              title="Activity section options"
            >
              <MoreHorizontal className="w-5 h-5 text-muted" />
            </button>
          </div>
          <ActivityOverTimeLive projectId={project._id} defaultRange="30" />
        </section>

        {/* Right rail */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8" />
          <div className="lg:col-span-4 space-y-6">
            <InsightsBlock
              projectId={project._id}
              insights={stats?.insights}
              loading={statsLoading}
            />

            <div className="card accent-risk rounded-2xl border border-border bg-surface p-4">
              <SectionHeader icon="AlertTriangle">Risks &amp; Blockers</SectionHeader>
              <div className="mt-3">
                <RisksPanel project={project} />
              </div>
            </div>

            <MembersPanel members={project.members || []} />
          </div>
        </div>
      </div>

      {/* ---- Public Status Modal (flagged) ---- */}
      {ENABLE_PUBLIC_STATUS && showStatusModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
            onClick={() => setShowStatusModal(false)}
            aria-hidden="true"
          />
          <div
            className="fixed z-50 inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(560px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Public status link"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-text">
                  Public status link
                </h3>
              </div>
              <button
                className="text-sm rounded-lg px-2 py-1 hover:bg-surface"
                onClick={() => setShowStatusModal(false)}
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              {!publicStatusPath ? (
                <p className="text-sm text-muted">
                  This project is currently <strong>Private</strong>. Use the toggle in the header or Project Settings to enable the public status page.
                </p>
              ) : (
                <>
                  <label className="block text-xs text-muted mb-1">
                    Share this read-only status page:
                  </label>
                  <div className="flex items-stretch gap-2">
                    <input
                      readOnly
                      value={fullPublicUrl}
                      className="flex-1 text-sm rounded-lg border border-border bg-surface px-3 py-2"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={copyLink}
                      className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-white bg-grad-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                      <span className="shine pointer-events-none" aria-hidden="true" />
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenLoading}
                      className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-border hover:bg-surface disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      title="Regenerate link (invalidates the old one)"
                    >
                      {regenLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                      Regenerate
                      <span className="shine pointer-events-none" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">
                    Regenerating creates a new token and invalidates the old link.
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---- Drawers / Modals ---- */}
      <TaskSheet
        open={showTaskSheet}
        onClose={() => setShowTaskSheet(false)}
        onCreate={handleAddTask}
        onUpdate={handlePatchTask}
        projectId={id}
        canEdit={canEdit}
      />
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} projectId={project?._id}/>
      <ProjectSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        project={project}
        onSaved={(updated) => {
          if (updated) setProject((p) => ({ ...(p || {}), ...(updated || {}) }));
        }}
      />
    </main>
  );
}
