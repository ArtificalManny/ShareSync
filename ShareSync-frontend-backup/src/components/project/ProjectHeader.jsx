// /src/components/project/ProjectHeader.jsx
import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../AuthContext";

function getRoleForUser(project, userId) {
  if (!project || !userId) return "viewer";
  // legacy owner field
  if (String(project.userId || "") === String(userId)) return "owner";
  // members array with typed roles
  const hit =
    Array.isArray(project.members) &&
    project.members.find(
      (m) => (m?.userId && String(m.userId) === String(userId)) || false
    );
  return (hit?.role === "owner" || hit?.role === "member" || hit?.role === "viewer")
    ? hit.role
    : "viewer";
}

const roleStyle = (role) => {
  switch (role) {
    case "owner":
      return "bg-indigo-100 text-indigo-700";
    case "member":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function ProjectHeader({ project, onAddTask }) {
  const { user } = useContext(AuthContext) || {};
  const [quickTask, setQuickTask] = useState("");

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const t = quickTask.trim();
    if (!t) return;
    await onAddTask?.(t);
    setQuickTask("");
  };

  const privacyColor =
    project?.privacy === "Public"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-700";

  const role = useMemo(
    () => getRoleForUser(project, user?._id || user?.id),
    [project, user]
  );

  const roleLabel = `Role: ${role[0].toUpperCase()}${role.slice(1)}`;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shadow-[0_8px_24px_rgba(16,24,40,0.08)]">
      <div className="px-4 sm:px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/projects" className="shrink-0" aria-label="Back to projects">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 grid place-content-center text-indigo-700 font-semibold">
              {project?.title?.[0]?.toUpperCase() || "P"}
            </div>
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-lg sm:text-xl font-bold text-ink-900 dark:text-white">
              {project?.title || "Untitled Project"}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Privacy pill */}
              <span className={`px-2 py-0.5 text-xs rounded-full ${privacyColor}`}>
                {project?.privacy || "Private"}
              </span>

              {/* Role pill */}
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${roleStyle(role)}`}
                title={roleLabel}
                aria-label={roleLabel}
              >
                {roleLabel}
              </span>

              {/* Status (read-only for now) */}
              <select
                className="text-xs rounded-md border border-slate-200 px-2 py-1 bg-white dark:bg-slate-800 dark:border-slate-700"
                defaultValue={project?.status || "Not Started"}
                disabled
                title="Status (read-only demo)"
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
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

          <button
            type="button"
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm"
            disabled
            title="Coming soon"
          >
            Invite
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm"
            disabled
            title="Settings (coming soon)"
          >
            Settings
          </button>
        </div>
      </div>
    </section>
  );
}