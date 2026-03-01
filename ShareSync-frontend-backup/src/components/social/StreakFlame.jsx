// src/components/social/StreakFlame.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// STREAK FLAME — Pure Presentational Component (Priority 3.5)
// ═══════════════════════════════════════════════════════════════════════════════
//
// DIFFERENT from components/momentum/StreakFlame.jsx
// This component is prop-driven (no hooks, no API calls).
// Designed to be embedded inside StreakComparison and anywhere else
// that already has streak data.
//
// TIERS:
//   0 = empty/grey  (streak 0)
//   1 = small ember  (1-3 days)   — orange
//   2 = growing flame (4-7 days)  — orange-red
//   3 = full fire    (8-14 days)  — red-orange + particles
//   4 = blue flame   (15-30 days) — blue + particles + glow
//   5 = legendary    (30+ days)   — violet + particles + glow
//
// ZERO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import '../../styles/streak-flames.css';

// ─────────────────────────────────────────────────────────────────────────
// TIER CONFIG
// ─────────────────────────────────────────────────────────────────────────
const TIER_CONFIG = [
  { tier: 0, label: 'No Streak',    emoji: '⚪',  min: 0,  max: 0  },
  { tier: 1, label: 'Ember',        emoji: '🔥',  min: 1,  max: 3  },
  { tier: 2, label: 'Flame',        emoji: '🔥',  min: 4,  max: 7  },
  { tier: 3, label: 'Full Fire',    emoji: '🔥',  min: 8,  max: 14 },
  { tier: 4, label: 'Blue Flame',   emoji: '��',  min: 15, max: 30 },
  { tier: 5, label: 'Legendary',    emoji: '💜',  min: 31, max: Infinity },
];

function getTier(streak) {
  if (streak <= 0) return 0;
  if (streak <= 3) return 1;
  if (streak <= 7) return 2;
  if (streak <= 14) return 3;
  if (streak <= 30) return 4;
  return 5;
}

function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG[0];
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function StreakFlameVisual({
  streak = 0,
  size = 40,
  showBadge = true,
  showLabel = false,
  className = '',
}) {
  const tier = useMemo(() => getTier(streak), [streak]);
  const config = useMemo(() => getTierConfig(tier), [tier]);
  const hasParticles = tier >= 3;
  const hasGlow = tier >= 4;

  // Flame body dimensions (proportional to size)
  const bodyWidth = Math.round(size * 0.6);
  const bodyHeight = Math.round(size * 0.75);

  return (
    <div
      className={`streak-flame streak-flame--tier-${tier} ${className}`}
      style={{ width: size, height: size }}
      title={`${streak} day streak — ${config.label}`}
    >
      {/* Glow ring (tiers 4+5) */}
      {hasGlow && <div className="streak-flame__glow" />}

      {/* Flame body */}
      <div
        className="streak-flame__body"
        style={{
          width: bodyWidth,
          height: bodyHeight,
        }}
      />

      {/* Particles (tiers 3+4+5) */}
      {hasParticles && (
        <div className="streak-flame__particles">
          <div className="streak-flame__particle" />
          <div className="streak-flame__particle" />
          <div className="streak-flame__particle" />
          <div className="streak-flame__particle" />
          <div className="streak-flame__particle" />
        </div>
      )}

      {/* Streak count badge */}
      {showBadge && streak > 0 && (
        <div className="streak-flame__badge">
          {streak}
        </div>
      )}

      {/* Tier label (optional) */}
      {showLabel && (
        <div className="streak-flame__tier-label">
          {config.label}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────

// Inline helper: tiny flame for lists (no badge, no label)
export function MiniStreakFlame({ streak = 0, className = '' }) {
  return (
    <StreakFlameVisual
      streak={streak}
      size={20}
      showBadge={false}
      showLabel={false}
      className={className}
    />
  );
}

// Export tier helpers so StreakComparison can use them
export { getTier, getTierConfig, TIER_CONFIG };
