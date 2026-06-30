// src/components/ui/ProgressBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROGRESS BAR v4.0 - Light Theme & Dark Mode Adapted
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Gradient fill styles for progress bar
const GRADIENT_FILLS = {
  ocean: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)',
  brand: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
  aurora: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)',
  sunset: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)',
  success: 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)',
  energy: 'linear-gradient(90deg, #FB923C 0%, #F43F5E 100%)',
  warning: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
  danger: 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)',
  // Legacy solid colors (backward compatibility)
  violet: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
  blue: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
  teal: 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)',
};

// Pulse colors for each variant
const PULSE_COLORS = {
  ocean: 'rgba(6, 182, 212, 0.4)',
  brand: 'rgba(139, 92, 246, 0.4)',
  aurora: 'rgba(139, 92, 246, 0.4)',
  sunset: 'rgba(236, 72, 153, 0.4)',
  success: 'rgba(45, 212, 191, 0.4)',
  energy: 'rgba(249, 115, 22, 0.4)',
  warning: 'rgba(245, 158, 11, 0.4)',
  danger: 'rgba(239, 68, 68, 0.4)',
  violet: 'rgba(139, 92, 246, 0.4)',
  blue: 'rgba(59, 130, 246, 0.4)',
  teal: 'rgba(45, 212, 191, 0.4)',
};

export default function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md',
  variant = 'ocean',  // NEW: gradient variant
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
  
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };
  
  // Get gradient fill - use success variant when complete
  const gradientFill = isComplete 
    ? GRADIENT_FILLS.success 
    : (GRADIENT_FILLS[variant] || GRADIENT_FILLS.ocean);
  
  const pulseColor = PULSE_COLORS[variant] || PULSE_COLORS.ocean;

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-zinc-400">Progress</span>
          <span className={cn(
            'font-semibold tabular-nums',
            isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-zinc-200',
            isPulsing && 'animate-bounce-subtle'
          )}>
            {Math.round(displayValue)}%
          </span>
        </div>
      )}
      
      {/* Track */}
      <div 
        className={cn(
          'relative rounded-full overflow-hidden bg-slate-200 dark:bg-[#1f1f23]',
          sizeClasses[size] || sizeClasses.md,
          isPulsing && 'progress-pulse'
        )}
        style={{ '--pulse-color': pulseColor }}
      >
        {/* Fill with gradient */}
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isShining && 'progress-shine'
          )}
          style={{ 
            width: `${percentage}%`,
            background: gradientFill,
          }}
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
                className={cn(
                  'absolute top-0 bottom-0 w-px transition-opacity duration-300 bg-slate-400 dark:bg-[#27272a]',
                  percentage >= threshold ? 'opacity-0' : 'opacity-30'
                )}
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
          0% { box-shadow: 0 0 0 0 var(--pulse-color, rgba(6, 182, 212, 0.4)); }
          100% { box-shadow: 0 0 0 8px transparent; }
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
 * ProgressRing - Circular progress indicator with gradient support
 */
export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  variant = 'ocean',
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

  // Gradient ID unique to this instance
  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Gradient colors based on variant
  const getGradientColors = () => {
    if (isComplete) return ['#2DD4BF', '#14B8A6'];
    
    const gradientMap = {
      ocean: ['#3B82F6', '#06B6D4', '#2DD4BF'],
      brand: ['#8B5CF6', '#7C3AED'],
      aurora: ['#8B5CF6', '#3B82F6', '#2DD4BF'],
      sunset: ['#8B5CF6', '#EC4899'],
      success: ['#2DD4BF', '#14B8A6'],
      energy: ['#FB923C', '#F43F5E'],
    };
    
    return gradientMap[variant] || gradientMap.ocean;
  };

  const gradientColors = getGradientColors();

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Pulse ring (behind) */}
      {isPulsing && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{ 
            animation: 'ring-pulse 0.6s ease-out',
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        className={cn(
          'transform -rotate-90 transition-transform duration-200',
          isPulsing ? 'scale-105' : 'scale-100'
        )}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientColors.map((color, index) => (
              <stop 
                key={index}
                offset={`${(index / (gradientColors.length - 1)) * 100}%`} 
                stopColor={color} 
              />
            ))}
          </linearGradient>
        </defs>
        
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-default, #E2E8F0)"
          strokeWidth={strokeWidth}
        />
        {/* Fill with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showValue && (
        <span className={cn(
          'absolute text-xs font-semibold tabular-nums transition-transform duration-200',
          isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-zinc-200',
          isPulsing ? 'scale-110' : 'scale-100'
        )}>
          {Math.round(percentage)}
        </span>
      )}
      
      <style>{`
        @keyframes ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          100% { box-shadow: 0 0 0 12px rgba(6, 182, 212, 0); }
        }
      `}</style>
    </div>
  );
}

/**
 * ProgressSteps - Step-based progress indicator
 */
export function ProgressSteps({
  steps = [],
  currentStep = 0,
  variant = 'ocean',
  className = ''
}) {
  const gradientLine = GRADIENT_FILLS[variant] || GRADIENT_FILLS.ocean;

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <React.Fragment key={index}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                  isCompleted && 'text-white',
                  isCurrent && 'text-white ring-4 ring-blue-100 dark:ring-blue-500/20',
                  !isCompleted && !isCurrent && 'bg-slate-200 dark:bg-[#1f1f23] text-slate-500 dark:text-zinc-500'
                )}
                style={isCompleted || isCurrent ? { background: gradientLine } : {}}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              {step.label && (
                <span className={cn(
                  'mt-2 text-xs',
                  isCurrent ? 'text-slate-800 dark:text-white font-medium' : 'text-slate-500 dark:text-zinc-500'
                )}>
                  {step.label}
                </span>
              )}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-all duration-300',
                  isCompleted ? '' : 'bg-slate-200 dark:bg-[#1f1f23]'
                )}
                style={isCompleted ? { background: gradientLine } : {}}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
