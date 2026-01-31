// src/components/focus/UnblockIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Unblock Indicator Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows how many teammates are waiting on this move.
// Creates social accountability and urgency.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Users, UserCheck } from 'lucide-react';

const VARIANTS = {
  default: {
    container: 'flex items-center gap-1.5 text-xs',
    icon: 'w-3.5 h-3.5',
    text: 'text-text-tertiary',
  },
  prominent: {
    container: 'flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cyan-500/10',
    icon: 'w-4 h-4 text-cyan-400',
    text: 'text-cyan-400 text-xs font-medium',
  },
  compact: {
    container: 'flex items-center gap-1 text-[11px]',
    icon: 'w-3 h-3',
    text: 'text-text-tertiary',
  },
  badge: {
    container: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10',
    icon: 'w-3 h-3 text-cyan-400',
    text: 'text-cyan-400 text-[10px] font-medium',
  },
};

export default function UnblockIndicator({
  count = 0,
  variant = 'default',
  showZero = false,
  showLabel = true,
  teammates = [], // Optional: array of teammate names/avatars
}) {
  // Don't render if zero and not showing zero
  if (count === 0 && !showZero) return null;

  const styles = VARIANTS[variant] || VARIANTS.default;
  const Icon = count > 0 ? Users : UserCheck;

  // Generate label text
  const labelText = count === 0
    ? 'No blockers'
    : count === 1
    ? 'Unblocks 1 teammate'
    : `Unblocks ${count} teammates`;

  return (
    <div className={styles.container} title={labelText}>
      <Icon className={`${styles.icon} ${count > 0 ? 'text-cyan-400' : 'text-text-tertiary'}`} />
      
      {showLabel ? (
        <span className={styles.text}>
          {count === 0 ? (
            'No blockers'
          ) : variant === 'compact' || variant === 'badge' ? (
            count
          ) : (
            <>Unblocks {count}</>
          )}
        </span>
      ) : (
        <span className={styles.text}>{count}</span>
      )}

      {/* Show teammate avatars if provided and prominent variant */}
      {variant === 'prominent' && teammates.length > 0 && (
        <div className="flex -space-x-1.5 ml-1">
          {teammates.slice(0, 3).map((teammate, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-surface-1 bg-surface-2 overflow-hidden"
              title={teammate.name}
            >
              {teammate.avatar ? (
                <img src={teammate.avatar} alt={teammate.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-medium text-text-tertiary">
                  {teammate.name?.charAt(0)}
                </div>
              )}
            </div>
          ))}
          {teammates.length > 3 && (
            <div className="w-5 h-5 rounded-full border border-surface-1 bg-surface-2 flex items-center justify-center text-[8px] font-medium text-text-tertiary">
              +{teammates.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline version for tight spaces
 */
export function UnblockBadge({ count }) {
  if (!count) return null;
  
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-400">
      <Users className="w-2.5 h-2.5" />
      {count}
    </span>
  );
}
