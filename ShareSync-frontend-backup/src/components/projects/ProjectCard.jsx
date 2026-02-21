// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECT CARD v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Working Studio"
//
// COLOR MAP:
// - Card Background: #FFFFFF
// - Card Border: #E2E8F0 (slate-200)
// - Card Hover Border: violet-200
// - Card Shadow: violet-tinted (rgba(139, 92, 246, 0.06))
// - Card Hover Shadow: violet-tinted (rgba(139, 92, 246, 0.12))
// - Icon Background: #EEF2FF (indigo-50)
// - Progress Bar: Ocean Gradient
// - Text Primary: #1E293B (slate-800)
// - Text Secondary: #64748B (slate-500)
// - Text Muted: #94A3B8 (slate-400)
//
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import { getProjectId } from '../../utils/projectHelpers';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * ProjectCard - A living card for projects (Light theme)
 */
const ProjectCard = ({ 
  project, 
  onClick,
  showProgress = true,
  className = '',
}) => {
  // Safely extract ID handling both _id and id
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
  
  // Progress bar gradient based on state
  const getProgressGradient = () => {
    if (isComplete) return 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)';
    if (livingState.state === 'completing') return 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)';
    if (livingState.state === 'blocked') return 'linear-gradient(90deg, #FCA5A5 0%, #F87171 100%)';
    // Ocean gradient for normal progress
    return 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)';
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

  // Get status color - Light theme
  const getStatusColor = () => {
    if (livingState.isBlocked) return 'text-red-600';
    if (livingState.state === 'stale') return 'text-slate-400';
    if (livingState.state === 'overdue') return 'text-red-600';
    if (isComplete) return 'text-teal-600';
    if (isNearComplete) return 'text-cyan-600';
    return 'text-slate-500';
  };

  // Icon background color - Light theme
  const getIconBackground = () => {
    if (isComplete) return 'bg-teal-50';
    if (livingState.isBlocked) return 'bg-red-50';
    if (livingState.isPriority) return 'bg-amber-50';
    return 'bg-indigo-50 group-hover:bg-violet-100';
  };

  // Icon color - Light theme
  const getIconColor = () => {
    if (isComplete) return 'text-teal-600';
    if (livingState.isBlocked) return 'text-red-500';
    if (livingState.state === 'stale') return 'text-slate-400';
    return 'text-slate-500 group-hover:text-violet-600';
  };

  // Safe click handler with validation
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
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl cursor-pointer',
        'bg-white border border-slate-200',
        'hover:border-violet-200',
        'transition-all duration-200',
        !projectId && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)',
      }}
      onMouseEnter={(e) => {
        if (projectId) {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.04)';
      }}
      data-living-state={livingState.state}
      data-project-id={projectId || 'invalid'}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: Identity (What is this?)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Project Icon */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          'transition-all duration-200',
          getIconBackground()
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          ) : livingState.isBlocked ? (
            <XCircle className="w-4 h-4 text-red-500" />
          ) : livingState.state === 'stale' ? (
            <Clock className="w-4 h-4 text-slate-400" />
          ) : emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <Folder className={cn('w-4 h-4 transition-colors', getIconColor())} />
          )}
        </div>

        {/* Title + Meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {livingState.isPriority && (
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <h4 className={cn(
              'text-sm font-medium truncate transition-colors',
              isComplete 
                ? 'text-slate-400 line-through' 
                : 'text-slate-800 group-hover:text-violet-600'
            )}>
              {name || 'Untitled Project'}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
            {client && (
              <>
                <span className="truncate max-w-[120px]">{client}</span>
                {dueDate && <span className="opacity-50">·</span>}
              </>
            )}
            {dueDate && (
              <span className={cn(
                'flex items-center gap-1 shrink-0',
                livingState.state === 'overdue' && 'text-red-600'
              )}>
                <Calendar className="w-3 h-3" />
                {dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: Status (Progress bar - Ocean Gradient)
      ═══════════════════════════════════════════════════════════════════ */}
      {showProgress && (
        <div className="hidden sm:flex items-center gap-3 w-36 shrink-0">
          <div className="flex-1">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  background: getProgressGradient(),
                }}
              />
            </div>
          </div>
          <span className={cn(
            'text-xs font-medium w-8 text-right',
            isComplete ? 'text-teal-600' : isNearComplete ? 'text-cyan-600' : 'text-slate-600'
          )}>
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
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            Nudge
          </span>
        )}

        <span className={cn('text-xs font-medium', getStatusColor())}>
          {getStatusText()}
        </span>

        <ChevronRight className="
          w-4 h-4 text-slate-300
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        " />
      </div>
    </div>
  );
};

export default ProjectCard;

/**
 * ProjectCardSkeleton - Loading placeholder (Light theme)
 */
export function ProjectCardSkeleton() {
  return (
    <div className="
      flex items-center gap-4 p-4 rounded-xl
      bg-white border border-slate-200
      animate-pulse
    ">
      <div className="w-10 h-10 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
      <div className="w-24 h-1.5 rounded-full bg-slate-100" />
    </div>
  );
}

/**
 * ProjectCardEmpty - Empty state (Light theme)
 */
export function ProjectCardEmpty({ 
  message = "No projects yet",
  action,
  actionLabel = "Create project",
}) {
  return (
    <div className="
      flex flex-col items-center justify-center 
      p-8 text-center rounded-xl
      bg-white border border-slate-200
    ">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Folder className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      {action && (
        <button 
          onClick={action}
          className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * ProjectCardCompact - Smaller variant for lists (Light theme)
 */
export function ProjectCardCompact({
  project,
  onClick,
  className = '',
}) {
  const projectId = getProjectId(project);
  const { name, progress = 0, status = 'active' } = project || {};
  const isComplete = progress >= 100 || status === 'completed';

  return (
    <div
      onClick={() => projectId && onClick?.(project)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
        'bg-white border border-slate-200',
        'hover:border-violet-200 hover:bg-slate-50',
        'transition-all duration-200',
        className
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
        ) : (
          <Folder className="w-4 h-4 text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isComplete ? 'text-slate-400 line-through' : 'text-slate-800'
        )}>
          {name || 'Untitled'}
        </p>
      </div>
      <span className={cn(
        'text-xs font-medium',
        isComplete ? 'text-teal-600' : 'text-slate-500'
      )}>
        {progress}%
      </span>
    </div>
  );
}
