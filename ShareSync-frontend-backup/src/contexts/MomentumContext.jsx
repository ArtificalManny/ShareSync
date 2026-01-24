// src/contexts/MomentumContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Global Context Provider
// ═══════════════════════════════════════════════════════════════════════════════
//
// PHASE C UPGRADE: Full Momentum Engine Integration
//
// Provides momentum state to the entire app so components can react:
// - Background color temperature shifts
// - Animation intensity changes  
// - Micro-interactions adjust
// - GLOW INTENSITY (0-5) for the Momentum Glow System
// - getMomentumScore() for the Heartbeat system
// - ⭐ PHASE C: Activity recording, fire mode, level transitions
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useMomentum from '../hooks/useMomentum';
import {
  calculateLevel,
  getLevelMeta,
  createActivity,
  ACTIVITY_POINTS,
  calculateScoreFromHistory,
  getMomentumMessage,
} from '../utils/momentumCalculator';

const MomentumContext = createContext(null);

// ⭐ PHASE A: Global score ref for heartbeat access
let globalMomentumScore = 50;
let globalMomentumLevel = 2;

// CSS custom properties we'll update based on momentum
const CSS_VARS = {
  '--momentum-temp-hue': '0',
  '--momentum-temp-opacity': '0',
  '--momentum-animation-scale': '1',
  '--momentum-pulse-enabled': '1',
  '--momentum-glow-level': '0',
  // ⭐ PHASE C: New CSS variables
  '--momentum-level': '0',
  '--momentum-score': '0',
  '--momentum-fire': '0',
  '--momentum-animation-speed': '1',
  '--momentum-glow-intensity': '0',
  '--momentum-hover-lift': '2px',
};

/**
 * Calculate glow intensity level (0-5) from momentum score (0-100)
 */
function calculateGlowLevel(score) {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 75) return 3;
  if (score < 90) return 4;
  return 5;
}

/**
 * Get semantic glow state name from level
 */
function getGlowStateName(level) {
  const states = ['idle', 'warming', 'building', 'flowing', 'peak', 'fire'];
  return states[level] || 'idle';
}

/**
 * Calculate glow CSS class from level
 */
function getGlowClassName(level) {
  const classes = [
    'momentum-idle',
    'momentum-warming', 
    'momentum-building',
    'momentum-flowing',
    'momentum-peak',
    'momentum-fire'
  ];
  return classes[level] || 'momentum-idle';
}

/**
 * ⭐ PHASE A: Get current momentum score (for heartbeat system)
 */
export function getMomentumScore() {
  return globalMomentumScore;
}

/**
 * ⭐ PHASE C: Get current momentum level
 */
export function getMomentumLevel() {
  return globalMomentumLevel;
}

