// src/components/momentum/MomentumAura.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Background Aura
// ═══════════════════════════════════════════════════════════════════════════════
//
// PHASE C UPGRADE: Full Momentum Engine Integration
//
// NOW USING DEEP VIOLET SIGNATURE PALETTE:
// - High momentum: Deep Violet → Electric Cyan gradient (energetic)
// - Low momentum: Cool blue tint (calm, slightly muted)
// - Neutral: Very subtle Deep Violet brand tint
// - ⭐ PHASE C: Fire mode: Energy red accent with animated particles
//
// The glow INTENSIFIES based on the 0-5 momentum level from MomentumContext.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useEffect, useState } from 'react';
import { useMomentumContext } from '../../contexts/MomentumContext';

// Deep Violet brand colors (from Phase 1 Emotional Color System)
const COLORS = {
  brand: {
    violet600: '124 58 237',   // #7C3AED - Primary signature
    violet500: '139 92 246',   // #8B5CF6 - Lighter
    violet400: '167 139 250',  // #A78BFA - Lightest
  },
  live: {
    cyan500: '6 182 212',      // #06B6D4 - Electric Cyan
    cyan400: '34 211 238',     // #22D3EE - Lighter
  },
  cool: {
    blue400: '96 165 250',     // #60A5FA - Cool blue
    blue300: '147 197 253',    // #93C5FD - Lighter
  },
  // ⭐ PHASE C: Fire mode colors
  fire: {
    energy500: '244 63 94',    // #F43F5E - Energy red
    energy400: '251 113 133',  // #FB7185 - Lighter
    warning500: '245 158 11',  // #F59E0B - Amber
  },
};

