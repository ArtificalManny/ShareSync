// src/components/project/quest-deck/SprintPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Sprint Panel with Health Ring
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Sparkles, Clock, AlertTriangle, Play, CheckCircle2, RotateCcw } from 'lucide-react';

const HEALTH_CONFIG = {
  healthy: {
    color: 'text-success',
    ringColor: 'stroke-success',
    bg: 'bg-success/10',
  },
  at_risk: {
    color: 'text-warning',
    ringColor: 'stroke-warning',
    bg: 'bg-warning/10',
  },
  critical: {
    color: 'text-error-500',
    ringColor: 'stroke-error-500',
    bg: 'bg-error-500/10',
  },
};

function HealthRing({ progress = 0, health = 'healthy', size = 80 }) {
  const config = HEALTH_CONFIG[health] || HEALTH_CONFIG.healthy;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={config.ringColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-semibold ${config.color}`}>
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function SprintPanel({ sprint, onAction }) {
  if (!sprint) {
    // No active sprint
    return (
      <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-medium text-text-secondary">Current Sprint</h3>
        </div>

        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-surface-2 mx-auto mb-4 flex items-center justify-center">
            <Play className="w-6 h-6 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium mb-1">No active sprint</p>
          <p className="text-xs text-text-tertiary mb-4">Start a sprint to track progress</p>
          
          <button 
            onClick={() => onAction?.('start')}
            className="
              w-full py-3 rounded-xl
              bg-brand text-white font-medium text-sm
              hover:bg-brand-600
              transition-colors
              flex items-center justify-center gap-2
            "
          >
            <Sparkles className="w-4 h-4" />
            Start Team Sprint
          </button>
        </div>
      </div>
    );
  }

  const {
    name,
    goal,
    daysLeft,
    health = 'healthy',
    progress = 0,
    velocity,
    tasksTotal,
    tasksComplete,
    blockers = 0,
  } = sprint;

  const healthConfig = HEALTH_CONFIG[health] || HEALTH_CONFIG.healthy;

  return (
    <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-medium text-text-secondary">Current Sprint</h3>
        </div>
        
        {blockers > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-error-500/10 text-error-500 text-[10px] font-medium">
            <AlertTriangle className="w-3 h-3" />
            {blockers} blocker{blockers > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Sprint Name */}
      <h4 className="text-lg font-semibold text-text-primary mb-2">{name}</h4>
      
      {goal && (
        <p className="text-xs text-text-tertiary mb-4 line-clamp-2">{goal}</p>
      )}

      {/* Health Ring & Stats */}
      <div className="flex items-center gap-6 mb-6">
        <HealthRing progress={progress} health={health} />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Time Left</span>
            <span className="flex items-center gap-1 text-sm font-medium text-text-primary">
              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
              {daysLeft} days
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Tasks</span>
            <span className="flex items-center gap-1 text-sm font-medium text-text-primary">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              {tasksComplete}/{tasksTotal}
            </span>
          </div>
          
          {velocity !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">Velocity</span>
              <span className="text-sm font-medium text-text-primary">{velocity}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => onAction?.(progress >= 1 ? 'review' : 'continue')}
        className="
          w-full py-3 rounded-xl
          bg-brand text-white font-medium text-sm
          hover:bg-brand-600
          transition-colors
          flex items-center justify-center gap-2
        "
      >
        {progress >= 1 ? (
          <>
            <RotateCcw className="w-4 h-4" />
            Review Sprint
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Continue Sprint
          </>
        )}
      </button>
    </div>
  );
}
