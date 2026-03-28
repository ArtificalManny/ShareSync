// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECT CARD v4.1 - "The Gallery Walk" Phase 2
// - Applied global `.card-surface` for consistent elevations.
// - Icon backgrounds use soft gradient washes for premium feel.
// - Standardized 8px grid gaps and typography weights.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import { getProjectId } from '../../utils/projectHelpers';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * ProjectCard - A living card for projects (Gebbia-Grade Polish)
 */
const ProjectCard = ({ 
  project, 
  onClick,
  showProgress = true,
  className = '',
}) => {
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
  
  const livingState = useLivingCard({
    progress, priority, status, lastActivity, dueDate, completedAt, isBlocked, blockers,
  });

  const isComplete = progress >= 100 || status === 'completed';
  const isNearComplete = !isComplete && progress >= 80;
  
  const getProgressGradient = () => {
    if (isComplete) return 'var(--progress-fill-complete)';
    if (livingState.state === 'completing') return 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)';
    if (livingState.state === 'blocked') return 'var(--color-error)';
    return 'var(--progress-gradient)';
  };

  const getStatusText = () => {
    if (livingState.state === 'blocked') return 'Blocked';
    if (livingState.state === 'stale') return 'Stale';
    if (livingState.state === 'overdue') return 'Overdue';
    if (isComplete) return 'Done';
    if (isNearComplete) return 'Almost there';
    return status || 'Active';
  };

  const getStatusColor = () => {
    if (livingState.isBlocked) return 'text-error';
    if (livingState.state === 'stale') return 'text-text-tertiary';
    if (livingState.state === 'overdue') return 'text-error';
    if (isComplete) return 'text-success';
    if (isNearComplete) return 'text-cyan-600';
    return 'text-text-secondary';
  };

  // Behavioral UI: Premium washes behind icons instead of flat grays
  const getIconBackground = () => {
    if (isComplete) return 'bg-gradient-to-br from-success-100 to-success-50 border border-success-200';
    if (livingState.isBlocked) return 'bg-gradient-to-br from-error-100 to-error-50 border border-error-200';
    if (livingState.isPriority) return 'bg-gradient-to-br from-warning-100 to-warning-50 border border-warning-200';
    return 'bg-gradient-to-br from-surface-tertiary to-surface-secondary border border-border-default group-hover:from-brand-50 group-hover:to-white group-hover:border-brand-200';
  };

  const getIconColor = () => {
    if (isComplete) return 'text-success';
    if (livingState.isBlocked) return 'text-error';
    if (livingState.state === 'stale') return 'text-text-tertiary';
    return 'text-text-tertiary group-hover:text-brand group-hover:scale-110';
  };

  const handleClick = () => {
    if (!projectId) return;
    onClick?.(project);
  };
  
  return (
    <div 
      onClick={handleClick}
      className={cn(
        'group card-surface flex items-center gap-4 p-4 cursor-pointer',
        !projectId && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm', getIconBackground())}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : livingState.isBlocked ? (
            <XCircle className="w-5 h-5 text-error" />
          ) : livingState.state === 'stale' ? (
            <Clock className="w-5 h-5 text-text-tertiary" />
          ) : emoji ? (
            <span className="text-xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          ) : (
            <Folder className={cn('w-5 h-5 transition-all duration-300', getIconColor())} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {livingState.isPriority && <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />}
            <h4 className={cn('text-[15px] font-bold truncate transition-colors tracking-tight', isComplete ? 'text-text-tertiary line-through' : 'text-text-primary group-hover:text-brand')}>
              {name || 'Untitled Project'}
            </h4>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[12px] font-medium text-text-secondary">
            {client && <><span className="truncate max-w-[140px]">{client}</span><span className="opacity-40 text-text-tertiary">•</span></>}
            {dueDate && (
              <span className={cn('flex items-center gap-1.5 shrink-0', livingState.state === 'overdue' && 'text-error font-bold')}>
                <Calendar className="w-3 h-3" />{dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="hidden sm:flex items-center gap-3 w-40 shrink-0">
          <div className="flex-1">
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)" 
                style={{ width: `${Math.min(progress, 100)}%`, background: getProgressGradient() }} 
              />
            </div>
          </div>
          <span className={cn('text-[13px] font-black w-9 text-right tabular-nums', isComplete ? 'text-success' : isNearComplete ? 'text-cyan-600' : 'text-text-secondary')}>
            {progress}%
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0 ml-2">
        {livingState.state === 'stale' && <span className="text-[10px] font-bold text-text-secondary bg-surface-tertiary px-2 py-1 rounded uppercase tracking-wider">Nudge</span>}
        <span className={cn('text-[12px] font-bold uppercase tracking-wider', getStatusColor())}>{getStatusText()}</span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-surface-secondary transition-colors duration-200">
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors duration-200" />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

export function ProjectCardSkeleton() {
  return (
    <div className="card-surface flex items-center gap-4 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-surface-tertiary" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-surface-tertiary" />
        <div className="h-3 w-1/2 rounded bg-surface-tertiary" />
      </div>
      <div className="w-32 h-2 rounded-full bg-surface-tertiary" />
    </div>
  );
}

export function ProjectCardEmpty({ message = "No projects yet", action, actionLabel = "Create project" }) {
  return (
    <div className="card-surface flex flex-col items-center justify-center p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-border-default flex items-center justify-center mb-4 shadow-sm">
        <Folder className="w-6 h-6 text-text-tertiary" />
      </div>
      <p className="text-[15px] font-medium text-text-secondary mb-5">{message}</p>
      {action && (
        <button onClick={action} className="text-[13px] font-bold text-brand hover:text-brand-600 bg-brand-subtle px-4 py-2 rounded-lg transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * ProjectCardCompact - Smaller variant for lists
 */
export function ProjectCardCompact({ project, onClick, className = '' }) {
  const projectId = getProjectId(project);
  const { name, progress = 0, status = 'active', emoji } = project || {};
  const isComplete = progress >= 100 || status === 'completed';

  return (
    <div
      onClick={() => projectId && onClick?.(project)}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl cursor-pointer',
        'bg-surface-primary border border-transparent',
        'hover:border-border-default hover:bg-surface-secondary hover:shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border-default group-hover:bg-white group-hover:border-brand-200 group-hover:shadow-sm transition-all duration-300 flex items-center justify-center shrink-0">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-success group-hover:scale-110 transition-transform" />
        ) : emoji ? (
           <span className="text-sm group-hover:scale-110 transition-transform">{emoji}</span>
        ) : (
          <Folder className="w-4 h-4 text-text-tertiary group-hover:text-brand group-hover:scale-110 transition-all duration-200" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[14px] font-bold truncate transition-colors duration-200 tracking-tight',
          isComplete ? 'text-text-tertiary line-through' : 'text-text-primary group-hover:text-brand'
        )}>
          {name || 'Untitled'}
        </p>
      </div>
      
      <span className={cn(
        'text-[12px] font-black tabular-nums',
        isComplete ? 'text-success' : 'text-text-secondary'
      )}>
        {progress}%
      </span>
    </div>
  );
}