export default function MomentumAura() {
  const { vibe, score, glowLevel, enabled, isFireMode } = useMomentumContext();

  // ⭐ PHASE C: Track fire mode transitions
  const [fireModeActive, setFireModeActive] = useState(false);
  const [showFireBurst, setShowFireBurst] = useState(false);

  useEffect(() => {
    if (isFireMode && !fireModeActive) {
      // Entering fire mode - show burst effect
      setFireModeActive(true);
      setShowFireBurst(true);
      const timer = setTimeout(() => setShowFireBurst(false), 1500);
      return () => clearTimeout(timer);
    } else if (!isFireMode && fireModeActive) {
      setFireModeActive(false);
    }
  }, [isFireMode, fireModeActive]);

  // Build the aura configuration based on vibe AND glow level
  const auraConfig = useMemo(() => {
    // Base opacity scales with glow level (0-5)
    const baseOpacity = 0.02 + (glowLevel * 0.015); // 0.02 to 0.095

    // ⭐ PHASE C: Fire mode special aura
    if (isFireMode) {
      return {
        gradient: `
          radial-gradient(ellipse 140% 90% at top right,
            rgba(${COLORS.brand.violet400}, ${baseOpacity * 2}) 0%,
            transparent 50%
          ),
          radial-gradient(ellipse 120% 70% at bottom left,
            rgba(${COLORS.fire.energy500}, ${baseOpacity * 1.2}) 0%,
            transparent 40%
          ),
          radial-gradient(ellipse 100% 60% at center,
            rgba(${COLORS.live.cyan500}, ${baseOpacity * 0.6}) 0%,
            transparent 50%
          )
        `,
        animation: 'momentum-fire-breathe 4s ease-in-out infinite',
      };
    }

    const configs = {
      high: {
        // Deep Violet → Cyan gradient - energetic brand presence
        gradient: `
          radial-gradient(ellipse 120% 80% at top right,
            rgba(${COLORS.brand.violet500}, ${baseOpacity * 1.5}) 0%,
            transparent 50%
          ),
          radial-gradient(ellipse 100% 60% at bottom left,
            rgba(${COLORS.live.cyan500}, ${baseOpacity * 0.8}) 0%,
            transparent 40%
          )
        `,
        animation: glowLevel >= 4
          ? 'momentum-breathe 6s ease-in-out infinite'
          : glowLevel >= 2
            ? 'momentum-breathe 8s ease-in-out infinite'
            : 'none',
      },
      low: {
        // Cool blue tint - calm, slightly muted
        gradient: `
          radial-gradient(ellipse 100% 70% at top left,
            rgba(${COLORS.cool.blue400}, ${baseOpacity * 0.8}) 0%,
            transparent 50%
          ),
          radial-gradient(ellipse 80% 50% at bottom right,
            rgba(${COLORS.cool.blue300}, ${baseOpacity * 0.5}) 0%,
            transparent 40%
          )
        `,
        animation: 'none',
      },
      neutral: {
        // Very subtle Deep Violet brand tint
        gradient: `
          radial-gradient(ellipse 100% 70% at top right,
            rgba(${COLORS.brand.violet600}, ${baseOpacity}) 0%,
            transparent 50%
          )
        `,
        animation: glowLevel >= 2
          ? 'momentum-subtle 12s ease-in-out infinite'
          : 'none',
      },
    };

    return configs[vibe] || configs.neutral;
  }, [vibe, glowLevel, isFireMode]);

  if (!enabled) return null;

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes momentum-breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes momentum-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes momentum-glow-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.1); }
        }

        /* ⭐ PHASE C: Fire mode breathing */
        @keyframes momentum-fire-breathe {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.03);
            filter: brightness(1.1);
          }
        }

        /* ⭐ PHASE C: Fire mode burst */
        @keyframes fire-burst {
          0% {
            opacity: 1;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }

        .fire-burst {
          animation: fire-burst 1.5s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .momentum-aura-overlay {
            animation: none !important;
          }
          .fire-burst {
            display: none;
          }
        }
      `}</style>

      {/* Aura overlay */}
      <div
        className="momentum-aura-overlay fixed inset-0 pointer-events-none z-0"
        style={{
          background: auraConfig.gradient,
          animation: auraConfig.animation,
          transition: 'background 2s ease-out, opacity 1s ease-out',
        }}
        aria-hidden="true"
        data-momentum={glowLevel}
        data-momentum-vibe={vibe}
        data-momentum-score={score}
        data-momentum-fire={isFireMode || undefined}
      />

      {/* ⭐ PHASE C: Fire mode burst effect on activation */}
      {showFireBurst && (
        <div
          className="fire-burst fixed inset-0 pointer-events-none z-[1]"
          style={{
            background: `radial-gradient(circle at center, rgba(${COLORS.fire.energy500}, 0.3) 0%, transparent 50%)`,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

/**
 * Smaller aura for cards/sections
 * Now uses Deep Violet brand colors and responds to glow level
 * ⭐ PHASE C: Enhanced with fire mode support
 */
export function MomentumCardAura({ className = '', intensity = 'auto' }) {
  const { vibe, glowLevel, enabled, isFireMode } = useMomentumContext();

  if (!enabled) return null;

  // Calculate opacity based on glow level
  const opacityLevel = intensity === 'auto'
    ? Math.min(0.05 + (glowLevel * 0.02), 0.15)
    : intensity === 'subtle' ? 0.03
    : intensity === 'strong' ? 0.12
    : 0.05;

  // ⭐ PHASE C: Fire mode special treatment
  if (isFireMode) {
    return (
      <div
        className={`
          absolute inset-0 pointer-events-none rounded-xl
          transition-all duration-1000
          ${className}
        `}
        style={{
          background: `linear-gradient(to bottom right,
            rgba(${COLORS.brand.violet500}, ${opacityLevel * 1.5}),
            rgba(${COLORS.fire.energy500}, ${opacityLevel * 0.8}),
            transparent
          )`,
        }}
        aria-hidden="true"
        data-momentum={glowLevel}
        data-momentum-fire="true"
      />
    );
  }

  // Color configurations using new Deep Violet palette
  const colorConfig = {
    high: {
      from: `rgba(${COLORS.brand.violet500}, ${opacityLevel})`,
      to: 'transparent',
      className: 'from-brand-500/5 to-transparent',
    },
    low: {
      from: `rgba(${COLORS.cool.blue400}, ${opacityLevel * 0.8})`,
      to: 'transparent',
      className: 'from-blue-400/5 to-transparent',
    },
    neutral: {
      from: `rgba(${COLORS.brand.violet600}, ${opacityLevel * 0.8})`,
      to: 'transparent',
      className: 'from-brand-600/5 to-transparent',
    },
  };

  const config = colorConfig[vibe] || colorConfig.neutral;

  return (
    <div
      className={`
        absolute inset-0 pointer-events-none rounded-xl
        bg-gradient-to-br ${config.className}
        transition-all duration-1000
        ${className}
      `}
      style={{
        background: `linear-gradient(to bottom right, ${config.from}, ${config.to})`,
      }}
      aria-hidden="true"
      data-momentum={glowLevel}
    />
  );
}

/**
 * Momentum glow ring for specific elements (buttons, cards, etc.)
 * ⭐ PHASE C: Enhanced with fire mode
 */
export function MomentumGlowRing({
  children,
  className = '',
  as: Component = 'div',
  pulse = false,
  ...props
}) {
  const { glowLevel, glowClassName, enabled, isFireMode } = useMomentumContext();

  if (!enabled) {
    return <Component className={className} {...props}>{children}</Component>;
  }

  return (
    <Component
      className={`
        ${glowClassName}
        ${pulse && glowLevel >= 2 ? 'momentum-pulse' : ''}
        ${isFireMode ? 'momentum-fire-glow' : ''}
        ${className}
      `}
      data-momentum={glowLevel}
      data-momentum-fire={isFireMode || undefined}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * HOC to wrap any component with momentum glow
 * ⭐ PHASE C: Enhanced with fire mode
 */
export function withMomentumGlow(WrappedComponent) {
  return function MomentumGlowWrapper(props) {
    const { glowLevel, glowClassName, enabled, isFireMode } = useMomentumContext();

    return (
      <WrappedComponent
        {...props}
        data-momentum={enabled ? glowLevel : undefined}
        data-momentum-fire={enabled && isFireMode ? 'true' : undefined}
        className={`${props.className || ''} ${enabled ? glowClassName : ''} ${enabled && isFireMode ? 'momentum-fire-glow' : ''}`.trim()}
      />
    );
  };
}

/**
 * Hook to get momentum glow styles for inline application
 * ⭐ PHASE C: Enhanced with fire mode
 */
export function useMomentumAuraStyles() {
  const { vibe, glowLevel, enabled, isFireMode } = useMomentumContext();

  return useMemo(() => {
    if (!enabled) return {};

    const baseOpacity = 0.02 + (glowLevel * 0.015);

    // ⭐ PHASE C: Fire mode special styles
    if (isFireMode) {
      return {
        boxShadow: `
          0 0 ${30 + glowLevel * 10}px rgba(${COLORS.brand.violet500}, ${baseOpacity * 2}),
          0 0 ${20 + glowLevel * 5}px rgba(${COLORS.fire.energy500}, ${baseOpacity * 1.5})
        `,
        borderColor: `rgba(${COLORS.fire.energy500}, ${0.15 + glowLevel * 0.05})`,
      };
    }

    const glowStyles = {
      high: {
        boxShadow: `0 0 ${20 + glowLevel * 10}px rgba(${COLORS.brand.violet500}, ${baseOpacity * 2})`,
        borderColor: `rgba(${COLORS.brand.violet500}, ${0.1 + glowLevel * 0.05})`,
      },
      low: {
        boxShadow: `0 0 ${15 + glowLevel * 5}px rgba(${COLORS.cool.blue400}, ${baseOpacity})`,
        borderColor: `rgba(${COLORS.cool.blue400}, ${0.05 + glowLevel * 0.02})`,
      },
      neutral: {
        boxShadow: `0 0 ${15 + glowLevel * 8}px rgba(${COLORS.brand.violet600}, ${baseOpacity * 1.5})`,
        borderColor: `rgba(${COLORS.brand.violet600}, ${0.08 + glowLevel * 0.04})`,
      },
    };

    return glowStyles[vibe] || glowStyles.neutral;
  }, [vibe, glowLevel, enabled, isFireMode]);
}

/**
 * ⭐ PHASE C: Fire mode ambient particles (optional visual effect)
 */
export function FireModeParticles({ count = 8 }) {
  const { isFireMode, enabled } = useMomentumContext();

  if (!enabled || !isFireMode) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes float-particle {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        .fire-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(${COLORS.fire.energy500}, 0.8), rgba(${COLORS.brand.violet500}, 0.6));
          filter: blur(1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .fire-particle {
            display: none;
          }
        }
      `}</style>

      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="fire-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationName: 'float-particle',
            animationDuration: `${8 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 5}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
