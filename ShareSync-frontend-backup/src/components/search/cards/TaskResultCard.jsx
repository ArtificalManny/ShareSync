import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Calendar, User } from "lucide-react";

function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return null; }
}

export default function TaskResultCard({ task = {} }) {
  const id = task._id || task.id;
  const title = task.title || "Untitled task";
  const status = (task.status || task.state || "").toString();
  const pid = task.projectId || task.project_id || task.project?._id || task.project?.id;
  const projectTitle = task.projectTitle || task.project?.title;
  const due = task.dueDate || task.due_at;
  const assignee = task.assignee?.name || task.assigneeName || task.assigneeUsername;

  const href = pid ? `/projects/${pid}?task=${id}` : "/projects";

  return (
    <Link
      to={href}
      className="block rounded-xl border border-border bg-surface p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      role="listitem"
      aria-label={`Task: ${title}`}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="mt-1 text-[11px] text-muted inline-flex flex-wrap items-center gap-3">
            {status && <span>Status: {status}</span>}
            {assignee && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {assignee}
              </span>
            )}
            {due && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {formatDate(due)}
              </span>
            )}
            {projectTitle && <span>Project · {projectTitle}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
