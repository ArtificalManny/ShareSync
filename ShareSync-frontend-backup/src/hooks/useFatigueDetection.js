// src/hooks/useFatigueDetection.js
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Fatigue Detection System
// Detects when user needs a break based on time, activity, and behavior patterns
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// FATIGUE LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export const FATIGUE_LEVELS = {
  FRESH: 'fresh',           // Just started, fully energized
  ENGAGED: 'engaged',       // Actively working, healthy
  SUSTAINING: 'sustaining', // Maintaining, watch for fatigue
  TIRED: 'tired',           // Signs of fatigue, suggest break soon
  FATIGUED: 'fatigued',     // Need break now
  EXHAUSTED: 'exhausted',   // Extended fatigue, insist on break
};

export const BREAK_TYPES = {
  MICRO: 'micro',           // 30 sec - stretch, look away
  SHORT: 'short',           // 5 min - stand, walk
  MEDIUM: 'medium',         // 15 min - proper break
  LONG: 'long',             // 30+ min - meal, exercise
};

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION THRESHOLDS (configurable)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_THRESHOLDS = {
  // Time thresholds (in minutes)
  continuousWorkBeforeBreak: 50,       // Pomodoro-style
  microBreakInterval: 20,              // Eye rest every 20 min
  maxContinuousHours: 3,               // Hard limit
  
  // Behavior thresholds
  rapidCorrectionCount: 5,             // Undo/backspace events indicating frustration
  rapidCorrectionWindow: 60,           // Seconds to track rapid corrections
  idleTimeForFatigue: 180,             // Seconds of inactivity suggesting fatigue
  scrollSpeedThreshold: 2000,          // Rapid scrolling (pixels/sec) suggests scanning
  
  // Activity thresholds
  lowActivityDuration: 600,            // 10 min of low activity
  activityPerMinuteThreshold: 2,       // Events per minute considered low
};

