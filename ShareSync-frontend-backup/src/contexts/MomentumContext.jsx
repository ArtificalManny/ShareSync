// src/contexts/MomentumContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine + PHASE F: Sound Integration
// v6.0 UPDATE: The "Heat Engine" Optimization
// ═══════════════════════════════════════════════════════════════════════════════
//
// Provides momentum state and activity tracking throughout the app.
// Features a 0-100 Heat Score, automatic decay, and threshold mappings.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef 
} from 'react';

// ⭐ PHASE F: Import momentum sounds
import { 
  useMomentumLevelTransition, 
  useFireModeSound,
  useMomentumTick,
  MOMENTUM_LEVELS,
} from '../sounds/MomentumSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION: The Heat Engine
// ═══════════════════════════════════════════════════════════════════════════════

const MOMENTUM_CONFIG = {
  // Phase 2: The Accelerators
  points: {
    LOGIN: 10,
    PAGE_NAVIGATION: 2,
    COMMENT_ADD: 5,
    FILE_UPLOAD: 5,
    TASK_COMPLETE: 15,
    FOCUS_START: 25,
    PROJECT_SHIP: 50,
  },
  
  // Phase 1: The Mapping (0-100 scale)
  // Level 0: 0-19 | Level 1: 20-39 | Level 2: 40-59 | Level 3: 60-79 | Level 4: 80-94 | Level 5: 95+
  thresholds: [0, 20, 40, 60, 80, 95],
  maxHeat: 100,
  
  // Phase 3: The Decay
  decayRate: 5,           // Points lost per interval
  decayInterval: 300000,  // 5 minutes in milliseconds
};

