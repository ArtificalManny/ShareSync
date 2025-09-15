import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import { patchProjectIcon } from "../../api/projects";
import ProjectIconPicker from "./ProjectIconPicker";
import AnimatedRing from "../ui/AnimatedRing";
import GradientText from "../ui/GradientText";
import StatusPill from "../projects/StatusPill.jsx"; // ✅ shared pill

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

// Small SVG renderer for preset keys
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

export default function ProjectHeader({ project, onAddTask, onTogglePublic }) {
  const { user } = useContext(AuthContext) || {};
  const role = useMemo(
    () => getRoleForUser(project, user?._id || user?.id),
    [project, user]
  );
  const isOwner = role === "owner";

  const [quickTask, setQuickTask] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Local override so header reflects immediately after change
  const [iconOverride, setIconOverride] = useState(project?.icon ?? null);

  const icon = iconOverride ?? project?.icon ?? null;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const t = quickTask.trim();
    if (!t) return;
    await onAddTask?.(t);
    setQuickTask("");
  };

  // Submit icon change to backend and optimistically reflect
  async function handleIconSelect(sel) {
    try {
      const updated = await patchProjectIcon(project._id, sel); // sel or null (clear)
      // BE returns { projectId, patch: { icon } }; fall back to sel to reflect immediately
      setIconOverride(updated?.icon ?? updated?.patch?.icon ?? sel ?? null);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.response?.data?.message || e?.message || "Failed to update icon.");
    } finally {
      setPickerOpen(false);
    }
  }

  // Public toggle state (derived)
  const publicEnabled = !!project?.publicToken;

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
            {/* 🔷 Project Icon with animated ring (auto-respects reduced motion) */}
            <AnimatedRing size="48px" thickness="2px" className="shrink-0" animated>
              <div className="h-8 w-8 rounded-lg grid place-content-center icon-ring text-xl">
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
            </AnimatedRing>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg sm:text-xl font-bold">
                  <GradientText variant="purple">
                    {project?.title || "Untitled Project"}
                  </GradientText>
                </h1>

                {/* Status pill for quick read */}
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
                {/* Role pill */}
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${roleStyle(role)} `}
                  title={`Role: ${role}`}
                  aria-label={`Role: ${role}`}
                >
                  Role: {role[0].toUpperCase()}{role.slice(1)}
                </span>

                {/* Public/Private toggle (owners only). Viewers see a static badge */}
                {isOwner ? (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${publicEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                      {publicEnabled ? "Public" : "Private"}
                    </span>
                    <input
                      type="checkbox"
                      className="h-4 w-7 appearance-none rounded-full bg-slate-300 checked:bg-indigo-600 relative transition-colors outline-none cursor-pointer"
                      checked={publicEnabled}
                      onChange={(e) => onTogglePublic?.(e.target.checked)}
                      aria-label="Toggle public status"
                    />
                  </label>
                ) : (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${publicEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {publicEnabled ? "Public" : "Private"}
                  </span>
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
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 transition-colors"
            >
              Add task
            </button>
          </form>

          {/* Quick actions — add .marching for pop */}
          <button
            type="button"
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm marching"
            disabled
            title="Coming soon"
          >
            Invite
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm marching"
            disabled
            title="Settings (coming soon)"
          >
            Settings
          </button>
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