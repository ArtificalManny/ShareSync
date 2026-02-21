// src/components/ui/ProgressBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROGRESS BAR v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES IN v4.0:
// - Updated to light theme colors
// - All Phase 8 micro-interactions preserved
// - NO BACKEND CHANGES
//
// ENHANCEMENTS:
// - Threshold crossing animations (25%, 50%, 75%, 100%)
// - Pulse effect when milestones are reached
// - Shine sweep at 100% completion
// - Count-up animation for label (optional)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';

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
    
    const duration = 500;
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
  
  // ✅ UPDATED: Light theme size classes
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  // ✅ UPDATED: Light theme progress fill colors
  const getProgressFillClass = () => {
    if (isComplete) return 'bg-emerald-500';
    if (percentage >= 67) return 'bg-violet-400';
    if (percentage >= 34) return 'bg-violet-500';
    return 'bg-violet-600';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Progress</span>
          <span className={`
            font-semibold tabular-nums
            ${isComplete ? 'text-emerald-600' : 'text-slate-700'}
            ${isPulsing ? 'animate-bounce-subtle' : ''}
          `}>
            {Math.round(displayValue)}%
          </span>
        </div>
      )}
      
      {/* Track - ✅ UPDATED: Light theme */}
      <div className={`
        relative rounded-full overflow-hidden
        bg-slate-200
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
                  ${percentage >= threshold ? 'opacity-0' : 'opacity-30'}
                  bg-slate-400
                `}
                style={{ left: `${threshold}%` }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Inline styles for animations */}
      <style>{`
        .progress-pulse {
          animation: progress-pulse 0.6s ease-out;
        }
        
        @keyframes progress-pulse {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          100% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
        }
        
        .progress-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shine 1.2s ease-out forwards;
        }
        
        @keyframes shine {
          to { left: 100%; }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 0.5s ease-out;
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

/**
 * ProgressRing - Circular progress indicator with micro-interactions
 * ✅ UPDATED: Light theme colors
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

  // ✅ UPDATED: Light theme colors
  const getStrokeColor = () => {
    if (isComplete) return '#10B981'; // emerald-500
    if (percentage >= 67) return '#A78BFA'; // violet-400
    if (percentage >= 34) return '#8B5CF6'; // violet-500
    return '#7C3AED'; // violet-600
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulse ring (behind) */}
      {isPulsing && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{ 
            boxShadow: `0 0 0 0 ${getStrokeColor()}`,
            animation: 'ring-pulse 0.6s ease-out',
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${isPulsing ? 'scale-105' : 'scale-100'} transition-transform duration-200`}
      >
        {/* Track - ✅ UPDATED: Light theme */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
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
          ${isComplete ? 'text-emerald-600' : 'text-slate-700'}
          ${isPulsing ? 'scale-110' : 'scale-100'}
          transition-transform duration-200
        `}>
          {Math.round(percentage)}
        </span>
      )}
      
      <style>{`
        @keyframes ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          100% { box-shadow: 0 0 0 12px rgba(139, 92, 246, 0); }
        }
      `}</style>
    </div>
  );
}
