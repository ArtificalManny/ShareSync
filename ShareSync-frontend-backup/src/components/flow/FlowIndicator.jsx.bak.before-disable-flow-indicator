// src/components/flow/FlowIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW STATE - Visual Indicator
// ═══════════════════════════════════════════════════════════════════════════════
// A subtle, non-distracting indicator that shows:
// - Building toward flow (progress ring)
// - In flow (solid indicator + duration)
// 
// Design principles:
// - Never distracting (that would defeat the purpose)
// - Subtle enough to ignore, visible enough to notice
// - Positioned in corner, out of main work area
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Zap, X } from 'lucide-react';
import { useFlowState } from '../../contexts/FlowStateContext';

export default function FlowIndicator({ position = 'bottom-right' }) {
  const { 
    isInFlow, 
    isBuilding, 
    flowProgress, 
    flowDurationFormatted,
    shouldShowIndicator,
    exitFlow,
  } = useFlowState();

  // Don't render if not in flow or building
  if (!shouldShowIndicator) {
    return null;
  }

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div 
      className={`
        fixed ${positionClasses[position]} z-40
        transition-all duration-500 ease-out
        ${isInFlow ? 'opacity-100 scale-100' : 'opacity-70 scale-95'}
      `}
    >
      {isBuilding && !isInFlow ? (
        // Building state - show progress
        <BuildingIndicator progress={flowProgress} />
      ) : isInFlow ? (
        // In flow - show duration
        <InFlowIndicator 
          duration={flowDurationFormatted} 
          onExit={() => exitFlow('manual')}
        />
      ) : null}
    </div>
  );
}

// Progress indicator while building toward flow
function BuildingIndicator({ progress }) {
  // Only show when meaningful progress (> 10%)
  if (progress < 10) return null;

  const circumference = 2 * Math.PI * 16; // radius = 16
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="
        flex items-center gap-2 px-3 py-2
        bg-surface-1/80 backdrop-blur-sm
        border border-white/[0.06]
        rounded-full
        text-xs text-text-tertiary
        transition-all duration-300
      "
      title={`Building focus: ${Math.round(progress)}%`}
    >
      {/* Progress ring */}
      <svg width="20" height="20" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-surface-3"
        />
        {/* Progress circle */}
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 8}
          strokeDashoffset={2 * Math.PI * 8 - (progress / 100) * 2 * Math.PI * 8}
          className="text-brand transition-all duration-300"
        />
      </svg>
      <span>Building focus...</span>
    </div>
  );
}

// Indicator when in flow state
function InFlowIndicator({ duration, onExit }) {
  return (
    <div 
      className="
        group flex items-center gap-2
        bg-brand/10 backdrop-blur-sm
        border border-brand/20
        rounded-full
        transition-all duration-300
        hover:bg-brand/15 hover:border-brand/30
      "
    >
      {/* Main indicator */}
      <div className="flex items-center gap-2 pl-3 pr-2 py-2">
        <div className="relative">
          <Zap className="w-4 h-4 text-brand" />
          {/* Subtle pulse */}
          <div className="absolute inset-0 animate-ping opacity-30">
            <Zap className="w-4 h-4 text-brand" />
          </div>
        </div>
        
        <span className="text-xs font-medium text-brand">
          In Flow
        </span>
        
        <span className="text-xs text-brand/70 tabular-nums">
          {duration}
        </span>
      </div>

      {/* Exit button - appears on hover */}
      <button
        onClick={onExit}
        className="
          p-1.5 mr-1
          rounded-full
          opacity-0 group-hover:opacity-100
          hover:bg-brand/20
          transition-all duration-200
        "
        title="Exit flow mode"
      >
        <X className="w-3 h-3 text-brand" />
      </button>
    </div>
  );
}

// Export individual components for flexibility
export { BuildingIndicator, InFlowIndicator };
