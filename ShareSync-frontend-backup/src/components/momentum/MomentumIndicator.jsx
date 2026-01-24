// src/components/momentum/MomentumIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Visual Level Indicator
// ═══════════════════════════════════════════════════════════════════════════════
//
// A visual indicator showing current momentum level.
// Can be displayed as:
// - Compact: Just a badge/pill
// - Standard: Badge with progress bar
// - Expanded: Full details with message
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { 
  Flame, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Battery,
  BatteryCharging,
  BatteryFull,
  Sparkles,
} from 'lucide-react';
import { useMomentumEngine } from '../../hooks/useMomentumEngine';

/**
 * Level configurations
 */
const LEVEL_CONFIG = {
  0: {
    name: 'Idle',
    icon: Battery,
    color: 'text-text-tertiary',
    bgColor: 'bg-surface-2',
    borderColor: 'border-white/[0.06]',
    glowColor: 'transparent',
  },
  1: {
    name: 'Warming',
    icon: BatteryCharging,
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    borderColor: 'border-brand-500/20',
    glowColor: 'rgb(var(--brand-500-rgb) / 0.1)',
  },
  2: {
    name: 'Building',
    icon: Zap,
    color: 'text-brand-500',
    bgColor: 'bg-brand-500/15',
    borderColor: 'border-brand-500/25',
    glowColor: 'rgb(var(--brand-500-rgb) / 0.15)',
  },
  3: {
    name: 'Flowing',
    icon: TrendingUp,
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/20',
    borderColor: 'border-brand-400/30',
    glowColor: 'rgb(var(--brand-500-rgb) / 0.2)',
  },
  4: {
    name: 'Peak',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-400/30',
    glowColor: 'rgb(var(--cyan-500-rgb) / 0.25)',
  },
  5: {
    name: 'On Fire',
    icon: Flame,
    color: 'text-energy-500',
    bgColor: 'bg-energy-500/20',
    borderColor: 'border-energy-500/30',
    glowColor: 'rgb(var(--energy-500-rgb) / 0.3)',
  },
};

/**
 * Trend icon component
 */
function TrendIcon({ trend, className = '' }) {
  if (trend === 'rising') {
    return <TrendingUp className={`w-3 h-3 text-success ${className}`} />;
  }
  if (trend === 'falling') {
    return <TrendingDown className={`w-3 h-3 text-warning ${className}`} />;
  }
  return <Minus className={`w-3 h-3 text-text-tertiary ${className}`} />;
}

/**
 * MomentumIndicator - Compact badge showing current level
 */
