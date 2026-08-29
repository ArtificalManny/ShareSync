// src/components/ui/MomentumBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 2.3: Reusable Momentum Progress Bar
// ═══════════════════════════════════════════════════════════════════════════════
//
// A small, reusable progress bar with gradient fill.
// Used in ProjectCardV2, but can be used anywhere.
//
// Props:
//   value      — 0-100 percentage
//   size       — 'sm' | 'md' | 'lg'
//   showLabel  — show percentage text
//   color      — override gradient with a single color
//   className  — additional classes
//
// NO BACKEND DEPENDENCIES. Pure presentational component.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

/**
 * Gradient stops based on value ranges
 */
function getGradient(value) {
  if (value >= 80) {
    // On fire: violet → fuchsia
    return 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)';
  }
  if (value >= 60) {
    // Flowing: violet → cyan
    return 'linear-gradient(90deg, #8B5CF6 0%, #06B6D4 100%)';
  }
  if (value >= 30) {
    // Building: blue → violet
    return 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)';
  }
  // Warming up: slate → blue
  return 'linear-gradient(90deg, #94A3B8 0%, #3B82F6 100%)';
}

/**
 * Height classes by size
 */
const SIZE_MAP = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

/**
 * Label text size by bar size
 */
const LABEL_SIZE_MAP = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-xs',
};

export default function MomentumBar({
  value = 0,
  size = 'sm',
  showLabel = false,
  color = null,
  className = '',
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const heightClass = SIZE_MAP[size] || SIZE_MAP.sm;
  const labelClass = LABEL_SIZE_MAP[size] || LABEL_SIZE_MAP.sm;

  const fillStyle = {
    width: `${clampedValue}%`,
    background: color || getGradient(clampedValue),
    transition: 'width 0.5s ease-out',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Track */}
      <div className={`flex-1 ${heightClass} rounded-full overflow-hidden bg-slate-200 dark:bg-white/10`}>
        {/* Fill */}
        <div
          className={`${heightClass} rounded-full`}
          style={fillStyle}
        />
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className={`${labelClass} font-medium tabular-nums text-slate-600 dark:text-zinc-400 w-8 text-right`}>
          {clampedValue}%
        </span>
      )}
    </div>
  );
}

/**
 * Tiny inline momentum dot (for lists, sidebar items)
 * Shows a colored dot based on momentum value
 */
export function MomentumDot({ value = 0, className = '' }) {
  let dotColor = 'bg-slate-300 dark:bg-zinc-600';
  if (value >= 80) dotColor = 'bg-fuchsia-500';
  else if (value >= 60) dotColor = 'bg-violet-500';
  else if (value >= 30) dotColor = 'bg-blue-500';
  else if (value > 0) dotColor = 'bg-slate-400';

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${dotColor} ${className}`}
      title={`Momentum: ${value}%`}
    />
  );
}
