// /src/components/projects/ProjectListItem.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { Users, Clock } from "lucide-react";
import AvatarGroup from "../AvatarGroup.jsx";

// lazy import so first paint is fast; we call this on hover/focus
let _prefetchStats = null;
async function prefetchStats(projectId) {
  try {
    if (!_prefetchStats) {
      const mod = await import("../../api/stats");
      _prefetchStats = mod.getProjectStats;
    }
    _prefetchStats && _prefetchStats(projectId, { range: 30 });
  } catch {}
}

export default function ProjectListItem({ project, onClick }) {
  const id = project?._id || project?.id;
  const title = project?.title || project?.name || "Untitled";
  const lastActivityAt = project?.lastActivityAt || project?.updatedAt || project?.createdAt;
  const status = (project?.status || "Active").toString();

  // Use API members if present; otherwise make safe placeholders.
  const members = Array.isArray(project?.members) && project.members.length
    ? normalizeMembers(project.members)
    : fallbackMembers(project);

  const rel = useMemo(() => formatRelativeTime(lastActivityAt), [lastActivityAt]);
  const statusCls = useMemo(() => statusClass(status), [status]);

  // Debounced prefetch on hover/focus
  const hoverTimer = useRef(null);
  const handleEnter = () => {
    if (!id) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => prefetchStats(id), 120);
  };
  const handleLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };
  useEffect(() => handleLeave, []); // cleanup on unmount

  return (
    <button
      type="button"
      onClick={() => id && onClick?.(id)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      className="motion-quick w-full text-left rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`Open project ${title}`}
    >
      {/* Header: title + avatars */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <Users className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <AvatarGroup users={members} max={4} size={26} />
        </div>
      </div>

      {/* Subtext: status pill + last update */}
      <div className="mt-2 flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
          {status}
        </span>

        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {rel || "—"}
        </span>
      </div>

      {/* Optional description */}
      {project?.description ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
          {project.description}
        </p>
      ) : null}
    </button>
  );
}

/* ---------- helpers ---------- */

function normalizeMembers(list) {
  // Normalize various shapes → { id, name, avatarUrl }
  return list.map((u, i) => ({
    id: u?.id || u?._id || `m${i}`,
    name: u?.name || u?.displayName || u?.username || "Member",
    avatarUrl: u?.avatarUrl || u?.avatar || u?.profilePicture || "",
  }));
}

function fallbackMembers(project) {
  const ownerName = project?.owner?.name || project?.ownerName || "Owner";
  const owner = {
    id: project?.owner?.id || project?.ownerId || "owner",
    name: ownerName,
    avatarUrl: project?.owner?.avatarUrl || project?.ownerAvatarUrl || "",
  };
  const maybe = project?.collaborators || project?.users || [];
  const others = Array.isArray(maybe)
    ? maybe.slice(0, 2).map((u, i) => ({
        id: u?.id || `u${i}`,
        name: u?.name || u?.username || "Member",
        avatarUrl: u?.avatarUrl || u?.profilePicture || "",
      }))
    : [];
  return [owner, ...others].filter(Boolean);
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("blocked") || s.includes("risk")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (s.includes("done") || s.includes("complete")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (s.includes("paused")) {
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }
  // default active
  return "bg-blue-50 text-blue-700 border border-blue-200";
}

function formatRelativeTime(dateish) {
  if (!dateish) return "";
  const ts = typeof dateish === "string" ? Date.parse(dateish) : +new Date(dateish);
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 8) return `${day}d ago`;
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return "";
  }
}
