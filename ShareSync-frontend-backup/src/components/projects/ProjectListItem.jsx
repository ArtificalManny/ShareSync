// src/components/projects/ProjectListItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.1 - Optical Alignment Audit
// Added strokeWidth={1.5} to icons and fixed visual weights across all 3 zones.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef } from "react";
import { Clock, Link2, ChevronRight, Folder } from "lucide-react";
import AvatarGroup from "../ui/AvatarGroup.jsx";
import useRecentFlag from "../../hooks/useRecentFlag";
import { formatRelativeTime } from "../../utils/formatters";

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

export default function ProjectListItem({ project, onClick, recentWindowMs = 10 * 60 * 1000 }) {
  const id = project?._id || project?.id;
  const title = project?.title || project?.name || "Untitled";
  const lastActivityAt = project?.lastActivityAt || project?.updatedAt || project?.createdAt;
  const status = (project?.status || "In Progress").toString();
  const publicEnabled = !!(project?.publicEnabled || project?.publicToken);
  const icon = project?.icon || null;
  const emoji = project?.emoji || null;

  const members = useMemo(() => {
    if (Array.isArray(project?.members) && project.members.length) {
      return normalizeMembers(project.members);
    }
    return fallbackMembers(project);
  }, [project]);

  const rel = useMemo(() => formatRelativeTime(lastActivityAt), [lastActivityAt]);
  const statusConfig = useMemo(() => getStatusConfig(status), [status]);
  const hasRecent = useRecentFlag(lastActivityAt, recentWindowMs);

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
      className={`
        group relative w-full text-left
        flex items-center gap-4 p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
        transition-all duration-200
        ${statusConfig.borderClass}
      `}
      aria-label={`Open project ${title}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            bg-surface-2 group-hover:bg-brand/10
            transition-colors duration-200
          `}>
            {emoji ? (
              <span className="text-xl">{emoji}</span>
            ) : icon?.kind === "emoji" ? (
              <span className="text-xl">{icon.value}</span>
            ) : (
              <Folder strokeWidth={1.5} className="w-5 h-5 shrink-0 text-text-tertiary group-hover:text-brand" />
            )}
          </div>
          
          {hasRecent && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface-1" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary leading-tight truncate group-hover:text-brand transition-colors">
              {title}
            </h3>
            {publicEnabled && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-3 text-text-tertiary shrink-0">
                <Link2 strokeWidth={1.5} className="w-3 h-3 shrink-0 relative -top-[0.5px]" />
                Public
              </span>
            )}
          </div>
          
          {project?.description && (
            <p className="text-xs text-text-tertiary mt-1 truncate leading-tight">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <span className={`
          flex items-center
          text-xs font-medium px-2 py-0.5 rounded
          ${statusConfig.pillClass}
        `}>
          {status}
        </span>
        
        <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <Clock strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0 relative -top-[0.5px]" />
          {rel || "—"}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <AvatarGroup
          users={members}
          max={3}
          size={24}
          highlightFirstRecent={hasRecent}
        />

        <ChevronRight strokeWidth={1.5} className="
          w-4 h-4 shrink-0 text-text-tertiary
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        " />
      </div>
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

function getStatusConfig(status) {
  const s = (status || "").toLowerCase();
  
  if (s.includes("complete") || s.includes("done")) {
    return {
      borderClass: "border-l-2 border-l-success",
      pillClass: "bg-success/10 text-success",
    };
  }
  if (s.includes("blocked") || s.includes("risk")) {
    return {
      borderClass: "border-l-2 border-l-danger",
      pillClass: "bg-danger/10 text-danger",
    };
  }
  if (s.includes("paused")) {
    return {
      borderClass: "border-l-2 border-l-text-tertiary",
      pillClass: "bg-surface-3 text-text-tertiary",
    };
  }
  return {
    borderClass: "",
    pillClass: "bg-brand/10 text-brand",
  };
}
