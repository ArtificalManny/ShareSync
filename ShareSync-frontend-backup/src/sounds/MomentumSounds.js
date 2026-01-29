// src/sounds/MomentumSounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Momentum Sounds
// ═══════════════════════════════════════════════════════════════════════════════
//
// Sounds that escalate with your momentum level.
// Creates audio feedback that matches the visual momentum system.
//
// As momentum increases:
// - Pitch rises
// - Sounds become richer
// - Fire mode adds distortion/energy
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSounds, useMomentumSounds as useMomentumSoundsBase } from '../hooks/useSounds';
import { useSoundContext } from '../contexts/SoundContext';

// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM LEVEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const MOMENTUM_LEVELS = {
  1: {
    name: 'Starting',
    pitchMultiplier: 1.0,
    intensityMultiplier: 0.7,
    color: 'slate',
  },
  2: {
    name: 'Building',
    pitchMultiplier: 1.1,
    intensityMultiplier: 0.85,
    color: 'blue',
  },
  3: {
    name: 'Flowing',
    pitchMultiplier: 1.25,
    intensityMultiplier: 1.0,
    color: 'purple',
  },
  4: {
    name: 'Surging',
    pitchMultiplier: 1.4,
    intensityMultiplier: 1.15,
    color: 'pink',
  },
  5: {
    name: 'On Fire',
    pitchMultiplier: 1.6,
    intensityMultiplier: 1.3,
    color: 'orange',
  },
};

/**
 * Get momentum level config
 */
