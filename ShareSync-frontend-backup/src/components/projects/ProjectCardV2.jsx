// src/components/projects/ProjectCardV2.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5.1: Information Architecture Rebalance - Project Card v2
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Clock, CheckCircle2, Flame, Users, AlertCircle, Star } from 'lucide-react';
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
 * Velocity Bar - Ocean Gradient
 */
const VelocityBar = ({ percentage }) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const isComplete = clampedPercentage >= 100;
  return (
    <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ 
          width: `${clampedPercentage}%`,
          background: isComplete 
            ? 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)'
            : 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)'
        }}
      />
    </div>
  );
};

const DEFAULT_COLOR = '#8B5CF6';

export default function ProjectCardV2({
  project,
  onProjectClick,
  onStartSprint,
  className = '',
}) {
  if (!project) return null;

  // ─── Extract data with safe fallbacks ───
  // Ensure we check both _id and id for MongoDB/Local consistency
  const projectId = project._id || project.id;
  const name = project.name || project.title || 'Untitled Project';
  const emoji = project.icon || project.emoji || '📁';
  const color = project.color || DEFAULT_COLOR;
  const description = project.description || '';

  // Task counts & Metrics
  const totalTasks = project.taskCount ?? project.totalTasks ?? project.tasks?.length ?? 0;
  const completedTasks = project.completedTasks ?? project.doneCount ?? 0;
  const openTasks = project.metrics?.openTasks?.value || (totalTasks - completedTasks);
  const velocity = project.metrics?.onTimePercent?.value || project.momentum || 0;
  const streak = project.streak?.value || project.streak || 0;
  const isImpressiveStreak = streak >= 7;
  const hasNextStep = Boolean(project.nextMicroStep);

  // Members
  const members = useMemo(() => {
    if (Array.isArray(project.members)) return project.members;
    if (Array.isArray(project.team)) return project.team;
    return [];
  }, [project.members, project.team]);

  // Last activity timestamp
  const lastShipText = useMemo(() => {
    const lastShip = project.lastShipAt || project.lastShippedAt || project.updatedAt;
    return timeAgo(lastShip);
  }, [project.lastShipAt, project.lastShippedAt, project.updatedAt]);

  const isStarred = project.isStarred || project.starred || (completedTasks >= 10);
  const statusClass = getStatusColor(project);

  const handleClick = () => {
    if (!projectId) {
       console.warn('[ProjectCardV2] No ID found for project:', name);
       return;
    }
    // Correctly call the click handler passed from Projects.jsx
    onProjectClick?.(projectId);
  };

  const handleStartSprint = (e) => {
    e.stopPropagation(); // Prevents navigation to ProjectHome
    onStartSprint?.(project);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative overflow-hidden card-action ${statusClass}
        p-5 rounded-xl cursor-pointer flex flex-col justify-between
        bg-white dark:bg-[#1f1f23]
        border border-slate-200 dark:border-white/[0.06]
        hover:border-violet-200 dark:hover:border-violet-500/30
        transition-all duration-200 hover:-translate-y-0.5
        ${project.isAtRisk ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500' : ''}
        ${className}
      `}
      style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />

      <div>
        <div className="flex justify-between items-start mb-4 mt-1">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            {emoji}
          </div>

          {streak > 0 && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
              ${isImpressiveStreak
                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }
            `}>
              <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}`} />
              <span>{streak}d</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {name}
          </h3>
          {isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
        </div>
        <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4 h-10">
          {description || 'No description provided.'}
        </p>

        {hasNextStep ? (
          <div className="bg-slate-50 dark:bg-[#111113] border border-slate-100 dark:border-white/5 rounded-lg p-3 mb-4">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Next step
            </div>
            <div className="text-sm text-slate-700 dark:text-zinc-300 truncate">
              {project.nextMicroStep}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#111113] rounded-lg p-3 mb-4 border border-dashed border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs">Add a next step</span>
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Velocity
            </span>
            <span className={`text-xs font-medium ${velocity >= 100 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-zinc-300'}`}>
              {velocity}%
            </span>
          </div>
          <VelocityBar percentage={velocity} />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">{members.length || 1}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs">{openTasks} tasks</span>
            </div>
          </div>
          {lastShipText && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
              <Clock className="w-3 h-3" />
              {lastShipText}
            </div>
          )}
        </div>

        <button
          onClick={handleStartSprint}
          className="w-full py-2 rounded-lg text-sm font-semibold text-white hover:shadow-lg transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
        >
          Start Sprint
        </button>
      </div>
    </div>
  );
}
