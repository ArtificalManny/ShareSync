// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECT CARD v4.0 - "The Gallery Walk" Phase 4 Signature
// FIXED: Momentum Variable hovers and Ship Cursor targeting.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2, AlertTriangle, Clock, XCircle, Rocket } from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import { getProjectId } from '../../utils/projectHelpers';
import ShippingCeremony from '../gamification/ShippingCeremony';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function ProjectCard({ 
  project, 
  onClick,
  showProgress = true,
  className = '',
  onShip // Accept the external ship handler
}) {
  const projectId = getProjectId(project);
  const [showCeremony, setShowCeremony] = useState(false);
  
  const { 
    name, client, progress = 0, dueDate, status = 'active', emoji,
    lastActivity, completedAt, isBlocked = false, blockers = [], priority = 'normal',
  } = project || {};
  
  const livingState = useLivingCard({ progress, priority, status, lastActivity, dueDate, completedAt, isBlocked, blockers });
  const isComplete = progress >= 100 || status === 'completed';
  const isNearComplete = !isComplete && progress >= 80;
  
  const getProgressGradient = () => {
    if (isComplete) return 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)';
    if (livingState.state === 'completing') return 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)';
    if (livingState.state === 'blocked') return 'linear-gradient(90deg, #FCA5A5 0%, #F87171 100%)';
    return 'var(--theme-gradient)'; // Uses dynamic momentum variables
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
    if (livingState.state === 'stale') return 'text-slate-400';
    if (livingState.state === 'overdue') return 'text-red-600';
    if (isComplete) return 'text-teal-600';
    if (isNearComplete) return 'text-[var(--theme-accent-primary)]';
    return 'text-slate-500';
  };

  const handleShipClick = (e) => {
    e.stopPropagation();
    setShowCeremony(true); // Trigger UI Celebration overlay
    if (onShip) onShip(project); // Pass to backend/parent
  };
  
  return (
    <>
      {/* 🚨 PHASE 4: Inject Fullscreen Ceremony Modal 🚨 */}
      <ShippingCeremony 
        isActive={showCeremony} 
        projectName={name || 'Untitled Project'} 
        onComplete={() => setShowCeremony(false)} 
      />

      <div 
        onClick={() => projectId && onClick?.(project)}
        className={cn(
          'group flex items-center gap-4 p-4 rounded-xl cursor-pointer',
          'bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10',
          'transition-all duration-300',
          !projectId && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)' }}
        onMouseEnter={(e) => {
          if (projectId) {
            e.currentTarget.style.borderColor = 'var(--theme-accent-primary)';
            e.currentTarget.style.boxShadow = '0 8px 32px var(--theme-accent-glow)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-[var(--theme-accent-glow)]">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
            ) : emoji ? (
              <span className="text-lg group-hover:scale-110 transition-transform">{emoji}</span>
            ) : (
              <Folder className="w-4 h-4 text-slate-400 group-hover:text-[var(--theme-accent-primary)] transition-colors" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {livingState.isPriority && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
              <h4 className={cn('text-sm font-bold truncate transition-colors duration-300', isComplete ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white group-hover:text-[var(--theme-accent-primary)]')}>
                {name || 'Untitled Project'}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 uppercase tracking-widest">
              {client && <><span className="truncate max-w-[120px]">{client}</span><span className="opacity-50">·</span></>}
              {dueDate && <span className={cn('flex items-center gap-1 shrink-0', livingState.state === 'overdue' && 'text-red-500')}><Calendar className="w-3 h-3" />{dueDate}</span>}
            </div>
          </div>
        </div>

        {showProgress && (
          <div className="hidden sm:flex items-center gap-3 w-36 shrink-0">
            <div className="flex-1">
              <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%`, background: getProgressGradient() }} />
              </div>
            </div>
            <span className={cn('text-[11px] font-black w-8 text-right', isComplete ? 'text-teal-500' : 'text-slate-500 group-hover:text-[var(--theme-accent-primary)] transition-colors')}>{progress}%</span>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <span className={cn('text-[11px] font-bold uppercase tracking-widest', getStatusColor())}>{getStatusText()}</span>
          
          {/* 🚨 PHASE 4: The Tactile Ship Button targeting CustomCursor 🚨 */}
          {!isComplete && (
            <button
              onClick={handleShipClick}
              data-cursor="ship"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--theme-accent-glow)] text-[var(--theme-accent-primary)] hover:bg-[var(--theme-accent-primary)] hover:text-white transition-all duration-300 shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 font-bold text-xs"
            >
              <Rocket className="w-3 h-3" /> Ship
            </button>
          )}
          
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    </>
  );
}

export function ProjectCardCompact({ project, onClick, className = '' }) {
  const projectId = getProjectId(project);
  const { name, progress = 0, status = 'active' } = project || {};
  const isComplete = progress >= 100 || status === 'completed';

  return (
    <div
      onClick={() => projectId && onClick?.(project)}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl cursor-pointer',
        'bg-white dark:bg-[#1f1f23] border border-slate-100 dark:border-white/5',
        'transition-all duration-300',
        className
      )}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--theme-accent-primary)';
        e.currentTarget.style.backgroundColor = 'var(--theme-accent-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 group-hover:bg-white transition-all duration-200 flex items-center justify-center shrink-0">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-teal-500 group-hover:scale-110 transition-transform" />
        ) : (
          <Folder className="w-4 h-4 text-slate-400 group-hover:text-[var(--theme-accent-primary)] group-hover:scale-110 transition-all duration-300" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-bold truncate transition-colors duration-300',
          isComplete ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white group-hover:text-[var(--theme-accent-primary)]'
        )}>
          {name || 'Untitled'}
        </p>
      </div>
      
      <span className={cn(
        'text-xs font-black',
        isComplete ? 'text-teal-500' : 'text-slate-500 group-hover:text-[var(--theme-accent-primary)] transition-colors'
      )}>
        {progress}%
      </span>
    </div>
  );
}
