// src/components/xp/XpRing.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: XP Ring with Micro-Interactions (Gebbia-Grade Polish)
// ═══════════════════════════════════════════════════════════════════════════════
//
// ENHANCEMENTS:
// - Ring pulses outward with brand/gold colors when XP is earned.
// - Number counts up smoothly (doesn't jump) using Spring physics conceptually.
// - Typography explicitly uses display font weights.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useEffect, useState, useRef } from "react";
import useAnimatedNumber from "../../hooks/useAnimatedNumber";
import LevelUpCelebration, { useLevelUp } from "./LevelUpCelebration";

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

  const prevProgressRef = useRef(clamped);
  const [isPulsing, setIsPulsing] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState('normal'); 

  // Animated XP display
  const { value: displayXP, isAnimating: isXPAnimating } = useAnimatedNumber(
    currentXP ?? Math.round(clamped * (maxXP || 100)),
    { duration: 800, enabled: motionEnabled }
  );

  const { isLevelingUp, celebrateLevel, onCelebrationComplete } = useLevelUp(level);

  useEffect(() => {
    if (!motionEnabled) return;
    
    const prevProgress = prevProgressRef.current;
    const currentProgress = clamped;
    
    const THRESHOLDS = [0.25, 0.5, 0.75, 1.0];
    const crossedThreshold = THRESHOLDS.some(t => 
      prevProgress < t && currentProgress >= t
    );
    
    if (currentProgress > prevProgress) {
      setIsPulsing(true);
      setPulseIntensity(crossedThreshold ? 'strong' : 'normal');
      
      const timer = setTimeout(() => {
        setIsPulsing(false);
        setPulseIntensity('normal');
      }, 800);
      
      return () => clearTimeout(timer);
    }
    
    prevProgressRef.current = currentProgress;
  }, [clamped, motionEnabled]);

  useEffect(() => {
    if (isLevelingUp && onLevelUp) {
      onLevelUp(celebrateLevel);
    }
  }, [isLevelingUp, celebrateLevel, onLevelUp]);

  const transition = motionEnabled
    ? "stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1)"
    : "none";

  const sublabel = maxXP ? `${displayXP} / ${maxXP}` : null;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: Level ${level}, ${Math.round(clamped * 100)}% to next level`}
    >
      {/* Pulse ring behind (Gold/Amber for reward sensation) */}
      {isPulsing && (
        <div 
          className={`
            absolute inset-0 rounded-full
            ${pulseIntensity === 'strong' ? 'xp-ring-pulse-strong' : 'xp-ring-pulse'}
          `}
          style={{ width: size, height: size }}
        />
      )}

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
          transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
          ${isPulsing ? 'scale-[1.03]' : 'scale-100'}
        `}
      >
        {/* Track (Warm Gray) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-tertiary, #F3F4F6)"
          strokeWidth={thickness}
        />

        {/* Progress gradient (Signature Purple) */}
        <defs>
          <linearGradient id="xp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500, #7C3AED)" />
            <stop offset="100%" stopColor="var(--color-brand-400, #8B5CF6)" />
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
          className={isPulsing ? 'opacity-100 drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]' : 'opacity-90'}
        />
      </svg>

      {/* Center label (Flawless Typography) */}
      {!isLevelingUp && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none select-none">
          <div className="text-center leading-tight mt-1">
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{label}</div>
            <div className={`
              text-2xl font-black text-text-primary tracking-tight
              transition-all duration-300
              ${isPulsing ? 'scale-110 text-brand' : 'scale-100'}
              ${isXPAnimating ? 'tabular-nums' : ''}
            `}>
              Lv {level}
            </div>
            {sublabel && (
              <div className={`
                text-[11px] font-bold text-text-tertiary mt-1 tabular-nums tracking-wide
                transition-colors duration-300
                ${isPulsing || isXPAnimating ? 'text-warning' : ''}
              `}>
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline keyframes for Gold/Reward pulse */}
      <style>{`
        @keyframes xp-ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4); opacity: 0.8; }
          100% { box-shadow: 0 0 0 15px transparent; opacity: 0; }
        }
        @keyframes xp-ring-pulse-strong {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); opacity: 1; }
          50% { box-shadow: 0 0 25px 6px rgba(245, 158, 11, 0.4); opacity: 0.8; }
          100% { box-shadow: 0 0 0 30px transparent; opacity: 0; }
        }
        .xp-ring-pulse { animation: xp-ring-pulse 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .xp-ring-pulse-strong { animation: xp-ring-pulse-strong 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
