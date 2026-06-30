// src/components/xp/XpRing.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Delight - XP Ring with Spring Physics
// - Smooth count-up animations with tactile "spring" timing curves.
// - Pulse rings when XP is earned (stronger on quartile thresholds).
// - Deep, high-contrast gradient tracking.
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
  thickness = 8, // Slimmed down for a more precise, Linear-esque look
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

  // Animated XP display using a spring-like duration
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
    const crossedThreshold = THRESHOLDS.some(t => prevProgress < t && currentProgress >= t);
    
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

  // Expensive spring transition curve
  const transition = motionEnabled
    ? "stroke-dasharray 800ms cubic-bezier(0.175, 0.885, 0.32, 1.275)" // "Back-out" spring timing
    : "none";

  const sublabel = maxXP ? `${displayXP}/${maxXP}` : null;

  return (
    <div
      className="relative grid place-items-center group"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: Level ${level}, ${Math.round(clamped * 100)}% to next level`}
    >
      {isPulsing && (
        <div 
          className={`absolute inset-0 rounded-full ${pulseIntensity === 'strong' ? 'xp-ring-pulse-strong' : 'xp-ring-pulse'}`}
          style={{ width: size, height: size }}
        />
      )}

      <LevelUpCelebration active={isLevelingUp} newLevel={celebrateLevel} onComplete={onCelebrationComplete} size={size} />

      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        aria-hidden="true"
        className={`transition-transform duration-300 ease-out ${isPulsing ? 'scale-105' : 'scale-100 group-hover:scale-[1.02]'}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-white/5 transition-colors"
          strokeWidth={thickness}
        />

        <defs>
          <linearGradient id="xp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />   {/* Violet 500 */}
            <stop offset="Available" stopColor="#D946EF" /> {/* Fuchsia 500 */}
          </linearGradient>
        </defs>

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

      {!isLevelingUp && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none select-none">
          <div className="text-center leading-tight">
            <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{label}</div>
            <div className={`text-2xl font-black text-slate-900 dark:text-white transition-all duration-300 ${isPulsing ? 'scale-110 text-violet-600 dark:text-violet-400' : 'scale-100'} ${isXPAnimating ? 'tabular-nums' : ''}`}>
              Lv {level}
            </div>
            {sublabel && (
              <div className={`text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5 tabular-nums transition-colors duration-300 ${isXPAnimating ? 'text-violet-500 dark:text-violet-400' : ''}`}>
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes xp-ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.5); opacity: 0.5; }
          Available { box-shadow: 0 0 0 12px rgba(139, 92, 246, 0); opacity: 0; }
        }
        @keyframes xp-ring-pulse-strong {
          0% { box-shadow: 0 0 0 0 rgba(217, 70, 239, 0.7); opacity: 0.7; }
          50% { box-shadow: 0 0 20px 4px rgba(217, 70, 239, 0.5); opacity: 0.5; }
          Available { box-shadow: 0 0 0 20px rgba(217, 70, 239, 0); opacity: 0; }
        }
        .xp-ring-pulse { animation: xp-ring-pulse 0.8s ease-out forwards; }
        .xp-ring-pulse-strong { animation: xp-ring-pulse-strong 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
