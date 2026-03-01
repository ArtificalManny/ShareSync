// src/components/focus/FocusBlockBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.3: "In Focus" Badge for Task Cards
// ═══════════════════════════════════════════════════════════════════════════════
//
// Small pill badge: "🔥 In Focus" or "🎯 Focus"
// Shown on task cards when the assignee is in an active focus block.
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import '../../styles/focus-block.css';

export default function FocusBlockBadge({
  isInFocus = false,
  variant = 'default', // 'default' | 'compact' | 'dot'
  className = '',
}) {
  if (!isInFocus) return null;

  if (variant === 'dot') {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full bg-violet-500 focus-block-pulse ${className}`}
        title="In Focus Mode"
      />
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold
          bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400
          border border-violet-200 dark:border-violet-500/20
          focus-block-badge-pulse
          ${className}
        `}
      >
        🎯
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold
        bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400
        border border-violet-200 dark:border-violet-500/20
        focus-block-badge-pulse
        ${className}
      `}
    >
      🔥 In Focus
    </span>
  );
}