export function MomentumProvider({ children, enabled = true }) {
  // Mock data - in real app, this would come from your API/state
  const [momentumData, setMomentumData] = useState({
    tasksCompletedToday: 3,
    tasksCompletedThisWeek: 15,
    dailyTarget: 5,
    weeklyTarget: 25,
    streakDays: 7,
    projectHealthScores: [75, 80, 60],
    recentActivityDays: 5,
  });

  const momentum = useMomentum(momentumData);

  // ⭐ PHASE C: Activity history for more accurate scoring
  const [activityHistory, setActivityHistory] = useState([]);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  
  // ⭐ PHASE C: Fire mode state
  const [isFireMode, setIsFireMode] = useState(false);
  const [fireModeStartTime, setFireModeStartTime] = useState(null);
  const previousLevelRef = useRef(calculateGlowLevel(momentum.score));

  // Update global score refs whenever momentum changes
  useEffect(() => {
    globalMomentumScore = momentum.score;
    globalMomentumLevel = calculateGlowLevel(momentum.score);
  }, [momentum.score]);

  // Calculate glow intensity from momentum score
  const glowLevel = useMemo(() => calculateGlowLevel(momentum.score), [momentum.score]);
  const glowState = useMemo(() => getGlowStateName(glowLevel), [glowLevel]);
  const glowClassName = useMemo(() => getGlowClassName(glowLevel), [glowLevel]);
  
  // ⭐ PHASE C: Level metadata
  const levelMeta = useMemo(() => getLevelMeta(glowLevel), [glowLevel]);

  // ⭐ PHASE C: Fire mode detection
  useEffect(() => {
    const wasFireMode = isFireMode;
    const nowFireMode = glowLevel === 5;
    
    if (nowFireMode && !wasFireMode) {
      // Entering fire mode
      setIsFireMode(true);
      setFireModeStartTime(Date.now());
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('momentum-fire-mode', {
        detail: { entering: true, level: glowLevel }
      }));
    } else if (!nowFireMode && wasFireMode) {
      // Exiting fire mode
      setIsFireMode(false);
      setFireModeStartTime(null);
      
      window.dispatchEvent(new CustomEvent('momentum-fire-mode', {
        detail: { entering: false, level: glowLevel }
      }));
    }
  }, [glowLevel, isFireMode]);

  // ⭐ PHASE C: Level change detection
  useEffect(() => {
    const previousLevel = previousLevelRef.current;
    
    if (glowLevel !== previousLevel) {
      const direction = glowLevel > previousLevel ? 'up' : 'down';
      
      // Dispatch level change event
      window.dispatchEvent(new CustomEvent('momentum-level-change', {
        detail: { 
          previousLevel, 
          newLevel: glowLevel, 
          direction,
          levelMeta: getLevelMeta(glowLevel),
        }
      }));
      
      previousLevelRef.current = glowLevel;
    }
  }, [glowLevel]);

  // Update CSS custom properties when momentum changes
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;

    // Temperature shift: cool (blue) for low, warm (orange/gold) for high
    if (momentum.isLowMomentum) {
      root.style.setProperty('--momentum-temp-hue', '210');
      root.style.setProperty('--momentum-temp-opacity', '0.03');
    } else if (momentum.isHighMomentum) {
      root.style.setProperty('--momentum-temp-hue', '35');
      root.style.setProperty('--momentum-temp-opacity', '0.04');
    } else {
      root.style.setProperty('--momentum-temp-hue', '263');
      root.style.setProperty('--momentum-temp-opacity', '0.02');
    }

    // Animation scaling (slower for low momentum)
    const animScale = momentum.isLowMomentum ? 1.5 : momentum.isHighMomentum ? 0.8 : 1;
    root.style.setProperty('--momentum-animation-scale', String(animScale));

    // Pulse enabled
    root.style.setProperty('--momentum-pulse-enabled', momentum.isLowMomentum ? '0' : '1');

    // Set glow level CSS variable
    root.style.setProperty('--momentum-glow-level', String(glowLevel));

    // ⭐ PHASE C: New CSS variables
    root.style.setProperty('--momentum-level', String(glowLevel));
    root.style.setProperty('--momentum-score', String(momentum.score));
    root.style.setProperty('--momentum-fire', isFireMode ? '1' : '0');
    
    // Animation speed (faster at high momentum)
    const animSpeed = [1.5, 1.3, 1.1, 0.9, 0.8, 0.7][glowLevel] || 1;
    root.style.setProperty('--momentum-animation-speed', String(animSpeed));
    
    // Glow intensity
    const glowIntensity = [0, 0.1, 0.2, 0.35, 0.5, 0.7][glowLevel] || 0;
    root.style.setProperty('--momentum-glow-intensity', String(glowIntensity));
    
    // Hover lift
    const hoverLift = ['2px', '3px', '4px', '5px', '6px', '8px'][glowLevel] || '2px';
    root.style.setProperty('--momentum-hover-lift', hoverLift);

    // Set data-momentum attribute on body for global styling
    document.body.setAttribute('data-momentum', String(glowLevel));
    document.body.setAttribute('data-momentum-name', glowState);
    document.body.setAttribute('data-momentum-score', String(momentum.score));
    
    // Fire mode attribute
    if (isFireMode) {
      document.body.setAttribute('data-momentum-fire', 'true');
    } else {
      document.body.removeAttribute('data-momentum-fire');
    }

  }, [enabled, momentum.isLowMomentum, momentum.isHighMomentum, momentum.score, glowLevel, glowState, isFireMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-momentum');
      document.body.removeAttribute('data-momentum-name');
      document.body.removeAttribute('data-momentum-score');
      document.body.removeAttribute('data-momentum-fire');
    };
  }, []);

  // Method to update momentum data (call from your task/project hooks)
  const updateMomentumData = useCallback((updates) => {
    setMomentumData(prev => ({ ...prev, ...updates }));
    setLastActivityTime(Date.now());
  }, []);

  // Simulate completing a task (for demo)
  const recordTaskCompletion = useCallback(() => {
    setMomentumData(prev => ({
      ...prev,
      tasksCompletedToday: prev.tasksCompletedToday + 1,
      tasksCompletedThisWeek: prev.tasksCompletedThisWeek + 1,
    }));
    setLastActivityTime(Date.now());
    
    // ⭐ PHASE C: Add to activity history
    const activity = createActivity('TASK_COMPLETE');
    setActivityHistory(prev => [...prev.slice(-50), activity]);
  }, []);

  // ⭐ PHASE C: Record any activity type
  const recordActivity = useCallback((type, metadata = {}) => {
    const activity = createActivity(type, metadata);
    setActivityHistory(prev => [...prev.slice(-50), activity]);
    setLastActivityTime(Date.now());
    
    // Update momentum data based on activity type
    const points = ACTIVITY_POINTS[type] || 0;
    
    switch (type) {
      case 'TASK_COMPLETE':
        recordTaskCompletion();
        break;
      case 'PROJECT_SHIP':
        setMomentumData(prev => ({
          ...prev,
          tasksCompletedToday: prev.tasksCompletedToday + 5,
          tasksCompletedThisWeek: prev.tasksCompletedThisWeek + 5,
        }));
        break;
      case 'FOCUS_START':
      case 'FOCUS_COMPLETE':
        setMomentumData(prev => ({
          ...prev,
          tasksCompletedToday: prev.tasksCompletedToday + (type === 'FOCUS_COMPLETE' ? 2 : 1),
        }));
        break;
      default:
        // Generic boost
        if (points > 0) {
          setMomentumData(prev => ({
            ...prev,
            tasksCompletedToday: prev.tasksCompletedToday + Math.floor(points / 10),
          }));
        }
    }
    
    return activity;
  }, [recordTaskCompletion]);

  // Helper to apply momentum glow to any element
  const getMomentumProps = useCallback((additionalClassName = '') => ({
    'data-momentum': glowLevel,
    'data-momentum-fire': isFireMode || undefined,
    className: `${glowClassName} ${additionalClassName}`.trim(),
  }), [glowLevel, glowClassName, isFireMode]);

  // Method to get current score
  const getScore = useCallback(() => momentum.score, [momentum.score]);

  // ⭐ PHASE C: Get contextual message
  const getMessage = useCallback(() => {
    return getMomentumMessage(
      momentum.score,
      momentumData.tasksCompletedToday,
      momentumData.streakDays
    );
  }, [momentum.score, momentumData.tasksCompletedToday, momentumData.streakDays]);

  // ⭐ PHASE C: Calculate time in fire mode
  const timeInFireMode = useMemo(() => {
    if (!isFireMode || !fireModeStartTime) return 0;
    return Date.now() - fireModeStartTime;
  }, [isFireMode, fireModeStartTime]);

  const value = {
    // Momentum data
    ...momentum,
    
    // Raw data
    data: momentumData,
    
    // Glow system values
    glowLevel,
    glowState,
    glowClassName,
    getMomentumProps,
    
    // Score accessor
    getScore,
    
    // ⭐ PHASE C: Level metadata
    level: glowLevel,
    levelMeta,
    
    // ⭐ PHASE C: Fire mode
    isFireMode,
    fireModeStartTime,
    timeInFireMode,
    
    // ⭐ PHASE C: Activity tracking
    activityHistory,
    lastActivityTime,
    recordActivity,
    
    // ⭐ PHASE C: Contextual message
    getMessage,
    message: getMessage(),
    
    // Actions
    updateMomentumData,
    recordTaskCompletion,
    
    // Feature flag
    enabled,
  };

  return (
    <MomentumContext.Provider value={value}>
      {children}
    </MomentumContext.Provider>
  );
}

