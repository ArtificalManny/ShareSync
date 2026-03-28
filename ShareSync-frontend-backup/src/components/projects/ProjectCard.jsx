// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECT CARD v4.1 - "The Gallery Walk" Light Theme
// - Unified Component: Merges Living State logic with Team Balance indicators.
// - High-Contrast Typography & Tactile Hover States.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2, AlertTriangle, Clock, XCircle, Users, Rocket } from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import { getProjectId } from '../../utils/projectHelpers';
import { labelledTimestamp } from '../../utils/formatters';
import AvatarGroup from '../ui/AvatarGroup';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Team Balance Styles (From Discovery logic)
function getBalanceStyle(status) {
  switch(status) {
    case 'heavy':
      return { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', text: 'text-orange-600 dark:text-orange-400', icon: AlertTriangle };
    case 'moderate':
      return { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle };
    case 'balanced':
      return { bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', text: 'text-teal-700 dark:text-teal-400', icon: CheckCircle2 };
    default:
      return null;
  }
}

export default function ProjectCard({ 
  project, 
  onClick,
  onShip,
  showProgress = true,
  className = '',
}) {
  const projectId = getProjectId(project);
  
  const { 
    name, title,
    client, 
    progress = 0, 
    dueDate, 
    status = 'active',
    emoji, icon, color,
    lastActivity, lastActivityAt, updatedAt, createdAt,
    completedAt, shippedAt,
    isBlocked = false,
    blockers = [],
    priority = 'normal',
    teamBalance,
    members = []
  } = project || {};

  const displayName = name || title || 'Untitled Project';
  const displayIcon = emoji || icon;
  const lastTs = lastActivity || lastActivityAt || updatedAt || createdAt;
  const isShipped = !!shippedAt;
  
  const livingState = useLivingCard({
    progress, priority, status, lastActivity: lastTs, dueDate, completedAt, isBlocked, blockers,
  });

  const isComplete = progress >= 100 || status === 'completed';
  const isNearComplete = !isComplete && progress >= 80;
  
  const getProgressGradient = () => {
    if (isComplete) return 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)';
    if (livingState.state === 'completing') return 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)';
    if (livingState.state === 'blocked') return 'linear-gradient(90deg, #FCA5A5 0%, #F87171 100%)';
    return 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)'; // Brand gradient
  };

  const getStatusColor = () => {
    if (livingState.isBlocked) return 'text-red-600';
    if (livingState.state === 'stale') return 'text-slate-400';
    if (livingState.state === 'overdue') return 'text-red-600';
    if (isComplete) return 'text-teal-600';
    if (isNearComplete) return 'text-cyan-600';
    return 'text-slate-500';
  };

  const getIconBackground = () => {
    if (isComplete) return 'bg-teal-50 dark:bg-teal-500/10';
    if (livingState.isBlocked) return 'bg-red-50 dark:bg-red-500/10';
    if (livingState.isPriority) return 'bg-amber-50 dark:bg-amber-500/10';
    return 'bg-slate-100 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:shadow-sm';
  };

  const getIconColor = () => {
    if (color) return color;
    if (isComplete) return 'text-teal-600';
    if (livingState.isBlocked) return 'text-red-500';
    if (livingState.state === 'stale') return 'text-slate-400';
    return 'text-slate-500 group-hover:text-violet-600 group-hover:scale-110';
  };

  const balanceStyle = teamBalance ? getBalanceStyle(teamBalance.status) : null;

  return (
    <div 
      onClick={() => projectId && onClick?.(project)}
      className={cn(
        'group relative flex flex-col p-5 rounded-2xl cursor-pointer overflow-hidden',
        'bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10',
        'hover:border-violet-300 dark:hover:border-violet-500/30',
        'transition-all duration-300',
        !projectId && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
      onMouseEnter={(e) => {
        if (projectId) e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.12)';
        if (projectId) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top Accent Line */}
      <div 
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
        style={color ? { background: color } : {}}
      />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300', getIconBackground())}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
            ) : livingState.isBlocked ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : livingState.state === 'stale' ? (
              <Clock className="w-5 h-5 text-slate-400" />
            ) : displayIcon ? (
              <span className="text-xl" style={{ color: getIconColor() }}>{displayIcon}</span>
            ) : (
              <Folder className={cn('w-5 h-5 transition-all duration-300', getIconColor())} style={color ? { color } : {}} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {livingState.isPriority && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              <h4 className={cn('text-[16px] font-black tracking-tight truncate transition-colors', isComplete ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white group-hover:text-violet-600')}>
                {displayName}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[12px] font-medium text-slate-500 dark:text-zinc-400">
              {client && <><span className="truncate max-w-[120px]">{client}</span><span>•</span></>}
              {dueDate && <span className={cn('flex items-center gap-1 shrink-0', livingState.state === 'overdue' && 'text-red-600')}><Calendar className="w-3.5 h-3.5" />{dueDate}</span>}
              {!dueDate && lastTs && <span className="flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" />{labelledTimestamp(lastTs, 'Updated')}</span>}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isShipped && onShip && (
          <button
            onClick={(e) => { e.stopPropagation(); onShip(project); }}
            className="opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg hover:scale-105"
          >
            <Rocket className="w-3 h-3" /> Ship
          </button>
        )}
      </div>

      {/* Team Balance Indicator */}
      {balanceStyle && teamBalance.message !== '✅ No recent activity' && (
        <div className="mb-4">
          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold border', balanceStyle.bg, balanceStyle.border)}>
            <balanceStyle.icon className={cn('w-3.5 h-3.5', balanceStyle.text)} />
            <span className={balanceStyle.text}>{teamBalance.message}</span>
          </div>
        </div>
      )}

      {/* Progress Footer */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <AvatarGroup members={members} />
        </div>
        
        {showProgress && (
          <div className="flex items-center gap-3 w-40 shrink-0">
            <div className="flex-1">
              <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progress, 100)}%`, background: getProgressGradient() }} />
              </div>
            </div>
            <span className={cn('text-[13px] font-black w-9 text-right tabular-nums', isComplete ? 'text-teal-600' : isNearComplete ? 'text-cyan-600' : 'text-slate-700 dark:text-zinc-300')}>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
