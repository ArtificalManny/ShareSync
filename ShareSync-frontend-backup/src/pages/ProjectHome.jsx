// /src/pages/ProjectHome.jsx
import React, { useEffect, useMemo, useState, useContext, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { getProject } from "../api/projects";
import { createTask, patchTask } from "../api/tasks";

import { getProjectStats } from "../api/stats";
import ActivityOverTimeLive from "../components/analytics/ActivityOverTimeLive";
import Page from "../components/layout/Page.jsx";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectKpis from "../components/project/ProjectKpis";
import RisksPanel from "../components/project/RisksPanel";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import Card from "../components/ui/Card.jsx";
import GradientPanel from "../components/frame/GradientPanel.jsx";
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
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  TimerReset,
  Brain,
  TrendingUp,
  Users,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { CALENDAR_ACCOUNTABILITY, MENTOR_V1, IMPORT_WIZARD_V1, ETA_EXPLAINER_V1 } from "../config/flags.js";
import { getIcsUrl } from "../api/calendar.js";
import { buildPublicStatusUrl } from "../api/public";
import EmptyState from "../components/ui/EmptyState.jsx";
import { REACTIONS_V1 } from "../config/flags.js";
import ReactionBar from "../components/reactions/ReactionBar.jsx";
import AvatarGroup from "../components/ui/AvatarGroup.jsx";
import usePresence from "../hooks/usePresence.js";

import TaskSheet from "../components/tasks/TaskSheet";
import InviteModal from "../components/project/InviteModal";
import ProjectSettingsModal from "../components/project/ProjectSettingsModal";
import FileGrid from "../components/files/FileGrid";
import InsightsBlock from "../components/insights/InsightsBlock";
import SprintCompleteModal from "../components/focus/SprintCompleteModal.jsx";
import TabbedFeed from "../components/feed/TabbedFeed.jsx";

// NEW: KPI graphs
import KpiGroup from "../components/analytics/KpiGroup";
// NEW: detail modal for a KPI point
import KpiDetailModal from "../components/kpi/KpiDetailModal";
// NEW: series hook + chart styles
import useKpiSeries from "../hooks/useKpiSeries";
import "../styles/charts.css";
import "../styles/posts.css"; // keep if TabbedFeed/PostCard styles are global

import ETAExplainer from "../components/project/ETAExplainer.jsx";
import FocusPresenceDot from "../components/presence/FocusPresenceDot.jsx";

// NEW: prefers-reduced-motion hook
import useReducedMotion from "../hooks/useReducedMotion";
import useXpToasts from "../hooks/useXpToasts.js";

// NEW: local comments helpers
import {
  buildKey as buildKpiKey,
  getComments as getKpiComments,
  addComment as addKpiComment,
} from "../utils/kpi/comments";

// 🔔 Telemetry
import { track } from "../utils/telemetry";
// 🔔 Toasts
import { toast } from "../components/ui/Toaster.jsx";

// ⛓️ Invites API (for initial pending list / refresh)
import { listInvites } from "../api/invite";

// 🔔 Stories (unread ring) helpers
import { setLastSeen } from "../utils/stories";

import { MESSENGER_V1 } from "../config/flags.js";
import ProjectChatThread from "../components/messenger/ProjectChatThread.jsx";

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
    project.members.find((m) => m?.userId && String(m.userId) === String(userId));
  return (hit?.role === "owner" || hit?.role === "member" || hit?.role === "viewer")
    ? hit.role
    : "viewer";
}

// ---- AI Mentor (Charles) helpers ----
function extractMentor(stats) {
  const ai = stats?.mentor || stats?.ai || {};
  const vel = stats?.throughputPerWeek?.value ?? ai.velocityPerWeek ?? null;
  const fc = ai.forecast || stats?.forecast || null; // { p50, p90, remainingTasks }
  const load = Array.isArray(ai.overload) ? ai.overload : [];
  const tips = Array.isArray(ai.suggestions) ? ai.suggestions : (ai.tips || []);
  const chrono = ai.chronotype || ai.productiveWindow || null;
  return { vel, fc, load, tips, chrono };
}

