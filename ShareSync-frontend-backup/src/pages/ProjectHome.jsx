// src/pages/ProjectHome.jsx
import React, { useEffect, useMemo, useState, useContext, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProject, updateProject, shipProject } from "../api/projects";
import { createTask, patchTask } from "../api/tasks";
import { getProjectStats } from "../api/stats";
import ActivityOverTimeLive from "../components/analytics/ActivityOverTimeLive";
import Page from "../components/layout/Page.jsx";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectKpis from "../components/project/ProjectKpis";
import RisksPanel from "../components/project/RisksPanel";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import AskAIButton from "../components/assistant/AskAIButton.jsx";
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
import { CALENDAR_ACCOUNTABILITY, MENTOR_V1 } from "../config/flags.js";
import { getIcsUrl } from "../api/calendar.js";
import { buildPublicStatusUrl } from "../api/public";
import EmptyState from "../components/ui/EmptyState.jsx";
import SkeletonBlock from "../components/skeleton/SkeletonBlock.jsx";
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

// KPI graphs
import KpiGroup from "../components/analytics/KpiGroup";
import KpiDetailModal from "../components/kpi/KpiDetailModal";
import useKpiSeries from "../hooks/useKpiSeries";
import "../styles/charts.css";
import "../styles/posts.css";

import ETAExplainer from "../components/project/ETAExplainer.jsx";
import FocusPresenceDot from "../components/presence/FocusPresenceDot.jsx";
import useReducedMotion from "../hooks/useReducedMotion";
import useXpToasts from "../hooks/useXpToasts.js";

import { listInvites } from "../api/invite";
import { setLastSeen } from "../utils/stories";
import { MESSENGER_V1 } from "../config/flags.js";
import ProjectChatThread from "../components/messenger/ProjectChatThread.jsx";

// Telemetry
import { track } from "../utils/telemetry";
import { toast } from "../components/ui/toast.jsx";

const mark = (name) => { try { performance?.mark?.(name); } catch {} };
const measure = (name, start, end) => { try { performance?.measure?.(name, start, end); } catch {} };

async function perfLogDev(name, start) {
  if (import.meta.env.MODE === "production") return;
  try {
    const mod = await import("../utils/perfLog.js");
    mod.perfLog?.(name, start);
  } catch {}
}

const ENABLE_PUBLIC_STATUS = import.meta?.env?.VITE_FEATURE_PUBLIC_STATUS === "true";

function getRoleForUser(project, userId) {
  if (!project || !userId) return "viewer";
  if (String(project.userId) === String(userId)) return "owner";
  const hit = Array.isArray(project.members) && project.members.find(m => String(m.userId) === String(userId));
  return hit?.role || "viewer";
}