const GLOW_STATES = {
  0: { name: 'dormant', color: null, message: 'Warming up...' },
  1: { name: 'warming', color: 'brand', message: 'Gaining Traction' },
  2: { name: 'active', color: 'brand', message: 'Gaining Traction' },
  3: { name: 'flowing', color: 'brand', message: 'Deep Flow' },
  4: { name: 'surging', color: 'cyan', message: 'Deep Flow' },
  5: { name: 'blazing', color: 'energy', message: 'Fire Mode 🔥' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const MomentumContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function MomentumProvider({ children }) {
  // Core state: 'score' is now our 0-100 Heat Score
  const [score, setScore] = useState(0);
  const [glowLevel, setGlowLevel] = useState(0);
  const [isFireMode, setIsFireMode] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [activities, setActivities] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  
  const previousLevelRef = useRef(0);
  
  // ⭐ PHASE F: Sound hooks
  const { playLevelTransition } = useMomentumLevelTransition();
  const { playFireModeActivate, playFireModeDeactivate } = useFireModeSound();
  const { playTick } = useMomentumTick(glowLevel);
  
  // Calculate level from heat score
  const calculateLevel = useCallback((currentScore) => {
    const thresholds = MOMENTUM_CONFIG.thresholds;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (currentScore >= thresholds[i]) {
        return i;
      }
    }
    return 0;
  }, []);
  
  // Get glow state info
  const glowState = useMemo(() => {
    return GLOW_STATES[glowLevel]?.name || 'dormant';
  }, [glowLevel]);
  
  const glowColor = useMemo(() => {
    return GLOW_STATES[glowLevel]?.color || null;
  }, [glowLevel]);
  
  const message = useMemo(() => {
    if (isFireMode) return 'Fire Mode 🔥';
    return GLOW_STATES[glowLevel]?.message || 'Warming up...';
  }, [glowLevel, isFireMode]);
  
  // ⭐ PHASE F: Handle level changes with sounds
  useEffect(() => {
    const previousLevel = previousLevelRef.current;
    
    if (glowLevel !== previousLevel) {
      playLevelTransition(previousLevel, glowLevel);
      previousLevelRef.current = glowLevel;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Momentum] Level ${previousLevel} → ${glowLevel} (Heat: ${score})`);
      }
    }
  }, [glowLevel, playLevelTransition, score]);
  
  // ⭐ PHASE F: Handle fire mode changes with sounds
  useEffect(() => {
    if (isFireMode) {
      playFireModeActivate();
    }
  }, [isFireMode, playFireModeActivate]);

  // Phase 3: The Decay Engine (Highly performant, interval-based)
  useEffect(() => {
    const decayTimer = setInterval(() => {
      setScore(prevScore => {
        if (prevScore === 0) return 0; // No decay needed
        
        const newScore = Math.max(0, prevScore - MOMENTUM_CONFIG.decayRate);
        const newLevel = calculateLevel(newScore);
        
        // Only update dependent states if they actually changed
        if (newLevel !== glowLevel) {
          setGlowLevel(newLevel);
        }
        
        if (newLevel < 5 && isFireMode) {
          setIsFireMode(false);
          playFireModeDeactivate();
        }
        
        return newScore;
      });
    }, MOMENTUM_CONFIG.decayInterval); // Triggers every 5 minutes

    // Resetting interval smoothly on lastActivity change
    return () => clearInterval(decayTimer);
  }, [lastActivity, glowLevel, isFireMode, calculateLevel, playFireModeDeactivate]);
  
  // Phase 2: Record Activity and Add Heat
  const recordActivity = useCallback((type, metadata = {}) => {
    let points = MOMENTUM_CONFIG.points[type] || 0;
    
    // Priority 3.3: 2x XP during active focus block
    try { 
      if (localStorage.getItem('ss.focusBlock.active') === '1') points *= 2; 
    } catch {}
    
    const now = Date.now();
    
    // Add activity to history
    const newActivity = {
      id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      points,
      timestamp: now,
      metadata,
    };
    
    setActivities(prev => [newActivity, ...prev].slice(0, 100));
    setLastActivity(now);
    
    // Process the Heat Accelerators
    setScore(prev => {
      const newScore = Math.min(MOMENTUM_CONFIG.maxHeat, prev + points);
      const newLevel = calculateLevel(newScore);
      
      if (newLevel !== glowLevel) {
        setGlowLevel(newLevel);
      }
      
      // Instant Fire Mode if crossing threshold
      if (newLevel >= 5 && !isFireMode) {
        setIsFireMode(true);
      }
      
      return newScore;
    });
    
    // ⭐ PHASE F: Play momentum tick sound
    playTick(glowLevel);
    
    return newActivity;
  }, [glowLevel, isFireMode, calculateLevel, playTick]);
  
  // Record team activity
  const recordTeamActivity = useCallback((activity) => {
    setTeamActivity(prev => [activity, ...prev].slice(0, 50));
  }, []);
  
  // Manual level set (for testing/debugging)
  const setLevel = useCallback((level) => {
    const clampedLevel = Math.max(0, Math.min(5, level));
    setGlowLevel(clampedLevel);
    setScore(MOMENTUM_CONFIG.thresholds[clampedLevel]);
    if (clampedLevel >= 5) setIsFireMode(true);
    else setIsFireMode(false);
  }, []);
  
  // Reset momentum entirely
  const resetMomentum = useCallback(() => {
    setScore(0);
    setGlowLevel(0);
    setIsFireMode(false);
    setActivities([]);
  }, []);
  
  // Context value mapping
  const value = useMemo(() => ({
    score,
    glowLevel,
    glowState,
    glowColor,
    message,
    isFireMode,
    activities,
    teamActivity,
    lastActivity,
    
    recordActivity,
    recordTeamActivity,
    setLevel,
    resetMomentum,
    
    thresholds: MOMENTUM_CONFIG.thresholds,
    maxLevel: 5,
  }), [
    score, 
    glowLevel, 
    glowState, 
    glowColor, 
    message, 
    isFireMode, 
    activities, 
    teamActivity,
    lastActivity,
    recordActivity, 
    recordTeamActivity,
    setLevel, 
    resetMomentum,
  ]);
  
  return (
    <MomentumContext.Provider value={value}>
      {children}
    </MomentumContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main momentum context hook
 */
export function useMomentumContext() {
  const context = useContext(MomentumContext);
  if (!context) {
    return {
      score: 0,
      glowLevel: 0,
      glowState: 'dormant',
      glowColor: null,
      message: 'Warming up...',
      isFireMode: false,
      activities: [],
      teamActivity: [],
      lastActivity: Date.now(),
      recordActivity: () => {},
      recordTeamActivity: () => {},
      setLevel: () => {},
      resetMomentum: () => {},
      thresholds: MOMENTUM_CONFIG.thresholds,
      maxLevel: 5,
    };
  }
  return context;
}

/**
 * Hook for recording specific activity types
 */
export function useMomentumActivity() {
  const { recordActivity, glowLevel } = useMomentumContext();
  
  const recordLogin = useCallback(() => {
    return recordActivity('LOGIN', {});
  }, [recordActivity]);

  const recordPageNavigation = useCallback((pageData = {}) => {
    return recordActivity('PAGE_NAVIGATION', pageData);
  }, [recordActivity]);

  const recordFocusStart = useCallback((focusData = {}) => {
    return recordActivity('FOCUS_START', focusData);
  }, [recordActivity]);

  const recordTaskCompletion = useCallback((taskData = {}) => {
    return recordActivity('TASK_COMPLETE', taskData);
  }, [recordActivity]);
  
  const recordProjectShip = useCallback((projectData = {}) => {
    return recordActivity('PROJECT_SHIP', projectData);
  }, [recordActivity]);
  
  const recordComment = useCallback((commentData = {}) => {
    return recordActivity('COMMENT_ADD', commentData);
  }, [recordActivity]);
  
  const recordFileUpload = useCallback((fileData = {}) => {
    return recordActivity('FILE_UPLOAD', fileData);
  }, [recordActivity]);
  
  return {
    recordLogin,
    recordPageNavigation,
    recordFocusStart,
    recordTaskCompletion,
    recordProjectShip,
    recordComment,
    recordFileUpload,
    currentLevel: glowLevel,
  };
}

/**
 * Hook for momentum-aware styling
 */
export function useMomentumStyles() {
  const { glowLevel, glowColor, isFireMode } = useMomentumContext();
  
  const getCardClasses = useCallback((baseClasses = '') => {
    const momentum = `momentum-responsive-card momentum-card`;
    const fire = isFireMode ? 'border-energy-500/10' : '';
    const surge = glowLevel >= 4 ? 'border-brand-500/10' : '';
    
    return `${baseClasses} ${momentum} ${fire || surge}`.trim();
  }, [glowLevel, isFireMode]);
  
  const getButtonClasses = useCallback((baseClasses = '') => {
    if (isFireMode) {
      return `${baseClasses} animate-pulse shadow-glow-energy`;
    }
    if (glowLevel >= 4) {
      return `${baseClasses} shadow-glow-brand`;
    }
    return baseClasses;
  }, [glowLevel, isFireMode]);
  
  return {
    getCardClasses,
    getButtonClasses,
    glowLevel,
    isFireMode,
    glowColor,
  };
}

/**
 * Hook for fire mode detection
 */
export function useFireMode() {
  const { isFireMode, glowLevel } = useMomentumContext();
  
  return {
    isFireMode,
    isNearFireMode: glowLevel >= 4,
    fireIntensity: isFireMode ? 1 : glowLevel >= 4 ? 0.5 : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { MomentumContext };
export default MomentumProvider;
