// src/hooks/useMomentumEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Main Access Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is the primary hook for accessing the Momentum Engine throughout the app.
// It combines all momentum features into one convenient interface.
//
// USAGE:
// const { 
//   score, level, isFireMode, 
//   recordActivity, getMessage,
//   engineProps, // spread on containers
// } = useMomentumEngine();
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useMomentumContext } from '../contexts/MomentumContext';
import { useMomentumTransitions, useLevelCelebration, useMomentumHistory } from './useMomentumTransitions';
import { 
  calculateLevel, 
  getLevelMeta, 
  getMomentumMessage,
  calculateProgressToNextLevel,
  estimateTimeToNextLevel,
  ACTIVITY_POINTS,
} from '../utils/momentumCalculator';

/**
 * Main Momentum Engine hook
 */
export function useMomentumEngine(options = {}) {
  const {
    enableCelebrations = true,
    enableTransitions = true,
    enableHistory = true,
  } = options;

  // Get base momentum context
  const momentumContext = useMomentumContext();
  const { 
    score: rawScore, 
    glowLevel,
    glowState,
    glowClassName,
    recordTaskCompletion,
    updateMomentumData,
    enabled,
    data,
  } = momentumContext;

  // Smooth transitions
  const transitions = useMomentumTransitions(rawScore, {
    enabled: enableTransitions && enabled,
    onLevelUp: (newLevel, oldLevel) => {
      if (enableCelebrations) {
        if (newLevel === 5) {
          celebration.celebrate('fireMode', { newLevel, oldLevel });
        } else {
          celebration.celebrate('levelUp', { newLevel, oldLevel });
        }
      }
    },
    onFireMode: () => {
      // Could trigger sound, haptic, etc.
      console.log('🔥 Fire mode activated!');
    },
    onExitFireMode: () => {
      console.log('Fire mode ended');
    },
  });

  // Celebrations
  const celebration = useLevelCelebration();

  // History tracking
  const history = useMomentumHistory(
    enableHistory ? transitions.displayScore : rawScore,
    60
  );

  // Progress to next level
  const progress = useMemo(() => 
    calculateProgressToNextLevel(transitions.displayScore),
    [transitions.displayScore]
  );

  // Time estimate to next level
  const timeToNextLevel = useMemo(() =>
    estimateTimeToNextLevel(transitions.displayScore),
    [transitions.displayScore]
  );

  // Contextual message
  const message = useMemo(() => 
    getMomentumMessage(
      transitions.displayScore, 
      data?.tasksCompletedToday || 0,
      data?.streakDays || 0
    ),
    [transitions.displayScore, data?.tasksCompletedToday, data?.streakDays]
  );

  // Record activity helper
  const recordActivity = useCallback((type, metadata = {}) => {
    const points = ACTIVITY_POINTS[type] || 0;
    
    // Update momentum data based on activity type
    switch (type) {
      case 'TASK_COMPLETE':
        recordTaskCompletion();
        break;
      case 'PROJECT_SHIP':
        updateMomentumData({
          tasksCompletedToday: (data?.tasksCompletedToday || 0) + 5,
        });
        break;
      case 'FOCUS_COMPLETE':
        updateMomentumData({
          tasksCompletedToday: (data?.tasksCompletedToday || 0) + 2,
        });
        break;
      default:
        // Generic activity boost
        break;
    }

    // Trigger celebration for significant activities
    if (enableCelebrations && points >= 15) {
      celebration.celebrate('milestone', {
        message: type === 'PROJECT_SHIP' ? 'Shipped! 🚀' : 'Nice!',
        subMessage: `+${points} momentum`,
      });
    }
  }, [recordTaskCompletion, updateMomentumData, data, enableCelebrations, celebration]);

  // Props to spread on momentum-responsive containers
  const engineProps = useMemo(() => ({
    'data-momentum': transitions.currentLevel,
    'data-momentum-score': transitions.displayScore,
    'data-momentum-state': transitions.levelMeta.name,
    'data-momentum-transitioning': transitions.isTransitioning || undefined,
    'data-momentum-fire': transitions.isFireMode || undefined,
    'data-momentum-trend': history.trend,
    className: `momentum-engine ${glowClassName}`.trim(),
  }), [
    transitions.currentLevel,
    transitions.displayScore,
    transitions.levelMeta.name,
    transitions.isTransitioning,
    transitions.isFireMode,
    history.trend,
    glowClassName,
  ]);

  // CSS variables to apply to containers
  const engineStyles = useMemo(() => ({
    '--momentum-level': transitions.currentLevel,
    '--momentum-score': transitions.displayScore,
    '--momentum-progress': progress.progress,
    '--momentum-fire': transitions.isFireMode ? 1 : 0,
  }), [transitions.currentLevel, transitions.displayScore, progress.progress, transitions.isFireMode]);

  return {
    // Core state
    score: transitions.displayScore,
    rawScore,
    level: transitions.currentLevel,
    levelMeta: transitions.levelMeta,
    levelProgress: transitions.levelProgress,
    
    // Glow system (from Phase 1)
    glowLevel,
    glowState,
    glowClassName,
    
    // Transitions
    isTransitioning: transitions.isTransitioning,
    transitionDirection: transitions.transitionDirection,
    isLevelingUp: transitions.isLevelingUp,
    isLevelingDown: transitions.isLevelingDown,
    
    // Fire mode
    isFireMode: transitions.isFireMode,
    fireModeJustActivated: transitions.fireModeJustActivated,
    
    // Progress
    progress,
    pointsToNextLevel: progress.pointsToNext,
    timeToNextLevel,
    
    // Messages
    message,
    getMessage: () => getMomentumMessage(
      transitions.displayScore,
      data?.tasksCompletedToday || 0,
      data?.streakDays || 0
    ),
    
    // History & trends
    history: history.history,
    trend: history.trend,
    peakScore: history.peakScore,
    averageScore: history.averageScore,
    timeAtCurrentLevel: history.timeAtCurrentLevel,
    
    // Celebrations
    celebration: celebration.celebration,
    celebrate: celebration.celebrate,
    dismissCelebration: celebration.dismiss,
    isCelebrating: celebration.isActive,
    
    // Actions
    recordActivity,
    recordTaskCompletion,
    updateMomentumData,
    
    // Props helpers
    engineProps,
    engineStyles,
    
    // Feature flags
    enabled,
  };
}

/**
 * Simplified hook for components that just need score/level
 */
export function useMomentumLevel() {
  const { score, level, levelMeta, isFireMode, glowLevel } = useMomentumEngine({
    enableCelebrations: false,
    enableTransitions: true,
    enableHistory: false,
  });
  
  return { score, level, levelMeta, isFireMode, glowLevel };
}

/**
 * Hook for momentum-responsive styling
 */
export function useMomentumStyles() {
  const { 
    level, 
    glowClassName, 
    isFireMode, 
    isTransitioning,
    engineProps,
    engineStyles,
  } = useMomentumEngine({
    enableCelebrations: false,
    enableHistory: false,
  });

  return {
    level,
    className: glowClassName,
    isFireMode,
    isTransitioning,
    props: engineProps,
    styles: engineStyles,
  };
}

/**
 * Hook for activity recording only
 */
export function useMomentumActivity() {
  const { recordActivity, recordTaskCompletion, celebrate } = useMomentumEngine({
    enableTransitions: false,
    enableHistory: false,
  });

  return {
    recordActivity,
    recordTaskCompletion,
    celebrate,
    ACTIVITY_TYPES: ACTIVITY_POINTS,
  };
}

export default useMomentumEngine;
