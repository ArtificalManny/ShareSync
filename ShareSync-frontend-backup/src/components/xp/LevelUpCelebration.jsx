// src/components/xp/LevelUpCelebration.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: Level-Up Celebration Effect
// ═══════════════════════════════════════════════════════════════════════════════
//
// Triggered when user levels up:
// 1. Ring fills completely (100%)
// 2. Flash effect pulses outward
// 3. Level number scales up with glow
// 4. Ring resets to 0% with new level
//
// Design: Celebratory but not obnoxious. Think "achievement unlocked", not "slot machine".
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { ParticleBurst } from '../ship/ParticleTrail';

/**
 * LevelUpCelebration - Overlay effect for level-up moments
 * 
 * @param {boolean} active - Whether celebration is active
 * @param {number} newLevel - The new level achieved
 * @param {function} onComplete - Callback when animation finishes
 * @param {number} size - Size to match parent ring (default: 120)
 */
export default function LevelUpCelebration({ 
  active = false, 
  newLevel = 1,
  onComplete,
  size = 120,
}) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'flash' | 'reveal' | 'done'

  useEffect(() => {
    if (active) {
      // Phase 1: Flash
      setPhase('flash');
      
      // Phase 2: Reveal new level
      const revealTimer = setTimeout(() => {
        setPhase('reveal');
      }, 400);
      
      // Phase 3: Done
      const doneTimer = setTimeout(() => {
        setPhase('done');
        onComplete?.();
      }, 1200);
      
      return () => {
        clearTimeout(revealTimer);
        clearTimeout(doneTimer);
      };
    } else {
      setPhase('idle');
    }
  }, [active, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* Flash ring expanding outward */}
      {phase === 'flash' && (
        <div 
          className="absolute inset-0 rounded-full level-up-flash"
          style={{
            background: 'radial-gradient(circle, var(--brand-400) 0%, transparent 70%)',
          }}
        />
      )}
      
      {/* Particle burst */}
      <ParticleBurst 
        active={phase === 'flash'}
        x="50%"
        y="50%"
        count={24}
        colors={['var(--brand-300)', 'var(--brand-400)', 'var(--success-400)', 'var(--warning-400)']}
      />
      
      {/* Level number overlay */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="level-up-number text-center">
            <div className="text-[10px] text-brand-300 uppercase tracking-wider mb-1">
              Level Up!
            </div>
            <div className="text-3xl font-bold text-brand">
              {newLevel}
            </div>
          </div>
        </div>
      )}
      
      {/* Inline styles for animations */}
      <style>{`
        @keyframes level-up-flash {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          30% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .level-up-flash {
          animation: level-up-flash 0.6s ease-out forwards;
        }
        
        @keyframes level-up-number {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .level-up-number {
          animation: level-up-number 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * useLevelUp - Hook to manage level-up state
 * 
 * @param {number} level - Current level
 * @returns {{ isLevelingUp: boolean, celebrateLevel: number, triggerLevelUp: function }}
 */
export function useLevelUp(level) {
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [celebrateLevel, setCelebrateLevel] = useState(level);
  const prevLevelRef = React.useRef(level);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      setCelebrateLevel(level);
      setIsLevelingUp(true);
    }
    prevLevelRef.current = level;
  }, [level]);

  const handleComplete = () => {
    setIsLevelingUp(false);
  };

  return { 
    isLevelingUp, 
    celebrateLevel, 
    onCelebrationComplete: handleComplete,
  };
}
