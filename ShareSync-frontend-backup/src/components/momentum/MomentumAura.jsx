// src/components/momentum/MomentumAura.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Background Aura
// ═══════════════════════════════════════════════════════════════════════════════
// A very subtle full-screen gradient overlay that shifts based on momentum.
// 
// NOW USING DEEP VIOLET SIGNATURE PALETTE:
// - High momentum: Deep Violet → Electric Cyan gradient (energetic)
// - Low momentum: Cool blue tint (calm, slightly muted)
// - Neutral: Very subtle Deep Violet brand tint
//
// The glow INTENSIFIES based on the 0-5 momentum level from MomentumContext.
// This should be BARELY perceptible at low levels - it's felt, not seen.
// At high levels (4-5), it becomes a subtle but noticeable brand presence.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
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
};

export default function MomentumAura() {
  const { vibe, score, glowLevel, enabled } = useMomentumContext();

  // Build the aura configuration based on vibe AND glow level
  const auraConfig = useMemo(() => {
    // Base opacity scales with glow level (0-5)
    const baseOpacity = 0.02 + (glowLevel * 0.015); // 0.02 to 0.095
    
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
        animation: 'none', // No animation for low momentum - stillness
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
  }, [vibe, glowLevel]);

  if (!enabled) return null;

  return (
    <>
      {/* Inject keyframes - now using CSS variables for dynamic intensity */}
      <style>{`
        @keyframes momentum-breathe {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.02);
          }
        }
        @keyframes momentum-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes momentum-glow-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.1); }
        }
        
        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .momentum-aura-overlay {
            animation: none !important;
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
      />
    </>
  );
}

/**
 * Smaller aura for cards/sections
 * Now uses Deep Violet brand colors and responds to glow level
 */
export function MomentumCardAura({ className = '', intensity = 'auto' }) {
  const { vibe, glowLevel, enabled } = useMomentumContext();

  if (!enabled) return null;

  // Calculate opacity based on glow level
  const opacityLevel = intensity === 'auto' 
    ? Math.min(0.05 + (glowLevel * 0.02), 0.15) 
    : intensity === 'subtle' ? 0.03 
    : intensity === 'strong' ? 0.12 
    : 0.05;

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
 * Applies the signature Deep Violet glow based on momentum level
 */
export function MomentumGlowRing({ 
  children, 
  className = '', 
  as: Component = 'div',
  pulse = false,
  ...props 
}) {
  const { glowLevel, glowClassName, enabled } = useMomentumContext();

  if (!enabled) {
    return <Component className={className} {...props}>{children}</Component>;
  }

  return (
    <Component
      className={`
        ${glowClassName}
        ${pulse && glowLevel >= 2 ? 'momentum-pulse' : ''}
        ${className}
      `}
      data-momentum={glowLevel}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * HOC to wrap any component with momentum glow
 */
export function withMomentumGlow(WrappedComponent) {
  return function MomentumGlowWrapper(props) {
    const { glowLevel, glowClassName, enabled } = useMomentumContext();
    
    return (
      <WrappedComponent
        {...props}
        data-momentum={enabled ? glowLevel : undefined}
        className={`${props.className || ''} ${enabled ? glowClassName : ''}`.trim()}
      />
    );
  };
}

/**
 * Hook to get momentum glow styles for inline application
 */
export function useMomentumAuraStyles() {
  const { vibe, glowLevel, enabled } = useMomentumContext();

  return useMemo(() => {
    if (!enabled) return {};

    const baseOpacity = 0.02 + (glowLevel * 0.015);

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
  }, [vibe, glowLevel, enabled]);
}
