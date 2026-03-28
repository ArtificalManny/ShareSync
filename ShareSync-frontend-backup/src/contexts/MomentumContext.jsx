// src/contexts/MomentumContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: Momentum Engine + UI Broadcaster
// ═══════════════════════════════════════════════════════════════════════════════
//
// Provides momentum state and activity tracking throughout the app.
// SIGNATURE UPDATE: Broadcasts `data-momentum` to the DOM body, allowing CSS 
// variables to shift the entire UI's color temperature dynamically.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useMomentumLevelTransition, useFireModeSound, useMomentumTick, MOMENTUM_LEVELS } from '../sounds/MomentumSounds';

const MOMENTUM_CONFIG = {
  points: { TASK_COMPLETE: 10, PROJECT_SHIP: 50, FOCUS_MINUTE: 1, STREAK_DAY: 20, COMMENT_ADD: 5, FILE_UPLOAD: 5 },
  thresholds: [0, 50, 150, 300, 500, 750],
  decayRate: 2,
  decayDelay: 300,
  fireModeDelay: 60,
  fireModeTimeout: 300,
};

const GLOW_STATES = {
  0: { name: 'dormant', color: null, message: 'Start a task to build momentum' },
  1: { name: 'warming', color: 'brand', message: 'Momentum building...' },
  2: { name: 'active', color: 'brand', message: 'Nice rhythm going!' },
  3: { name: 'flowing', color: 'brand', message: 'You\'re in the flow' },
  4: { name: 'surging', color: 'cyan', message: 'Incredible momentum!' },
  5: { name: 'blazing', color: 'energy', message: 'Maximum velocity! ��' },
};

const MomentumContext = createContext(null);

export function MomentumProvider({ children }) {
  const [score, setScore] = useState(0);
  const [glowLevel, setGlowLevel] = useState(0);
  const [isFireMode, setIsFireMode] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [activities, setActivities] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  
  const decayTimerRef = useRef(null);
  const fireModeTimerRef = useRef(null);
  const previousLevelRef = useRef(0);
  
  const { playLevelTransition } = useMomentumLevelTransition();
  const { playFireModeActivate, playFireModeDeactivate } = useFireModeSound();
  const { playTick } = useMomentumTick(glowLevel);

  // 🚨 PHASE 4: UI BROADCASTER - Syncs React state to DOM for CSS Color Shifts 🚨
  useEffect(() => {
    document.body.setAttribute('data-momentum', glowLevel);
  }, [glowLevel]);

  useEffect(() => {
    document.body.setAttribute('data-momentum-fire', isFireMode);
  }, [isFireMode]);
  
  const calculateLevel = useCallback((currentScore) => {
    const thresholds = MOMENTUM_CONFIG.thresholds;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (currentScore >= thresholds[i]) return i;
    }
    return 0;
  }, []);
  
  const glowState = useMemo(() => GLOW_STATES[glowLevel]?.name || 'dormant', [glowLevel]);
  const glowColor = useMemo(() => GLOW_STATES[glowLevel]?.color || null, [glowLevel]);
  const message = useMemo(() => isFireMode ? 'FIRE MODE ACTIVE! 🔥🔥🔥' : GLOW_STATES[glowLevel]?.message || '', [glowLevel, isFireMode]);
  
  useEffect(() => {
    const previousLevel = previousLevelRef.current;
    if (glowLevel !== previousLevel) {
      playLevelTransition(previousLevel, glowLevel);
      previousLevelRef.current = glowLevel;
    }
  }, [glowLevel, playLevelTransition]);
  
  useEffect(() => {
    if (isFireMode) playFireModeActivate();
  }, [isFireMode, playFireModeActivate]);
  
  const recordActivity = useCallback((type, metadata = {}) => {
    let points = MOMENTUM_CONFIG.points[type] || 0;
    try { if (localStorage.getItem('ss.focusBlock.active') === '1') points *= 2; } catch {}
    const now = Date.now();
    
    const newActivity = { id: `${now}-${Math.random().toString(36).substr(2, 9)}`, type, points, timestamp: now, metadata };
    setActivities(prev => [newActivity, ...prev].slice(0, 100));
    setLastActivity(now);
    
    setScore(prev => {
      const newScore = prev + points;
      const newLevel = calculateLevel(newScore);
      
      if (newLevel !== glowLevel) setGlowLevel(newLevel);
      if (newLevel >= 5 && !isFireMode) {
        if (fireModeTimerRef.current) clearTimeout(fireModeTimerRef.current);
        fireModeTimerRef.current = setTimeout(() => setIsFireMode(true), MOMENTUM_CONFIG.fireModeDelay * 1000);
      }
      return newScore;
    });
    
    playTick(glowLevel);
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    decayTimerRef.current = setTimeout(() => startDecay(), MOMENTUM_CONFIG.decayDelay * 1000);
    
    return newActivity;
  }, [glowLevel, isFireMode, calculateLevel, playTick]);
  
  const startDecay = useCallback(() => {
    const decay = () => {
      setScore(prev => {
        const newScore = Math.max(0, prev - MOMENTUM_CONFIG.decayRate);
        const newLevel = calculateLevel(newScore);
        
        if (newLevel !== glowLevel) {
          setGlowLevel(newLevel);
          if (newLevel < 5 && isFireMode) {
            setIsFireMode(false);
            playFireModeDeactivate();
          }
        }
        if (newScore > 0) decayTimerRef.current = setTimeout(decay, 60000);
        return newScore;
      });
    };
    decay();
  }, [glowLevel, isFireMode, calculateLevel, playFireModeDeactivate]);
  
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
  
  const recordTeamActivity = useCallback((activity) => setTeamActivity(prev => [activity, ...prev].slice(0, 50)), []);
  
  const setLevel = useCallback((level) => {
    const clampedLevel = Math.max(0, Math.min(5, level));
    setGlowLevel(clampedLevel);
    setScore(MOMENTUM_CONFIG.thresholds[clampedLevel]);
  }, []);
  
  const resetMomentum = useCallback(() => {
    setScore(0); setGlowLevel(0); setIsFireMode(false); setActivities([]);
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    if (fireModeTimerRef.current) clearTimeout(fireModeTimerRef.current);
  }, []);
  
  useEffect(() => {
    return () => {
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      if (fireModeTimerRef.current) clearTimeout(fireModeTimerRef.current);
    };
  }, []);
  
  const value = useMemo(() => ({
    score, glowLevel, glowState, glowColor, message, isFireMode, activities, teamActivity, lastActivity,
    recordActivity, recordTeamActivity, setLevel, resetMomentum,
    thresholds: MOMENTUM_CONFIG.thresholds, maxLevel: 5,
  }), [score, glowLevel, glowState, glowColor, message, isFireMode, activities, teamActivity, lastActivity, recordActivity, recordTeamActivity, setLevel, resetMomentum]);
  
  return <MomentumContext.Provider value={value}>{children}</MomentumContext.Provider>;
}

