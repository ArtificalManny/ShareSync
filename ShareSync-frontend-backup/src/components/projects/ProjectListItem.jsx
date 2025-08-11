// src/components/projects/ProjectListItem.jsx
import React, { useMemo } from 'react';

function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - (d?.getTime?.() || Date.now()));
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
  'Not Started': 'bg-slate-200 text-slate-700',
  'In Progress': 'bg-indigo-100 text-indigo-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
};

export default function ProjectListItem({ project, onClick }) {
  const updatedAt = useMemo(
    () => new Date(project.updatedAt || project.lastActivityAt || project.createdAt || Date.now()),
    [project.updatedAt, project.lastActivityAt, project.createdAt]
  );

  const status = project.status || 'Not Started';
  const statusClass = STATUS_STYLES[status] || 'bg-slate-200 text-slate-700';

  const members = Array.isArray(project.members) ? project.members : [];
  const visible = members.slice(0, 5);
  const overflow = Math.max(0, members.length - visible.length);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open project ${project.title}`}
      className="w-full text-left rounded-2xl p-4 bg-[var(--card-bg)] dark:bg-[var(--card-bg-dark)] border border-[var(--card-border)] dark:border-[var(--card-border-dark)] hover:shadow-md hover:ring-1 hover:ring-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: title, category, desc, avatars */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-ink-900 dark:text-white">
              {project.title}
            </h3>
            {project.category ? (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                {project.category}
              </span>
            ) : null}
            {project.hasPendingInvite && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-700 border border-amber-200">
                Invited
              </span>
            )}
          </div>

          {project.description ? (
            <p className="mt-1 text-sm text-[var(--body-text)] dark:text-[var(--body-text-dark)] line-clamp-2">
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
                return (
                  <div
                    key={`${label}-${i}`}
                    title={label}
                    className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-medium border border-white shadow-sm"
                  >
                    {initials}
                  </div>
                );
              })}
              {overflow > 0 && (
                <div
                  title={`${overflow} more`}
                  className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 text-[11px] border border-white flex items-center justify-center"
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

          <div className="text-xs text-[var(--muted-text)] dark:text-[var(--muted-text-dark)] mt-2">
            Updated {timeAgo(updatedAt)}
          </div>

          {project.dueDate && (
            <div className="text-xs text-[var(--muted-text)] dark:text-[var(--muted-text-dark)]">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}