function inProductiveWindow(windowSpec, now = new Date()) {
  if (!windowSpec) return false;
  const h = now.getHours();
  const { startHour, endHour } = windowSpec;
  if (typeof startHour !== "number" || typeof endHour !== "number") return false;
  if (endHour >= startHour) return h >= startHour && h < endHour; // e.g., 9..11
  return h >= startHour || h < endHour; // wraps midnight
}

/* ---------------- Milestones (files & tasks) ---------------- */
function getPunctuality(task) {
  const due = task?.dueDate ? new Date(task.dueDate) : null;
  const done = task?.completedAt ? new Date(task.completedAt) : null;
  const now = new Date();
  if (!due) return "unscheduled";
  if (done) return done <= due ? "on-time" : "late";
  const ms = due - now;
  if (ms < 0) return "late";
  if (ms <= 48 * 3600 * 1000) return "at-risk";
  return "scheduled";
}

function AccountabilityPanel({ tasks = [], stats, onAddDueDate }) {
  const withDue = tasks.filter((t) => t?.dueDate);
  const stateCounts = withDue.reduce((acc, t) => {
    const s = getPunctuality(t);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const total = withDue.length;
  const ontime = stateCounts["on-time"] || 0;
  const late = stateCounts["late"] || 0;
  const risk = stateCounts["at-risk"] || 0;
  const scheduled = (stateCounts["scheduled"] || 0) + risk + late + ontime;

  const reliability = stats?.reliability?.score ?? null; // 0..100
  const streak = stats?.reliability?.streak ?? null; // days
  const lastMsg = stats?.insights?.punctuality?.[0]?.text || null;

  const Chip = ({ tone = "default", icon = null, label, value }) => {
    const toneCls =
      tone === "good"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "bad"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-slate-50 text-slate-700 border-slate-200";
    return (
      <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${toneCls}`}>
        {icon}
        <div className="text-xs">
          <div className="font-semibold leading-none num">{value}</div>
          <div className="leading-none mt-0.5">{label}</div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-6" role="region" aria-label="Scheduling & Accountability">
      <div className="flex items-start justify-between">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold">Scheduling &amp; Accountability</h3>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Chip icon={<CalendarDays className="w-4 h-4" />} label="Scheduled (has due date)" value={scheduled} />
        <Chip tone="good" icon={<CheckCircle2 className="w-4 h-4" />} label="On-time (completed ≤ due)" value={ontime} />
        <Chip tone="bad" icon={<AlertTriangle className="w-4 h-4" />} label="Late (overdue or completed late)" value={late} />
        <Chip tone="warn" icon={<TimerReset className="w-4 h-4" />} label="At risk (due ≤ 48h)" value={risk} />
        <div className="rounded-xl border border-dashed border-border px-3 py-2">
          <div className="text-xs text-muted">Reliability</div>
          <div className="text-lg font-semibold">
            {reliability != null ? `${Math.round(reliability)}%` : "—"}
            {streak ? <span className="ml-2 text-xs text-muted">· streak {streak}d</span> : null}
          </div>
          <div className="text-[11px] text-muted mt-1">XP bonuses for punctuality</div>
        </div>
      </div>

      {lastMsg && <div className="mt-3 text-xs px-3 py-2 rounded-xl border border-border bg-surface/50">{lastMsg}</div>}

      {total === 0 && (
        <div className="mt-3">
          <EmptyState
            icon="🗓️"
            title="Add due dates to unlock reliability tracking."
            primary={{ label: "Add a due date", onClick: () => onAddDueDate?.() }}
          />
        </div>
      )}
    </Card>
  );
}

function nextThreshold(count, thresholds = [1, 5, 10, 25, 50, 100]) {
  for (const t of thresholds) if (count < t) return t;
  return null;
}
function MilestoneBar({ icon, label, count, unit }) {
  const next = nextThreshold(count);
  function thresholdsBelow(t) {
    return [1, 5, 10, 25, 50, 100].filter((x) => x < t);
  }
  const prev = next ? (count >= 1 ? thresholdsBelow(next).slice(-1)[0] || 0 : 0) : count;
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
      <div
        className="mt-2 h-2 rounded-full overflow-hidden"
        style={{ background: "color-mix(in srgb, rgb(var(--accent)) 16%, transparent)" }}
      >
        <div
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--info)) 100%)" }}
          aria-label={`${label} ${pct}%`}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted">
        {next ? (
          <>
            Next milestone: <span className="font-medium">{next} {unit}</span>
          </>
        ) : (
          <>Milestones complete — keep going! 🎉</>
        )}
      </div>
    </div>
  );
}

function MentorPanel({ stats, projectId, onStartFocus, onOpenTasks }) {
  const { vel, fc, load, tips, chrono } = extractMentor(stats);

  const CardInner = ({ title, icon, children }) => (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );

  const Nudge = () => {
    if (!inProductiveWindow(chrono)) return null;
    return (
      <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 dark:bg-indigo-900/20 px-3 py-2 flex items-center justify-between">
        <div className="text-sm">You’re usually strongest now. Want to tackle your top task?</div>
        <button className="btn btn--primary" onClick={onStartFocus} title="Start a 25-min sprint">
          Start 25:00
        </button>
      </div>
    );
  };

  return (
    <Card className="mt-6" role="region" aria-label="AI Mentor">
      <div className="flex items-start justify-between">
        <div className="inline-flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold">AI Charles Xavier – Predictive Mentor</h3>
        </div>
      </div>

      <div className="mt-3"><Nudge /></div>

      {!vel && !fc && (
        <div className="mt-3">
          <EmptyState
            icon="🔮"
            title="Complete a few tasks to unlock ETA."
            primary={{ label: "Open tasks", onClick: () => onOpenTasks?.() }}
            secondary={{ label: "Start a 25:00", onClick: onStartFocus }}
          />
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <CardInner title="Velocity & forecast" icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}>
          <div className="text-sm">
            <div>
              Velocity: <span className="font-semibold num">{vel != null ? `${vel}/wk` : "—"}</span>
            </div>
            {fc ? (
              <div className="mt-1 text-xs text-muted">
                ETA (p50): <span className="font-medium">{fc.p50 || "—"}</span>
                {fc.p90 ? <> · p90: <span className="font-medium">{fc.p90}</span></> : null}
                {fc.remainingTasks != null ? <> · remaining: <span className="num">{fc.remainingTasks}</span></> : null}
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted">Add a few completed tasks to unlock ETA.</div>
            )}
          </div>
        </CardInner>

        <CardInner title="Workload balance" icon={<Users className="w-4 h-4 text-indigo-600" />}>
          {Array.isArray(load) && load.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {load.slice(0, 3).map((m, i) => (
                <li key={m.userId || i} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="truncate">
                    <span className="font-medium">{m.name || "Member"}</span> at {Math.round(m.loadPct ?? 0)}%
                    {m.recommendation ? <> — {m.recommendation}</> : null}
                  </span>
                </li>
              ))}
              {load.length > 3 && <li className="text-xs text-muted">+{load.length - 3} more…</li>}
            </ul>
          ) : (
            <div className="text-xs text-muted">No overload detected.</div>
          )}
        </CardInner>

        <CardInner title="Suggestions" icon={<Lightbulb className="w-4 h-4 text-indigo-600" />}>
          {Array.isArray(tips) && tips.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1">
              {tips.slice(0, 4).map((t, i) => <li key={t.id || i}>{t.text || String(t)}</li>)}
            </ul>
          ) : (
            <div className="text-xs text-muted">MVP active: using velocity-based hints. More learnings will appear here.</div>
          )}
        </CardInner>
      </div>

      <div className="mt-3 text-[11px] text-muted">Phase 2: probability models, AI delegation, scenario planning.</div>
    </Card>
  );
}

/* ----------------------------------------------------------- */

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  const meId = user?._id || user?.id;

  // Live presence for this project
  const presence = (() => {
    try { return usePresence(id); } catch { return null; }
  })();
  // AvatarGroup expects a function: isOnline(userId) -> boolean
const isOnline =
typeof presence?.isOnline === "function"
  ? presence.isOnline
  : (uid) => {
      // if the hook exposes an array of online ids, use it; otherwise fall back to a single-flag bool
      const idStr = String(uid ?? "");
      const list = Array.isArray(presence?.onlineIds) ? presence.onlineIds.map(String) : [];
      if (list.length) return list.includes(idStr);
      return Boolean(presence?.online ?? presence?.isOnline);
    };

  // Calendar ICS link (flag-gated)
  const icsUrl = CALENDAR_ACCOUNTABILITY ? getIcsUrl(id) : null;

  // XP toasts (confetti + telemetry on punctual completions)
  useXpToasts(id);

  const [project, setProject] = useState(null);

  const [loading, setLoading] = useState(true);
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
  const [sprintDoneOpen, setSprintDoneOpen] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(false);

  // Files (used by Files section)
  const [files, setFiles] = useState([]);

  // Track whether we've fetched invites once (to avoid loops)
  const invitesFetchedRef = useRef(false);

  // 🔹 KPI detail modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // { label, t, v, idx }
  const [selectedMetric, setSelectedMetric] = useState("");
  const [pointComments, setPointComments] = useState([]);

  // Reduced motion
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    mark("ss:projecthome:mounted");
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
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
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const start = performance.now();
    (async () => {
      setStatsLoading(true);
      setStatsError("");
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
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && project) {
      mark("ss:projecthome:data-ready");
      measure("perf:projecthome:data", "ss:nav-project-click", "ss:projecthome:data-ready");
    }
  }, [loading, project]);

  // ✅ Mark project as seen on mount / when tab visible/focus
  useEffect(() => {
    if (!project?._id) return;

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      try {
        setLastSeen(project._id, Date.now());
      } catch {}
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        try {
          setLastSeen(project._id, Date.now());
        } catch {}
      }
    };
    const onFocus = () => {
      try {
        setLastSeen(project._id, Date.now());
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [project?._id]);

  // 🔴 Realtime (keep updates to files/members/tasks; TabbedFeed handles its own data)
  useSocket(id ? `project:${id}` : null, {
    onEvents: {
      "project:statsUpdated": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          // optional: refetch KPIs later
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
        setFiles((prev) => {
          const seen = new Set(prev.map((f) => String(f._id || f.id)));
          const incoming = payload.files.filter((f) => !seen.has(String(f._id || f.id)));
          return [...incoming, ...prev];
        });
      },
      "project:updated": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.patch) return;
        if (Object.prototype.hasOwnProperty.call(payload.patch, "icon")) {
          setProject((p) => ({ ...p, icon: payload.patch.icon }));
        } else {
          setProject((p) => ({ ...p, ...payload.patch }));
        }
      },
      "tasks:created": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.task) return;
        setProject((p) => ({ ...p, tasks: [payload.task, ...(p?.tasks || [])] }));
      },
      "tasks:updated": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.task) return;
        setProject((p) => ({
          ...p,
          tasks: (p?.tasks || []).map((t) =>
            String(t._id) === String(payload.task._id) ? payload.task : t
          ),
        }));
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

  // ▶️ Initial invites load (owner only)
  useEffect(() => {
    if (!project?._id) return;
    if (!canManage) return;
    if (invitesFetchedRef.current) return;
    if (Array.isArray(project?.invites)) {
      invitesFetchedRef.current = true;
      return;
    }

    (async () => {
      try {
        const rows = await listInvites(project._id);
        setProject((p) => ({ ...(p || {}), invites: rows || [] }));
      } catch {
        /* soft-fail */
      } finally {
        invitesFetchedRef.current = true;
      }
    })();
  }, [project?._id, canManage]);

  // Convenient manual refresh (used after InviteModal closes)
  const refreshInvites = useCallback(async () => {
    if (!project?._id) return;
    try {
      const rows = await listInvites(project._id);
      setProject((p) => ({ ...(p || {}), invites: rows || [] }));
    } catch {}
  }, [project?._id]);

  // Tasks
  const handleAddTask = async (payload) => {
    if (!canEdit) return;
    const created = await createTask(id, payload);
    setProject((p) => ({ ...p, tasks: [created, ...(p?.tasks || [])] }));
    try {
      toast({ title: "Task created", variant: "success" });
      track("task_created", { projectId: id, taskId: created?._id || created?.id });
    } catch {}
  };

  const handlePatchTask = async (taskId, patch) => {
    if (!canEdit) return;
    const updated = await patchTask(id, taskId, patch);
    setProject((p) => ({
      ...p,
      tasks: (p?.tasks || []).map((t) => (String(t._id) === String(taskId) ? updated : t)),
    }));
    try {
      toast({ title: "Task updated", variant: "success" });
      track("task_updated", { projectId: id, taskId });
    } catch {}
  };

  // --- Public status helpers (flagged) ---
  const publicToken = project?.publicToken || "";
  const publicEnabled = !!publicToken;
  const publicStatusPath = ENABLE_PUBLIC_STATUS && publicEnabled ? buildPublicStatusUrl(publicToken) : null;
  const fullPublicUrl =
    typeof window !== "undefined" && publicStatusPath ? `${window.location.origin}${publicStatusPath}` : publicStatusPath || "";

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
      try {
        toast({ title: "Link copied", variant: "success" });
        track("public_link_copied", { projectId: id });
      } catch {}
    } catch (e) {
      setCopied(false);
      const msg = e?.message || "Failed to copy link.";
      try {
        toast({ title: "Copy failed", description: msg, variant: "error" });
      } catch {}
    }
  };

  const handleTogglePublic = useCallback(
    async (nextEnabled) => {
      if (!ENABLE_PUBLIC_STATUS) return;
      if (!canManage || !project?._id) return;

      let mod = {};
      try {
        mod = await import("../api/public");
      } catch {}

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
            toast({ title: "Public status enabled", variant: "success" });
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
            toast({ title: "Public status disabled" });
            track("public_status_changed", {
              projectId: project._id,
              action: "disabled",
            });
          } catch {}
        }
      } catch (e) {
        const msg = e?.message || "Failed to update public status.";
        alert(msg);
        try {
          toast({ title: "Public status failed", description: msg, variant: "error" });
        } catch {}
      }
    },
    [canManage, project?._id]
  );

  const handleRegenerate = async () => {
    if (!ENABLE_PUBLIC_STATUS) return;
    if (!canManage || !project?._id) return;
    setRegenLoading(true);
    let mod = {};
    try {
      mod = await import("../api/public");
    } catch {}
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
        try {
          toast({ title: "Link regenerated", variant: "success" });
          track("public_status_changed", { projectId: project._id, action: "regenerated" });
        } catch {}
      }
    } catch (e) {
      const msg = e?.message || "Failed to regenerate link.";
      alert(msg);
      try {
        toast({ title: "Regenerate failed", description: msg, variant: "error" });
      } catch {}
    } finally {
      setRegenLoading(false);
    }
  };

  const kpiTrends = useKpiSeries(stats);

  //Quick-join the current focus session (if one is active on this project)
  const joinFocus = useCallback(() => {
    try { track("focus_join_clicked", { projectId: id}); } catch {}
    try { window.dispatchEvent(new CustomEvent("start-tenx-sprint", { detail: { projectId: id } })); } catch{}
  }, [id]);

  useEffect(() => {
    if (!MENTOR_V1) return;
    const { chrono } = extractMentor(stats || {});
    if (inProductiveWindow(chrono)) {
      try {
        toast({
          title: "Prime time ✨",
          description: "You’re usually most productive now. Start a 25:00?",
          action: { label: "Start", onClick: () => window.dispatchEvent(new CustomEvent("start-tenx-sprint")) },
        });
      } catch {}
    }
  }, [stats]);

  // 🔹 KPI point click handler → open modal and preload comments
  const onKpiPointClick = useCallback(
    (p) => {
      const metric = p?.metric || p?.title || p?.seriesLabel || p?.labelMetric || "Metric";
      setSelectedMetric(metric);
      setSelectedPoint(p || null);
      setModalOpen(true);
      try {
        track("kpi_point_opened", { projectId: id, metric, t: p?.t || p?.label || null });
      } catch {}
    },
    [id]
  );

  // Load comments whenever selection changes/opened
  useEffect(() => {
    if (!modalOpen || !selectedPoint || !selectedMetric) return;
    const key = buildKpiKey({
      projectId: project?._id || id,
      metric: selectedMetric,
      t: selectedPoint.t || selectedPoint.label,
    });
    try {
      setPointComments(getKpiComments(key));
    } catch {
      setPointComments([]);
    }
  }, [modalOpen, selectedPoint, selectedMetric, project?._id, id]);

  const handleAddPointComment = useCallback(
    (text) => {
      if (!selectedPoint || !selectedMetric) return;
      const key = buildKpiKey({
        projectId: project?._id || id,
        metric: selectedMetric,
        t: selectedPoint.t || selectedPoint.label,
      });
      const entry = {
        text: String(text || "").trim(),
        at: Date.now(),
        author: user?.firstName || user?.username || user?.email || "You",
      };
      const updated = addKpiComment(key, entry);
      setPointComments(updated);
      try {
        track("kpi_comment_added", { projectId: id, metric: selectedMetric });
      } catch {}
    },
    [selectedPoint, selectedMetric, project?._id, id, user?.firstName, user?.username, user?.email]
  );

  if (loading) {
    return (
      <Page className="bg-bg text-text min-h-screen">
        <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-surface" />
            <div className="h-24 rounded-2xl bg-surface" />
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
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

            {CALENDAR_ACCOUNTABILITY && icsUrl && (
              <a
                href={icsUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={() => {
                  try {
                    const { trackScheduleCreated } = require("../utils/telemetry.js");
                    trackScheduleCreated?.({ projectId: id, method: "ics_export" });
                  } catch {}
                }}
                className="ml-3 relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Download tasks as .ics"
              >
                <CalendarDays className="w-4 h-4" />
                Download .ics
                <span className="shine pointer-events-none" aria-hidden="true" />
              </a>
            )}
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
            <div key={i} className="rounded-2xl border border-dashed border-border bg-surface p-4 animate-pulse h-[88px]" />
          ))}
        </div>
      );
    }
    if (statsError || !stats) return null;

    const fmtPct = (v) => `${Math.round((v ?? 0) * 100)}%`;
    const card = (label, value, sub) => (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 shadow-sm">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-xl font-semibold text-text num">{value}</div>
        {sub ? <div className="text-xs text-muted mt-1">{sub}</div> : null}
        {REACTIONS_V1 && (
          <ReactionBar targetId={`kpi:${project?._id || id}:${label}`} ownerId={project?.userId} meId={meId || "me"} label={label} />
        )}
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

  const disabledBtn = "opacity-60 cursor-not-allowed hover:bg-transparent hover:opacity-60";

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
      <div className="px-4 sm:px-6 lg:px-10 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto">
        {/* Header (public toggle gated by flag) */}
        <GradientPanel>
          <ProjectHeader
            project={project}
            onAddTask={() => canEdit && setShowTaskSheet(true)}
            onTogglePublic={ENABLE_PUBLIC_STATUS ? handleTogglePublic : undefined}
          />
          {/* Presence (who's around) */}
          {Array.isArray(project?.members) && project.members.length > 0 && (
            <div className="mt-2 px-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Breathing pulse when anyone is focusing on this project */}
                <FocusPresenceDot
  active={Boolean(
    presence?.isFocusing &&
    (!presence?.focusProjectId || String(presence.focusProjectId) === String(id))
  )}
  title="Live focus in progress"
/>
                <span className="text-xs text-muted">Online now</span>
                <AvatarGroup members={project.members} isOnline={isOnline}/>
              </div>
              {/* Quick “Join focus” CTA when there’s a live focus on this project */}
              {presence?.isFocusing && (!presence?.focusProjectId || String(presence.focusProjectId) === String(id)) && (
                <button
                type="button"
                className="btn btn--outline focus-ring"
                onClick={joinFocus}
                title="Join the current 25:00"
                >
                  Join Focus
                </button>
              )}
            </div>
          )}
        </GradientPanel>

        {MESSENGER_V1 && project?.chatEnabled && (
          <Card className="mt-6" role="region" aria-label="Project chat">
            <div className="flex items-start justify-between">
              <SectionHeader icon="MessagesSquare">Chat</SectionHeader>
            </div>
            <div className="mt-3">
              <ProjectChatThread projectId={project._id} />
            </div>
          </Card>
        )}

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

          {IMPORT_WIZARD_V1 && canManage && (
            <Link
              to="/import"
              onClick={() => {
                try {
                  track("import_cta_clicked", { projectId: id, source: "project_home" });
                } catch {}
              }}
              className={[
                "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              ].join(" ")}
              title="Import from Linear or Jira"
            >
              <TrendingUp className="w-4 h-4" />
              Import from Linear/Jira
              <span className="shine pointer-events-none" aria-hidden="true" />
            </Link>
          )}

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
        <Card className="mt-6 accent-kpi" role="region" aria-label="Project KPIs" aria-busy={statsLoading ? "true" : "false"}>
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
          <div className="my-3 border-t border-border" />
          <div className="mt-3">
            <KpiCards />
          </div>
        </Card>

        {/* ETA Explainer */}
        {ETA_EXPLAINER_V1 && (
          <div className="mt-6">
            <ETAExplainer 
            projectId={project._id}
            tasks={project?.tasks || []}
            stats={stats}
            />
            </div>
        )}

        {/* NEW: KPI Trends */}
        {kpiTrends.length > 0 && (
          <Card className="mt-6 accent-activity" role="region" aria-label="KPI Trends">
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
                onPointClick={onKpiPointClick}
                motionEnabled={!prefersReducedMotion}
              />
            </div>
            {REACTIONS_V1 && (
              <ReactionBar targetId={`kpi-trends:${project?._id || id}`} ownerId={project?.userId} meId={meId || "me"} label="KPI Trends" />
            )}
          </Card>
        )}

        {/* Scheduling + Accountability */}
        {CALENDAR_ACCOUNTABILITY && (
          <AccountabilityPanel tasks={project?.tasks || []} stats={stats} onAddDueDate={() => canEdit && setShowTaskSheet(true)} />
        )}

        {/* AI Charles Xavier = Mentor */}
        {MENTOR_V1 && (
          <MentorPanel
            stats={stats}
            projectId={project?._id}
            onStartFocus={() => window.dispatchEvent(new CustomEvent("start-tenx-sprint"))}
            onOpenTasks={() => canEdit && setShowTaskSheet(true)}
          />
        )}

        {/* Unified Tabbed Feed (project-scoped) */}
        <TabbedFeed projectId={project._id} showDiscover={false} className="mt-6" />

        {/* NEW: Files & Tasks Milestones */}
        <Card className="mt-6" role="region" aria-label="Milestones">
          <div className="flex items-start justify-between">
            <SectionHeader icon="Flag">Milestones</SectionHeader>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <MilestoneBar icon={<FilesIcon className="w-4 h-4 text-indigo-600" />} label="Files uploaded" count={filesCount} unit="files" />
            <MilestoneBar icon={<Trophy className="w-4 h-4 text-emerald-600" />} label="Tasks completed" count={completedTasks} unit="tasks" />
          </div>
        </Card>

        {/* Files */}
        <Card className="mt-6" role="region" aria-label="Files">
          <div className="flex items-start justify-between">
            <SectionHeader icon="Folder">Files</SectionHeader>
          </div>
          <div className="mt-3">
            <FileGrid projectId={project._id} initialFiles={files} canEdit={canEdit} canManage={canManage} />
          </div>
        </Card>

        {/* Activity Over Time */}
        <Card className="mt-6 accent-activity" role="region" aria-label="Activity over time">
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
          <div className="mt-3">
            <ActivityOverTimeLive projectId={project._id} defaultRange="30" />
          </div>
        </Card>

        {/* Right rail */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8" />
          <div className="lg:col-span-4 space-y-6">
            <InsightsBlock projectId={project._id} insights={stats?.insights} loading={statsLoading} />

            <Card className="accent-risk">
              <SectionHeader icon="AlertTriangle">Risks &amp; Blockers</SectionHeader>
              <div className="mt-3">
                <RisksPanel project={project} />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ---- Public Status Modal (flagged) ---- */}
      {ENABLE_PUBLIC_STATUS && showStatusModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50" onClick={() => setShowStatusModal(false)} aria-hidden="true" />
          <div
            className="fixed z-50 inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(560px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Public status link"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-text">Public status link</h3>
              </div>
              <button className="text-sm rounded-lg px-2 py-1 hover:bg-surface" onClick={() => setShowStatusModal(false)}>
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
                  <label className="block text-xs text-muted mb-1">Share this read-only status page:</label>
                  <div className="flex items-stretch gap-2">
                    <input
                      readOnly
                      value={fullPublicUrl}
                      className="flex-1 text-sm rounded-lg border border-border bg-surface px-3 py-2"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={copyLink}
                      className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-white bg-grad-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lift fade-swap"
                    >
                      <span className="swap-a" aria-hidden={copied ? "true" : "false"}>
                        <Copy className="w-4 h-4" />
                      </span>
                      <span className="swap-b" aria-hidden={copied ? "false" : "true"}>
                        <Check className="w-4 h-4" />
                      </span>
                      <span className="swap-a" aria-hidden={copied ? "true" : "false"}>Copy</span>
                      <span className="swap-b" aria-hidden={copied ? "false" : "true"}>Copied</span>
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
                  <p className="text-[11px] text-muted">Regenerating creates a new token and invalidates the old link.</p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---- KPI Detail Modal ---- */}
      {modalOpen && selectedPoint && (
        <KpiDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          metric={selectedMetric}
          point={selectedPoint}
          comments={pointComments}
          onAddComment={handleAddPointComment}
        />
      )}

      {/* ---- Sprint Complete Modal ---- */}
      <SprintCompleteModal
        open={sprintDoneOpen}
        onClose={() => {
          setSprintDoneOpen(false);
          setShareToFeed(false);
        }}
        completedTasks={[]}
        onShareToggleChange={(on) => {
          setShareToFeed(on);
          try {
            track("share_toggle_used", { on });
          } catch {}
        }}
      />

      {/* ---- Drawers / Modals ---- */}
      <TaskSheet
        open={showTaskSheet}
        onClose={() => setShowTaskSheet(false)}
        onCreate={handleAddTask}
        onUpdate={handlePatchTask}
        projectId={id}
        canEdit={canEdit}
      />
      <InviteModal
        open={showInvite}
        onClose={() => {
          setShowInvite(false);
          refreshInvites();
        }}
        projectId={project?._id}
      />
      <ProjectSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        project={project}
        onSaved={(updated) => {
          if (updated) {
            setProject((p) => ({ ...(p || {}), ...(updated || {}) }));
            try {
              toast({ title: "Project saved", variant: "success" });
              track("project_saved", { projectId: updated?._id || project?._id || id });
            } catch {}
          }
        }}
      />
    </main>
  );
}