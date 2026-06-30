// src/components/momentum/MomentumPulse.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Micro-animation Wrapper
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps elements to add subtle "alive" animations when momentum is high.
// Animations are disabled/reduced when momentum is low.
//
// Usage:
//   <MomentumPulse>
//     <ProgressRing />
//   </MomentumPulse>
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useMomentumContext } from '../../contexts/MomentumContext';

/**
 * Wrapper that adds subtle pulse animation based on momentum
 */
export default function MomentumPulse({ 
  children, 
  intensity = 'medium', // 'subtle' | 'medium' | 'strong'
  className = '',
}) {
  const { isHighMomentum, isLowMomentum, animationIntensity, enabled } = useMomentumContext();

  // If disabled or low momentum, just render children
  if (!enabled || isLowMomentum) {
    return <>{children}</>;
  }

  // Animation configurations
  const animations = {
    subtle: {
      animation: isHighMomentum ? 'momentum-pulse-subtle 4s ease-in-out infinite' : 'none',
      scale: '1.005',
    },
    medium: {
      animation: isHighMomentum ? 'momentum-pulse-medium 3s ease-in-out infinite' : 'none',
      scale: '1.01',
    },
    strong: {
      animation: isHighMomentum ? 'momentum-pulse-strong 2s ease-in-out infinite' : 'none',
      scale: '1.02',
    },
  };

  const config = animations[intensity];

  return (
    <>
      <style>{`
        @keyframes momentum-pulse-subtle {
          0%, Available { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.005); opacity: 0.95; }
        }
        @keyframes momentum-pulse-medium {
          0%, Available { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.01); opacity: 0.92; }
        }
        @keyframes momentum-pulse-strong {
          0%, Available { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
      `}</style>
      
      <div
        className={className}
        style={{
          animation: config.animation,
          willChange: isHighMomentum ? 'transform, opacity' : 'auto',
        }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * Glow effect that intensifies with momentum
 */
export function MomentumGlow({ 
  children, 
  color = 'brand', // 'brand' | 'success' | 'warning'
  className = '',
}) {
  const { isHighMomentum, score, enabled } = useMomentumContext();

  if (!enabled) {
    return <>{children}</>;
  }

  const colors = {
    brand: 'rgba(139, 92, 246, VAR)',
    success: 'rgba(16, 185, 129, VAR)',
    warning: 'rgba(251, 191, 36, VAR)',
  };

  // Glow intensity based on momentum score
  const glowOpacity = isHighMomentum ? 0.3 : score > 50 ? 0.15 : 0.05;
  const glowColor = colors[color].replace('VAR', String(glowOpacity));

  return (
    <div
      className={`relative ${className}`}
      style={{
        filter: isHighMomentum ? `drop-shadow(0 0 8px ${glowColor})` : 'none',
        transition: 'filter 1s ease-out',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Number counter that animates more energetically with high momentum
 */
export function MomentumNumber({ 
  value, 
  suffix = '',
  className = '',
}) {
  const { isHighMomentum, enabled } = useMomentumContext();

  return (
    <span
      className={`
        tabular-nums transition-all duration-300
        ${isHighMomentum && enabled ? 'text-brand font-bold' : ''}
        ${className}
      `}
      style={{
        textShadow: isHighMomentum && enabled 
          ? '0 0 10px rgba(139, 92, 246, 0.3)' 
          : 'none',
      }}
    >
      {value}{suffix}
    </span>
  );
}
