import React, { useEffect, useRef, useState } from 'react';

/**
 * ProgressBar - Phase 8: Micro-Interactions
 * 
 * ENHANCEMENTS:
 * - Threshold crossing animations (25%, 50%, 75%, 100%)
 * - Pulse effect when milestones are reached
 * - Shine sweep at 100% completion
 * - Count-up animation for label (optional)
 * 
 * @param {number} value - Current progress value
 * @param {number} max - Maximum value (default: 100)
 * @param {string} size - Size: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} showLabel - Show percentage label
 * @param {boolean} animate - Enable milestone animations
 * @param {boolean} countUp - Animate the number counting up
 * @param {string} className - Additional CSS classes
 */
export default function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md',
  showLabel = false,
  animate = true,
  countUp = false,
  className = ''
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isComplete = percentage >= 100;
  const prevPercentageRef = useRef(percentage);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isShining, setIsShining] = useState(false);
  const [displayValue, setDisplayValue] = useState(countUp ? 0 : percentage);
  
  // Thresholds that trigger celebration
  const THRESHOLDS = [25, 50, 75, 100];
  
  // Detect threshold crossings
  useEffect(() => {
    if (!animate) return;
    
    const prevPct = prevPercentageRef.current;
    const currentPct = percentage;
    
    // Check if we crossed any threshold (going up)
    const crossedThreshold = THRESHOLDS.some(threshold => 
      prevPct < threshold && currentPct >= threshold
    );
    
    if (crossedThreshold) {
      // Trigger pulse animation
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      
      // At 100%, also trigger shine
      if (currentPct >= 100 && prevPct < 100) {
        setIsShining(true);
        setTimeout(() => setIsShining(false), 1200);
      }
      
      return () => clearTimeout(timer);
    }
    
    prevPercentageRef.current = currentPct;
  }, [percentage, animate]);
  
  // Count-up animation for display value
  useEffect(() => {
    if (!countUp) {
      setDisplayValue(percentage);
      return;
    }
    
    const duration = 500; // ms
    const startValue = displayValue;
    const endValue = percentage;
    const startTime = performance.now();
    
    const animateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    requestAnimationFrame(animateValue);
  }, [percentage, countUp]);
  
  // Size classes
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  // Progress fill color based on completion percentage
  const getProgressFillClass = () => {
    if (isComplete) return 'bg-success';
    if (percentage >= 67) return 'bg-brand-400';
    if (percentage >= 34) return 'bg-brand';
    return 'bg-brand-700';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Progress</span>
          <span className={`
            font-semibold tabular-nums
            ${isComplete ? 'text-success' : 'text-text-primary'}
            ${isPulsing ? 'animate-bounce-subtle' : ''}
          `}>
            {Math.round(displayValue)}%
          </span>
        </div>
      )}
      
      {/* Track */}
      <div className={`
        relative rounded-full overflow-hidden
        bg-surface-2
        ${sizeClasses[size]}
        ${isPulsing ? 'progress-pulse' : ''}
      `}>
        {/* Fill */}
        <div 
          className={`
            h-full rounded-full
            transition-all duration-500 ease-out
            ${getProgressFillClass()}
            ${isShining ? 'progress-shine' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
        
        {/* Threshold markers (subtle) */}
        {animate && size !== 'xs' && (
          <div className="absolute inset-0 flex pointer-events-none">
            {[25, 50, 75].map(threshold => (
              <div 
                key={threshold}
                className={`
                  absolute top-0 bottom-0 w-px
                  transition-opacity duration-300
                  ${percentage >= threshold ? 'opacity-0' : 'opacity-20'}
                  bg-white/20
                `}
                style={{ left: `${threshold}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProgressRing - Circular progress indicator with micro-interactions
 */
export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  showValue = true,
  animate = true,
  className = ''
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isComplete = percentage >= 100;
  const prevPercentageRef = useRef(percentage);
  const [isPulsing, setIsPulsing] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Detect threshold crossings
  useEffect(() => {
    if (!animate) return;
    
    const prevPct = prevPercentageRef.current;
    const THRESHOLDS = [25, 50, 75, 100];
    
    const crossedThreshold = THRESHOLDS.some(threshold => 
      prevPct < threshold && percentage >= threshold
    );
    
    if (crossedThreshold) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    
    prevPercentageRef.current = percentage;
  }, [percentage, animate]);

  // Color based on completion
  const getStrokeColor = () => {
    if (isComplete) return 'var(--success-500)';
    if (percentage >= 67) return 'var(--brand-400)';
    if (percentage >= 34) return 'var(--brand-500)';
    return 'var(--brand-700)';
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulse ring (behind) */}
      {isPulsing && (
        <div 
          className="absolute inset-0 rounded-full ring-pulse"
          style={{ 
            boxShadow: `0 0 0 0 ${getStrokeColor()}`,
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${isPulsing ? 'scale-105' : 'scale-100'} transition-transform duration-200`}
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
          absolute text-xs font-semibold tabular-nums
          ${isComplete ? 'text-success' : 'text-text-primary'}
          ${isPulsing ? 'scale-110' : 'scale-100'}
          transition-transform duration-200
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
 * <ProgressBar value={75} animate />
 * // Pulses when crossing 75% threshold
 * 
 * <ProgressBar value={100} showLabel countUp />
 * // Teal bar with count-up animation and shine effect
 * 
 * <ProgressRing value={50} size={48} animate />
 * // Ring that pulses at 50%
 */
