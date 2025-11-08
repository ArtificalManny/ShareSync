// src/components/projects/ProjectListItem.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { Users, Clock, Link2 } from "lucide-react";
import AvatarGroup from "../ui/AvatarGroup.jsx";
import StatusPill from "./StatusPill.jsx";
import AnimatedRing from "../ui/AnimatedRing";
import useRecentFlag from "../../hooks/useRecentFlag";
import useReducedMotion from "../../hooks/useReducedMotion";
import { formatRelativeTime } from "../../utils/formatters";
import Button from "../ui/Button.jsx";

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

function SVGIcon({ name, className = "w-5 h-5" }) {
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
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    default:
      return <div className={className} />;
  }
}

export default function ProjectListItem({ project, onClick, recentWindowMs = 10 * 60 * 1000 }) {
  const id = project?._id || project?.id;
  const title = project?.title || project?.name || "Untitled";
  const lastActivityAt = project?.lastActivityAt || project?.updatedAt || project?.createdAt;
  const status = (project?.status || "In Progress").toString();
  const publicEnabled = !!(project?.publicEnabled || project?.publicToken);

  const icon = project?.icon || null;

  const members = Array.isArray(project?.members) && project.members.length
    ? normalizeMembers(project.members)
    : fallbackMembers(project);

  const rel = useMemo(() => formatRelativeTime(lastActivityAt), [lastActivityAt]);
  const { barCls } = useMemo(() => accentForStatus(status), [status]);

  const hasRecent = useRecentFlag(lastActivityAt, recentWindowMs);
  const prefersReduced = useReducedMotion();

  const hoverTimer = useRef(null);
  const handleEnter = () => {
    if (!id) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => prefetchStats(id), 120);
  };
  const handleLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };
  useEffect(() => handleLeave, []);

  return (
    <button
      type="button"
      onClick={() => id && onClick?.(id)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      className="group relative w-full text-left rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 overflow-hidden marching"
      aria-label={`Open project ${title}`}
    >
      <span className={`absolute left-0 top-0 h-full w-1.5 rounded-l-2xl ${barCls} transition-[width] duration-200 group-hover:w-2`} />
      <span className="shine pointer-events-none" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <span className="relative shrink-0 h-7 w-7 rounded-lg grid place-content-center bg-slate-50 dark:bg-slate-800 text-xl">
            {hasRecent && !prefersReduced && (
              <AnimatedRing
                size="36px"
                thickness="2px"
                animated
                className="absolute -inset-[5px] pointer-events-none rounded-xl"
              />
            )}
            {hasRecent && prefersReduced && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                aria-hidden
              />
            )}

            {icon?.kind === "emoji" && (
              <span role="img" aria-label="project icon" className="leading-none">
                {icon.value}
              </span>
            )}
            {icon?.kind === "svg" && (
              <span className="text-indigo-600">
                <SVGIcon name={icon.value} className="w-4.5 h-4.5" />
              </span>
            )}
            {!icon && (
              <span className="text-indigo-600">
                <SVGIcon name="target" className="w-4.5 h-4.5" />
              </span>
            )}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              {publicEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Public link enabled"
                  className="h-6 px-2 py-0 inline-flex items-center gap-1 text-[11px]"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Public
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Users className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <div className="transition-transform duration-200 group-hover:scale-[1.04]">
            <AvatarGroup
              users={members}
              max={4}
              size={26}
              highlightFirstRecent={hasRecent}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <StatusPill status={status} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {rel || "—"}
        </span>
      </div>

      {project?.description ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
          {project.description}
        </p>
      ) : null}
    </button>
  );
}

function normalizeMembers(list) {
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

function accentForStatus(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("complete") || s.includes("done")) {
    return { barCls: "bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500" };
  }
  if (s.includes("blocked") || s.includes("risk")) {
    return { barCls: "bg-gradient-to-b from-amber-500 via-orange-500 to-rose-500" };
  }
  if (s.includes("paused")) {
    return { barCls: "bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600" };
  }
  return { barCls: "bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500" };
}