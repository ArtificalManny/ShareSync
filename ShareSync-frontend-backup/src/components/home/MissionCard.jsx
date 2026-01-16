// src/components/home/MissionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ ──────────────────    │ ──────────────────          │ ──────────────────    │
// │ Icon + Title          │ Progress bar (woven in)     │ Primary button        │
// │ Meta (time · category)│ Single metric if needed     │ Chevron on hover      │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// RULES:
// - Zone 1: WHAT is this? (fixed width ~50%)
// - Zone 2: HOW is it going? (flexible, progress woven in)
// - Zone 3: WHAT can I do? (fixed width, right-aligned)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Clock, Zap, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

export default function MissionCard({ project, onClick }) {
  const [status, setStatus] = useState('idle');

  const handleDeploy = (e) => {
    e.stopPropagation();
    setStatus('deploying');
    setTimeout(() => setStatus('shipped'), 2000);
  };

  const isShipped = status === 'shipped';
  const isDeploying = status === 'deploying';

  // Health determines the progress bar color (woven in, not a badge)
  const getProgressColor = (health) => {
    if (health > 80) return 'bg-success';
    if (health > 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div 
      onClick={() => onClick?.(project)}
      className={`
        group relative p-4 rounded-xl cursor-pointer
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isShipped ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        
        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1: Identity (What is this?)
            Fixed width ~50%, contains icon + title + meta
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icon - indicates completion state */}
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center shrink-0
            transition-colors duration-200
            ${isShipped ? 'bg-success/10' : 'bg-surface-2 group-hover:bg-brand/10'}
          `}>
            {isShipped ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <span className="text-lg">{project.emoji || '◎'}</span>
            )}
          </div>

          {/* Title + Meta */}
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
              {project.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-tertiary">
              <Clock className="w-3 h-3" />
              <span>{project.eta}</span>
              <span className="opacity-50">·</span>
              <span>{project.category}</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2: Status (How is it going?)
            Progress woven in as a bar, not badges
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="hidden sm:flex items-center gap-3 w-32">
          {/* Progress bar - THE status indicator */}
          <div className="flex-1">
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.health)}`}
                style={{ width: `${project.health}%` }}
              />
            </div>
          </div>
          {/* Single number - velocity or health, not both */}
          <span className="text-xs font-medium text-text-secondary w-8 text-right">
            {project.velocity}%
          </span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 3: Action (What can I do?)
            Primary action + hover chevron
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleDeploy}
            disabled={status !== 'idle'}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200
              ${status === 'idle' 
                ? 'bg-surface-2 text-text-secondary hover:bg-brand hover:text-white' 
                : status === 'deploying' 
                  ? 'bg-surface-2 text-text-tertiary cursor-wait' 
                  : 'bg-success/10 text-success'
              }
            `}
          >
            {status === 'idle' && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Deploy
              </span>
            )}
            {isDeploying && <Loader2 className="w-3 h-3 animate-spin" />}
            {isShipped && <CheckCircle2 className="w-3 h-3" />}
          </button>

          <ChevronRight className="
            w-4 h-4 text-text-tertiary
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          " />
        </div>
      </div>
    </div>
  );
}
