// src/components/projects/ProjectGridCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7.1: Contrast Audit - Grid Card
// OPTICAL TWEAKS: Pushed secondary descriptions and metadata to text-slate-500 
// to ensure the project title (text-slate-900) remains the dominant focal point.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Flame, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        bg-white border border-slate-200/60
        hover:shadow-[0_8px_24px_rgba(139,92,246,0.06),0_2px_8px_rgba(139,92,246,0.04)] hover:border-violet-200/80
        transition-all duration-200
        ${project.isAtRisk ? 'border-l-2 border-l-red-500' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          transition-all duration-200
          ${isComplete 
            ? 'bg-emerald-50 text-emerald-600' 
            : 'bg-slate-50 group-hover:bg-violet-50 group-hover:scale-105'
          }
        `}>
          {isComplete ? (
            <CheckCircle2 strokeWidth={1.5} className="w-6 h-6 text-emerald-500" />
          ) : (
            <span>{project.emoji || getSeasonEmoji(project.season)}</span>
          )}
        </div>
        
        {streak > 0 && (
          <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
            ${isImpressiveStreak 
              ? 'bg-amber-50 text-amber-600 border border-amber-200/60' 
              : 'bg-slate-50 text-slate-500 border border-slate-200'
            }
          `}>
            <Flame strokeWidth={2} className={`w-3.5 h-3.5 ${isImpressiveStreak ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>{streak}d</span>
          </div>
        )}
      </div>

      <h3 className={`
        text-base font-semibold mb-1 transition-colors leading-tight
        ${isComplete 
          ? 'text-slate-400 line-through' 
          : 'text-slate-900 group-hover:text-violet-600'
        }
      `}>
        {project.name || project.title}
      </h3>
      <p className="text-[13px] text-slate-500 leading-snug line-clamp-2 mb-5">
        {project.description || "No description provided."}
      </p>

      {hasNextStep ? (
        <div className="bg-slate-50/80 rounded-lg p-3.5 mb-5 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Next step
          </div>
          <div className="text-[13px] font-medium text-slate-700 truncate">
            {project.nextMicroStep}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/50 rounded-lg p-3.5 mb-5 border border-dashed border-slate-200">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle strokeWidth={1.5} className="w-4 h-4" />
            <span className="text-[13px] font-medium">Add a next step</span>
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Velocity
          </span>
          <span className={`text-xs font-bold ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
            {velocity}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getProgressFillClass(velocity)}`}
            style={{ width: `${Math.min(velocity, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Users strokeWidth={1.5} className="w-4 h-4 relative -top-[0.5px]" />
          <span className="text-xs font-medium">
            {project.metrics?.openTasks?.value || project.taskCount || 0} tasks
          </span>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onStartSprint?.(project); }}
          className="
            px-4 py-1.5 rounded-lg text-xs font-semibold
            bg-violet-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]
            hover:bg-violet-700 active:translate-y-[1px] active:shadow-none
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
