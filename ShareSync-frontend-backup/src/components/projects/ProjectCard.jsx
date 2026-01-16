// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ ──────────────────    │ ──────────────────          │ ──────────────────    │
// │ Icon + Title          │ Progress bar (woven in)     │ Status text           │
// │ Client · Due date     │ Single % metric             │ Chevron on hover      │
// └─────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Calendar, ChevronRight, Folder } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  const { name, client, progress = 0, dueDate, status, emoji } = project;
  const isComplete = progress === 100;
  
  // Progress bar color based on health (woven in, not a badge)
  const getProgressColor = () => {
    if (isComplete) return 'bg-success';
    if (progress >= 70) return 'bg-brand';
    if (progress >= 40) return 'bg-warning';
    return 'bg-danger';
  };

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
          Icon + Title + Meta (client · due date)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Project Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          transition-colors duration-200
          ${isComplete ? 'bg-success/10' : 'bg-surface-2 group-hover:bg-brand/10'}
        `}>
          {emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <Folder className={`w-4 h-4 ${isComplete ? 'text-success' : 'text-text-tertiary group-hover:text-brand'}`} />
          )}
        </div>

        {/* Title + Meta */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
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
          ZONE 2: Status (How is it going?)
          Progress bar with single percentage - color indicates health
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex items-center gap-3 w-36 shrink-0">
        <div className="flex-1">
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-text-secondary w-8 text-right">
          {progress}%
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: Action (What can I do?)
          Status indicator + Chevron on hover
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status text - minimal, not a badge */}
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