// ═══════════════════════════════════════════════════════════════════════════════
// BREAK RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const BREAK_RECOMMENDATIONS = {
  [BREAK_TYPES.MICRO]: [
    { title: 'Eye Rest', description: 'Look at something 20 feet away for 20 seconds', icon: '👁️', duration: 20 },
    { title: 'Stretch', description: 'Roll your shoulders and neck', icon: '🧘', duration: 30 },
    { title: 'Breathe', description: 'Take 3 deep breaths', icon: '🌬️', duration: 30 },
    { title: 'Blink', description: 'Blink rapidly 20 times to refresh eyes', icon: '✨', duration: 15 },
  ],
  [BREAK_TYPES.SHORT]: [
    { title: 'Water Break', description: 'Get up and drink a glass of water', icon: '💧', duration: 300 },
    { title: 'Walk', description: 'Take a quick walk around the room', icon: '🚶', duration: 300 },
    { title: 'Stretch Routine', description: 'Do a 5-minute stretch sequence', icon: '��', duration: 300 },
    { title: 'Fresh Air', description: 'Step outside for fresh air', icon: '🌳', duration: 300 },
  ],
  [BREAK_TYPES.MEDIUM]: [
    { title: 'Coffee Break', description: 'Make a coffee or tea mindfully', icon: '☕', duration: 900 },
    { title: 'Snack Time', description: 'Have a healthy snack', icon: '🍎', duration: 900 },
    { title: 'Short Walk', description: 'Walk around the block', icon: '🏃', duration: 900 },
    { title: 'Meditation', description: 'Do a 10-minute guided meditation', icon: '🧘‍♀️', duration: 900 },
  ],
  [BREAK_TYPES.LONG]: [
    { title: 'Meal Break', description: 'Take a proper meal break away from screen', icon: '🍽️', duration: 1800 },
    { title: 'Exercise', description: 'Do a workout or long walk', icon: '💪', duration: 1800 },
    { title: 'Power Nap', description: 'Take a 20-minute power nap', icon: '😴', duration: 1200 },
    { title: 'Social Break', description: 'Chat with someone in person', icon: '👋', duration: 1800 },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENCOURAGING MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

const FATIGUE_MESSAGES = {
  [FATIGUE_LEVELS.FRESH]: [
    "You're starting fresh! Let's make it count.",
    "Full energy! What will you ship today?",
  ],
  [FATIGUE_LEVELS.ENGAGED]: [
    "You're in the zone! Keep it up.",
    "Nice flow going! Stay hydrated.",
  ],
  [FATIGUE_LEVELS.SUSTAINING]: [
    "Solid progress. Remember to take breaks.",
    "You're doing great. A micro-break soon?",
  ],
  [FATIGUE_LEVELS.TIRED]: [
    "Your brain might need a quick reset.",
    "A 5-minute break could boost your next hour.",
    "Great work! Time to recharge briefly?",
  ],
  [FATIGUE_LEVELS.FATIGUED]: [
    "You've been at it a while. Break time?",
    "Your best work comes after rest.",
    "Even machines need downtime. You do too.",
  ],
  [FATIGUE_LEVELS.EXHAUSTED]: [
    "Please take a proper break. I insist.",
    "You've earned a rest. Step away for a bit.",
    "Your wellbeing matters more than any task.",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const LS_KEYS = {
  SESSION_START: 'ss.fatigue.sessionStart',
  LAST_BREAK: 'ss.fatigue.lastBreak',
  BREAKS_TAKEN: 'ss.fatigue.breaksTaken',
  BREAK_PREFERENCES: 'ss.fatigue.preferences',
  DISMISSED_REMINDERS: 'ss.fatigue.dismissed',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useFatigueDetection - Monitors user fatigue and suggests breaks
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether detection is enabled
 * @param {Object} options.thresholds - Custom thresholds (overrides defaults)
 * @param {Function} options.onFatigueDetected - Callback when fatigue level changes
 * @param {Function} options.onBreakRecommended - Callback when break is recommended
 * 
 * @returns {Object} Fatigue state and controls
 */
export function useFatigueDetection({
  enabled = true,
  thresholds = {},
  onFatigueDetected,
  onBreakRecommended,
} = {}) {
  // Merge thresholds with defaults
  const config = useMemo(() => ({ ...DEFAULT_THRESHOLDS, ...thresholds }), [thresholds]);
  
  // State
  const [fatigueLevel, setFatigueLevel] = useState(FATIGUE_LEVELS.FRESH);
  const [sessionStart, setSessionStart] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.SESSION_START);
      return saved ? parseInt(saved) : Date.now();
    } catch {
      return Date.now();
    }
  });
  const [lastBreak, setLastBreak] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.LAST_BREAK);
      return saved ? parseInt(saved) : Date.now();
    } catch {
      return Date.now();
    }
  });
  const [breaksTaken, setBreaksTaken] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.BREAKS_TAKEN);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  
  // Refs for tracking behavior
  const activityLog = useRef([]);
  const correctionCount = useRef(0);
  const lastActivityTime = useRef(Date.now());
  const scrollEvents = useRef([]);
  
  // Calculate session duration
  const sessionDuration = useMemo(() => {
    return Math.floor((Date.now() - sessionStart) / 60000); // minutes
  }, [sessionStart]);
  
  // Calculate time since last break
  const timeSinceBreak = useMemo(() => {
    return Math.floor((Date.now() - lastBreak) / 60000); // minutes
  }, [lastBreak]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTIVITY TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Track general activity (call from components)
  const logActivity = useCallback((type = 'generic') => {
    if (!enabled) return;
    
    const now = Date.now();
    activityLog.current.push({ type, timestamp: now });
    lastActivityTime.current = now;
    
    // Keep only last 10 minutes of activity
    const tenMinutesAgo = now - 600000;
    activityLog.current = activityLog.current.filter(a => a.timestamp > tenMinutesAgo);
  }, [enabled]);
  
  // Track corrections (undo, backspace, delete)
  const logCorrection = useCallback(() => {
    if (!enabled) return;
    
    correctionCount.current += 1;
    
    // Reset count after window
    setTimeout(() => {
      correctionCount.current = Math.max(0, correctionCount.current - 1);
    }, config.rapidCorrectionWindow * 1000);
  }, [enabled, config.rapidCorrectionWindow]);
  
  // Track scroll events
  const logScroll = useCallback((scrollAmount) => {
    if (!enabled) return;
    
    const now = Date.now();
    scrollEvents.current.push({ amount: Math.abs(scrollAmount), timestamp: now });
    
    // Keep only last 5 seconds
    scrollEvents.current = scrollEvents.current.filter(s => s.timestamp > now - 5000);
  }, [enabled]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FATIGUE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const calculateFatigue = useCallback(() => {
    if (!enabled) return FATIGUE_LEVELS.ENGAGED;
    
    const now = Date.now();
    const minutesSinceBreak = timeSinceBreak;
    const hoursSinceStart = sessionDuration / 60;
    
    // Check for exhaustion (hard limits)
    if (hoursSinceStart >= config.maxContinuousHours) {
      return FATIGUE_LEVELS.EXHAUSTED;
    }
    
    // Check for fatigue
    if (minutesSinceBreak >= config.continuousWorkBeforeBreak * 2) {
      return FATIGUE_LEVELS.FATIGUED;
    }
    
    // Check for tiredness
    if (minutesSinceBreak >= config.continuousWorkBeforeBreak) {
      return FATIGUE_LEVELS.TIRED;
    }
    
    // Check for rapid corrections (frustration signal)
    if (correctionCount.current >= config.rapidCorrectionCount) {
      return FATIGUE_LEVELS.TIRED;
    }
    
    // Check for idle time (disengagement signal)
    const idleTime = (now - lastActivityTime.current) / 1000;
    if (idleTime >= config.idleTimeForFatigue) {
      return FATIGUE_LEVELS.TIRED;
    }
    
    // Check activity rate
    const recentActivity = activityLog.current.filter(
      a => a.timestamp > now - 60000
    ).length;
    
    if (minutesSinceBreak > 30 && recentActivity < config.activityPerMinuteThreshold) {
      return FATIGUE_LEVELS.SUSTAINING;
    }
    
    // Check for rapid scrolling (scanning without focus)
    const recentScrolls = scrollEvents.current;
    if (recentScrolls.length > 10) {
      const totalScroll = recentScrolls.reduce((sum, s) => sum + s.amount, 0);
      const timeSpan = (recentScrolls[recentScrolls.length - 1]?.timestamp - recentScrolls[0]?.timestamp) / 1000;
      if (timeSpan > 0 && totalScroll / timeSpan > config.scrollSpeedThreshold) {
        return FATIGUE_LEVELS.SUSTAINING;
      }
    }
    
    // Default based on time
    if (minutesSinceBreak < 20) return FATIGUE_LEVELS.FRESH;
    if (minutesSinceBreak < 35) return FATIGUE_LEVELS.ENGAGED;
    
    return FATIGUE_LEVELS.SUSTAINING;
  }, [enabled, timeSinceBreak, sessionDuration, config]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BREAK RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const getRecommendedBreak = useCallback((level) => {
    let breakType;
    
    switch (level) {
      case FATIGUE_LEVELS.SUSTAINING:
        breakType = BREAK_TYPES.MICRO;
        break;
      case FATIGUE_LEVELS.TIRED:
        breakType = BREAK_TYPES.SHORT;
        break;
      case FATIGUE_LEVELS.FATIGUED:
        breakType = BREAK_TYPES.MEDIUM;
        break;
      case FATIGUE_LEVELS.EXHAUSTED:
        breakType = BREAK_TYPES.LONG;
        break;
      default:
        return null;
    }
    
    const options = BREAK_RECOMMENDATIONS[breakType];
    const randomIndex = Math.floor(Math.random() * options.length);
    
    return {
      type: breakType,
      ...options[randomIndex],
    };
  }, []);
  
  const getMessage = useCallback((level) => {
    const messages = FATIGUE_MESSAGES[level] || [];
    if (messages.length === 0) return '';
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BREAK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const startBreak = useCallback((breakType = BREAK_TYPES.SHORT) => {
    const now = Date.now();
    const breakRecord = {
      type: breakType,
      startTime: now,
      fatigueLevel: fatigueLevel,
    };
    
    setBreaksTaken(prev => {
      const updated = [...prev, breakRecord];
      try {
        localStorage.setItem(LS_KEYS.BREAKS_TAKEN, JSON.stringify(updated.slice(-20)));
      } catch {}
      return updated;
    });
    
    setShowBreakReminder(false);
    setReminderDismissed(false);
    
    return breakRecord;
  }, [fatigueLevel]);
  
  const endBreak = useCallback(() => {
    const now = Date.now();
    setLastBreak(now);
    setFatigueLevel(FATIGUE_LEVELS.FRESH);
    
    try {
      localStorage.setItem(LS_KEYS.LAST_BREAK, now.toString());
    } catch {}
    
    // Reset tracking
    correctionCount.current = 0;
    activityLog.current = [];
    scrollEvents.current = [];
  }, []);
  
  const dismissReminder = useCallback((snoozeMinutes = 10) => {
    setShowBreakReminder(false);
    setReminderDismissed(true);
    
    // Snooze: show again after snoozeMinutes
    if (snoozeMinutes > 0) {
      setTimeout(() => {
        setReminderDismissed(false);
      }, snoozeMinutes * 60 * 1000);
    }
  }, []);
  
  const resetSession = useCallback(() => {
    const now = Date.now();
    setSessionStart(now);
    setLastBreak(now);
    setFatigueLevel(FATIGUE_LEVELS.FRESH);
    setBreaksTaken([]);
    setShowBreakReminder(false);
    setReminderDismissed(false);
    
    correctionCount.current = 0;
    activityLog.current = [];
    scrollEvents.current = [];
    
    try {
      localStorage.setItem(LS_KEYS.SESSION_START, now.toString());
      localStorage.setItem(LS_KEYS.LAST_BREAK, now.toString());
      localStorage.setItem(LS_KEYS.BREAKS_TAKEN, '[]');
    } catch {}
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECT: Periodic fatigue check
  // ═══════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!enabled) return;
    
    const checkFatigue = () => {
      const newLevel = calculateFatigue();
      
      if (newLevel !== fatigueLevel) {
        setFatigueLevel(newLevel);
        onFatigueDetected?.(newLevel);
        
        // Show break reminder for concerning levels
        if (
          !reminderDismissed &&
          [FATIGUE_LEVELS.TIRED, FATIGUE_LEVELS.FATIGUED, FATIGUE_LEVELS.EXHAUSTED].includes(newLevel)
        ) {
          const recommendation = getRecommendedBreak(newLevel);
          setCurrentRecommendation(recommendation);
          setShowBreakReminder(true);
          onBreakRecommended?.(recommendation);
        }
      }
    };
    
    // Check every 30 seconds
    const interval = setInterval(checkFatigue, 30000);
    checkFatigue(); // Initial check
    
    return () => clearInterval(interval);
  }, [
    enabled,
    fatigueLevel,
    calculateFatigue,
    reminderDismissed,
    getRecommendedBreak,
    onFatigueDetected,
    onBreakRecommended,
  ]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECT: Track keyboard corrections
  // ═══════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e) => {
      // Track corrections
      if (['Backspace', 'Delete'].includes(e.key) || (e.metaKey && e.key === 'z')) {
        logCorrection();
      }
      // Track general activity
      logActivity('keystroke');
    };
    
    const handleMouseMove = () => {
      logActivity('mouse');
    };
    
    const handleScroll = (e) => {
      logScroll(e.deltaY || 0);
      logActivity('scroll');
    };
    
    // Throttled mouse tracking
    let lastMouseLog = 0;
    const throttledMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseLog > 5000) { // Every 5 seconds max
        handleMouseMove();
        lastMouseLog = now;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', throttledMouseMove);
    window.addEventListener('wheel', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', throttledMouseMove);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [enabled, logCorrection, logActivity, logScroll]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════════
  
  return {
    // Current state
    fatigueLevel,
    sessionDuration,
    timeSinceBreak,
    breaksTaken,
    
    // Recommendations
    showBreakReminder,
    currentRecommendation,
    message: getMessage(fatigueLevel),
    
    // Helpers
    isFatigued: [
      FATIGUE_LEVELS.TIRED,
      FATIGUE_LEVELS.FATIGUED,
      FATIGUE_LEVELS.EXHAUSTED,
    ].includes(fatigueLevel),
    
    needsBreak: [
      FATIGUE_LEVELS.FATIGUED,
      FATIGUE_LEVELS.EXHAUSTED,
    ].includes(fatigueLevel),
    
    // Actions
    startBreak,
    endBreak,
    dismissReminder,
    resetSession,
    
    // Activity logging (for components to call)
    logActivity,
    logCorrection,
    logScroll,
    
    // Constants
    FATIGUE_LEVELS,
    BREAK_TYPES,
    BREAK_RECOMMENDATIONS,
  };
}

export default useFatigueDetection;
