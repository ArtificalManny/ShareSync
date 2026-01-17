import React from 'react';

/**
 * ProgressBar - Phase 7 Visual Cohesion
 * 
 * PHILOSOPHY: Progress is NEUTRAL, not emotional.
 * - Uses purple intensity based on completion, NOT red/green
 * - 100% complete gets teal celebration color
 * - No "danger" state for progress (that's for errors only)
 * 
 * @param {number} value - Current progress value
 * @param {number} max - Maximum value (default: 100)
 * @param {string} size - Size: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} showLabel - Show percentage label
 * @param {boolean} animate - Enable pulse animation on high progress
 * @param {string} className - Additional CSS classes
 */
export default function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md',
  showLabel = false,
  animate = false,
  className = ''
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isComplete = percentage >= 100;
  
  // Size classes
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  // Progress fill color based on completion percentage
  // Uses purple intensity, NOT semantic red/green
  const getProgressFillClass = () => {
    if (isComplete) return 'bg-success'; // Teal celebration at 100%
    if (percentage >= 67) return 'bg-brand-400'; // Brighter purple
    if (percentage >= 34) return 'bg-brand'; // Standard purple
    return 'bg-brand-700'; // Darker purple for low progress
  };

  // Optional pulse animation when close to completion
  const animationClass = animate && percentage >= 80 && !isComplete 
    ? 'animate-progress' 
    : '';

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Progress</span>
          <span className={`font-semibold ${isComplete ? 'text-success' : 'text-text-primary'}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      {/* Track */}
      <div className={`
        rounded-full overflow-hidden
        bg-surface-2
        ${sizeClasses[size]}
      `}>
        {/* Fill */}
        <div 
          className={`
            h-full rounded-full
            transition-all duration-500 ease-out
            ${getProgressFillClass()}
            ${animationClass}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

/**
 * ProgressRing - Circular progress indicator (for XP, levels, etc.)
 */
export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  showValue = true,
  className = ''
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isComplete = percentage >= 100;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on completion
  const getStrokeColor = () => {
    if (isComplete) return 'var(--success-500)';
    if (percentage >= 67) return 'var(--brand-400)';
    if (percentage >= 34) return 'var(--brand-500)';
    return 'var(--brand-700)';
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showValue && (
        <span className={`
          absolute text-xs font-semibold
          ${isComplete ? 'text-success' : 'text-text-primary'}
        `}>
          {Math.round(percentage)}
        </span>
      )}
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * <ProgressBar value={75} />
 * // Purple progress bar at 75%
 * 
 * <ProgressBar value={100} showLabel />
 * // Teal (complete) progress bar with label
 * 
 * <ProgressBar value={25} size="lg" />
 * // Large bar with darker purple (low progress)
 * 
 * <ProgressRing value={75} size={48} />
 * // Circular progress ring
 */
