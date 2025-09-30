import React from "react";
import { Link } from "react-router-dom";
import { Folder, Clock, ShieldCheck } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  const m = s / 60; if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60; if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24; return `${Math.floor(d)}d ago`;
}

export default function ProjectResultCard({ project = {} }) {
  const id = project._id || project.id;
  const title = project.title || project.name || "Untitled project";
  const pct = typeof project.percentComplete === "number"
    ? project.percentComplete
    : typeof project.completionPct === "number"
      ? project.completionPct
      : null;
  const last = project.lastActivityAt || project.updatedAt || project.createdAt;
  const isPublic = !!(project.publicToken || project.publicEnabled || project.isPublic);

  return (
    <Link
      to={`/projects/${id}`}
      className="block rounded-xl border border-border bg-surface p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      role="listitem"
      aria-label={`Project: ${title}`}
    >
      <div className="flex items-center gap-2">
        <Folder className="w-4 h-4 text-indigo-600" />
        <div className="font-medium text-sm truncate">{title}</div>
        {isPublic && (
          <span className="ml-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-3 h-3" /> Public
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last activity: {timeAgo(last)}
        </span>
        {pct !== null && (
          <span className="inline-flex items-center gap-1">
            {Math.round(pct)}% complete
          </span>
        )}
      </div>

      {pct !== null && (
        <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-1.5 rounded-full bg-indigo-600"
            style={{ width: `${Math.max(0, Math.min(100, Math.round(pct)))}%` }}
            aria-hidden="true"
          />
        </div>
      )}
    </Link>
  );
}
