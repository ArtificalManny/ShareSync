// src/components/context/LastTouchedBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PRESERVATION - "Last Touched" Badge
// ═══════════════════════════════════════════════════════════════════════════════
// Shows when the user last interacted with an item.
// "Edited 2h ago" or "You · 5m ago"
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Clock, Edit3 } from 'lucide-react';

/**
 * Badge showing when user last touched an item
 * 
 * @param {Object} props
 * @param {string} props.relativeTime - e.g., "2h ago", "just now"
 * @param {boolean} props.isVeryRecent - Within the last hour
 * @param {string} props.variant - 'default' | 'subtle' | 'inline'
 */
export default function LastTouchedBadge({ 
  relativeTime,
  isVeryRecent = false,
  variant = 'default',
  className = '',
}) {
  if (!relativeTime) return null;

  // Variant styles
  const variants = {
    default: `
      px-2 py-1 rounded-full text-[10px] font-medium
      flex items-center gap-1
      ${isVeryRecent 
        ? 'bg-brand/10 text-brand border border-brand/20' 
        : 'bg-surface-2 text-text-tertiary'
      }
    `,
    subtle: `
      text-[10px] text-text-tertiary
      flex items-center gap-1
    `,
    inline: `
      text-xs text-text-tertiary
      inline-flex items-center gap-1
    `,
  };

  const iconSize = variant === 'default' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <span className={`${variants[variant]} ${className}`}>
      {isVeryRecent ? (
        <Edit3 className={iconSize} />
      ) : (
        <Clock className={iconSize} />
      )}
      <span>
        {isVeryRecent ? 'You · ' : ''}
        {relativeTime}
      </span>
    </span>
  );
}

/**
 * Inline version for use in text
 * "Last edited 2h ago"
 */
export function LastEditedText({ 
  relativeTime,
  prefix = 'Edited',
  className = '',
}) {
  if (!relativeTime) return null;

  return (
    <span className={`text-xs text-text-tertiary ${className}`}>
      {prefix} {relativeTime}
    </span>
  );
}
