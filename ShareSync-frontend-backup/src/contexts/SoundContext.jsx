// src/contexts/SoundContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Sound Context
// ═══════════════════════════════════════════════════════════════════════════════
//
// Global sound state management with React Context.
// Handles volume levels, mute states, and user preferences.
// Persists settings to localStorage for continuity across sessions.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { soundEngine } from '../utils/SoundEngine';
import { 
  SOUNDS, 
  SOUND_CATEGORIES, 
  DEFAULT_VOLUMES,
  AMBIENT_LOOPS,
  getSoundById,
  applyMomentumScale,
} from '../config/soundConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const STORAGE_KEY = 'sharesync_sound_preferences';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════
const SoundContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════
export function SoundProvider({ children }) {
  // ─────────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumes, setVolumes] = useState(DEFAULT_VOLUMES);
  const [activeAmbient, setActiveAmbient] = useState(null);
  const [preferences, setPreferences] = useState({
    enableUIFeedback: true,
    enableAchievementSounds: true,
    enableMomentumSounds: true,
    enableNotificationSounds: true,
    enableAmbientSounds: true,
    enableHoverSounds: false, // Off by default - can be annoying
    momentumSoundIntensity: 'normal', // 'minimal' | 'normal' | 'intense'
  });
  
  // Track if user has interacted (needed for Web Audio API)
  const hasInteracted = useRef(false);
  const initPromise = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOAD PREFERENCES FROM STORAGE
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.volumes) setVolumes(prev => ({ ...prev, ...parsed.volumes }));
        if (parsed.isMuted !== undefined) setIsMuted(parsed.isMuted);
        if (parsed.preferences) setPreferences(prev => ({ ...prev, ...parsed.preferences }));
      }
    } catch (e) {
      console.warn('[SoundContext] Failed to load preferences:', e);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SAVE PREFERENCES TO STORAGE
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Skip initial render
    if (!hasInteracted.current && !isInitialized) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        volumes,
        isMuted,
        preferences,
      }));
    } catch (e) {
      console.warn('[SoundContext] Failed to save preferences:', e);
    }
  }, [volumes, isMuted, preferences, isInitialized]);

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIALIZE SOUND ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    if (initPromise.current) return initPromise.current;
    
    initPromise.current = (async () => {
      const success = await soundEngine.init();
      if (success) {
        // Apply stored volumes
        soundEngine.setMasterVolume(isMuted ? 0 : volumes.master);
        Object.values(SOUND_CATEGORIES).forEach(category => {
          if (volumes[category] !== undefined) {
            soundEngine.setCategoryVolume(category, volumes[category]);
          }
        });
        setIsInitialized(true);
      }
      return success;
    })();
    
    return initPromise.current;
  }, [volumes, isMuted]);

  // ─────────────────────────────────────────────────────────────────────────────
  // USER INTERACTION HANDLER
  // Auto-initialize on first user interaction
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleInteraction = () => {
      if (hasInteracted.current) return;
      hasInteracted.current = true;
      initialize();
      
      // Remove listeners
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initialize]);

  // ─────────────────────────────────────────────────────────────────────────────
  // VISIBILITY CHANGE HANDLER
  // Suspend/resume audio context when tab is hidden/visible
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        soundEngine.suspend();
      } else {
        soundEngine.resume();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // VOLUME CONTROLS
  // ─────────────────────────────────────────────────────────────────────────────
  const setMasterVolume = useCallback((volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setVolumes(prev => ({ ...prev, master: clampedVolume }));
    if (isInitialized && !isMuted) {
      soundEngine.setMasterVolume(clampedVolume);
    }
  }, [isInitialized, isMuted]);

  const setCategoryVolume = useCallback((category, volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setVolumes(prev => ({ ...prev, [category]: clampedVolume }));
    if (isInitialized) {
      soundEngine.setCategoryVolume(category, clampedVolume);
    }
  }, [isInitialized]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (isInitialized) {
        soundEngine.setMasterVolume(newMuted ? 0 : volumes.master);
        if (newMuted) {
          soundEngine.stopAllAmbient();
          setActiveAmbient(null);
        }
      }
      return newMuted;
    });
  }, [isInitialized, volumes.master]);

  const mute = useCallback(() => {
    setIsMuted(true);
    if (isInitialized) {
      soundEngine.setMasterVolume(0);
      soundEngine.stopAllAmbient();
      setActiveAmbient(null);
    }
  }, [isInitialized]);

  const unmute = useCallback(() => {
    setIsMuted(false);
    if (isInitialized) {
      soundEngine.setMasterVolume(volumes.master);
    }
  }, [isInitialized, volumes.master]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAY SOUND
  // ─────────────────────────────────────────────────────────────────────────────
  const playSound = useCallback((soundId, options = {}) => {
    // Check if sounds are enabled
    if (isMuted) return null;
    if (!isInitialized && !hasInteracted.current) return null;
    
    // Get sound definition
    const sound = typeof soundId === 'string' ? getSoundById(soundId) : soundId;
    if (!sound) {
      console.warn(`[SoundContext] Unknown sound: ${soundId}`);
      return null;
    }
    
    // Check category preferences
    const categoryPrefs = {
      [SOUND_CATEGORIES.UI]: preferences.enableUIFeedback,
      [SOUND_CATEGORIES.ACHIEVEMENT]: preferences.enableAchievementSounds,
      [SOUND_CATEGORIES.MOMENTUM]: preferences.enableMomentumSounds,
      [SOUND_CATEGORIES.NOTIFICATION]: preferences.enableNotificationSounds,
      [SOUND_CATEGORIES.AMBIENT]: preferences.enableAmbientSounds,
    };
    
    if (!categoryPrefs[sound.category]) return null;
    
    // Apply momentum scaling if provided
    let params = sound.params;
    if (options.momentumLevel && sound.momentumScale) {
      params = applyMomentumScale(sound, options.momentumLevel);
    }
    
    // Initialize if needed
    if (!isInitialized) {
      initialize().then(() => {
        soundEngine.play({ ...sound, params }, options);
      });
      return null;
    }
    
    return soundEngine.play({ ...sound, params }, options);
  }, [isMuted, isInitialized, preferences, initialize]);

  // ─────────────────────────────────────────────────────────────────────────────
  // AMBIENT CONTROLS
  // ─────────────────────────────────────────────────────────────────────────────
  const startAmbient = useCallback((loopId) => {
    if (isMuted || !preferences.enableAmbientSounds) return false;
    
    const loop = AMBIENT_LOOPS[loopId];
    if (!loop) {
      console.warn(`[SoundContext] Unknown ambient loop: ${loopId}`);
      return false;
    }
    
    const start = () => {
      const success = soundEngine.startAmbient(loop);
      if (success) {
        setActiveAmbient(loopId);
      }
      return success;
    };
    
    if (!isInitialized) {
      initialize().then(start);
      return true;
    }
    
    return start();
  }, [isMuted, preferences.enableAmbientSounds, isInitialized, initialize]);

  const stopAmbient = useCallback((loopId) => {
    if (loopId) {
      soundEngine.stopAmbient(loopId);
      if (activeAmbient === loopId) {
        setActiveAmbient(null);
      }
    } else {
      soundEngine.stopAllAmbient();
      setActiveAmbient(null);
    }
  }, [activeAmbient]);

  const setAmbientVolume = useCallback((loopId, volume) => {
    soundEngine.setAmbientVolume(loopId, volume);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // PREFERENCE CONTROLS
  // ─────────────────────────────────────────────────────────────────────────────
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // STOP ALL
  // ─────────────────────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (isInitialized) {
      soundEngine.stopAll();
      setActiveAmbient(null);
    }
  }, [isInitialized]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────────
  const contextValue = useMemo(() => ({
    // State
    isInitialized,
    isMuted,
    volumes,
    activeAmbient,
    preferences,
    
    // Volume controls
    setMasterVolume,
    setCategoryVolume,
    toggleMute,
    mute,
    unmute,
    
    // Playback
    playSound,
    
    // Ambient
    startAmbient,
    stopAmbient,
    setAmbientVolume,
    
    // Preferences
    updatePreferences,
    
    // Utility
    initialize,
    stopAll,
    
    // Constants
    SOUND_CATEGORIES,
    AMBIENT_LOOPS,
  }), [
    isInitialized,
    isMuted,
    volumes,
    activeAmbient,
    preferences,
    setMasterVolume,
    setCategoryVolume,
    toggleMute,
    mute,
    unmute,
    playSound,
    startAmbient,
    stopAmbient,
    setAmbientVolume,
    updatePreferences,
    initialize,
    stopAll,
  ]);

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main hook to access sound context
 */
export function useSoundContext() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
}

/**
 * Hook for quick mute/unmute controls
 */
export function useSoundMute() {
  const { isMuted, toggleMute, mute, unmute } = useSoundContext();
  return { isMuted, toggleMute, mute, unmute };
}

/**
 * Hook for volume controls
 */
export function useSoundVolume() {
  const { volumes, setMasterVolume, setCategoryVolume } = useSoundContext();
  return { volumes, setMasterVolume, setCategoryVolume };
}

/**
 * Hook for ambient sound controls
 */
export function useAmbientSound() {
  const { 
    activeAmbient, 
    startAmbient, 
    stopAmbient, 
    setAmbientVolume,
    AMBIENT_LOOPS,
  } = useSoundContext();
  
  return { 
    activeAmbient, 
    startAmbient, 
    stopAmbient, 
    setAmbientVolume,
    availableLoops: Object.values(AMBIENT_LOOPS),
  };
}

/**
 * Hook for sound preferences
 */
export function useSoundPreferences() {
  const { preferences, updatePreferences } = useSoundContext();
  return { preferences, updatePreferences };
}

// Default export
export default SoundContext;
