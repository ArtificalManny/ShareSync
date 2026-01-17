// src/components/momentum/MomentumAura.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Background Aura
// ═══════════════════════════════════════════════════════════════════════════════
// A very subtle full-screen gradient overlay that shifts based on momentum.
// 
// High momentum: Warm golden glow (top corners)
// Low momentum: Cool blue tint (subtle)
// Neutral: Nearly invisible purple brand tint
//
// This should be BARELY perceptible - it's felt, not seen.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useMomentumContext } from '../../contexts/MomentumContext';

export default function MomentumAura() {
  const { vibe, score, enabled } = useMomentumContext();

  if (!enabled) return null;

  // Get aura configuration based on vibe
  const auraConfig = {
    high: {
      // Warm golden corners - energetic but not distracting
      gradient: `
        radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at bottom left, rgba(251, 146, 60, 0.04) 0%, transparent 40%)
      `,
      animation: 'momentum-breathe 8s ease-in-out infinite',
    },
    low: {
      // Cool blue tint - calm, slightly muted
      gradient: `
        radial-gradient(ellipse at top left, rgba(96, 165, 250, 0.05) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(147, 197, 253, 0.03) 0%, transparent 40%)
      `,
      animation: 'none', // No animation for low momentum - stillness
    },
    neutral: {
      // Very subtle brand purple - barely there
      gradient: `
        radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
      `,
      animation: 'momentum-subtle 12s ease-in-out infinite',
    },
  };

  const config = auraConfig[vibe];

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes momentum-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes momentum-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
      
      {/* Aura overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: config.gradient,
          animation: config.animation,
          transition: 'background 2s ease-out',
        }}
        aria-hidden="true"
        data-momentum-vibe={vibe}
        data-momentum-score={score}
      />
    </>
  );
}

/**
 * Smaller aura for cards/sections
 */
export function MomentumCardAura({ className = '' }) {
  const { vibe, enabled } = useMomentumContext();

  if (!enabled) return null;

  const colors = {
    high: 'from-amber-500/5 to-transparent',
    low: 'from-blue-500/5 to-transparent',
    neutral: 'from-brand/5 to-transparent',
  };

  return (
    <div
      className={`
        absolute inset-0 pointer-events-none rounded-xl
        bg-gradient-to-br ${colors[vibe]}
        transition-all duration-1000
        ${className}
      `}
      aria-hidden="true"
    />
  );
}
