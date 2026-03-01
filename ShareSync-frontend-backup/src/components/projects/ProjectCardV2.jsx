// src/components/projects/ProjectCardV2.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 2.3: Upgraded Project Card
// ═══════════════════════════════════════════════════════════════════════════════
//
// Replaces the basic folder-icon project cards with rich, informative cards.
//
// Features:
// - Color-coded emoji icon (user picks color on creation)
// - Momentum progress bar (gradient fill)
// - Member avatar stack with online indicators
// - "Last ship: Xh ago" timestamp (recency signal)
// - Task count + currently shipping count
// - Card-action tier with status color strip
//
// Props:
//   project    — Project object from API
//   onClick    — Click handler
//   className  — Additional classes
//
// NO BACKEND DEPENDENCIES. Uses data already present on project objects.
// Falls back gracefully for any missing fields.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Zap, Clock, CheckCircle2, Rocket, ChevronRight, Star } from 'lucide-react';
import MomentumBar from '../ui/MomentumBar';
import AvatarStack, { OnlineCount } from '../ui/AvatarStack';
import { getStatusColor } from '../../utils/statusColor';

/**
 * Format a relative time string from a date
 */
function timeAgo(date) {
  if (!date) return null;
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;

  if (isNaN(diffMs) || diffMs < 0) return null;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * Default project color when none is set
 */
const DEFAULT_COLOR = '#8B5CF6';

export default function ProjectCardV2({
  project,
  onClick,
  className = '',
}) {
  if (!project) return null;

  // ─── Extract data with safe fallbacks ───
  const projectId = project.id || project._id;
  const name = project.name || project.title || 'Untitled Project';
  const emoji = project.icon || project.emoji || '📁';
  const color = project.color || DEFAULT_COLOR;
  const description = project.description || '';

  // Task counts
  const totalTasks = project.taskCount ?? project.totalTasks ?? project.tasks?.length ?? 0;
  const completedTasks = project.completedTasks ?? project.doneCount ?? 0;
  const shippingNow = project.shippingNow ?? project.activeCount ?? 0;

  // Momentum (0-100)
  const momentum = project.momentum ?? project.velocity ?? project.health ?? 0;

  // Members
  const members = useMemo(() => {
    if (Array.isArray(project.members)) return project.members;
    if (Array.isArray(project.team)) return project.team;
    return [];
  }, [project.members, project.team]);

  // Last ship timestamp
  const lastShipText = useMemo(() => {
    const lastShip = project.lastShipAt || project.lastShippedAt || project.updatedAt;
    return timeAgo(lastShip);
  }, [project.lastShipAt, project.lastShippedAt, project.updatedAt]);

  // Is this project "starred" or featured?
  const isStarred = project.isStarred || project.starred || (completedTasks >= 10);

  // Status class for left-edge color strip
  const statusClass = getStatusColor(project);

  // Momentum state label
  const momentumLabel = useMemo(() => {
    if (momentum >= 80) return 'On Fire';
    if (momentum >= 60) return 'Flowing';
    if (momentum >= 30) return 'Building';
    if (momentum > 0) return 'Warming Up';
    return '';
  }, [momentum]);

  return (
    <div
      onClick={() => onClick?.(project)}
      className={`
        group relative card-action ${statusClass}
        p-5 rounded-xl cursor-pointer
        bg-white dark:bg-[#1f1f23]
        border border-slate-200 dark:border-white/[0.06]
        hover:border-violet-200 dark:hover:border-violet-500/30
        shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)]
        transition-all duration-200
        hover:-translate-y-0.5
        ${className}
      `}
    >
      {/* ── Row 1: Icon + Name + Momentum Badge ── */}
      <div className="flex items-start gap-4 mb-4">
        {/* Project emoji icon with color background */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {emoji}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {name}
            </h3>

            {isStarred && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>

          {/* Task count + shipping indicator */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedTasks}/{totalTasks} tasks
            </span>

            {shippingNow > 0 && (
              <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium">
                <Rocket className="w-3 h-3" />
                {shippingNow} shipping
              </span>
            )}
          </div>
        </div>

        {/* Momentum percentage badge */}
        {momentum > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex-shrink-0">
            <Zap className="w-3 h-3 text-violet-500 dark:text-violet-400" />
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tabular-nums">
              {momentum}%
            </span>
          </div>
        )}
      </div>

      {/* ── Row 2: Momentum Bar ── */}
      <div className="mb-4">
        <MomentumBar value={momentum} size="sm" />
        {momentumLabel && (
          <div className="mt-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
            {momentumLabel}
          </div>
        )}
      </div>

      {/* ── Row 3: Members + Last Ship ── */}
      <div className="flex items-center justify-between">
        {/* Left: Avatar stack */}
        <div className="flex items-center gap-2">
          {members.length > 0 ? (
            <>
              <AvatarStack members={members} max={3} size="sm" showOnline={true} />
              <OnlineCount members={members} />
            </>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
              Solo project
            </span>
          )}
        </div>

        {/* Right: Last ship time */}
        <div className="flex items-center gap-2">
          {lastShipText && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
              <Clock className="w-3 h-3" />
              Last ship: {lastShipText}
            </span>
          )}

          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact variant for sidebars and lists
 */
export function ProjectCardV2Compact({
  project,
  onClick,
  className = '',
}) {
  if (!project) return null;

  const name = project.name || project.title || 'Untitled';
  const emoji = project.icon || project.emoji || '📁';
  const color = project.color || DEFAULT_COLOR;
  const momentum = project.momentum ?? project.velocity ?? 0;
  const totalTasks = project.taskCount ?? project.totalTasks ?? 0;
  const statusClass = getStatusColor(project);

  return (
    <div
      onClick={() => onClick?.(project)}
      className={`
        group flex items-center gap-3 p-3 rounded-lg cursor-pointer
        card-action ${statusClass}
        bg-white dark:bg-[#1f1f23]
        border border-slate-200 dark:border-white/[0.06]
        hover:border-violet-200 dark:hover:border-violet-500/30
        transition-all duration-200
        ${className}
      `}
    >
      {/* Mini emoji icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        {emoji}
      </div>

      {/* Name + tasks */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-700 dark:text-zinc-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {name}
        </h4>
        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
          {totalTasks} tasks · {momentum}% momentum
        </div>
      </div>

      {/* Mini momentum bar */}
      <div className="w-16 flex-shrink-0">
        <MomentumBar value={momentum} size="sm" />
      </div>
    </div>
  );
}
