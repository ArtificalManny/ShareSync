import React from 'react';

/**
 * ProgressBar - Smooth animated progress indicator
 * 
 * @param {number} value - Current progress value
 * @param {number} max - Maximum value (default: 100)
 * @param {string} color - Color theme: 'primary', 'success', 'warning', 'danger'
 * @param {string} size - Size: 'sm', 'md', 'lg'
 * @param {boolean} showLabel - Show percentage label above bar
 * @param {string} className - Additional CSS classes
 */
export default function ProgressBar({ 
  value, 
  max = 100, 
  color = 'primary',
  size = 'md',
  showLabel = false,
  className = ''
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const colorClasses = {
    primary: 'from-primary-500 to-primary-400',
    success: 'from-emerald-500 to-emerald-400',
    warning: 'from-amber-500 to-amber-400',
    danger: 'from-red-500 to-red-400'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="caption-text">Progress</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * <ProgressBar value={75} />
 * // Simple 75% progress bar
 * 
 * <ProgressBar value={30} max={50} color="success" showLabel />
 * // 60% progress (30/50) with label in green
 * 
 * <ProgressBar value={85} size="lg" color="warning" />
 * // Large warning-colored progress bar
 */
