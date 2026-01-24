// src/hooks/useMomentumTransitions.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Smooth Level Transitions
// ═══════════════════════════════════════════════════════════════════════════════
//
// This hook manages smooth transitions between momentum levels.
// Instead of jarring instant changes, the interface gracefully morphs.
//
// FEATURES:
// - Smooth score interpolation over time
// - Level change animations and callbacks
// - Celebration triggers at milestones
// - Debounced updates to prevent flicker
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { calculateLevel, getLevelMeta } from '../utils/momentumCalculator';

/**
 * Transition configuration
 */
const TRANSITION_CONFIG = {
  // How long the score takes to interpolate to new value (ms)
  SCORE_TRANSITION_DURATION: 1500,
  
  // How long between level change and celebration
  CELEBRATION_DELAY: 300,
  
  // Minimum time between level changes to prevent flicker
  LEVEL_CHANGE_DEBOUNCE: 2000,
  
  // Easing function for score interpolation
  EASING: (t) => t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2, // easeInOutCubic
};

/**
 * Hook for smooth momentum transitions
 */
export function useMomentumTransitions(targetScore, options = {}) {
  const {
    onLevelUp = () => {},
    onLevelDown = () => {},
    onFireMode = () => {},
    onExitFireMode = () => {},
    transitionDuration = TRANSITION_CONFIG.SCORE_TRANSITION_DURATION,
    enabled = true,
  } = options;

  // Current displayed score (interpolated)
  const [displayScore, setDisplayScore] = useState(targetScore);
  
  // Current and previous levels
  const [currentLevel, setCurrentLevel] = useState(() => calculateLevel(targetScore));
  const previousLevelRef = useRef(currentLevel);
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null); // 'up' | 'down' | null
  
  // Animation refs
  const animationRef = useRef(null);
  const startScoreRef = useRef(targetScore);
  const startTimeRef = useRef(null);
  const lastLevelChangeRef = useRef(0);

  // Fire mode state
  const [isFireMode, setIsFireMode] = useState(false);
  const [fireModeJustActivated, setFireModeJustActivated] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (!enabled) {
      setDisplayScore(targetScore);
      return;
    }

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startScore = displayScore;
    const scoreDiff = targetScore - startScore;
    
    // Skip animation for tiny changes
    if (Math.abs(scoreDiff) < 1) {
      setDisplayScore(targetScore);
      return;
    }

    startScoreRef.current = startScore;
    startTimeRef.current = performance.now();
    setIsTransitioning(true);
    setTransitionDirection(scoreDiff > 0 ? 'up' : 'down');

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easedProgress = TRANSITION_CONFIG.EASING(progress);
      
      const newScore = startScoreRef.current + (scoreDiff * easedProgress);
      setDisplayScore(Math.round(newScore));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayScore(targetScore);
        setIsTransitioning(false);
        setTransitionDirection(null);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetScore, transitionDuration, enabled]);

  // Handle level changes
  useEffect(() => {
    const newLevel = calculateLevel(displayScore);
    
    // Debounce level changes
    const now = Date.now();
    if (now - lastLevelChangeRef.current < TRANSITION_CONFIG.LEVEL_CHANGE_DEBOUNCE) {
      return;
    }

    if (newLevel !== currentLevel) {
      lastLevelChangeRef.current = now;
      const previousLevel = currentLevel;
      
      setCurrentLevel(newLevel);
      previousLevelRef.current = previousLevel;

      // Fire callbacks after a small delay for visual effect
      setTimeout(() => {
        if (newLevel > previousLevel) {
          onLevelUp(newLevel, previousLevel);
          
          // Special fire mode handling
          if (newLevel === 5 && !isFireMode) {
            setIsFireMode(true);
            setFireModeJustActivated(true);
            onFireMode();
            
            // Reset "just activated" flag after animation
            setTimeout(() => setFireModeJustActivated(false), 3000);
          }
        } else {
          onLevelDown(newLevel, previousLevel);
          
          // Exit fire mode
          if (previousLevel === 5 && newLevel < 5 && isFireMode) {
            setIsFireMode(false);
            onExitFireMode();
          }
        }
      }, TRANSITION_CONFIG.CELEBRATION_DELAY);
    }
  }, [displayScore, currentLevel, onLevelUp, onLevelDown, onFireMode, onExitFireMode, isFireMode]);

  // Add/remove transitioning class from body
  useEffect(() => {
    if (isTransitioning) {
      document.body.classList.add('momentum-transitioning');
    } else {
      // Keep class briefly for smooth settling
      const timer = setTimeout(() => {
        document.body.classList.remove('momentum-transitioning');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Level metadata
  const levelMeta = useMemo(() => getLevelMeta(currentLevel), [currentLevel]);

  // Progress within current level
  const levelProgress = useMemo(() => {
    const { min, max } = levelMeta;
    const range = max - min;
    const progress = (displayScore - min) / range;
    return Math.max(0, Math.min(1, progress));
  }, [displayScore, levelMeta]);

  return {
    // Current state
    displayScore,
    targetScore,
    currentLevel,
    previousLevel: previousLevelRef.current,
    levelMeta,
    levelProgress,
    
    // Transition state
    isTransitioning,
    transitionDirection,
    
    // Fire mode
    isFireMode,
    fireModeJustActivated,
    
    // Helpers
    isLevelingUp: transitionDirection === 'up' && isTransitioning,
    isLevelingDown: transitionDirection === 'down' && isTransitioning,
  };
}

/**
 * Hook for level change celebrations
 */
export function useLevelCelebration() {
  const [celebration, setCelebration] = useState(null);
  
  const celebrate = useCallback((type, data = {}) => {
    const celebrations = {
      levelUp: {
        id: `levelup_${Date.now()}`,
        type: 'levelUp',
        message: `Level ${data.newLevel}!`,
        subMessage: getLevelMeta(data.newLevel).label,
        duration: 2000,
        ...data,
      },
      fireMode: {
        id: `fire_${Date.now()}`,
        type: 'fireMode',
        message: '🔥 FIRE MODE!',
        subMessage: "You're absolutely crushing it!",
        duration: 3000,
        ...data,
      },
      milestone: {
        id: `milestone_${Date.now()}`,
        type: 'milestone',
        message: data.message || 'Milestone!',
        subMessage: data.subMessage || '',
        duration: 2500,
        ...data,
      },
    };

    const celebrationData = celebrations[type] || celebrations.milestone;
    setCelebration(celebrationData);

    // Auto-clear
    setTimeout(() => {
      setCelebration(null);
    }, celebrationData.duration);
  }, []);

  const dismiss = useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    celebration,
    celebrate,
    dismiss,
    isActive: celebration !== null,
  };
}

/**
 * Hook for momentum history tracking
 */
export function useMomentumHistory(currentScore, maxHistory = 60) {
  const historyRef = useRef([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const now = Date.now();
    historyRef.current.push({ score: currentScore, timestamp: now });
    
    // Trim old entries (keep last N)
    if (historyRef.current.length > maxHistory) {
      historyRef.current = historyRef.current.slice(-maxHistory);
    }
    
    setHistory([...historyRef.current]);
  }, [currentScore, maxHistory]);

  // Calculate trend
  const trend = useMemo(() => {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-10);
    const firstScore = recent[0].score;
    const lastScore = recent[recent.length - 1].score;
    const diff = lastScore - firstScore;
    
    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  }, [history]);

  // Peak score in session
  const peakScore = useMemo(() => {
    return Math.max(...history.map(h => h.score), 0);
  }, [history]);

  // Time at current level
  const timeAtCurrentLevel = useMemo(() => {
    if (history.length < 2) return 0;
    
    const currentLevel = calculateLevel(currentScore);
    let firstAtLevel = null;
    
    // Find when we first entered this level
    for (let i = history.length - 1; i >= 0; i--) {
      const historyLevel = calculateLevel(history[i].score);
      if (historyLevel === currentLevel) {
        firstAtLevel = history[i].timestamp;
      } else {
        break;
      }
    }
    
    return firstAtLevel ? Date.now() - firstAtLevel : 0;
  }, [history, currentScore]);

  return {
    history,
    trend,
    peakScore,
    timeAtCurrentLevel,
    averageScore: history.length > 0 
      ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
      : currentScore,
  };
}

export default useMomentumTransitions;
