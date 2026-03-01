// src/contexts/MomentumContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine + PHASE F: Sound Integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// Provides momentum state and activity tracking throughout the app.
// ⭐ PHASE F: Plays sounds on momentum level changes and fire mode activation
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
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const MOMENTUM_CONFIG = {
  // Points for various activities
  points: {
    TASK_COMPLETE: 10,
    PROJECT_SHIP: 50,
    FOCUS_MINUTE: 1,
    STREAK_DAY: 20,
    COMMENT_ADD: 5,
    FILE_UPLOAD: 5,
  },
  
  // Level thresholds (cumulative points needed)
  thresholds: [0, 50, 150, 300, 500, 750],
  
  // Decay rate (points lost per minute of inactivity)
  decayRate: 2,
  
  // Decay starts after this many seconds of inactivity
  decayDelay: 300, // 5 minutes
  
  // Fire mode requires level 5 sustained for this many seconds
  fireModeDelay: 60,
  
  // Fire mode timeout after inactivity (seconds)
  fireModeTimeout: 300, // 5 minutes
};

const GLOW_STATES = {
  0: { name: 'dormant', color: null, message: 'Start a task to build momentum' },
  1: { name: 'warming', color: 'brand', message: 'Momentum building...' },
  2: { name: 'active', color: 'brand', message: 'Nice rhythm going!' },
  3: { name: 'flowing', color: 'brand', message: 'You\'re in the flow' },
  4: { name: 'surging', color: 'cyan', message: 'Incredible momentum!' },
  5: { name: 'blazing', color: 'energy', message: 'Maximum velocity! 🔥' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const MomentumContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function MomentumProvider({ children }) {
  // Core state
  const [score, setScore] = useState(0);
  const [glowLevel, setGlowLevel] = useState(0);
  const [isFireMode, setIsFireMode] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [activities, setActivities] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  
  // Refs for timers and tracking
  const decayTimerRef = useRef(null);
  const fireModeTimerRef = useRef(null);
  const previousLevelRef = useRef(0);
  
  // ⭐ PHASE F: Sound hooks
  const { playLevelTransition } = useMomentumLevelTransition();
  const { playFireModeActivate, playFireModeDeactivate } = useFireModeSound();
  const { playTick } = useMomentumTick(glowLevel);
  
  // Calculate level from score
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
    if (isFireMode) return 'FIRE MODE ACTIVE! 🔥🔥🔥';
    return GLOW_STATES[glowLevel]?.message || '';
  }, [glowLevel, isFireMode]);
  
  // ⭐ PHASE F: Handle level changes with sounds
  useEffect(() => {
    const previousLevel = previousLevelRef.current;
    
    if (glowLevel !== previousLevel) {
      // Play level transition sound
      playLevelTransition(previousLevel, glowLevel);
      
      // Update ref
      previousLevelRef.current = glowLevel;
      
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Momentum] Level ${previousLevel} → ${glowLevel}`);
      }
    }
  }, [glowLevel, playLevelTransition]);
  
  // ⭐ PHASE F: Handle fire mode changes with sounds
  useEffect(() => {
    if (isFireMode) {
      playFireModeActivate();
    }
    // Note: deactivation sound is played in the deactivation logic below
  }, [isFireMode, playFireModeActivate]);
  
  // Record activity and update momentum
  const recordActivity = useCallback((type, metadata = {}) => {
    let points = MOMENTUM_CONFIG.points[type] || 0;
    // Priority 3.3: 2x XP during active focus block
    try { if (localStorage.getItem('ss.focusBlock.active') === '1') points *= 2; } catch {}
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
    
    // Update score
    setScore(prev => {
      const newScore = prev + points;
      const newLevel = calculateLevel(newScore);
      
      // Update level if changed
      if (newLevel !== glowLevel) {
        setGlowLevel(newLevel);
      }
      
      // Check for fire mode eligibility
      if (newLevel >= 5 && !isFireMode) {
        // Start fire mode timer
        if (fireModeTimerRef.current) clearTimeout(fireModeTimerRef.current);
        fireModeTimerRef.current = setTimeout(() => {
          setIsFireMode(true);
        }, MOMENTUM_CONFIG.fireModeDelay * 1000);
      }
      
      return newScore;
    });
    
    // ⭐ PHASE F: Play momentum tick sound
    playTick(glowLevel);
    
    // Reset decay timer
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    decayTimerRef.current = setTimeout(() => {
      startDecay();
    }, MOMENTUM_CONFIG.decayDelay * 1000);
    
    return newActivity;
  }, [glowLevel, isFireMode, calculateLevel, playTick]);
  
  // Start momentum decay
  const startDecay = useCallback(() => {
    const decay = () => {
      setScore(prev => {
        const newScore = Math.max(0, prev - MOMENTUM_CONFIG.decayRate);
        const newLevel = calculateLevel(newScore);
        
        // Update level if changed
        if (newLevel !== glowLevel) {
          setGlowLevel(newLevel);
          
          // Deactivate fire mode if dropping below level 5
          if (newLevel < 5 && isFireMode) {
            setIsFireMode(false);
            playFireModeDeactivate();
          }
        }
        
        // Continue decay if score > 0
        if (newScore > 0) {
          decayTimerRef.current = setTimeout(decay, 60000); // Every minute
        }
        
        return newScore;
      });
    };
    
    decay();
  }, [glowLevel, isFireMode, calculateLevel, playFireModeDeactivate]);
  
  // Deactivate fire mode after timeout
  useEffect(() => {
    if (isFireMode) {
      const timeout = setTimeout(() => {
        const timeSinceActivity = Date.now() - lastActivity;
        if (timeSinceActivity > MOMENTUM_CONFIG.fireModeTimeout * 1000) {
          setIsFireMode(false);
          playFireModeDeactivate();
        }
      }, MOMENTUM_CONFIG.fireModeTimeout * 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isFireMode, lastActivity, playFireModeDeactivate]);
  
  // Record team activity
  const recordTeamActivity = useCallback((activity) => {
    setTeamActivity(prev => [activity, ...prev].slice(0, 50));
  }, []);
  
  // Manual level set (for testing/debugging)
  const setLevel = useCallback((level) => {
    const clampedLevel = Math.max(0, Math.min(5, level));
    setGlowLevel(clampedLevel);
    setScore(MOMENTUM_CONFIG.thresholds[clampedLevel]);
  }, []);
  
  // Reset momentum
  const resetMomentum = useCallback(() => {
    setScore(0);
    setGlowLevel(0);
    setIsFireMode(false);
    setActivities([]);
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    if (fireModeTimerRef.current) clearTimeout(fireModeTimerRef.current);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      if (fireModeTimerRef.current) clearTimeout(fireModeTimerRef.current);
    };
  }, []);
  
  // Context value
  const value = useMemo(() => ({
    // State
    score,
    glowLevel,
    glowState,
    glowColor,
    message,
    isFireMode,
    activities,
    teamActivity,
    lastActivity,
    
    // Actions
    recordActivity,
    recordTeamActivity,
    setLevel,
    resetMomentum,
    
    // Config
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
    // Return safe defaults if not in provider
    return {
      score: 0,
      glowLevel: 0,
      glowState: 'dormant',
      glowColor: null,
      message: '',
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
  
  const recordTaskCompletion = useCallback((taskData = {}) => {
    return recordActivity('TASK_COMPLETE', taskData);
  }, [recordActivity]);
  
  const recordProjectShip = useCallback((projectData = {}) => {
    return recordActivity('PROJECT_SHIP', projectData);
  }, [recordActivity]);
  
  const recordFocusMinute = useCallback(() => {
    return recordActivity('FOCUS_MINUTE', {});
  }, [recordActivity]);
  
  const recordComment = useCallback((commentData = {}) => {
    return recordActivity('COMMENT_ADD', commentData);
  }, [recordActivity]);
  
  const recordFileUpload = useCallback((fileData = {}) => {
    return recordActivity('FILE_UPLOAD', fileData);
  }, [recordActivity]);
  
  return {
    recordTaskCompletion,
    recordProjectShip,
    recordFocusMinute,
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