function extractMentor(stats) {
  const ai = stats?.mentor || stats?.ai || {};
  const vel = stats?.throughputPerWeek?.value ?? ai.velocityPerWeek ?? null;
  const fc = ai.forecast || stats?.forecast || null;
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
  if (endHour >= startHour) return h >= startHour && h < endHour;
  return h >= startHour || h < endHour;
}

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
  const withDue = tasks.filter(t => t?.dueDate);
  const stateCounts = withDue.reduce((acc, t) => {
    const s = getPunctuality(t);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const total = withDue.length;
  const ontime = stateCounts["on-time"] || 0;
  const late = stateCounts["late"] || 0;
  const risk = stateCounts["at-risk"] || 0;

  const reliability = stats?.reliability?.score ?? null;
  const streak = stats?.reliability?.streak ?? null;
  const lastMsg = stats?.insights?.punctuality?.[0]?.text || null;

  const Chip = ({ tone = "default", icon = null, label, value }) => {
    const toneCls = tone === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    tone === "warn" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    tone === "bad" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-slate-50 text-slate-700 border-slate-200";
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
        <Chip icon={<CalendarDays className="w-4 h-4" />} label="Scheduled" value={withDue.length} />
        <Chip tone="good" icon={<CheckCircle2 className="w-4 h-4" />} label="On-time" value={ontime} />
        <Chip tone="bad" icon={<AlertTriangle className="w-4 h-4" />} label="Late" value={late} />
        <Chip tone="warn" icon={<TimerReset className="w-4 h-4" />} label="At risk" value={risk} />
        <div className="rounded-xl border border-dashed border-border px-3 py-2">
          <div className="text-xs text-muted">Reliability</div>
          <div className="text-lg font-semibold">
            {reliability != null ? `${Math.round(reliability)}%` : "—"}
            {streak ? <span className="ml-2 text-xs text-muted">· {streak}d</span> : null}
          </div>
        </div>
      </div>

      {lastMsg && <div className="mt-3 text-xs px-3 py-2 rounded-xl border border-border bg-surface/50">{lastMsg}</div>}

      {total === 0 && (
        <div className="mt-3">
          <EmptyState
            icon="CalendarDays"
            title="Add due dates to unlock reliability tracking."
            primary={{ label: "Add a due date", onClick: onAddDueDate }}
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
  const prev = next ? (count >= 1 ? [1, 5, 10, 25, 50, 100].filter(x => x < next).slice(-1)[0] || 0 : 0) : count;
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
        />
      </div>
      <div className="mt-1 text-[11px] text-muted">
        {next ? (
          <>Next milestone: <span className="font-medium">{next} {unit}</span></>
        ) : (
          <>Milestones complete — keep going!</>
        )}
      </div>
    </div>
  );
}

function MentorPanel({ stats, projectId, onStartFocus, onOpenTasks }) {
  const { chrono } = extractMentor(stats || {});
  const Nudge = () => {
    if (!inProductiveWindow(chrono)) return null;
    return (
      <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 dark:bg-indigo-900/20 px-3 py-2 flex items-center justify-between">
        <div className="text-sm">You’re usually strongest now. Want to tackle your top task?</div>
        <button className="btn btn--primary" onClick={onStartFocus}>Start 25:00</button>
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

      <div className="mt-3 text-[11px] text-muted">Phase 2: probability models, AI delegation, scenario planning.</div>
    </Card>
  );
}

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  const meId = user?._id || user?.id;

  const presence = usePresence(id);
  const isOnline = (uid) => {
    const list = Array.isArray(presence?.onlineIds) ? presence.onlineIds.map(String) : [];
    return list.includes(String(uid));
  };

  const icsUrl = CALENDAR_ACCOUNTABILITY ? getIcsUrl(id) : null;
  useXpToasts(id);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [showTaskSheet, setShowTaskSheet] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sprintDoneOpen, setSprintDoneOpen] = useState(false);

  const [files, setFiles] = useState([]);
  const invitesFetchedRef = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("");
  const [pointComments, setPointComments] = useState([]);

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => { mark("ss:projecthome:mounted"); }, []);

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
    return () => { ignore = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const start = performance.now();
    (async () => {
      setStatsLoading(true);
      try {
        const data = await getProjectStats(id, { range: 30 });
        if (!ignore) setStats(data || null);
        perfLogDev("perf:project:kpi-tti", start);
      } catch (e) {
        if (!ignore) console.error(e);
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

  useEffect(() => {
    if (!project?._id) return;
    if (document.visibilityState === "visible") setLastSeen(project._id, Date.now());
    const onVisible = () => { if (document.visibilityState === "visible") setLastSeen(project._id, Date.now()); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [project?._id]);

  useSocket(id ? `project:${id}` : null, {
    onEvents: {
      "project:updated": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.patch) return;
        setProject(p => ({ ...p, ...payload.patch }));
      },
      "tasks:created": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.task) return;
        setProject(p => ({ ...p, tasks: [payload.task, ...(p?.tasks || [])] }));
      },
      "tasks:updated": (payload) => {
        if (String(payload?.projectId) !== String(id) || !payload?.task) return;
        setProject(p => ({
          ...p,
          tasks: (p?.tasks || []).map(t => String(t._id) === String(payload.task._id) ? payload.task : t),
        }));
      },
    },
  });

  const myRole = useMemo(() => getRoleForUser(project, meId), [project, meId]);
  const canEdit = myRole === "owner" || myRole === "member";
  const canManage = myRole === "owner";

  useEffect(() => {
    if (!project?._id || !canManage || invitesFetchedRef.current || Array.isArray(project?.invites)) return;
    (async () => {
      try {
        const rows = await listInvites(project._id);
        setProject(p => ({ ...(p || {}), invites: rows || [] }));
      } catch {}
      invitesFetchedRef.current = true;
    })();
  }, [project?._id, canManage]);

  const refreshInvites = useCallback(async () => {
    if (!project?._id) return;
    try {
      const rows = await listInvites(project._id);
      setProject(p => ({ ...(p || {}), invites: rows || [] }));
    } catch {}
  }, [project?._id]);

  const handleAddTask = async (payload) => {
    if (!canEdit) return;
    const created = await createTask(id, payload);
    setProject(p => ({ ...p, tasks: [created, ...(p?.tasks || [])] }));
    toast({ title: "Task created", variant: "success" });
    track("task_created", { projectId: id, taskId: created?._id });
  };

  const handlePatchTask = async (taskId, patch) => {
    if (!canEdit) return;
    const updated = await patchTask(id, taskId, patch);
    setProject(p => ({
      ...p,
      tasks: (p?.tasks || []).map(t => (String(t._id) === String(taskId) ? updated : t)),
    }));
    toast({ title: "Task updated", variant: "success" });
    track("task_updated", { projectId: id, taskId });
  };

  const handleShip = async () => {
    if (!canManage) return;
    try {
      await shipProject(id);
      setProject(p => ({ ...p, shippedAt: new Date().toISOString() }));
      toast({ title: "Project shipped!", variant: "success" });
      track("project_shipped", { projectId: id });
    } catch (e) {
      toast({ title: "Ship failed", description: e.message, variant: "error" });
    }
  };

  const kpiTrends = useKpiSeries(stats);

  const onKpiPointClick = useCallback((p) => {
    const metric = p?.metric || p?.title || "Metric";
    setSelectedMetric(metric);
    setSelectedPoint(p);
    setModalOpen(true);
    track("kpi_point_opened", { projectId: id, metric, t: p?.t });
  }, [id]);

  const joinFocus = useCallback(() => {
    track("focus_join_clicked", { projectId: id });
    window.dispatchEvent(new CustomEvent("start-tenx-sprint", { detail: { projectId: id } }));
  }, [id]);

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
            <button onClick={() => window.location.reload()} className="mt-4 btn btn-primary">Retry</button>
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
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-dashed border-border bg-surface p-4 animate-pulse h-[88px]" />
          ))}
        </div>
      );
    }
    if (!stats) return null;

    const fmtPct = v => `${Math.round((v ?? 0) * 100)}%`;
    const card = (label, value, sub) => (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 shadow-sm">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-xl font-semibold text-text num">{value}</div>
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

  const filesCount = Array.isArray(files) ? files.length : 0;
  const completedTasks = (project?.tasks || []).filter(t =>
    t?.completed === true || Boolean(t?.completedAt)
  ).length;

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto">
        <GradientPanel>
          <ProjectHeader
            name={project?.title || "Untitled"}
            status={project?.status || "In Progress"}
            isPublic={!!project?.publicToken}
            metrics={{
              ontime: project?.metrics?.onTimePct ?? 0,
              throughput: project?.metrics?.throughputPerWeek ?? 0,
              streak: project?.metrics?.streakDays ?? 0,
            }}
            icon={project?.icon || "Briefcase"}
            onAddTask={() => canEdit && setShowTaskSheet(true)}
            onStartFocus={() => window.dispatchEvent(new CustomEvent("start-tenx-sprint"))}
            onDownloadICS={icsUrl ? () => window.open(icsUrl, "_blank") : null}
          />
          {Array.isArray(project?.members) && project.members.length > 0 && (
            <div className="mt-2 px-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FocusPresenceDot
                  active={Boolean(presence?.isFocusing && String(presence.focusProjectId) === String(id))}
                  title="Live focus in progress"
                />
                <span className="text-xs text-muted">Online now</span>
                <AvatarGroup members={project.members} isOnline={isOnline} />
              </div>
              {presence?.isFocusing && String(presence.focusProjectId) === String(id) && (
                <button type="button" className="btn btn--outline" onClick={joinFocus}>Join Focus</button>
              )}
            </div>
          )}
        </GradientPanel>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => canEdit && setShowTaskSheet(true)}
            disabled={!canEdit}
            className="btn btn--primary"
          >
            <Plus className="w-4 h-4" /> Add task
          </button>

          <button
            type="button"
            onClick={() => canManage && setShowInvite(true)}
            disabled={!canManage}
            className="btn btn--outline"
          >
            <UserPlus className="w-4 h-4" /> Invite
          </button>

          <button
            type="button"
            onClick={() => canManage && setShowSettings(true)}
            disabled={!canManage}
            className="btn btn--outline"
          >
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>

          {project.shippedAt ? (
            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Trophy className="w-4 h-4" /> Shipped
            </div>
          ) : (
            <button
              type="button"
              onClick={handleShip}
              disabled={!canManage}
              className="btn btn--primary bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Rocket className="w-4 h-4" /> Ship
            </button>
          )}
        </div>

        <Card className="mt-6" role="region" aria-label="Project KPIs">
          <SectionHeader icon="Gauge">Project KPIs</SectionHeader>
          <div className="mt-3"><KpiCards /></div>
        </Card>

        {MENTOR_V1 && (
          <MentorPanel
            stats={stats}
            projectId={project?._id}
            onStartFocus={() => window.dispatchEvent(new CustomEvent("start-tenx-sprint"))}
            onOpenTasks={() => canEdit && setShowTaskSheet(true)}
          />
        )}

        <section className="mt-6">
          {loading ? (
            <SkeletonBlock height={72} radius={16} repeat={4} />
          ) : (
            <TabbedFeed projectId={project._id} showDiscover={false} />
          )}
        </section>

        <Card className="mt-6" role="region" aria-label="Milestones">
          <SectionHeader icon="Flag">Milestones</SectionHeader>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <MilestoneBar icon={<FilesIcon className="w-4 h-4 text-indigo-600" />} label="Files uploaded" count={filesCount} unit="files" />
            <MilestoneBar icon={<Trophy className="w-4 h-4 text-emerald-600" />} label="Tasks completed" count={completedTasks} unit="tasks" />
          </div>
        </Card>

        <Card className="mt-6" role="region" aria-label="Files">
          <SectionHeader icon="Folder">Files</SectionHeader>
          <div className="mt-3">
            {loading ? (
              <SkeletonBlock height={88} radius={16} repeat={2} />
            ) : files.length === 0 ? (
              <EmptyState icon="Folder" title="No files yet" />
            ) : (
              <FileGrid projectId={project._id} initialFiles={files} canEdit={canEdit} canManage={canManage} />
            )}
          </div>
        </Card>

        <Card className="mt-6 accent-activity" role="region" aria-label="Activity over time">
          <SectionHeader icon="ActivitySquare">Activity Over Time</SectionHeader>
          <div className="mt-3">
            <ActivityOverTimeLive projectId={project._id} defaultRange="30" />
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8" />
          <div className="lg:col-span-4 space-y-6">
            <InsightsBlock projectId={project._id} insights={stats?.insights} loading={statsLoading} />
            <Card className="accent-risk">
              <SectionHeader icon="AlertTriangle">Risks &amp; Blockers</SectionHeader>
              <div className="mt-3"><RisksPanel project={project} /></div>
            </Card>
          </div>
        </div>
      </div>

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
        onClose={() => { setShowInvite(false); refreshInvites(); }}
        projectId={project?._id}
      />
      <ProjectSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        project={project}
        onSaved={(updated) => {
          if (updated) {
            setProject(p => ({ ...(p || {}), ...(updated || {}) }));
            toast({ title: "Project saved", variant: "success" });
            track("project_saved", { projectId: updated?._id || project?._id });
          }
        }}
      />
    </main>
  );
}