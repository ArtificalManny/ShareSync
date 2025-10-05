import React, { useContext, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Link2, RefreshCcw, Copy as CopyIcon, Check as CheckIcon, CalendarDays } from "lucide-react";
import { AuthContext } from "../../AuthContext";
import { patchProjectIcon } from "../../api/projects";
import {
  enablePublic,
  disablePublic,
  regeneratePublicToken,
  buildPublicStatusUrl,
} from "../../api/public";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx";
import ProjectIconPicker from "./ProjectIconPicker";
import AnimatedRing from "../ui/AnimatedRing";
import GradientText from "../ui/GradientText";
import StatusPill from "../projects/StatusPill.jsx";
import useRecentFlag from "../../hooks/useRecentFlag";
import useReducedMotion from "../../hooks/useReducedMotion";
import { setLastSeen } from "../../utils/stories";
import { CALENDAR_ACCOUNTABILITY } from "../../config/flags.js";
import { getIcsUrl } from "../../api/calendar.js";
import { trackScheduleCreated } from "../../utils/telemetry";

const ENABLE_PUBLIC_STATUS = (() => {
  const v = import.meta?.env?.VITE_FEATURE_PUBLIC_STATUS ?? "";
  return /^(1|true|on|yes)$/i.test(String(v));
})();

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

const roleStyle = (role) => {
  switch (role) {
    case "owner":  return "bg-indigo-100 text-indigo-700";
    case "member": return "bg-sky-100 text-sky-700";
    default:       return "bg-slate-100 text-slate-700";
  }
};

function SVGIcon({ name, className = "w-6 h-6" }) {
  const common = { className, "aria-hidden": true };
  switch (name) {
    case "rocket":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 2c3 0 6 2 8 4l-6 6-2-2-6 6-2-2 6-6-2-2 6-6z" fill="currentColor" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M13 2L3 14h7l-1 8 11-12h-7l0-8z" fill="currentColor" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      );
    default:
      return <div className={className} />;
  }
}

function Avatar({ label, title }) {
  const ch = (label || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div
      className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 grid place-content-center text-xs font-medium text-slate-700 dark:text-slate-200"
      title={title}
      aria-label={title}
    >
      {ch}
    </div>
  );
}