export function useMomentumContext() {
  const context = useContext(MomentumContext);
  
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      score: 50,
      vibe: 'neutral',
      isHighMomentum: false,
      isLowMomentum: false,
      isNeutral: true,
      temperatureShift: 0,
      animationIntensity: 0.7,
      components: { completions: 50, streak: 50, health: 50, activity: 50 },
      data: {},
      // Glow system defaults
      glowLevel: 2,
      glowState: 'building',
      glowClassName: 'momentum-building',
      getMomentumProps: (className = '') => ({ 'data-momentum': 2, className: `momentum-building ${className}`.trim() }),
      // Score accessor
      getScore: () => 50,
      // ⭐ PHASE C defaults
      level: 2,
      levelMeta: { min: 40, max: 59, name: 'building', label: 'Building' },
      isFireMode: false,
      fireModeStartTime: null,
      timeInFireMode: 0,
      activityHistory: [],
      lastActivityTime: Date.now(),
      recordActivity: () => {},
      getMessage: () => "Building momentum",
      message: "Building momentum",
      // Actions
      updateMomentumData: () => {},
      recordTaskCompletion: () => {},
      enabled: false,
    };
  }
  
  return context;
}

// Export helper hooks for convenience
export function useMomentumGlow() {
  const { glowLevel, glowState, glowClassName, getMomentumProps, isFireMode } = useMomentumContext();
  return { glowLevel, glowState, glowClassName, getMomentumProps, isFireMode };
}

export function useMomentumScore() {
  const { score, vibe, isHighMomentum, isLowMomentum, isNeutral, getScore, level, levelMeta } = useMomentumContext();
  return { score, vibe, isHighMomentum, isLowMomentum, isNeutral, getScore, level, levelMeta };
}

// ⭐ PHASE C: New hook for fire mode
export function useFireMode() {
  const { isFireMode, fireModeStartTime, timeInFireMode, glowLevel } = useMomentumContext();
  return { isFireMode, fireModeStartTime, timeInFireMode, level: glowLevel };
}

// ⭐ PHASE C: New hook for activity recording
export function useMomentumActivity() {
  const { recordActivity, recordTaskCompletion, activityHistory, lastActivityTime } = useMomentumContext();
  return { 
    recordActivity, 
    recordTaskCompletion, 
    activityHistory, 
    lastActivityTime,
    ACTIVITY_TYPES: ACTIVITY_POINTS,
  };
}

export default MomentumContext;
