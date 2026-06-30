// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECT CARD v4.1 - World Class Tactile Update
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import { getProjectId } from '../../utils/projectHelpers';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * ProjectCard - A living card for projects (Premium Tactile Theme)
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
  
  const getProgressGradient = () => {
    if (isComplete) return 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)';
    if (livingState.state === 'completing') return 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)';
    if (livingState.state === 'blocked') return 'linear-gradient(90deg, #FCA5A5 0%, #F87171 100%)';
    return 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)';
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
    if (livingState.isBlocked) return 'text-red-600';
    if (livingState.state === 'stale') return 'text-slate-500';
    if (livingState.state === 'overdue') return 'text-red-600';
    if (isComplete) return 'text-teal-600';
    if (isNearComplete) return 'text-cyan-600';
    return 'text-slate-500';
  };

  const getIconBackground = () => {
    if (isComplete) return 'bg-teal-50 border-teal-100';
    if (livingState.isBlocked) return 'bg-red-50 border-red-100';
    if (livingState.isPriority) return 'bg-amber-50 border-amber-100';
    return 'bg-slate-50/80 border-slate-200/60 group-hover:bg-white group-hover:shadow-sm group-hover:border-violet-100';
  };

  const getIconColor = () => {
    if (isComplete) return 'text-teal-600';
    if (livingState.isBlocked) return 'text-red-500';
    if (livingState.state === 'stale') return 'text-slate-400';
    return 'text-slate-400 group-hover:text-violet-500';
  };

  const handleClick = () => {
    if (!projectId) return;
    onClick?.(project);
  };
  
  return (
    <div 
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-5 p-5 rounded-2xl cursor-pointer relative overflow-hidden',
        'bg-white border border-slate-200/80',
        'transition-all duration-300 ease-out',
        !projectId && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}
      onMouseEnter={(e) => {
        if (projectId) {
          e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(139, 92, 246, 0.08), 0 4px 12px -2px rgba(139, 92, 246, 0.04)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80 group-hover:w-1.5 transition-all duration-300" 
        style={{ background: project?.color || '#8B5CF6' }} 
      />

      <div className="flex items-center gap-4 min-w-0 flex-1 pl-1">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2', getIconBackground())}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
          ) : livingState.isBlocked ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : livingState.state === 'stale' ? (
            <Clock className="w-5 h-5 text-slate-400" />
          ) : emoji ? (
            <span className="text-xl">{emoji}</span>
          ) : (
            <Folder className={cn('w-5 h-5 transition-all duration-300', getIconColor())} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {livingState.isPriority && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            <h4 className={cn('text-base font-bold tracking-tight truncate transition-colors duration-200', isComplete ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-violet-600')}>
              {name || 'Untitled Project'}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500">
            {client && <><span className="truncate max-w-[120px]">{client}</span><span className="opacity-40">·</span></>}
            {dueDate && <span className={cn('flex items-center gap-1 shrink-0', livingState.state === 'overdue' && 'text-red-600 font-bold')}><Calendar className="w-3.5 h-3.5" />{dueDate}</span>}
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="hidden sm:flex items-center gap-3 w-40 shrink-0">
          <div className="flex-1">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(progress, 100)}%`, background: getProgressGradient() }} />
            </div>
          </div>
          <span className={cn('text-[11px] font-bold tracking-wider w-8 text-right', isComplete ? 'text-teal-600' : isNearComplete ? 'text-cyan-600' : 'text-slate-500')}>{progress}%</span>
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0">
        {livingState.state === 'stale' && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Nudge</span>}
        <span className={cn('text-xs font-bold tracking-wide uppercase', getStatusColor())}>{getStatusText()}</span>
        <ChevronRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};

export default ProjectCard;

export function ProjectCardSkeleton() {
  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl bg-white border border-slate-100 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-slate-100" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-1/3 rounded bg-slate-100" />
        <div className="h-3 w-1/4 rounded bg-slate-50" />
      </div>
      <div className="w-24 h-1 rounded-full bg-slate-100" />
    </div>
  );
}

export function ProjectCardEmpty({ message = "No projects yet", action, actionLabel = "Create project" }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-slate-50 border border-slate-200 border-dashed">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
        <Folder className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-500 mb-5">{message}</p>
      {action && <button onClick={action} className="text-sm font-bold tracking-wide text-violet-600 hover:text-violet-700 hover:underline transition-all">{actionLabel}</button>}
    </div>
  );
}

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
        'group flex items-center gap-3 p-3.5 rounded-xl cursor-pointer relative overflow-hidden',
        'bg-white border border-slate-200/80',
        'transition-all duration-300 ease-out',
        className
      )}
      onMouseEnter={(e) => {
        if (projectId) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-violet-100 group-hover:shadow-sm transition-all duration-300 flex items-center justify-center shrink-0">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
        ) : (
          <Folder className="w-4 h-4 text-slate-400 group-hover:text-violet-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-bold tracking-tight truncate transition-colors duration-200',
          isComplete ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-violet-600'
        )}>
          {name || 'Untitled'}
        </p>
      </div>
      
      <span className={cn(
        'text-[11px] font-bold tracking-wider',
        isComplete ? 'text-teal-600' : 'text-slate-500'
      )}>
        {progress}%
      </span>
    </div>
  );
}
