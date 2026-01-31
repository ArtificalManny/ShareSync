// src/hooks/useFocusFortress.js
// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS FORTRESS: Deep Work Protection System
// The app actively protects your focus with escalating levels
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export const FOCUS_LEVELS = {
  OFF: 0,
  LEVEL_1: 1, // Mute notifications
  LEVEL_2: 2, // Hide sidebar, simplify UI
  LEVEL_3: 3, // Single-task mode (one task visible)
  LEVEL_4: 4, // Fortress - full screen, no escape
};

export const FOCUS_LEVEL_CONFIG = {
  [FOCUS_LEVELS.OFF]: {
    name: 'Off',
    description: 'Normal mode',
    icon: '🌤️',
    features: [],
  },
  [FOCUS_LEVELS.LEVEL_1]: {
    name: 'Focus',
    description: 'Notifications muted',
    icon: '🔕',
    features: [
      'muteNotifications',
    ],
  },
  [FOCUS_LEVELS.LEVEL_2]: {
    name: 'Deep Focus',
    description: 'Simplified UI',
    icon: '🎯',
    features: [
      'muteNotifications',
      'hideSidebar',
      'simplifyUI',
      'reducedColors',
    ],
  },
  [FOCUS_LEVELS.LEVEL_3]: {
    name: 'Single Task',
    description: 'One task only',
    icon: '🔒',
    features: [
      'muteNotifications',
      'hideSidebar',
      'simplifyUI',
      'reducedColors',
      'singleTaskMode',
      'hideOtherTasks',
    ],
  },
  [FOCUS_LEVELS.LEVEL_4]: {
    name: 'Fortress',
    description: 'Maximum protection',
    icon: '��',
    features: [
      'muteNotifications',
      'hideSidebar',
      'simplifyUI',
      'reducedColors',
      'singleTaskMode',
      'hideOtherTasks',
      'fullScreen',
      'blockEscape',
      'zenMode',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERRUPTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const INTERRUPTION_TYPES = {
  MESSAGE: 'message',
  MENTION: 'mention',
  NOTIFICATION: 'notification',
  CALENDAR: 'calendar',
  SYSTEM: 'system',
};

export const INTERRUPTION_ACTIONS = {
  ALLOW: 'allow',           // Break focus and allow
  QUEUE: 'queue',           // Queue for after session
  URGENT: 'urgent',         // Mark as urgent (will interrupt)
  BLOCK: 'block',           // Block completely
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const LS_KEYS = {
  FOCUS_STATS: 'ss.focus.stats',
  FOCUS_PREFERENCES: 'ss.focus.prefs',
  QUEUED_INTERRUPTIONS: 'ss.focus.queue',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useFocusFortress({
  defaultLevel = FOCUS_LEVELS.OFF,
  defaultDuration = 25 * 60, // 25 minutes
  onFocusStart,
  onFocusEnd,
  onLevelChange,
  onInterruption,
} = {}) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [level, setLevel] = useState(FOCUS_LEVELS.OFF);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration);
  const [currentTask, setCurrentTask] = useState(null);
  const [queuedInterruptions, setQueuedInterruptions] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    startTime: null,
    pausedTime: 0,
    interruptions: 0,
    tasksCompleted: 0,
  });
  
  // Focus analytics state
  const [focusHistory, setFocusHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.FOCUS_STATS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.FOCUS_PREFERENCES);
      return saved ? JSON.parse(saved) : {
        defaultLevel: FOCUS_LEVELS.LEVEL_2,
        defaultDuration: 25 * 60,
        autoStartBreaks: true,
        breakDuration: 5 * 60,
        soundEnabled: true,
        queueInterruptions: true,
      };
    } catch {
      return {};
    }
  });
  
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const config = useMemo(() => FOCUS_LEVEL_CONFIG[level], [level]);
  
  const features = useMemo(() => {
    const featureSet = new Set(config.features || []);
    return {
      muteNotifications: featureSet.has('muteNotifications'),
      hideSidebar: featureSet.has('hideSidebar'),
      simplifyUI: featureSet.has('simplifyUI'),
      reducedColors: featureSet.has('reducedColors'),
      singleTaskMode: featureSet.has('singleTaskMode'),
      hideOtherTasks: featureSet.has('hideOtherTasks'),
      fullScreen: featureSet.has('fullScreen'),
      blockEscape: featureSet.has('blockEscape'),
      zenMode: featureSet.has('zenMode'),
    };
  }, [config]);
  
  const progress = useMemo(() => {
    if (duration === 0) return 0;
    return ((duration - timeRemaining) / duration) * 100;
  }, [duration, timeRemaining]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIMER LOGIC
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!isActive) return;
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endSession(true); // Completed naturally
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FULLSCREEN HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!isActive) return;
    
    if (features.fullScreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [isActive, features.fullScreen]);
  
  // Block escape during Fortress mode
  useEffect(() => {
    if (!isActive || !features.blockEscape) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Show "are you sure?" prompt instead
      }
    };
    
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You are in Focus Fortress mode. Are you sure you want to leave?';
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive, features.blockEscape]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // APPLY CSS CLASSES
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const classes = [];
    
    if (isActive) {
      classes.push('focus-active');
      classes.push(`focus-level-${level}`);
      
      if (features.hideSidebar) classes.push('focus-hide-sidebar');
      if (features.simplifyUI) classes.push('focus-simplified');
      if (features.reducedColors) classes.push('focus-reduced-colors');
      if (features.singleTaskMode) classes.push('focus-single-task');
      if (features.zenMode) classes.push('focus-zen');
    }
    
    document.body.classList.add(...classes);
    
    return () => {
      document.body.classList.remove(
        'focus-active',
        'focus-level-1', 'focus-level-2', 'focus-level-3', 'focus-level-4',
        'focus-hide-sidebar', 'focus-simplified', 'focus-reduced-colors',
        'focus-single-task', 'focus-zen'
      );
    };
  }, [isActive, level, features]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const startSession = useCallback((options = {}) => {
    const {
      focusLevel = preferences.defaultLevel || FOCUS_LEVELS.LEVEL_2,
      sessionDuration = preferences.defaultDuration || defaultDuration,
      task = null,
    } = options;
    
    setLevel(focusLevel);
    setDuration(sessionDuration);
    setTimeRemaining(sessionDuration);
    setCurrentTask(task);
    setIsActive(true);
    setSessionStats({
      startTime: Date.now(),
      pausedTime: 0,
      interruptions: 0,
      tasksCompleted: 0,
    });
    sessionStartRef.current = Date.now();
    
    onFocusStart?.({ level: focusLevel, duration: sessionDuration, task });
  }, [preferences, defaultDuration, onFocusStart]);
  
  const endSession = useCallback((completed = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Record session to history
    if (sessionStartRef.current) {
      const sessionRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        level,
        duration: duration - timeRemaining,
        targetDuration: duration,
        completed,
        task: currentTask,
        interruptions: sessionStats.interruptions,
        tasksCompleted: sessionStats.tasksCompleted,
      };
      
      setFocusHistory(prev => {
        const updated = [...prev, sessionRecord].slice(-100); // Keep last 100
        try {
          localStorage.setItem(LS_KEYS.FOCUS_STATS, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
    
    const endStats = {
      ...sessionStats,
      endTime: Date.now(),
      completed,
      actualDuration: duration - timeRemaining,
    };
    
    setIsActive(false);
    setLevel(FOCUS_LEVELS.OFF);
    setTimeRemaining(duration);
    setCurrentTask(null);
    sessionStartRef.current = null;
    
    onFocusEnd?.(endStats);
    
    // Process queued interruptions
    if (queuedInterruptions.length > 0) {
      // Could show a modal with queued items
    }
    
    return endStats;
  }, [level, duration, timeRemaining, currentTask, sessionStats, queuedInterruptions, onFocusEnd]);
  
  const pauseSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setSessionStats(prev => ({
      ...prev,
      pausedTime: prev.pausedTime + (Date.now() - sessionStartRef.current),
    }));
  }, []);
  
  const resumeSession = useCallback(() => {
    setIsActive(true);
    sessionStartRef.current = Date.now();
  }, []);
  
  const changeLevel = useCallback((newLevel) => {
    const oldLevel = level;
    setLevel(newLevel);
    onLevelChange?.({ from: oldLevel, to: newLevel });
  }, [level, onLevelChange]);
  
  const extendSession = useCallback((additionalSeconds) => {
    setDuration(prev => prev + additionalSeconds);
    setTimeRemaining(prev => prev + additionalSeconds);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTERRUPTION HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleInterruption = useCallback((interruption, action = null) => {
    // If no action specified, check preferences
    if (!action) {
      action = features.muteNotifications 
        ? INTERRUPTION_ACTIONS.QUEUE 
        : INTERRUPTION_ACTIONS.ALLOW;
    }
    
    setSessionStats(prev => ({
      ...prev,
      interruptions: prev.interruptions + 1,
    }));
    
    switch (action) {
      case INTERRUPTION_ACTIONS.QUEUE:
        setQueuedInterruptions(prev => [...prev, {
          ...interruption,
          queuedAt: Date.now(),
        }]);
        break;
        
      case INTERRUPTION_ACTIONS.ALLOW:
        // Break focus
        pauseSession();
        break;
        
      case INTERRUPTION_ACTIONS.URGENT:
        // Interrupt regardless of level
        pauseSession();
        break;
        
      case INTERRUPTION_ACTIONS.BLOCK:
        // Do nothing, completely blocked
        break;
    }
    
    onInterruption?.({ interruption, action });
    
    return action;
  }, [features.muteNotifications, pauseSession, onInterruption]);
  
  const clearQueuedInterruptions = useCallback(() => {
    setQueuedInterruptions([]);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TASK COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const recordTaskCompletion = useCallback(() => {
    setSessionStats(prev => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
    }));
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(LS_KEYS.FOCUS_PREFERENCES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // State
    level,
    isActive,
    duration,
    timeRemaining,
    progress,
    currentTask,
    queuedInterruptions,
    sessionStats,
    focusHistory,
    preferences,
    
    // Config
    config,
    features,
    
    // Session controls
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    changeLevel,
    extendSession,
    
    // Interruption handling
    handleInterruption,
    clearQueuedInterruptions,
    
    // Task tracking
    recordTaskCompletion,
    
    // Preferences
    updatePreferences,
    
    // Constants
    FOCUS_LEVELS,
    FOCUS_LEVEL_CONFIG,
    INTERRUPTION_TYPES,
    INTERRUPTION_ACTIONS,
  };
}

export default useFocusFortress;
