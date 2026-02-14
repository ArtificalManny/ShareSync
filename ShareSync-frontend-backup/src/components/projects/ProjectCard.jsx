// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE B: Living Cards - Project Card Component
// ⭐ FIX: Now handles both MongoDB _id and normalized id fields
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import { getProjectId } from '../../utils/projectHelpers';

/**
 * ProjectCard - A living card for projects
 */
const ProjectCard = ({ 
  project, 
  onClick,
  showProgress = true,
  className = '',
}) => {
  // ⭐ FIX: Safely extract ID handling both _id and id
  const projectId = getProjectId(project);
  
  const { 
    name, 
    client, 
    progress = 0, 
    dueDate, 
    status = 'active',
    emoji,
    lastActivity,
    completedAt,
    isBlocked = false,
    blockers = [],
    priority = 'normal',
  } = project || {};
  
  // Calculate living state from project data
  const livingState = useLivingCard({
    progress,
    priority,
    status,
    lastActivity,
    dueDate,
    completedAt,
    isBlocked,
    blockers,
  });

  const isComplete = progress >= 100 || status === 'completed';
  const isNearComplete = !isComplete && progress >= 80;
  
  // Progress bar color based on state
  const getProgressFillClass = () => {
    if (isComplete) return 'bg-success';
    if (livingState.state === 'completing') return 'bg-cyan-500';
    if (livingState.state === 'blocked') return 'bg-error/50';
    if (progress >= 67) return 'bg-brand-400';
    if (progress >= 34) return 'bg-brand';
    return 'bg-brand-700';
  };

  // Get status text
  const getStatusText = () => {
    if (livingState.state === 'blocked') return 'Blocked';
    if (livingState.state === 'stale') return 'Stale';
    if (livingState.state === 'overdue') return 'Overdue';
    if (isComplete) return 'Done';
    if (isNearComplete) return 'Almost there';
    return status || 'Active';
  };

  // Get status color
  const getStatusColor = () => {
    if (livingState.isBlocked) return 'text-error';
    if (livingState.state === 'stale') return 'text-text-tertiary';
    if (livingState.state === 'overdue') return 'text-error';
    if (isComplete) return 'text-success';
    if (isNearComplete) return 'text-cyan-500';
    return 'text-text-tertiary';
  };

  // ⭐ FIX: Safe click handler with validation
  const handleClick = () => {
    if (!projectId) {
      console.error('[ProjectCard] Cannot click - project has no valid ID:', project);
      return;
    }
    onClick?.(project);
  };
  
  return (
    <div 
      onClick={handleClick}
      className={`
        group living-card ${livingState.className}
        flex items-center gap-4 p-4 rounded-xl cursor-pointer
        transition-all duration-200
        ${!projectId ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      data-living-state={livingState.state}
      data-project-id={projectId || 'invalid'}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: Identity (What is this?)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Project Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          transition-all duration-200
          ${isComplete 
            ? 'bg-success/10' 
            : livingState.isBlocked
              ? 'bg-error/10'
              : livingState.isPriority
                ? 'bg-warning/10'
                : 'bg-surface-2 group-hover:bg-brand/10'
          }
        `}>
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : livingState.isBlocked ? (
            <XCircle className="w-4 h-4 text-error" />
          ) : livingState.state === 'stale' ? (
            <Clock className="w-4 h-4 text-text-tertiary" />
          ) : emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <Folder className="w-4 h-4 text-text-tertiary group-hover:text-brand transition-colors" />
          )}
        </div>

        {/* Title + Meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {livingState.isPriority && (
              <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
            )}
            <h4 className={`
              text-sm font-medium truncate transition-colors task-title
              ${isComplete 
                ? 'text-text-tertiary line-through' 
                : 'text-text-primary group-hover:text-brand'
              }
            `}>
              {name || 'Untitled Project'}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-tertiary">
            {client && (
              <>
                <span className="truncate max-w-[120px]">{client}</span>
                {dueDate && <span className="opacity-50">·</span>}
              </>
            )}
            {dueDate && (
              <span className={`
                flex items-center gap-1 shrink-0
                ${livingState.state === 'overdue' ? 'text-error' : ''}
              `}>
                <Calendar className="w-3 h-3" />
                {dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: Status (Progress bar)
      ═══════════════════════════════════════════════════════════════════ */}
      {showProgress && (
        <div className="hidden sm:flex items-center gap-3 w-36 shrink-0">
          <div className="flex-1">
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden card-progress relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 card-progress-fill ${getProgressFillClass()}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          <span className={`
            text-xs font-medium w-8 text-right
            ${isComplete ? 'text-success' : isNearComplete ? 'text-cyan-500' : 'text-text-secondary'}
          `}>
            {progress}%
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: Action
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Stale nudge action */}
        {livingState.state === 'stale' && (
          <span className="nudge-action text-[10px] font-medium text-text-tertiary bg-surface-2 px-2 py-1 rounded">
            Nudge
          </span>
        )}

        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>

        <ChevronRight className="
          w-4 h-4 text-text-tertiary
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        " />
      </div>
    </div>
  );
};

export default ProjectCard;

/**
 * ProjectCardSkeleton - Loading placeholder
 */
export function ProjectCardSkeleton() {
  return (
    <div className="
      flex items-center gap-4 p-4 rounded-xl
      bg-surface-1 border border-white/[0.06]
      animate-pulse
    ">
      <div className="w-10 h-10 rounded-xl bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-surface-2" />
        <div className="h-3 w-1/2 rounded bg-surface-2" />
      </div>
      <div className="w-24 h-1.5 rounded-full bg-surface-2" />
    </div>
  );
}

/**
 * ProjectCardEmpty - Empty state
 */
export function ProjectCardEmpty({ 
  message = "No projects yet",
  action,
  actionLabel = "Create project",
}) {
  return (
    <div className="
      living-card living-card--idle
      flex flex-col items-center justify-center 
      p-8 text-center rounded-xl
    ">
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
        <Folder className="w-6 h-6 text-text-tertiary" />
      </div>
      <p className="text-sm text-text-secondary mb-4">{message}</p>
      {action && (
        <button 
          onClick={action}
          className="text-sm font-medium text-brand hover:text-brand-400 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
