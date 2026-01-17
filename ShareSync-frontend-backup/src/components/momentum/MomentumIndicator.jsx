// src/components/momentum/MomentumIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Debug/Display Indicator
// ═══════════════════════════════════════════════════════════════════════════════
// A small indicator that shows current momentum state.
// Can be used for debugging or as a subtle UI element.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useMomentumContext } from '../../contexts/MomentumContext';

/**
 * Compact momentum indicator
 */
export default function MomentumIndicator({ 
  position = 'bottom-right',
  showDetails = false,
}) {
  const { score, vibe, components, isHighMomentum, isLowMomentum, enabled } = useMomentumContext();
  const [expanded, setExpanded] = useState(false);

  if (!enabled) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const vibeConfig = {
    high: {
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      label: 'High Momentum',
    },
    low: {
      icon: TrendingDown,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      label: 'Building...',
    },
    neutral: {
      icon: Minus,
      color: 'text-text-secondary',
      bg: 'bg-surface-2 border-white/[0.06]',
      label: 'Steady',
    },
  };

  const config = vibeConfig[vibe];
  const Icon = config.icon;

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div
        className={`
          ${config.bg} border rounded-xl
          transition-all duration-300
          ${expanded ? 'p-3' : 'p-2'}
        `}
      >
        {/* Compact view */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {score}
          </span>
          {showDetails && (
            expanded 
              ? <ChevronDown className="w-3 h-3 text-text-tertiary" />
              : <ChevronUp className="w-3 h-3 text-text-tertiary" />
          )}
        </button>

        {/* Expanded details */}
        {expanded && showDetails && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
            <div className="text-xs text-text-tertiary">{config.label}</div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-tertiary">Tasks</span>
                <span className="ml-2 text-text-secondary">{components.completions}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Streak</span>
                <span className="ml-2 text-text-secondary">{components.streak}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Health</span>
                <span className="ml-2 text-text-secondary">{components.health}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Activity</span>
                <span className="ml-2 text-text-secondary">{components.activity}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline momentum badge (for use in headers, etc.)
 */
export function MomentumBadge({ className = '' }) {
  const { score, vibe, enabled } = useMomentumContext();

  if (!enabled) return null;

  const vibeColors = {
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-surface-2 text-text-secondary border-white/[0.06]',
  };

  const vibeIcons = {
    high: TrendingUp,
    low: TrendingDown,
    neutral: Minus,
  };

  const Icon = vibeIcons[vibe];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 
        rounded-full border text-xs font-medium
        ${vibeColors[vibe]}
        ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{score}</span>
    </div>
  );
}
