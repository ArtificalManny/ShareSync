// src/components/xp/XpRing.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: XP Ring with Micro-Interactions
// ═══════════════════════════════════════════════════════════════════════════════
//
// ENHANCEMENTS:
// - Ring pulses outward when XP is earned
// - Number counts up smoothly (doesn't jump)
// - Level-up triggers celebration effect
// - Threshold celebrations at 25%, 50%, 75%
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useEffect, useState, useRef } from "react";
import useAnimatedNumber from "../../hooks/useAnimatedNumber";
import LevelUpCelebration, { useLevelUp } from "./LevelUpCelebration";

/**
 * XpRing - Circular progress ring with micro-interactions
 *
 * Props:
 *  - level: number (displayed in the center)
 *  - progress: number in [0,1] (XP progress to next level)
 *  - currentXP: number (actual XP value for count-up)
 *  - maxXP: number (XP needed for next level)
 *  - size?: number (px, default 120)
 *  - thickness?: number (px, default 10)
 *  - label?: string ("XP")
 *  - motionEnabled?: boolean (default true)
 *  - onLevelUp?: function (callback when level increases)
 */
export default function XpRing({
  level = 1,
  progress = 0,
  currentXP,
  maxXP,
  size = 120,
  thickness = 10,
  label = "XP",
  motionEnabled = true,
  onLevelUp,
}) {
  const radius = useMemo(() => (size - thickness) / 2, [size, thickness]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = clamped * circumference;
  const remainder = circumference - dash;

  // Track previous progress for threshold detection
  const prevProgressRef = useRef(clamped);
  const [isPulsing, setIsPulsing] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState('normal'); // 'normal' | 'strong'

  // Animated XP display
  const { value: displayXP, isAnimating: isXPAnimating } = useAnimatedNumber(
    currentXP ?? Math.round(clamped * (maxXP || 100)),
    { duration: 600, enabled: motionEnabled }
  );

  // Level-up celebration
  const { isLevelingUp, celebrateLevel, onCelebrationComplete } = useLevelUp(level);

  // Detect progress changes and trigger pulse
  useEffect(() => {
    if (!motionEnabled) return;
    
    const prevProgress = prevProgressRef.current;
    const currentProgress = clamped;
    
    // Check for threshold crossings (stronger pulse)
    const THRESHOLDS = [0.25, 0.5, 0.75, 1.0];
    const crossedThreshold = THRESHOLDS.some(t => 
      prevProgress < t && currentProgress >= t
    );
    
    // Any increase triggers a pulse
    if (currentProgress > prevProgress) {
      setIsPulsing(true);
      setPulseIntensity(crossedThreshold ? 'strong' : 'normal');
      
      const timer = setTimeout(() => {
        setIsPulsing(false);
        setPulseIntensity('normal');
      }, 600);
      
      return () => clearTimeout(timer);
    }
    
    prevProgressRef.current = currentProgress;
  }, [clamped, motionEnabled]);

  // Notify level up
  useEffect(() => {
    if (isLevelingUp && onLevelUp) {
      onLevelUp(celebrateLevel);
    }
  }, [isLevelingUp, celebrateLevel, onLevelUp]);

  // Motion transition
  const transition = motionEnabled
    ? "stroke-dasharray 700ms cubic-bezier(0.2, 0.8, 0.2, 1)"
    : "none";

  // Sublabel with XP values
  const sublabel = maxXP ? `${displayXP}/${maxXP}` : null;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: Level ${level}, ${Math.round(clamped * 100)}% to next level`}
    >
      {/* Pulse ring behind (appears on XP gain) */}
      {isPulsing && (
        <div 
          className={`
            absolute inset-0 rounded-full
            ${pulseIntensity === 'strong' ? 'xp-ring-pulse-strong' : 'xp-ring-pulse'}
          `}
          style={{ 
            width: size, 
            height: size,
          }}
        />
      )}

      {/* Level-up celebration overlay */}
      <LevelUpCelebration 
        active={isLevelingUp}
        newLevel={celebrateLevel}
        onComplete={onCelebrationComplete}
        size={size}
      />

      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        aria-hidden="true"
        className={`
          transition-transform duration-200
          ${isPulsing ? 'scale-105' : 'scale-100'}
        `}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={thickness}
        />

        {/* Progress gradient */}
        <defs>
          <linearGradient id="xp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-500, #A855F7)" />
            <stop offset="100%" stopColor="var(--accent-500, #D946EF)" />
          </linearGradient>
        </defs>

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#xp-ring-grad)"
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${remainder}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition }}
          className={isPulsing ? 'opacity-100' : 'opacity-90'}
        />
      </svg>

      {/* Center label (hidden during level-up) */}
      {!isLevelingUp && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none select-none">
          <div className="text-center leading-tight">
            <div className="text-[11px] text-text-tertiary">{label}</div>
            <div className={`
              text-xl font-bold text-text-primary
              transition-all duration-200
              ${isPulsing ? 'scale-110 text-brand' : 'scale-100'}
              ${isXPAnimating ? 'tabular-nums' : ''}
            `}>
              Lv {level}
            </div>
            {sublabel && (
              <div className={`
                text-[11px] text-text-tertiary mt-0.5 tabular-nums
                ${isXPAnimating ? 'text-brand-400' : ''}
              `}>
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes xp-ring-pulse {
          0% {
            box-shadow: 0 0 0 0 var(--brand-500);
            opacity: 0.5;
          }
          100% {
            box-shadow: 0 0 0 12px transparent;
            opacity: 0;
          }
        }
        
        @keyframes xp-ring-pulse-strong {
          0% {
            box-shadow: 0 0 0 0 var(--brand-400);
            opacity: 0.7;
          }
          50% {
            box-shadow: 0 0 20px 4px var(--brand-500);
            opacity: 0.5;
          }
          100% {
            box-shadow: 0 0 0 20px transparent;
            opacity: 0;
          }
        }
        
        .xp-ring-pulse {
          animation: xp-ring-pulse 0.6s ease-out forwards;
        }
        
        .xp-ring-pulse-strong {
          animation: xp-ring-pulse-strong 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
