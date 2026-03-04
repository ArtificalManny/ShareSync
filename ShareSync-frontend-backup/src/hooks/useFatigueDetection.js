// src/hooks/useFatigueDetection.js
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Fatigue Detection System (SAFELY DISABLED)
// Hook hollowed out to prevent background tracking while keeping imports intact.
// ═══════════════════════════════════════════════════════════════════════════════

export const FATIGUE_LEVELS = {
  FRESH: 'fresh',
  ENGAGED: 'engaged',
  SUSTAINING: 'sustaining',
  TIRED: 'tired',
  FATIGUED: 'fatigued',
  EXHAUSTED: 'exhausted',
};

export const BREAK_TYPES = {
  MICRO: 'micro',
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
};

const BREAK_RECOMMENDATIONS = {};

export function useFatigueDetection({
  enabled = true,
  thresholds = {},
  onFatigueDetected,
  onBreakRecommended,
} = {}) {
  // Return a static, inert state. No tracking, no timers, no popups.
  return {
    fatigueLevel: FATIGUE_LEVELS.FRESH,
    sessionDuration: 0,
    timeSinceBreak: 0,
    breaksTaken: [],
    
    showBreakReminder: false,
    currentRecommendation: null,
    message: '',
    
    isFatigued: false,
    needsBreak: false,
    
    startBreak: () => {},
    endBreak: () => {},
    dismissReminder: () => {},
    resetSession: () => {},
    
    logActivity: () => {},
    logCorrection: () => {},
    logScroll: () => {},
    
    FATIGUE_LEVELS,
    BREAK_TYPES,
    BREAK_RECOMMENDATIONS,
  };
}

export default useFatigueDetection;
