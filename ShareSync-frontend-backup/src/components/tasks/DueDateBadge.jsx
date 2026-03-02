// src/components/tasks/DueDateBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Inline due date badge with color coding
//
// Colors:
//   Green  → >48h remaining
//   Yellow → 24-48h remaining
//   Amber  → <24h remaining
//   Red    → Overdue
//
// Shows relative text: "Due in 2h", "Due tomorrow", "3 days overdue"
// Tooltip shows full date on hover
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDueDateStatus } from '../../hooks/useDueDateStatus';

export default function DueDateBadge({
  dueDate,
  completedAt = null,
  size = 'sm',       // 'xs' | 'sm' | 'md'
  showIcon = true,
  showTooltip = true,
  className = '',
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const { status, color, bgColor, borderColor, label, isOverdue, isUrgent, fullDate } = useDueDateStatus(dueDate);

  // If no due date, render nothing
  if (!dueDate) return null;

  // If task is completed, show a muted "completed" style
  const isComplete = Boolean(completedAt);

  // Size classes
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  // Pick icon
  const Icon = isComplete ? CheckCircle2 : isOverdue ? AlertTriangle : Clock;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <span
        className={`
          inline-flex items-center rounded-md font-medium
          transition-colors duration-150
          ${sizeClasses[size] || sizeClasses.sm}
          ${isComplete
            ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-white/10'
            : `${bgColor} ${color} border ${borderColor}`
          }
          ${className}
        `}
      >
        {showIcon && (
          <Icon
            className={`
              ${iconSizes[size] || iconSizes.sm}
              ${isComplete ? 'text-slate-400 dark:text-zinc-500' : ''}
            `}
          />
        )}
        <span className={isComplete ? 'line-through' : ''}>
          {isComplete ? 'Done' : label}
        </span>
      </span>

      {/* Tooltip — full date */}
      {showTooltip && tooltipVisible && fullDate && (
        <div
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-2.5 py-1.5 rounded-lg
            bg-slate-800 dark:bg-zinc-700
            text-white text-[11px] font-medium
            whitespace-nowrap z-50
            shadow-lg
            animate-in fade-in slide-in-from-bottom-1 duration-150
          "
        >
          {fullDate}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-slate-800 dark:bg-zinc-700 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
