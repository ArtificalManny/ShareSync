// src/components/ecosystem/ProjectsOverview.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ ──────────────────    │ ──────────────────          │ ──────────────────    │
// │ Emoji + Project name  │ Progress bar + next task    │ Streak (if earned)    │
// │                       │ OR "Needs step" warning     │ Chevron on hover      │
// └─────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronRight, Plus, Target, AlertCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const ProjectsOverview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [projects] = useState([
    {
      _id: '1',
      name: 'ShareSync v2',
      emoji: '🚀',
      progress: 68,
      streak: 7,
      nextTask: 'Fix login page CSS',
      isAtRisk: false
    },
    {
      _id: '2',
      name: 'AI Writing Tool',
      emoji: '✨',
      progress: 85,
      streak: 120,
      nextTask: 'Write API docs',
      isAtRisk: false
    },
    {
      _id: '3',
      name: 'Math Homework',
      emoji: '📐',
      progress: 45,
      streak: 3,
      nextTask: null,
      isAtRisk: true
    }
  ]);

  // Progress bar color based on health
  const getProgressColor = (progress, isAtRisk) => {
    if (isAtRisk) return 'bg-warning';
    if (progress >= 70) return 'bg-success';
    if (progress >= 40) return 'bg-brand';
    return 'bg-warning';
  };

  return (
    <div className="h-full rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">Active Projects</h3>
            {!isMobile && (
              <p className="text-[11px] text-text-tertiary">Your current focus</p>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/projects/new')}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-surface-2 text-text-secondary
            hover:bg-brand hover:text-white
            transition-colors
          "
        >
          <Plus className="w-3.5 h-3.5" />
          {!isMobile && "New"}
        </button>
      </div>

      {/* Project List */}
      <div className="divide-y divide-white/[0.04]">
        {projects.map(project => {
          const isImpressiveStreak = project.streak >= 7;
          
          return (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className={`
                group flex items-center gap-3 px-4 py-3 cursor-pointer
                hover:bg-surface-2 transition-colors duration-200
                ${project.isAtRisk ? 'border-l-2 border-l-warning' : ''}
              `}
            >
              {/* ═══════════════════════════════════════════════════════════════
                  ZONE 1: Identity (Which project?)
                  Emoji + Name
              ═══════════════════════════════════════════════════════════════ */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-lg shrink-0">{project.emoji}</span>
                
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                    {project.name}
                  </h4>
                  
                  {/* Next task OR warning */}
                  {project.isAtRisk ? (
                    <p className="text-xs text-warning mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Needs next step
                    </p>
                  ) : project.nextTask ? (
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">
                      → {project.nextTask}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  ZONE 2: Status (How's it going?)
                  Progress bar - compact
              ═══════════════════════════════════════════════════════════════ */}
              <div className="hidden sm:flex items-center gap-2 w-24 shrink-0">
                <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progress, project.isAtRisk)}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-text-tertiary w-7 text-right">
                  {project.progress}%
                </span>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  ZONE 3: Action (Streak indicator + Navigate)
                  Only show streak if earned (7+ days)
              ═══════════════════════════════════════════════════════════════ */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Streak - only if impressive */}
                {!project.isAtRisk && isImpressiveStreak && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-warning">
                    <Flame className="w-3 h-3" />
                    {project.streak}d
                  </span>
                )}

                <ChevronRight className="
                  w-4 h-4 text-text-tertiary
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                " />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <button 
          onClick={() => navigate('/projects')}
          className="
            w-full py-2 rounded-lg text-xs font-medium
            text-text-tertiary hover:text-text-primary
            hover:bg-surface-2
            transition-all
          "
        >
          View All Projects
        </button>
      </div>
    </div>
  );
};

export default ProjectsOverview;
