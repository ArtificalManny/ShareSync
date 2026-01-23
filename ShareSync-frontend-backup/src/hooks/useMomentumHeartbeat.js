// src/hooks/useMomentumHeartbeat.js
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM HEARTBEAT
// ═══════════════════════════════════════════════════════════════════════════════
// Every 30 seconds, the interface "breathes" based on your current momentum.
// This is the difference between a dashboard and a companion.
//
// How it works:
// 1. Polls momentum score every 30 seconds
// 2. Converts score (0-100) to level (0-5)
// 3. Updates body[data-momentum] attribute
// 4. CSS responds with environmental changes
//
// The user never consciously notices this, but they FEEL it.
// High momentum = warm, responsive, alive
// Low momentum = calm, inviting, encouraging
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMomentumContext } from '../contexts/MomentumContext';

// Configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const TRANSITION_DURATION = 2000; // 2 seconds to smoothly transition levels

// Score to level mapping
// This creates a curve where level 5 (on fire) is rare and earned
function scoreToLevel(score) {
  if (score < 20) return 0;  // Idle (0-19)
  if (score < 40) return 1;  // Warming (20-39)
  if (score < 60) return 2;  // Building (40-59)
  if (score < 75) return 3;  // Flowing (60-74)
  if (score < 90) return 4;  // Peak (75-89)
  return 5;                   // On Fire (90-100) - rare!
}

// Level names for debugging and display
const LEVEL_NAMES = {
  0: 'idle',
  1: 'warming',
  2: 'building',
  3: 'flowing',
  4: 'peak',
  5: 'fire',
};

export default function useMomentumHeartbeat(options = {}) {
  const {
    enabled = true,
    interval = HEARTBEAT_INTERVAL,
    onBeat = null,           // Callback when heartbeat occurs
    onLevelChange = null,    // Callback when level changes
  } = options;

  const { score, glowLevel } = useMomentumContext();
  const [currentLevel, setCurrentLevel] = useState(() => scoreToLevel(score));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastBeatTime, setLastBeatTime] = useState(Date.now());
  const intervalRef = useRef(null);
  const previousLevelRef = useRef(currentLevel);

  // Update body attribute
  const updateBodyAttribute = useCallback((level) => {
    if (typeof document === 'undefined') return;
    
    const body = document.body;
    const previousLevel = body.getAttribute('data-momentum');
    
    // Only update if different
    if (previousLevel !== String(level)) {
      // Add transitioning class for smooth CSS transitions
      body.classList.add('momentum-transitioning');
      body.setAttribute('data-momentum', String(level));
      body.setAttribute('data-momentum-name', LEVEL_NAMES[level]);
      
      // Remove transitioning class after transition completes
      setTimeout(() => {
        body.classList.remove('momentum-transitioning');
      }, TRANSITION_DURATION);
    }
  }, []);

  // The heartbeat function
  const beat = useCallback(() => {
    const newLevel = scoreToLevel(score);
    
    setLastBeatTime(Date.now());
    
    // Update body attribute
    updateBodyAttribute(newLevel);
    
    // Check for level change
    if (newLevel !== previousLevelRef.current) {
      setIsTransitioning(true);
      
      if (onLevelChange) {
        onLevelChange({
          previousLevel: previousLevelRef.current,
          newLevel,
          previousName: LEVEL_NAMES[previousLevelRef.current],
          newName: LEVEL_NAMES[newLevel],
          direction: newLevel > previousLevelRef.current ? 'up' : 'down',
        });
      }
      
      setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION);
      previousLevelRef.current = newLevel;
    }
    
    setCurrentLevel(newLevel);
    
    // Callback
    if (onBeat) {
      onBeat({
        score,
        level: newLevel,
        levelName: LEVEL_NAMES[newLevel],
        timestamp: Date.now(),
      });
    }
  }, [score, updateBodyAttribute, onBeat, onLevelChange]);

  // Set up the heartbeat interval
  useEffect(() => {
    if (!enabled) return;

    // Initial beat
    beat();

    // Start interval
    intervalRef.current = setInterval(beat, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, beat]);

  // Also beat immediately when score changes significantly
  useEffect(() => {
    if (!enabled) return;
    
    const newLevel = scoreToLevel(score);
    if (newLevel !== currentLevel) {
      beat();
    }
  }, [score, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Remove momentum attributes when component unmounts
      if (typeof document !== 'undefined') {
        document.body.removeAttribute('data-momentum');
        document.body.removeAttribute('data-momentum-name');
        document.body.classList.remove('momentum-transitioning');
      }
    };
  }, []);

  // Manual beat trigger (for testing or immediate updates)
  const triggerBeat = useCallback(() => {
    beat();
  }, [beat]);

  // Get time until next beat
  const getTimeUntilNextBeat = useCallback(() => {
    const elapsed = Date.now() - lastBeatTime;
    return Math.max(0, interval - elapsed);
  }, [lastBeatTime, interval]);

  return {
    currentLevel,
    levelName: LEVEL_NAMES[currentLevel],
    score,
    isTransitioning,
    lastBeatTime,
    triggerBeat,
    getTimeUntilNextBeat,
    
    // Convenience checks
    isIdle: currentLevel === 0,
    isWarming: currentLevel === 1,
    isBuilding: currentLevel === 2,
    isFlowing: currentLevel === 3,
    isPeak: currentLevel === 4,
    isOnFire: currentLevel === 5,
    
    // Grouped checks
    isLowMomentum: currentLevel <= 1,
    isMidMomentum: currentLevel >= 2 && currentLevel <= 3,
    isHighMomentum: currentLevel >= 4,
  };
}

// Export utilities
export { scoreToLevel, LEVEL_NAMES, HEARTBEAT_INTERVAL };