export default function ProjectHeader({
  project,
  onAddTask,
  onTogglePublic,
  recentWindowMs = 10 * 60 * 1000,
}) {
  const { user } = useContext(AuthContext) || {};
  const role = useMemo(
    () => getRoleForUser(project, user?._id || user?.id),
    [project, user]
  );
  const isOwner = role === "owner";

  const [quickTask, setQuickTask] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [iconOverride, setIconOverride] = useState(project?.icon ?? null);

  const initialEnabled = !!(project?.publicEnabled || project?.publicToken);
  const [publicEnabled, setPublicEnabled] = useState(initialEnabled);
  const [publicToken, setPublicToken] = useState(project?.publicToken || null);
  const [busyToggle, setBusyToggle] = useState(false);
  const [busyRegen, setBusyRegen] = useState(false);
  const [copied, setCopied] = useState(false);

  const icon = iconOverride ?? project?.icon ?? null;

  // ✅ Mark project as seen on view/focus
  useEffect(() => {
    if (!project?._id) return;

    // Immediately if visible
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      try { setLastSeen(project._id, Date.now()); track("project_seen", { projectId: project._id, source: "header_mount" }); } catch {}
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        try { setLastSeen(project._id, Date.now()); track("project_seen", { projectId: project._id, source: "visibilitychange" }); } catch {}
      }
    };
    const onFocus = () => {
      try { setLastSeen(project._id, Date.now()); track("project_seen", { projectId: project._id, source: "focus" }); } catch {}
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [project?._id]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const t = quickTask.trim();
    if (!t) return;
    await onAddTask?.(t);
    setQuickTask("");
  };

  // Persist icon; toast + telemetry
  async function handleIconSelect(sel) {
    try {
      const updated = await patchProjectIcon(project._id, sel); // sel or null (clear)
      const nextIcon = updated?.icon ?? updated?.patch?.icon ?? sel ?? null;
      setIconOverride(nextIcon);

      if (sel) {
        toast({ title: "Icon updated", variant: "success" });
        try { track("icon_saved", { projectId: project._id }); } catch {}
      } else {
        toast({ title: "Icon removed" });
        try { track("icon_removed", { projectId: project._id }); } catch {}
      }
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to update icon.");
    } finally {
      setPickerOpen(false);
    }
  }

  async function handleTogglePublic(nextChecked) {
    if (!isOwner || !project?._id) return;
    if (!ENABLE_PUBLIC_STATUS) return;

    setBusyToggle(true);
    try {
      if (typeof onTogglePublic === "function") {
        setPublicEnabled(nextChecked);
        if (!nextChecked) setPublicToken(null);
        await onTogglePublic(nextChecked);
      } else {
        if (nextChecked) {
          const res = await enablePublic(project._id);
          setPublicEnabled(!!res?.publicEnabled);
          setPublicToken(res?.publicToken || res?.token || null);
          try { track("public_status_changed", { projectId: project._id, action: "enabled", source: "header" }); } catch {}
        } else {
          await disablePublic(project._id);
          setPublicEnabled(false);
          setPublicToken(null);
          try { track("public_status_changed", { projectId: project._id, action: "disabled", source: "header" }); } catch {}
        }
      }
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to update public status.");
      if (typeof onTogglePublic === "function") setPublicEnabled((v) => !v);
    } finally {
      setBusyToggle(false);
    }
  }

  async function handleRegenerate() {
    if (!isOwner || !project?._id) return;
    if (!ENABLE_PUBLIC_STATUS) return;
    if (!publicEnabled) return;
    setBusyRegen(true);
    try {
      const res = await regeneratePublicToken(project._id);
      setPublicEnabled(!!res?.publicEnabled);
      setPublicToken(res?.publicToken || res?.token || null);
      try { track("public_status_changed", { projectId: project._id, action: "regenerated", source: "header" }); } catch {}
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to regenerate link.");
    } finally {
      setBusyRegen(false);
    }
  }

  const publicPath = publicToken ? buildPublicStatusUrl(publicToken) : "";
  const publicHref =
    typeof window !== "undefined" && publicPath
      ? `${window.location.origin}${publicPath}`
      : publicPath;

  // Calendar (.ics) export link
  const icsUrl = CALENDAR_ACCOUNTABILITY ? getIcsUrl(project?._id || project?.id) : null;

  const hasRecent = useRecentFlag(project?.lastActivityAt, recentWindowMs);
  const prefersReduced = useReducedMotion();
  const ringAnimated = hasRecent && !prefersReduced;

  async function copyPublicUrl() {
    if (!publicHref) return;
    try {
      await navigator.clipboard.writeText(publicHref);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  function markAsRead() {
    try {
      setLastSeen(project?._id, Date.now());
      track("project_mark_read", { projectId: project?._id });
    } catch {}
  }

  return (
    <section className="card shine accent-bar rounded-2xl border border-border bg-surface shadow-[var(--shadow-elev)]">
      <span className="accent-bar__left" aria-hidden="true" />
      <div className="px-4 sm:px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/projects" className="shrink-0" aria-label="Back to projects">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 grid place-content-center text-indigo-700 font-semibold">
              {project?.title?.[0]?.toUpperCase() || "P"}
            </div>
          </Link>

          <div className="min-w-0 flex items-center gap-3">
            {/* Icon + activity ring */}
            <div className="relative shrink-0">
              {ringAnimated && (
                <AnimatedRing size="48px" thickness="2px" className="absolute -inset-[6px]" animated />
              )}
              {!ringAnimated && hasRecent && (
                <span
                  className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                  aria-hidden
                />
              )}
              <div className="h-8 w-8 rounded-lg grid place-content-center icon-ring text-xl bg-white dark:bg-slate-800">
                {icon?.kind === "emoji" && (
                  <span role="img" aria-label="project icon">{icon.value}</span>
                )}
                {icon?.kind === "svg" && (
                  <span className="text-indigo-600">
                    <SVGIcon name={icon.value} className="w-5 h-5" />
                  </span>
                )}
                {!icon && (
                  <span className="text-indigo-600">
                    <SVGIcon name="target" className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg sm:text-xl font-bold">
                  <GradientText variant="purple">
                    {project?.title || "Untitled Project"}
                  </GradientText>
                </h1>

                <span className="hidden sm:inline-flex">
                  <StatusPill status={project?.status || "In Progress"} />
                </span>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Edit icon"
                  >
                    Edit icon
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${roleStyle(role)} `}
                  title={`Role: ${role}`}
                  aria-label={`Role: ${role}`}
                >
                  Role: {role[0].toUpperCase()}{role.slice(1)}
                </span>

                <button
                  type="button"
                  onClick={markAsRead}
                  className="px-2 py-0.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Mark this project as read"
                >
                  Mark as read
                </button>

                {isOwner && ENABLE_PUBLIC_STATUS && typeof onTogglePublic === "function" ? (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${publicEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                      {publicEnabled ? "Public" : "Private"}
                    </span>
                    <input
                      type="checkbox"
                      className="h-4 w-7 appearance-none rounded-full bg-slate-300 checked:bg-indigo-600 relative transition-colors outline-none cursor-pointer disabled:opacity-60"
                      checked={publicEnabled}
                      disabled={busyToggle}
                      onChange={(e) => handleTogglePublic(e.target.checked)}
                      aria-label="Toggle public status"
                    />
                  </label>
                ) : (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${publicEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {publicEnabled ? "Public" : "Private"}
                  </span>
                )}

                {ENABLE_PUBLIC_STATUS && publicEnabled && (
                  <div className="inline-flex items-center gap-1 text-xs">
                    <a
                      href={publicHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Open public link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Public link
                    </a>
                    <button
                      type="button"
                      onClick={copyPublicUrl}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Copy public link"
                    >
                      {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={busyRegen}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                      title="Regenerate public link"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      {busyRegen ? "…" : "Regenerate"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
            <input
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              placeholder="Quick add a task…"
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 transition-colors"
            >
              Add task
            </button>
          </form>

          {CALENDAR_ACCOUNTABILITY && icsUrl && (
            <a
              href={icsUrl}
              target="_blank"
              rel="noreferrer"
              download
              onClick={() => {
                try {
                  trackScheduleCreated?.({ projectId: project?._id || project?.id, method: "ics_export", source: "header"});
                } catch {}
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm inline-flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Download tasks as .ics"
            >
              <CalendarDays className="w-4 h-4"/>
              Download .ics
            </a>
          )}

          {/* Inline Members (replaces Invite/Settings buttons) */}
{Array.isArray(project?.members) && (
  <div className="sm:ml-2 flex items-center gap-3">
    {/* Avatar group */}
    <div className="flex -space-x-2">
      {project.members.slice(0, 5).map((m, i) => {
        const name = m?.name || m?.email || "Member";
        const role = (m?.role || "member").toLowerCase();
        return (
          <Avatar
            key={m._id || m.userId || m.email || i}
            label={name}
            title={`${name} · ${role}`}
          />
        );
      })}
      {project.members.length > 5 && (
        <div
          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-900 grid place-content-center text-[11px] text-slate-600 dark:text-slate-300"
          title={`${project.members.length - 5} more`}
        >
          +{project.members.length - 5}
        </div>
      )}
    </div>

    {/* Counts + pending */}
    <div className="text-xs text-slate-600 dark:text-slate-300">
      {project.members.length} member{project.members.length === 1 ? "" : "s"}
      {Array.isArray(project?.invites) && project.invites.filter(i => (i?.status || "pending") === "pending").length > 0 && (
        <span className="ml-2 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px]">
          {project.invites.filter(i => (i?.status || "pending") === "pending").length} pending
        </span>
      )}
    </div>
  </div>
)}

        
        </div>
      </div>

      <ProjectIconPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleIconSelect}
      />
    </section>
  );
}
