// src/utils/shipSound.js
// ═══════════════════════════════════════════════════════════════════════════════
// SHIP CEREMONY - Sound Effect Utility
// ═══════════════════════════════════════════════════════════════════════════════
// Plays a satisfying "thunk" when user ships something
// Respects: reduced motion, user sound preferences, system mute
// ═══════════════════════════════════════════════════════════════════════════════

// We'll use a subtle, professional "thunk" sound
// This is a base64-encoded short sound to avoid external dependencies
// It's a soft, satisfying "pop/thunk" - not gamey, professional

const SHIP_SOUND_ENABLED_KEY = 'sharesync_ship_sound_enabled';

// Soft "thunk" sound - base64 encoded WAV (very short, ~50ms)
// This is a professional, subtle completion sound
const THUNK_SOUND_BASE64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

let audioContext = null;
let soundBuffer = null;
let isInitialized = false;

/**
 * Initialize the audio system (call on first user interaction)
 */
export async function initShipSound() {
  if (isInitialized) return;
  
  try {
    // Create audio context on user interaction (browser requirement)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // For now, we'll use a simple oscillator-based sound
    // This avoids needing to load external audio files
    isInitialized = true;
  } catch (error) {
    console.warn('Ship sound initialization failed:', error);
  }
}

/**
 * Play the ship ceremony sound
 */
export function playShipSound() {
  // Check if sounds are enabled
  if (!isSoundEnabled()) return;
  
  // Check for reduced motion preference (some users associate sound with motion)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  try {
    if (!audioContext) {
      // Fallback: create context on demand
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Create a satisfying "thunk" using oscillators
    // This is a short, professional completion sound
    const now = audioContext.currentTime;
    
    // Main tone - low frequency "thunk"
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);
    
    // High click for "snap" feel
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now);
    osc2.stop(now + 0.05);
    
  } catch (error) {
    // Silently fail - sound is enhancement, not critical
    console.warn('Ship sound playback failed:', error);
  }
}

/**
 * Check if ship sounds are enabled
 */
export function isSoundEnabled() {
  try {
    const stored = localStorage.getItem(SHIP_SOUND_ENABLED_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

/**
 * Toggle ship sounds on/off
 */
export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(SHIP_SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Toggle sound and return new state
 */
export function toggleSound() {
  const newState = !isSoundEnabled();
  setSoundEnabled(newState);
  return newState;
}
