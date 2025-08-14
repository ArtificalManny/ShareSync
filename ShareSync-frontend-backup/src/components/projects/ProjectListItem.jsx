// src/components/projects/ProjectListItem.jsx
import React, { useMemo } from 'react';

function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const ts = d?.getTime?.();
  const diff = Math.max(0, Date.now() - (Number.isFinite(ts) ? ts : Date.now()));
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dys = Math.floor(h / 24);
  if (dys < 30) return `${dys}d ago`;
  const mo = Math.floor(dys / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

const STATUS_STYLES = {
  'Not Started': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  'In Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function ProjectListItem({ project, onClick }) {
  const updatedAt = useMemo(() => {
    return new Date(
      project?.updatedAt ||
      project?.lastActivityAt ||
      project?.createdAt ||
      Date.now()
    );
  }, [project?.updatedAt, project?.lastActivityAt, project?.createdAt]);

  const title = project?.title || 'Untitled Project';
  const status = project?.status || 'Not Started';
  const statusClass = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];

  const members = Array.isArray(project?.members) ? project.members : [];
  const visible = members.slice(0, 5);
  const overflow = Math.max(0, members.length - visible.length);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open project ${title}`}
      className="w-full text-left rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:ring-1 hover:ring-slate-200 dark:hover:ring-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: title, category, desc, avatars */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>

            {project?.category ? (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {project.category}
              </span>
            ) : null}

            {project?.hasPendingInvite && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40">
                Invited
              </span>
            )}
          </div>

          {project?.description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {project.description}
            </p>
          ) : null}

          {visible.length > 0 && (
            <div className="mt-3 flex -space-x-2">
              {visible.map((m, i) => {
                const label = m?.username || m?.email || 'Member';
                const initials =
                  (label.replace(/@.*$/, '').match(/[A-Za-z]/g) || [])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || '??';

                // If you later add member photos, swap div->img and keep width/height+lazy
                return (
                  <div
                    key={`${label}-${i}`}
                    title={label}
                    aria-label={label}
                    className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100 flex items-center justify-center text-[11px] font-medium border border-white dark:border-slate-900 shadow-sm"
                  >
                    {initials}
                  </div>
                );
              })}
              {overflow > 0 && (
                <div
                  title={`${overflow} more`}
                  aria-label={`${overflow} more`}
                  className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[11px] border border-white dark:border-slate-900 flex items-center justify-center"
                >
                  +{overflow}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: status, timestamps, due date */}
        <div className="shrink-0 text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {status}
          </span>

          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Updated {timeAgo(updatedAt)}
          </div>

          {project?.dueDate && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
