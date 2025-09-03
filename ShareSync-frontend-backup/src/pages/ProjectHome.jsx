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
import { uploadFiles } from "../api/uploads";

import { getProjectStats } from "../api/stats";
import ActivityOverTimeLive from "../components/analytics/ActivityOverTimeLive";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectKpis from "../components/project/ProjectKpis";
import ProjectActivityFeed from "../components/project/ProjectActivityFeed";
import RisksPanel from "../components/project/RisksPanel";
import MembersPanel from "../components/project/MembersPanel";
import AuditList from "../components/audit/AuditList.jsx";
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
} from "lucide-react";
import { buildPublicStatusUrl } from "../api/public";

// ✅ REAL components
import TaskSheet from "../components/tasks/TaskSheet";
import InviteModal from "../components/project/InviteModal";
import ProjectSettingsModal from "../components/project/ProjectSettingsModal";
import UpdateComposer from "../components/compose/UpdateComposer";
import FileGrid from "../components/files/FileGrid";
import InsightsBlock from "../components/insights/InsightsBlock";

// ---- small helpers ----
const mark = (name) => { try { performance?.mark?.(name); } catch {} };
const measure = (name, start, end) => { try { performance?.measure?.(name, start, end); } catch {} };

// Simple de-dupe by stable key (id/_id/tempId fallback)
function dedupeById(items = []) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key =
      String(it?._id ?? it?.id ?? it?.tempId ?? "") ||
      `${it?.type || "?"}:${it?.createdAt || ""}:${(it?.text || "").slice(0, 16)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

async function perfLogDev(name, start) {
  if (import.meta.env.MODE === "production") return;
  try {
    const mod = await import("../utils/perfLog.js");
    mod.perfLog?.(name, start);
  } catch {}
}

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
  const [showTaskSheet, setShowTaskSheet] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Tabs & files
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'updates' | 'tasks' | 'files'
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
      const items = Array.isArray(res?.items) ? res.items : [];
      const nextCursor = res?.nextCursor || null;

      setFeed((prev) => ({
        items: dedupeById(cursor ? [...prev.items, ...items] : items),
        nextCursor, // ✅ keep this
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
        if (String(evt?.projectId) === String(id)) {
          setFeed((prev) => ({ ...prev, items: dedupeById([evt, ...prev.items]) }));
        }
      },
      "project:statsUpdated": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          // Optionally fetch fresh KPIs
        }
      },
      // members updated
      "project:membersUpdated": (payload) => {
        if (String(payload?.projectId) === String(id)) {
          setProject((p) => ({ ...p, members: payload.members || p?.members || [] }));
        }
      },
      // files added
      "project:filesAdded": (payload) => {
        if (String(payload?.projectId) === String(id) && Array.isArray(payload?.files)) {
          setFiles((prev) => dedupeById([...payload.files, ...prev]));
        }
      },
      // task created
      "tasks:created": (payload) => {
        if (String(payload?.projectId) === String(id) && payload?.task) {
          setProject((p) => ({ ...p, tasks: [payload.task, ...(p?.tasks || [])] }));
        }
      },
      "tasks:updated": (payload) => {
        if (String(payload?.projectId) === String(id) && payload?.task) {
          setProject((p) => ({
            ...p,
            tasks: (p?.tasks || []).map((t) =>
              String(t._id) === String(payload.task._id) ? payload.task : t
            ),
          }));
        }
      },
    },
  });

  // --- Role + permissions ---
  const myRole = useMemo(() => getRoleForUser(project, meId), [project, meId]);
  const canEdit = myRole === "owner" || myRole === "member";
  const canManage = myRole === "owner";

  // Composer (string or {text, attachments[], mentions?, visibility?})
  const handlePostUpdate = async (payload) => {
    if (!canEdit) return; // guard
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
        clientTempId: optimistic._id, // harmless if server ignores
      });
      setFeed((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it._id === optimistic._id ? created : it)),
      }));
    } catch {
      // roll back optimistic
      setFeed((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it._id !== optimistic._id),
      }));
      throw new Error("Failed to post update");
    }
  };

  const tasks = useMemo(() => project?.tasks ?? [], [project]);

  // ✅ Optimistic task add
  const handleAddTask = async (title) => {
    if (!canEdit) return; // guard
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
      setProject((p) => ({
        ...p,
        tasks: (p?.tasks || []).filter((t) => t._id !== optimistic._id),
      }));
      throw e;
    }
  };

  const handlePatchTask = async (taskId, patch) => {
    if (!canEdit) return; // guard
    const updated = await patchTask(id, taskId, patch);
    setProject((p) => ({
      ...p,
      tasks: (p?.tasks || []).map((t) => (String(t._id) === String(taskId) ? updated : t)),
    }));
  };

  // --- Public status link helpers ---
  const publicToken = project?.publicToken || project?.token || project?._id;
  const publicStatusPath = publicToken ? buildPublicStatusUrl(publicToken) : null;
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

  // Feed filtering
  const filteredFeedItems = useMemo(() => {
    if (activeTab === "all") return feed.items;
    if (activeTab === "updates") return feed.items.filter((it) => (it.type || "").includes("update"));
    if (activeTab === "tasks") return feed.items.filter((it) => (it.type || "").includes("task"));
    if (activeTab === "files") return feed.items.filter((it) => (it.type || "").includes("file"));
    return feed.items;
  }, [feed.items, activeTab]);

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
              className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
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

  // Styles for disabled buttons
  const disabledBtn =
    "opacity-60 cursor-not-allowed hover:bg-transparent hover:opacity-60";

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto">
        {/* Header */}
        <ProjectHeader project={project} onAddTask={() => canEdit && setShowTaskSheet(true)} />

        {/* Action Bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => canEdit && setShowTaskSheet(true)}
            disabled={!canEdit}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 ${!canEdit ? disabledBtn : ""}`}
            title={!canEdit ? "Viewers cannot add tasks" : "Add task"}
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>

          <button
            type="button"
            onClick={() => canManage && setShowInvite(true)}
            disabled={!canManage}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface ${!canManage ? disabledBtn : ""}`}
            title={!canManage ? "Only owners can invite" : "Invite"}
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>

          <button
            type="button"
            onClick={() => canManage && setShowSettings(true)}
            disabled={!canManage}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface ${!canManage ? disabledBtn : ""}`}
            title={!canManage ? "Only owners can manage settings" : "Settings"}
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>

          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface"
            title="Copy public status link"
          >
            <Share2 className="w-4 h-4" />
            Public status
          </button>
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

        {/* Tabs */}
        <div className="mt-6">
          <div className="inline-flex rounded-xl border border-border overflow-hidden">
            {[
              { key: "all", label: "All" },
              { key: "updates", label: "Updates" },
              { key: "tasks", label: "Tasks" },
              { key: "files", label: "Files" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-sm ${
                  activeTab === t.key
                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                    : "text-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main column */}
          <div className="lg:col-span-8 space-y-4">
            {(activeTab === "all" || activeTab === "updates") && canEdit && (
              <UpdateComposer
                disabled={!canEdit}
                onSubmit={handlePostUpdate}
                onUploadFiles={(flist) => uploadFiles(flist, { projectId: id })}
              />
            )}

            {(activeTab === "all" || activeTab === "updates") && (
              <ProjectActivityFeed
                items={filteredFeedItems}
                loading={feedLoading}
                onLoadMore={() => feed.nextCursor && loadFeed(feed.nextCursor)}
                hasMore={!!feed.nextCursor}
                onPostUpdate={canEdit ? handlePostUpdate : undefined}
                onRefetch={() => loadFeed()}
              />
            )}

            {activeTab === "tasks" && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <SectionHeader icon="ListTodo">Tasks</SectionHeader>
                <div className="mt-3 space-y-2">
                  {(tasks || []).map((t) => (
                    <div key={t._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div className="text-sm">{t.title}</div>
                      <div className="text-xs text-muted">{t.status || "Not Started"}</div>
                    </div>
                  ))}
                  {!tasks?.length && <div className="text-sm text-muted">No tasks yet.</div>}
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <SectionHeader icon="Folder">Files</SectionHeader>
                <div className="mt-3">
                  <FileGrid
                    projectId={project._id}
                    initialFiles={project.files || []}
                    canEdit={canEdit}
                    canManage={canManage}   // ✅ owners get delete controls
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="lg:col-span-4 space-y-6">
            {/* ✅ Insights */}
            <InsightsBlock
              projectId={project._id}
              insights={stats?.insights}
              loading={statsLoading}
              className=""
            />

            <div className="card accent-risk rounded-2xl border border-border bg-surface p-4">
              <SectionHeader icon="AlertTriangle">Risks &amp; Blockers</SectionHeader>
              <div className="mt-3">
                <RisksPanel project={project} />
              </div>
            </div>

            <MembersPanel members={project.members || []} />

            <div className="card accent-activity rounded-2xl border border-border bg-surface p-4">
              <SectionHeader icon="History">Recent Activity</SectionHeader>
              <div className="mt-2">
                <AuditList scope="project" projectId={project._id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Public Status Modal ---- */}
      {showStatusModal && (
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
                  Copy public status link
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
                  This project doesn’t have a public token yet. Once enabled, you’ll see a shareable link here.
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
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">
                    Visitors can view KPIs and recent activity summaries. No login required.
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
      />
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
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