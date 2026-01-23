// src/components/ui/LivingCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE B: Living Cards - Core Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// Cards that respond to their content and state. Not just containers - 
// living indicators that breathe, pulse, and communicate status visually.
//
// USAGE:
// <LivingCard state="priority" progress={65}>
//   <TaskContent />
// </LivingCard>
//
// Or with automatic state calculation:
// <LivingCard data={{ priority: 'high', progress: 65, dueDate: '2024-01-20' }}>
//   <TaskContent />
// </LivingCard>
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { forwardRef, useMemo } from 'react';
import { useLivingCard, getLivingStateClasses, getLivingStateMeta } from '../../hooks/useLivingCard';
import { AlertTriangle, CheckCircle, Clock, XCircle, Radio, TrendingUp, Zap } from 'lucide-react';

// Icon mapping for state badges
const stateIcons = {
  priority: AlertTriangle,
  completing: TrendingUp,
  completed: CheckCircle,
  done: CheckCircle,
  stale: Clock,
  blocked: XCircle,
  live: Radio,
  overdue: AlertTriangle,
  active: Zap,
};

/**
 * LivingCard - A card that responds to its content state
 */
const LivingCard = forwardRef(({
  children,
  className = '',
  
  // State can be passed directly or calculated from data
  state: forcedState = null,
  data = null,
  
  // Card options
  variant = 'default', // 'default' | 'featured' | 'intelligence' | 'subtle'
  padding = 'standard', // 'none' | 'compact' | 'standard' | 'spacious'
  hover = true,
  clickable = false,
  selected = false,
  disabled = false,
  
  // Show state badge
  showStateBadge = false,
  
  // Progress (for completing state shimmer)
  progress = null,
  
  // Event handlers
  onClick,
  onMouseEnter,
  onMouseLeave,
  
  // HTML element
  as: Component = 'div',
  
  ...props
}, ref) => {
  
  // Calculate living state from data if provided
  const calculatedState = useLivingCard(data || {});
  
  // Use forced state or calculated state
  const currentState = forcedState || (data ? calculatedState.state : 'idle');
  const stateClassName = getLivingStateClasses(currentState);
  const stateMeta = getLivingStateMeta(currentState);
  
  // Padding classes
  const paddingClasses = {
    none: '',
    compact: 'p-3',
    standard: 'p-4',
    spacious: 'p-5',
  };
  
  // Variant classes (additional to state)
  const variantClasses = {
    default: '',
    featured: 'living-card--featured',
    intelligence: 'living-card--intelligence',
    subtle: 'opacity-90 hover:opacity-100',
  };
  
  // Combine all classes
  const cardClasses = useMemo(() => {
    return [
      'living-card',
      stateClassName,
      variantClasses[variant] || '',
      paddingClasses[padding],
      hover && !disabled ? 'cursor-pointer' : '',
      clickable ? 'cursor-pointer' : '',
      selected ? 'ring-2 ring-brand-500/50' : '',
      disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      className,
    ].filter(Boolean).join(' ');
  }, [stateClassName, variant, padding, hover, clickable, selected, disabled, className]);
  
  // Get state icon
  const StateIcon = stateIcons[currentState];
  
  // Handle click
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };
  
  return (
    <Component
      ref={ref}
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-living-state={currentState}
      data-progress={progress}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {/* State badge (optional) */}
      {showStateBadge && stateMeta.label && (
        <div className={`
          absolute top-2 right-2 flex items-center gap-1
          px-2 py-1 rounded-md text-[10px] font-medium
          bg-surface-2 border border-white/[0.06]
          text-${stateMeta.color}
        `}>
          {StateIcon && <StateIcon className="w-3 h-3" />}
          {stateMeta.label}
        </div>
      )}
      
      {/* Card content */}
      {children}
      
      {/* Nudge action slot for stale cards */}
      {currentState === 'stale' && (
        <div className="nudge-action absolute bottom-3 right-3">
          {/* This slot can be filled by parent or shows default */}
        </div>
      )}
    </Component>
  );
});

LivingCard.displayName = 'LivingCard';

/**
 * LivingCardHeader - Header section with optional icon
 */
export function LivingCardHeader({ 
  children, 
  icon,
  className = '' 
}) {
  return (
    <div className={`flex items-start gap-3 mb-3 ${className}`}>
      {icon && (
        <div className="
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          bg-surface-2 group-hover:bg-brand/10 transition-colors
        ">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

/**
 * LivingCardTitle - Main title with hover effect
 */
export function LivingCardTitle({ 
  children, 
  className = '',
  as: Component = 'h4',
}) {
  return (
    <Component className={`
      text-sm font-medium text-text-primary
      group-hover:text-brand transition-colors
      task-title
      ${className}
    `}>
      {children}
    </Component>
  );
}

/**
 * LivingCardMeta - Secondary info (dates, tags, etc.)
 */
export function LivingCardMeta({ children, className = '' }) {
  return (
    <div className={`
      flex items-center gap-1.5 mt-1
      text-xs text-text-tertiary
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * LivingCardProgress - Progress bar with state-aware styling
 */
export function LivingCardProgress({ 
  value = 0, 
  showLabel = true,
  size = 'sm',
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
  
  // Color based on progress
  const getProgressColor = () => {
    if (isComplete) return 'bg-success';
    if (isNearComplete) return 'bg-cyan-500';
    if (percentage >= 50) return 'bg-brand-400';
    return 'bg-brand-600';
  };
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className={`
          card-progress bg-surface-3 rounded-full overflow-hidden
          ${sizeClasses[size]}
        `}>
          <div 
            className={`
              card-progress-fill h-full rounded-full 
              transition-all duration-500
              ${getProgressColor()}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {showLabel && (
        <span className={`
          text-xs font-medium w-8 text-right
          ${isComplete ? 'text-success' : 'text-text-secondary'}
        `}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/**
 * LivingCardBadge - Small status badge
 */
export function LivingCardBadge({ 
  children, 
  variant = 'default',
  icon,
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
      {icon}
      {children}
    </span>
  );
}

/**
 * LivingCardActions - Footer actions area
 */
export function LivingCardActions({ children, className = '' }) {
  return (
    <div className={`
      flex items-center gap-2 mt-3 pt-3
      border-t border-white/[0.06]
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * PriorityDot - Visual priority indicator
 */
export function PriorityDot({ priority = 'normal', className = '' }) {
  const priorityClasses = {
    low: 'priority-dot--low bg-surface-3',
    normal: 'priority-dot--normal bg-text-tertiary',
    high: 'priority-dot--high bg-warning-500',
    urgent: 'priority-dot--urgent bg-error-500',
  };
  
  return (
    <span className={`
      priority-dot inline-block w-2 h-2 rounded-full
      ${priorityClasses[priority] || priorityClasses.normal}
      ${className}
    `} />
  );
}

// Export all components
export {
  LivingCard as default,
  LivingCard,
};
