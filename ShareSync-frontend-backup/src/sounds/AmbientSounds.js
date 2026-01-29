// src/sounds/AmbientSounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Ambient Sounds
// ═══════════════════════════════════════════════════════════════════════════════
//
// Background audio for focus mode and deep work.
// Includes noise generators, binaural beats, and ambient drones.
//
// All sounds are generated programmatically - no external audio files needed.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAmbientSound as useAmbientSoundBase, useSoundContext } from '../contexts/SoundContext';
import { useSounds } from '../hooks/useSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT SOUND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const AMBIENT_SOUNDS = {
  // Noise generators
  white_noise: {
    id: 'white_noise',
    name: 'White Noise',
    description: 'Full spectrum noise, like static',
    category: 'noise',
    icon: '📻',
    bestFor: 'Blocking distractions, masking sounds',
  },
  
  pink_noise: {
    id: 'pink_noise',
    name: 'Pink Noise',
    description: 'Softer, balanced noise',
    category: 'noise',
    icon: '🌸',
    bestFor: 'General focus, studying',
  },
  
  brown_noise: {
    id: 'brown_noise',
    name: 'Brown Noise',
    description: 'Deep, rumbling noise like thunder',
    category: 'noise',
    icon: '🌊',
    bestFor: 'Deep work, relaxation',
  },
  
  // Binaural beats
  binaural_focus: {
    id: 'binaural_focus',
    name: 'Focus Binaural',
    description: 'Alpha waves (10 Hz) for relaxed focus',
    category: 'binaural',
    icon: '🧠',
    bestFor: 'Creative work, light focus',
    requiresHeadphones: true,
  },
  
  binaural_deep: {
    id: 'binaural_deep',
    name: 'Deep Work Binaural',
    description: 'Theta waves (4 Hz) for deep concentration',
    category: 'binaural',
    icon: '🎯',
    bestFor: 'Complex tasks, deep work',
    requiresHeadphones: true,
  },
  
  // Ambient drones
  drone_ambient: {
    id: 'drone_ambient',
    name: 'Ambient Drone',
    description: 'Soft, evolving tones',
    category: 'drone',
    icon: '🌌',
    bestFor: 'Meditation, creative thinking',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT PRESETS
// Pre-configured settings for common scenarios
// ═══════════════════════════════════════════════════════════════════════════════

export const AMBIENT_PRESETS = {
  focus: {
    name: 'Focus Mode',
    description: 'Optimal for concentrated work',
    sound: 'brown_noise',
    volume: 0.25,
    icon: '🎯',
  },
  
  creative: {
    name: 'Creative Flow',
    description: 'Light background for creative work',
    sound: 'drone_ambient',
    volume: 0.15,
    icon: '🎨',
  },
  
  deep_work: {
    name: 'Deep Work',
    description: 'Maximum concentration (headphones required)',
    sound: 'binaural_deep',
    volume: 0.2,
    icon: '🧠',
    requiresHeadphones: true,
  },
  
  distraction_block: {
    name: 'Block Distractions',
    description: 'Mask background noise',
    sound: 'pink_noise',
    volume: 0.3,
    icon: '🔇',
  },
  
  calm: {
    name: 'Calm',
    description: 'Relaxed, gentle background',
    sound: 'binaural_focus',
    volume: 0.15,
    icon: '🌿',
    requiresHeadphones: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS SESSION SOUNDS
// ═══════════════════════════════════════════════════════════════════════════════

export const FOCUS_SESSION_SOUNDS = {
  // Sound to play when focus session starts
  sessionStart: 'focus_start',
  
  // Sound to play when focus session ends
  sessionEnd: 'focus_end',
  
  // Timer sounds
  timerTick: 'timer_tick',
  timerWarning: 'timer_warning',
  timerComplete: 'timer_complete',
  
  // Volume fade settings
  fadeIn: {
    duration: 2000, // 2 seconds
    curve: 'ease-out',
  },
  fadeOut: {
    duration: 1500,
    curve: 'ease-in',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for ambient sound playback
 * 
 * @example
 * const { startAmbient, stopAmbient, activeSound, setVolume } = useAmbientPlayer();
 * startAmbient('brown_noise');
 */
export function useAmbientPlayer() {
  const { 
    activeAmbient, 
    startAmbient: startBase, 
    stopAmbient: stopBase,
    setAmbientVolume,
  } = useAmbientSoundBase();
  
  const [volume, setVolume] = useState(0.25);
  
  const startAmbient = useCallback((soundId, options = {}) => {
    const initialVolume = options.volume ?? volume;
    const success = startBase(soundId);
    
    if (success) {
      setAmbientVolume(soundId, initialVolume);
    }
    
    return success;
  }, [startBase, setAmbientVolume, volume]);
  
  const stopAmbient = useCallback(() => {
    stopBase();
  }, [stopBase]);
  
  const setAmbientVolumeLevel = useCallback((newVolume) => {
    setVolume(newVolume);
    if (activeAmbient) {
      setAmbientVolume(activeAmbient, newVolume);
    }
  }, [activeAmbient, setAmbientVolume]);
  
  const activeSound = activeAmbient ? AMBIENT_SOUNDS[activeAmbient] : null;
  
  return {
    startAmbient,
    stopAmbient,
    activeAmbient,
    activeSound,
    volume,
    setVolume: setAmbientVolumeLevel,
    isPlaying: !!activeAmbient,
  };
}

/**
 * Hook for ambient presets
 * 
 * @example
 * const { applyPreset, presets, activePreset } = useAmbientPresets();
 * applyPreset('focus');
 */
export function useAmbientPresets() {
  const { startAmbient, stopAmbient, activeAmbient, setVolume } = useAmbientPlayer();
  const [activePreset, setActivePreset] = useState(null);
  
  const applyPreset = useCallback((presetId) => {
    const preset = AMBIENT_PRESETS[presetId];
    if (!preset) return false;
    
    startAmbient(preset.sound, { volume: preset.volume });
    setActivePreset(presetId);
    return true;
  }, [startAmbient]);
  
  const clearPreset = useCallback(() => {
    stopAmbient();
    setActivePreset(null);
  }, [stopAmbient]);
  
  return {
    applyPreset,
    clearPreset,
    presets: AMBIENT_PRESETS,
    activePreset,
    activePresetConfig: activePreset ? AMBIENT_PRESETS[activePreset] : null,
  };
}

/**
 * Hook for focus session ambient integration
 * Automatically manages ambient sound during focus sessions
 * 
 * @example
 * const { startFocusAmbient, endFocusAmbient } = useFocusAmbient('brown_noise');
 */
export function useFocusAmbient(defaultSound = 'brown_noise') {
  const { startAmbient, stopAmbient, setVolume, isPlaying } = useAmbientPlayer();
  const { playFocusStart, playFocusEnd } = useSounds();
  const [isInFocusSession, setIsInFocusSession] = useState(false);
  
  const startFocusAmbient = useCallback((soundId = defaultSound, options = {}) => {
    const { playStartSound = true, volume = 0.25 } = options;
    
    if (playStartSound) {
      playFocusStart();
    }
    
    // Slight delay to let start sound play
    setTimeout(() => {
      startAmbient(soundId, { volume });
    }, 500);
    
    setIsInFocusSession(true);
  }, [defaultSound, startAmbient, playFocusStart]);
  
  const endFocusAmbient = useCallback((options = {}) => {
    const { playEndSound = true } = options;
    
    stopAmbient();
    setIsInFocusSession(false);
    
    if (playEndSound) {
      setTimeout(() => {
        playFocusEnd();
      }, 200);
    }
  }, [stopAmbient, playFocusEnd]);
  
  return {
    startFocusAmbient,
    endFocusAmbient,
    isInFocusSession,
    isPlaying,
    setVolume,
  };
}

/**
 * Hook for timer sounds in focus sessions
 * 
 * @example
 * const { playTick, playWarning, playComplete } = useFocusTimerSounds();
 */
export function useFocusTimerSounds() {
  const { playTimerTick, playTimerWarning, playTimerComplete } = useSounds();
  
  return {
    playTick: playTimerTick,
    playWarning: playTimerWarning,
    playComplete: playTimerComplete,
  };
}

/**
 * Combined ambient sounds hook
 */
export function useAmbientSounds() {
  const player = useAmbientPlayer();
  const presets = useAmbientPresets();
  const focusAmbient = useFocusAmbient();
  const timerSounds = useFocusTimerSounds();
  
  return useMemo(() => ({
    // Player controls
    ...player,
    
    // Presets
    ...presets,
    
    // Focus integration
    ...focusAmbient,
    
    // Timer sounds
    ...timerSounds,
    
    // Sound definitions
    availableSounds: AMBIENT_SOUNDS,
    soundCategories: ['noise', 'binaural', 'drone'],
  }), [player, presets, focusAmbient, timerSounds]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT SOUND RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get recommended ambient sound based on context
 */
export function getRecommendedAmbient(context) {
  const recommendations = {
    // Task types
    coding: 'brown_noise',
    writing: 'pink_noise',
    creative: 'drone_ambient',
    reading: 'binaural_focus',
    meeting: null, // No ambient during meetings
    
    // Time of day
    morning: 'binaural_focus',
    afternoon: 'brown_noise',
    evening: 'drone_ambient',
    night: 'binaural_deep',
    
    // Energy levels
    low_energy: 'binaural_focus',
    medium_energy: 'pink_noise',
    high_energy: 'brown_noise',
    
    // Distractions
    noisy_environment: 'white_noise',
    quiet_environment: 'drone_ambient',
  };
  
  return recommendations[context] || 'brown_noise';
}

/**
 * Get all sounds in a category
 */
export function getAmbientSoundsByCategory(category) {
  return Object.values(AMBIENT_SOUNDS).filter(sound => sound.category === category);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT SOUND UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if sound requires headphones
 */
export function requiresHeadphones(soundId) {
  return AMBIENT_SOUNDS[soundId]?.requiresHeadphones ?? false;
}

/**
 * Get display info for ambient sound
 */
export function getAmbientDisplayInfo(soundId) {
  const sound = AMBIENT_SOUNDS[soundId];
  if (!sound) return null;
  
  return {
    ...sound,
    requiresHeadphones: requiresHeadphones(soundId),
  };
}

/**
 * Get preset display info
 */
export function getPresetDisplayInfo(presetId) {
  const preset = AMBIENT_PRESETS[presetId];
  if (!preset) return null;
  
  const sound = AMBIENT_SOUNDS[preset.sound];
  
  return {
    ...preset,
    soundInfo: sound,
    requiresHeadphones: requiresHeadphones(preset.sound),
  };
}

export default AMBIENT_SOUNDS;
