// src/components/projects/ProjectGridCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: Visual Cohesion - Grid Card (matches Projects.jsx ProjectCard)
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is the GRID version of project cards (vertical layout)
// Used in: Projects page grid view
//
// IMPROVEMENTS:
// - Richer visual hierarchy
// - Better emoji display (larger, more prominent)
// - Progress uses purple intensity
// - Consistent with MissionCard quality
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Flame, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

// Phase 7: Purple intensity progress
const getProgressFillClass = (percentage) => {
  if (percentage >= 100) return 'bg-success';
  if (percentage >= 67) return 'bg-brand-400';
  if (percentage >= 34) return 'bg-brand';
  return 'bg-brand-700';
};

const ProjectGridCard = ({ project, onProjectClick, onStartSprint }) => {
  const getSeasonEmoji = (season) => {
    switch(season) {
      case 'shipping': return '🚀';
      case 'exploring': return '🌱';
      case 'maintaining': return '🛠';
      default: return '📁';
    }
  };

  const velocity = project.metrics?.onTimePercent?.value || project.velocity || 0;
  const streak = project.streak?.value || 0;
  const isImpressiveStreak = streak >= 7;
  const hasNextStep = Boolean(project.nextMicroStep);
  const isComplete = velocity >= 100;

  return (
    <div 
      onClick={() => onProjectClick?.(project._id || project.id)}
      className={`
        group p-5 rounded-xl cursor-pointer
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${project.isAtRisk ? 'border-l-2 border-l-warning' : ''}
      `}
    >
      {/* Header: Emoji + Streak */}
      <div className="flex justify-between items-start mb-4">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          transition-all duration-200
          ${isComplete 
            ? 'bg-success/10' 
            : 'bg-surface-2 group-hover:bg-brand/10 group-hover:scale-105'
          }
        `}>
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <span>{project.emoji || getSeasonEmoji(project.season)}</span>
          )}
        </div>
        
        {/* Streak - only prominent when earned */}
        {streak > 0 && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
            ${isImpressiveStreak 
              ? 'bg-brand/10 text-brand' 
              : 'bg-surface-2 text-text-tertiary'
            }
          `}>
            <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-brand' : 'text-text-tertiary'}`} />
            <span>{streak}d</span>
          </div>
        )}
      </div>

      {/* Title + Description */}
      <h3 className={`
        text-base font-semibold mb-1 transition-colors
        ${isComplete 
          ? 'text-text-tertiary line-through' 
          : 'text-text-primary group-hover:text-brand'
        }
      `}>
        {project.name || project.title}
      </h3>
      <p className="text-sm text-text-secondary line-clamp-2 mb-4">
        {project.description}
      </p>

      {/* Next Step */}
      {hasNextStep ? (
        <div className="bg-surface-2 rounded-lg p-3 mb-4">
          <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
            Next step
          </div>
          <div className="text-sm text-text-primary truncate">
            {project.nextMicroStep}
          </div>
        </div>
      ) : (
        <div className="bg-surface-2 rounded-lg p-3 mb-4 border border-dashed border-white/[0.08]">
          <div className="flex items-center gap-2 text-text-tertiary">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">Add a next step</span>
          </div>
        </div>
      )}

      {/* Velocity Progress - PHASE 7: Purple intensity */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
            Velocity
          </span>
          <span className={`text-xs font-medium ${isComplete ? 'text-success' : 'text-text-primary'}`}>
            {velocity}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getProgressFillClass(velocity)}`}
            style={{ width: `${Math.min(velocity, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs">
            {project.metrics?.openTasks?.value || project.taskCount || 0} tasks
          </span>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onStartSprint?.(project); }}
          className="
            px-3 py-1.5 rounded-lg text-xs font-medium
            bg-brand text-white
            hover:bg-brand-600 hover:shadow-glow-brand
            transition-all duration-200
          "
        >
          Start Sprint
        </button>
      </div>
    </div>
  );
};

export default ProjectGridCard;