export function getMomentumLevelConfig(level) {
  return MOMENTUM_LEVELS[Math.min(Math.max(level, 1), 5)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM SOUND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const MOMENTUM_SOUNDS = {
  // Tick sound (on activity)
  momentum_tick: {
    id: 'momentum_tick',
    description: 'Brief tick when activity contributes to momentum',
    scalesWithLevel: true,
    useCase: 'Completing small actions, adding to streak',
  },
  
  // Level up
  momentum_level_up: {
    id: 'momentum_level_up',
    description: 'Momentum level increased',
    scalesWithLevel: true,
    useCase: 'Transitioning between momentum levels',
  },
  
  // Fire mode
  fire_mode_activate: {
    id: 'fire_mode_activate',
    description: 'Fire mode activated',
    scalesWithLevel: false,
    useCase: 'Reaching max momentum, entering fire mode',
  },
  
  fire_mode_deactivate: {
    id: 'fire_mode_deactivate',
    description: 'Fire mode deactivated',
    scalesWithLevel: false,
    useCase: 'Leaving fire mode, momentum reset',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FIRE MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const FIRE_MODE_CONFIG = {
  // Level required to activate fire mode
  activationLevel: 5,
  
  // Duration before fire mode deactivates from inactivity (ms)
  inactivityTimeout: 5 * 60 * 1000, // 5 minutes
  
  // Sound effects in fire mode
  sounds: {
    onActivate: 'fire_mode_activate',
    onDeactivate: 'fire_mode_deactivate',
    tickOverride: true, // Use fire-specific tick sound
  },
  
  // Visual intensity
  visualIntensity: 1.5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM TICK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const MOMENTUM_TICK_CONFIG = {
  // Actions that trigger momentum tick sound
  triggerActions: [
    'task_complete',
    'task_create',
    'comment_add',
    'focus_minute',
    'ship',
  ],
  
  // Cooldown between tick sounds (ms)
  cooldown: 200,
  
  // Maximum ticks per minute (prevent spam)
  maxTicksPerMinute: 30,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for momentum-aware tick sounds
 * Automatically scales with current momentum level
 * 
 * @example
 * const { playTick } = useMomentumTick();
 * playTick(); // Plays at current momentum level
 */
export function useMomentumTick(currentLevel = 2) {
  const { playMomentumTick } = useMomentumSoundsBase();
  const lastTickTime = useRef(0);
  const tickCount = useRef(0);
  const tickResetTime = useRef(Date.now());
  
  // Reset tick count every minute
  useEffect(() => {
    const interval = setInterval(() => {
      tickCount.current = 0;
      tickResetTime.current = Date.now();
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const playTick = useCallback((level = currentLevel) => {
    const now = Date.now();
    
    // Check cooldown
    if (now - lastTickTime.current < MOMENTUM_TICK_CONFIG.cooldown) {
      return false;
    }
    
    // Check max ticks per minute
    if (tickCount.current >= MOMENTUM_TICK_CONFIG.maxTicksPerMinute) {
      return false;
    }
    
    lastTickTime.current = now;
    tickCount.current++;
    
    playMomentumTick(level);
    return true;
  }, [currentLevel, playMomentumTick]);
  
  return { playTick };
}

/**
 * Hook for momentum level transition sounds
 * 
 * @example
 * const { playLevelTransition } = useMomentumLevelTransition();
 * playLevelTransition(2, 3); // Play transition from level 2 to 3
 */
export function useMomentumLevelTransition() {
  const { playMomentumUp, playFireModeOn, playFireModeOff } = useMomentumSoundsBase();
  
  const playLevelTransition = useCallback((fromLevel, toLevel) => {
    // Fire mode activation
    if (toLevel >= FIRE_MODE_CONFIG.activationLevel && fromLevel < FIRE_MODE_CONFIG.activationLevel) {
      playFireModeOn();
      return 'fire_activate';
    }
    
    // Fire mode deactivation
    if (fromLevel >= FIRE_MODE_CONFIG.activationLevel && toLevel < FIRE_MODE_CONFIG.activationLevel) {
      playFireModeOff();
      return 'fire_deactivate';
    }
    
    // Normal level up
    if (toLevel > fromLevel) {
      playMomentumUp(toLevel);
      return 'level_up';
    }
    
    // Level down (currently silent)
    return 'level_down';
  }, [playMomentumUp, playFireModeOn, playFireModeOff]);
  
  return { playLevelTransition };
}

/**
 * Hook for fire mode sounds
 * 
 * @example
 * const { playFireOn, playFireOff, isFireModeSound } = useFireModeSound();
 */
export function useFireModeSound() {
  const { playFireModeOn, playFireModeOff } = useMomentumSoundsBase();
  
  const isFireModeSound = useCallback((level) => {
    return level >= FIRE_MODE_CONFIG.activationLevel;
  }, []);
  
  return {
    playFireOn: playFireModeOn,
    playFireOff: playFireModeOff,
    isFireModeSound,
    fireThreshold: FIRE_MODE_CONFIG.activationLevel,
  };
}

/**
 * Hook that integrates with MomentumContext
 * Automatically plays sounds on level changes
 * 
 * @example
 * // In a component that renders once
 * useMomentumSoundEffects();
 */
export function useMomentumSoundEffects() {
  const { playLevelTransition } = useMomentumLevelTransition();
  const previousLevel = useRef(null);
  
  // This would typically connect to MomentumContext
  // For now, returns a handler that can be called manually
  const handleLevelChange = useCallback((newLevel) => {
    if (previousLevel.current !== null && previousLevel.current !== newLevel) {
      playLevelTransition(previousLevel.current, newLevel);
    }
    previousLevel.current = newLevel;
  }, [playLevelTransition]);
  
  return { handleLevelChange };
}

/**
 * Combined momentum sounds hook
 */
export function useMomentumSounds(currentLevel = 2) {
  const base = useMomentumSoundsBase();
  const { playTick } = useMomentumTick(currentLevel);
  const { playLevelTransition } = useMomentumLevelTransition();
  const { playFireOn, playFireOff, isFireModeSound, fireThreshold } = useFireModeSound();
  const { handleLevelChange } = useMomentumSoundEffects();
  
  const levelConfig = useMemo(() => getMomentumLevelConfig(currentLevel), [currentLevel]);
  
  return useMemo(() => ({
    // Base sounds
    ...base,
    
    // Enhanced
    playTick,
    playLevelTransition,
    playFireOn,
    playFireOff,
    handleLevelChange,
    
    // State
    currentLevel,
    levelConfig,
    isFireMode: currentLevel >= fireThreshold,
    fireThreshold,
    isFireModeSound,
  }), [
    base, playTick, playLevelTransition, playFireOn, playFireOff, 
    handleLevelChange, currentLevel, levelConfig, fireThreshold, isFireModeSound
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM SOUND PRESETS
// Pre-configured sound behaviors for different momentum states
// ═══════════════════════════════════════════════════════════════════════════════

export const MOMENTUM_SOUND_PRESETS = {
  // Level 1: Subtle, encouraging
  starting: {
    tickEnabled: true,
    tickVolume: 0.5,
    levelUpEnabled: true,
    ambientEnabled: false,
  },
  
  // Level 2-3: Normal feedback
  flowing: {
    tickEnabled: true,
    tickVolume: 0.7,
    levelUpEnabled: true,
    ambientEnabled: false,
  },
  
  // Level 4: Enhanced feedback
  surging: {
    tickEnabled: true,
    tickVolume: 0.85,
    levelUpEnabled: true,
    ambientEnabled: true,
  },
  
  // Level 5: Maximum intensity
  fire: {
    tickEnabled: true,
    tickVolume: 1.0,
    levelUpEnabled: true,
    ambientEnabled: true,
    useFireSounds: true,
  },
};

/**
 * Get preset for momentum level
 */
export function getMomentumSoundPreset(level) {
  if (level >= 5) return MOMENTUM_SOUND_PRESETS.fire;
  if (level >= 4) return MOMENTUM_SOUND_PRESETS.surging;
  if (level >= 2) return MOMENTUM_SOUND_PRESETS.flowing;
  return MOMENTUM_SOUND_PRESETS.starting;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM ACTIVITY SOUNDS MAPPING
// Maps activity types to appropriate sounds
// ═══════════════════════════════════════════════════════════════════════════════

export const ACTIVITY_SOUND_MAP = {
  // High impact (uses full ship/achievement sounds)
  ship: 'ship',
  major_milestone: 'ship_epic',
  level_up: 'level_up',
  achievement: 'achievement_unlock',
  
  // Medium impact (uses task complete)
  task_complete: 'task_complete',
  sprint_complete: 'task_complete',
  
  // Low impact (uses momentum tick)
  task_create: 'momentum_tick',
  comment: 'momentum_tick',
  reaction: 'momentum_tick',
  focus_checkpoint: 'momentum_tick',
};

/**
 * Get appropriate sound for an activity type
 */
export function getSoundForActivity(activityType, momentumLevel = 2) {
  const soundId = ACTIVITY_SOUND_MAP[activityType];
  if (!soundId) return null;
  
  return {
    soundId,
    momentumLevel,
    scalesWithMomentum: soundId === 'momentum_tick',
  };
}

export default MOMENTUM_SOUNDS;
