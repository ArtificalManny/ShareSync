// src/components/common/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE B: Living Cards - Unified Card System
// ═══════════════════════════════════════════════════════════════════════════════
//
// BASE CARD TOKENS:
// - Border radius: rounded-xl (12px)
// - Background: bg-surface-1
// - Border: border-white/[0.06]
// - Hover: bg-surface-2, border-white/[0.1]
// - Padding: p-4 (compact) or p-5 (standard)
// - Shadow: none at rest, subtle on hover
//
// LIVING BEHAVIORS (Phase B):
// - state prop: 'idle' | 'priority' | 'completing' | 'completed' | 'stale' | 'blocked' | 'live'
// - Automatic breathing animation on hover
// - Momentum-responsive glow
// - State-specific visual treatments
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useLivingCard, getLivingStateClasses } from '../../hooks/useLivingCard';

/**
 * Card - Base card component with living behaviors
 */
export default function Card({ 
  children, 
  className = '',
  onClick,
  padding = 'standard', // 'compact' | 'standard' | 'spacious' | 'none'
  hover = true,
  selected = false,
  disabled = false,
  variant = 'default', // 'default' | 'ghost' | 'outline' | 'elevated' | 'glass' | 'subtle'
  as: Component = 'div',
  
  // Phase B: Living card props
  state = null, // 'idle' | 'priority' | 'completing' | 'completed' | 'stale' | 'blocked' | 'live' | 'done' | 'overdue'
  data = null, // Pass task/project data to auto-calculate state
  living = false, // Enable living card styles
  breathing = false, // Enable breathing animation
  momentum = null, // Override momentum level (0-5)
  
  ...props 
}) {
  // Calculate living state from data if provided
  const calculatedState = useLivingCard(data || {});
  const currentState = state || (data ? calculatedState.state : null);
  const livingClassName = currentState ? getLivingStateClasses(currentState) : '';

  const paddingClasses = {
    none: '',
    compact: 'p-4',
    standard: 'p-5',
    spacious: 'p-6',
  };

  const variantClasses = {
    default: 'bg-surface-1 border border-white/[0.06]',
    ghost: 'bg-transparent border border-transparent',
    outline: 'bg-transparent border border-white/[0.08]',
    elevated: 'bg-surface-1 border border-white/[0.06] shadow-card card-elevated',
    glass: 'card-glass',
    subtle: 'card-subtle',
  };

  const hoverClasses = hover && !disabled
    ? 'hover:bg-surface-2 hover:border-white/[0.1] cursor-pointer'
    : '';

  const selectedClasses = selected
    ? 'ring-2 ring-brand/50 border-brand/30'
    : '';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  // Combine all classes
  const cardClasses = [
    'group rounded-xl transition-all duration-200',
    living || currentState ? 'living-card' : 'card',
    livingClassName,
    paddingClasses[padding],
    variantClasses[variant],
    hoverClasses,
    selectedClasses,
    disabledClasses,
    breathing ? 'living-card--active' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      onClick={disabled ? undefined : onClick}
      className={cardClasses}
      data-living-state={currentState}
      data-momentum={momentum}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * CardHeader - Top section of card
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardBody - Main content area
 */
export function CardBody({ children, className = '' }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Bottom section with border
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 mt-4 border-t border-white/[0.06] ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardTitle - Main heading
 */
export function CardTitle({ children, className = '', as: Component = 'h3' }) {
  return (
    <Component className={`
      text-base font-semibold text-text-primary 
      group-hover:text-brand transition-colors
      task-title
      ${className}
    `}>
      {children}
    </Component>
  );
}

/**
 * CardMeta - Secondary text (dates, categories, etc.)
 */
export function CardMeta({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs text-text-tertiary ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardMetric - Large number with label
 */
export function CardMetric({ value, label, className = '' }) {
  return (
    <div className={`${className}`}>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

/**
 * CardBadge - Small status badge
 */
export function CardBadge({ 
  children, 
  variant = 'default', // 'default' | 'brand' | 'success' | 'warning' | 'error' | 'live'
  className = '' 
}) {
  const variantClasses = {
    default: 'bg-surface-2 text-text-tertiary',
    brand: 'bg-brand/10 text-brand',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    live: 'bg-cyan-500/10 text-cyan-500',
  };

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-md 
      text-[10px] font-medium
      ${variantClasses[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}

/**
 * CardIconBox - Icon container with consistent styling
 */
export function CardIconBox({ 
  children, 
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'default', // 'default' | 'brand' | 'success' | 'warning' | 'error' | 'live'
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  };

  const variantClasses = {
    default: 'bg-surface-2 group-hover:bg-brand/10',
    brand: 'bg-brand/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    error: 'bg-error/10',
    live: 'bg-cyan-500/10',
  };

  return (
    <div className={`
      rounded-xl flex items-center justify-center shrink-0
      transition-colors duration-200
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * CardProgress - Progress bar with Phase 7 purple intensity + Phase B shimmer
 */
export function CardProgress({ 
  value = 0, 
  showLabel = true,
  size = 'sm', // 'xs' | 'sm' | 'md'
  shimmer = false, // Enable shimmer effect for "completing" state
  className = '' 
}) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const isComplete = percentage >= 100;
  const isNearComplete = percentage >= 80;

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
  };

  // Phase 7: Purple intensity, not traffic lights
  // Phase B: Cyan for near-complete
  const getProgressFillClass = () => {
    if (isComplete) return 'bg-success';
    if (isNearComplete) return 'bg-cyan-500';
    if (percentage >= 67) return 'bg-brand-400';
    if (percentage >= 34) return 'bg-brand';
    return 'bg-brand-700';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className={`
          card-progress bg-surface-3 rounded-full overflow-hidden relative
          ${sizeClasses[size]}
        `}>
          <div 
            className={`
              card-progress-fill h-full rounded-full transition-all duration-500 
              ${getProgressFillClass()}
            `}
            style={{ width: `${percentage}%` }}
          />
          {/* Shimmer effect for completing state */}
          {shimmer && isNearComplete && !isComplete && (
            <div className="
              absolute inset-0 
              bg-gradient-to-r from-transparent via-white/30 to-transparent
              animate-[completing-shimmer_2s_ease-in-out_infinite]
            " />
          )}
        </div>
      </div>
      {showLabel && (
        <span className={`
          text-xs font-medium w-8 text-right
          ${isComplete ? 'text-success' : isNearComplete ? 'text-cyan-500' : 'text-text-secondary'}
        `}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/**
 * CardAccentBar - Left side accent indicator
 */
export function CardAccentBar({
  variant = 'brand', // 'brand' | 'live' | 'success' | 'warning' | 'error' | 'energy'
  className = '',
}) {
  const variantClasses = {
    brand: 'bg-gradient-to-b from-brand-400 to-brand-600',
    live: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
    success: 'bg-gradient-to-b from-success-400 to-success-600',
    warning: 'bg-gradient-to-b from-warning-400 to-warning-600',
    error: 'bg-gradient-to-b from-error-400 to-error-600',
    energy: 'bg-gradient-to-b from-energy-400 to-energy-600',
  };

  return (
    <div className={`
      accent-bar__left
      absolute left-0 top-0 bottom-0 w-1
      rounded-l-xl
      ${variantClasses[variant]}
      ${className}
    `} />
  );
}
