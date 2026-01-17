// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: Visual Cohesion - Unified with MissionCard Quality
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES FROM v2.0:
// - Progress bars now use purple intensity (not red/yellow/green)
// - Richer visual hierarchy matching MissionCard
// - Consistent padding, radius, hover states
// - Better emoji/icon treatment
//
// 3-ZONE PATTERN:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ Icon + Title + Meta   │ Progress bar + %            │ Status + Chevron      │
// └─────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder, CheckCircle2 } from 'lucide-react';

// Phase 7: Purple intensity progress, not traffic lights
const getProgressFillClass = (percentage) => {
  if (percentage >= 100) return 'bg-success';
  if (percentage >= 67) return 'bg-brand-400';
  if (percentage >= 34) return 'bg-brand';
  return 'bg-brand-700';
};

const ProjectCard = ({ project, onClick }) => {
  const { name, client, progress = 0, dueDate, status, emoji } = project;
  const isComplete = progress >= 100;
  
  return (
    <div 
      onClick={() => onClick?.(project)}
      className={`
        group flex items-center gap-4 p-4 rounded-xl cursor-pointer
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isComplete ? 'opacity-70' : ''}
      `}
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
            : 'bg-surface-2 group-hover:bg-brand/10'
          }
        `}>
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <Folder className="w-4 h-4 text-text-tertiary group-hover:text-brand transition-colors" />
          )}
        </div>

        {/* Title + Meta */}
        <div className="min-w-0 flex-1">
          <h4 className={`
            text-sm font-medium truncate transition-colors
            ${isComplete 
              ? 'text-text-tertiary line-through' 
              : 'text-text-primary group-hover:text-brand'
            }
          `}>
            {name}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-tertiary">
            {client && (
              <>
                <span className="truncate max-w-[120px]">{client}</span>
                {dueDate && <span className="opacity-50">·</span>}
              </>
            )}
            {dueDate && (
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                {dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: Status (Progress bar - PHASE 7 purple intensity)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex items-center gap-3 w-36 shrink-0">
        <div className="flex-1">
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressFillClass(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        <span className={`
          text-xs font-medium w-8 text-right
          ${isComplete ? 'text-success' : 'text-text-secondary'}
        `}>
          {progress}%
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: Action
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`
          text-xs font-medium
          ${isComplete ? 'text-success' : 'text-text-tertiary'}
        `}>
          {status || (isComplete ? 'Done' : 'Active')}
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