export default function MomentumIndicator({
  variant = 'standard', // 'compact' | 'standard' | 'expanded' | 'minimal'
  showScore = false,
  showTrend = true,
  showProgress = true,
  animated = true,
  className = '',
}) {
  const {
    score,
    level,
    levelMeta,
    levelProgress,
    isFireMode,
    trend,
    message,
    timeToNextLevel,
    isTransitioning,
  } = useMomentumEngine();

  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[0];
  const Icon = config.icon;

  // Minimal variant - just an icon
  if (variant === 'minimal') {
    return (
      <div 
        className={`
          flex items-center justify-center
          w-8 h-8 rounded-lg
          ${config.bgColor} ${config.borderColor} border
          transition-all duration-500
          ${animated && isFireMode ? 'animate-pulse' : ''}
          ${className}
        `}
        title={`Momentum: ${levelMeta.label} (${score})`}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
    );
  }

  // Compact variant - pill badge
  if (variant === 'compact') {
    return (
      <div 
        className={`
          inline-flex items-center gap-1.5
          px-2.5 py-1 rounded-full
          ${config.bgColor} ${config.borderColor} border
          transition-all duration-500
          ${animated && isFireMode ? 'animate-pulse' : ''}
          ${className}
        `}
        style={{
          boxShadow: level >= 2 ? `0 0 20px ${config.glowColor}` : 'none',
        }}
      >
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>
          {config.name}
        </span>
        {showTrend && (
          <TrendIcon trend={trend} />
        )}
      </div>
    );
  }

  // Standard variant - badge with progress
  if (variant === 'standard') {
    return (
      <div 
        className={`
          flex items-center gap-3
          px-3 py-2 rounded-xl
          ${config.bgColor} ${config.borderColor} border
          transition-all duration-500
          ${className}
        `}
        style={{
          boxShadow: level >= 2 ? `0 0 24px ${config.glowColor}` : 'none',
        }}
      >
        {/* Icon */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${level >= 3 ? 'bg-white/10' : 'bg-surface-2'}
          ${animated && isFireMode ? 'animate-bounce' : ''}
        `}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${config.color}`}>
              {config.name}
            </span>
            {showScore && (
              <span className="text-xs text-text-tertiary">
                {score}
              </span>
            )}
            {showTrend && (
              <TrendIcon trend={trend} />
            )}
          </div>
          
          {/* Progress bar */}
          {showProgress && level < 5 && (
            <div className="mt-1.5 h-1 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className={`
                  h-full rounded-full transition-all duration-700
                  ${level >= 3 ? 'bg-cyan-500' : 'bg-brand-500'}
                `}
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>
          )}
          
          {/* Fire mode indicator */}
          {isFireMode && (
            <div className="mt-1 text-[10px] text-energy-500 font-medium animate-pulse">
              🔥 Maximum intensity!
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded variant - full details
  return (
    <div 
      className={`
        p-4 rounded-xl
        ${config.bgColor} ${config.borderColor} border
        transition-all duration-500
        ${className}
      `}
      style={{
        boxShadow: level >= 2 ? `0 0 30px ${config.glowColor}` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${level >= 3 ? 'bg-white/10' : 'bg-surface-2'}
            ${animated && isFireMode ? 'animate-bounce' : ''}
          `}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className={`text-sm font-semibold ${config.color}`}>
              {config.name}
            </div>
            <div className="text-xs text-text-tertiary">
              Level {level}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${config.color} tabular-nums`}>
            {score}
          </div>
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <TrendIcon trend={trend} />
            <span>{trend}</span>
          </div>
        </div>
      </div>

      {/* Progress to next level */}
      {level < 5 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
            <span>Progress to Level {level + 1}</span>
            <span>{Math.round(levelProgress * 100)}%</span>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <div 
              className={`
                h-full rounded-full transition-all duration-700
                ${level >= 3 ? 'bg-gradient-to-r from-brand-500 to-cyan-500' : 'bg-brand-500'}
              `}
              style={{ width: `${levelProgress * 100}%` }}
            />
          </div>
          {timeToNextLevel && (
            <div className="mt-1 text-[10px] text-text-tertiary">
              {timeToNextLevel}
            </div>
          )}
        </div>
      )}

      {/* Message */}
      <div className={`
        text-sm ${level >= 3 ? 'text-text-primary' : 'text-text-secondary'}
        ${isTransitioning ? 'opacity-70' : 'opacity-100'}
        transition-opacity duration-300
      `}>
        "{message}"
      </div>

      {/* Fire mode special content */}
      {isFireMode && (
        <div className="
          mt-3 pt-3 border-t border-white/10
          text-center
        ">
          <div className="text-energy-500 font-semibold animate-pulse">
            🔥 FIRE MODE ACTIVE 🔥
          </div>
          <div className="text-[10px] text-text-tertiary mt-1">
            You're in the top 5% of productivity right now
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline momentum badge for use in headers, etc.
 */
export function MomentumBadge({ className = '' }) {
  const { level, isFireMode } = useMomentumEngine();
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[0];
  const Icon = config.icon;

  return (
    <span 
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5 rounded-full
        text-[10px] font-medium
        ${config.bgColor} ${config.color}
        ${isFireMode ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      {isFireMode ? '🔥' : config.name}
    </span>
  );
}

/**
 * Momentum level dots for compact display
 */
export function MomentumDots({ className = '' }) {
  const { level } = useMomentumEngine();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`
            w-1.5 h-1.5 rounded-full transition-all duration-300
            ${i <= level 
              ? i === 5 ? 'bg-energy-500' : 'bg-brand-500' 
              : 'bg-surface-3'
            }
            ${i === level ? 'scale-125' : 'scale-100'}
          `}
        />
      ))}
    </div>
  );
}