export function useMomentumContext() {
  const context = useContext(MomentumContext);
  if (!context) {
    return { score: 0, glowLevel: 0, glowState: 'dormant', glowColor: null, message: '', isFireMode: false, activities: [], teamActivity: [], lastActivity: Date.now(), recordActivity: () => {}, recordTeamActivity: () => {}, setLevel: () => {}, resetMomentum: () => {}, thresholds: MOMENTUM_CONFIG.thresholds, maxLevel: 5 };
  }
  return context;
}

export function useMomentumActivity() {
  const { recordActivity, glowLevel } = useMomentumContext();
  const recordTaskCompletion = useCallback((taskData = {}) => recordActivity('TASK_COMPLETE', taskData), [recordActivity]);
  const recordProjectShip = useCallback((projectData = {}) => recordActivity('PROJECT_SHIP', projectData), [recordActivity]);
  const recordFocusMinute = useCallback(() => recordActivity('FOCUS_MINUTE', {}), [recordActivity]);
  const recordComment = useCallback((commentData = {}) => recordActivity('COMMENT_ADD', commentData), [recordActivity]);
  const recordFileUpload = useCallback((fileData = {}) => recordActivity('FILE_UPLOAD', fileData), [recordActivity]);
  
  return { recordTaskCompletion, recordProjectShip, recordFocusMinute, recordComment, recordFileUpload, currentLevel: glowLevel };
}

export function useMomentumStyles() {
  const { glowLevel, glowColor, isFireMode } = useMomentumContext();
  const getCardClasses = useCallback((baseClasses = '') => {
    return `${baseClasses} transition-all duration-300 ${isFireMode ? 'border-theme-accent/30 shadow-theme-glow' : glowLevel >= 4 ? 'border-theme-accent/10' : ''}`.trim();
  }, [glowLevel, isFireMode]);
  
  const getButtonClasses = useCallback((baseClasses = '') => {
    return `${baseClasses} transition-all duration-300 ${isFireMode ? 'animate-pulse shadow-theme-glow bg-theme-accent' : glowLevel >= 4 ? 'shadow-theme-glow bg-theme-accent' : ''}`.trim();
  }, [glowLevel, isFireMode]);
  
  return { getCardClasses, getButtonClasses, glowLevel, isFireMode, glowColor };
}

export function useFireMode() {
  const { isFireMode, glowLevel } = useMomentumContext();
  return { isFireMode, isNearFireMode: glowLevel >= 4, fireIntensity: isFireMode ? 1 : glowLevel >= 4 ? 0.5 : 0 };
}

export { MomentumContext };
export default MomentumProvider;
