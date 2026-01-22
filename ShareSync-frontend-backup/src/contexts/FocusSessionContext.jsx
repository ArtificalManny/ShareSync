// src/contexts/FocusSessionContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Global Context Provider
// ═══════════════════════════════════════════════════════════════════════════════
//
// Enhanced focus session management with:
// - Task association (what you're focusing on)
// - Session history tracking
// - Break reminders
// - Integration with presence system
// - Notifications when session ends
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

const FocusSessionContext = createContext(null);

// Session states
export const FOCUS_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  BREAK: 'break',
  COMPLETED: 'completed',
};

// Default durations (in minutes)
export const FOCUS_DURATIONS = {
  SHORT: 15,
  STANDARD: 25,
  LONG: 45,
  CUSTOM: 0,
};

export const BREAK_DURATIONS = {
  SHORT: 5,
  LONG: 15,
};

// Storage key
const STORAGE_KEY = 'ss.focus-sessions';

export function FocusSessionProvider({ children }) {
  // Session state
  const [status, setStatus] = useState(FOCUS_STATUS.IDLE);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [totalFocusTimeToday, setTotalFocusTimeToday] = useState(0);
  
  // Break state
  const [isBreak, setIsBreak] = useState(false);
  const [breakRemaining, setBreakRemaining] = useState(0);
  
  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('ss.focus-settings');
      return stored ? JSON.parse(stored) : {
        defaultDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreak: false,
        soundEnabled: true,
        notificationsEnabled: true,
        showInArena: true,
      };
    } catch {
      return {
        defaultDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreak: false,
        soundEnabled: true,
        notificationsEnabled: true,
        showInArena: true,
      };
    }
  });

  // Timer ref
  const timerRef = useRef(null);

  // Load session history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // Count today's sessions
        const todaySessions = data.sessions?.filter(
          s => new Date(s.completedAt).toDateString() === today
        ) || [];
        
        setSessionsToday(todaySessions.length);
        setTotalFocusTimeToday(
          todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
        );
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('ss.focus-settings', JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if (settings.notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [settings.notificationsEnabled]);

  /**
   * Play completion sound
   */
  const playCompletionSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Audio not available
    }
  }, [settings.soundEnabled]);

  /**
   * Show notification
   */
  const showNotification = useCallback((title, body) => {
    if (!settings.notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'focus-session',
      });
    }
  }, [settings.notificationsEnabled]);

  /**
   * Handle session completion
   */
  const handleSessionComplete = useCallback(() => {
    setStatus(FOCUS_STATUS.COMPLETED);
    playCompletionSound();
    showNotification(
      '🎉 Focus Session Complete!',
      currentTask ? `Great work on "${currentTask}"!` : 'Time for a break!'
    );

    // Save session to history
    const session = {
      id: `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
      startedAt: sessionStartTime,
      duration: totalSeconds / 60,
      task: currentTask,
      project: currentProject,
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { sessions: [] };
      data.sessions = [session, ...(data.sessions || []).slice(0, 99)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }

    // Update today's stats
    setSessionsToday(prev => prev + 1);
    setTotalFocusTimeToday(prev => prev + totalSeconds / 60);

    // Auto-start break if enabled
    if (settings.autoStartBreak) {
      setTimeout(() => startBreak(), 2000);
    }
  }, [currentTask, currentProject, sessionStartTime, totalSeconds, settings.autoStartBreak, playCompletionSound, showNotification]);

  /**
   * Start a focus session
   */
  const startSession = useCallback((options = {}) => {
    const {
      minutes = settings.defaultDuration,
      task = null,
      project = null,
    } = options;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setStatus(FOCUS_STATUS.RUNNING);
    setCurrentTask(task);
    setCurrentProject(project);
    setSessionStartTime(new Date().toISOString());
    setIsBreak(false);

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        
        if (next <= 0) {
          clearInterval(timerRef.current);
          handleSessionComplete();
          return 0;
        }
        
        return next;
      });
    }, 1000);
  }, [settings.defaultDuration, handleSessionComplete]);

  /**
   * Pause the session
   */
  const pauseSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus(FOCUS_STATUS.PAUSED);
  }, []);

  /**
   * Resume the session
   */
  const resumeSession = useCallback(() => {
    if (status !== FOCUS_STATUS.PAUSED) return;
    
    setStatus(FOCUS_STATUS.RUNNING);
    
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        
        if (next <= 0) {
          clearInterval(timerRef.current);
          handleSessionComplete();
          return 0;
        }
        
        return next;
      });
    }, 1000);
  }, [status, handleSessionComplete]);

  /**
   * Cancel the session
   */
  const cancelSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus(FOCUS_STATUS.IDLE);
    setRemainingSeconds(settings.defaultDuration * 60);
    setTotalSeconds(settings.defaultDuration * 60);
    setCurrentTask(null);
    setCurrentProject(null);
    setSessionStartTime(null);
    setIsBreak(false);
  }, [settings.defaultDuration]);

  /**
   * Complete session early
   */
  const completeSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const actualDuration = totalSeconds - remainingSeconds;
    
    if (actualDuration > 60) {
      handleSessionComplete();
    } else {
      cancelSession();
    }
  }, [totalSeconds, remainingSeconds, handleSessionComplete, cancelSession]);

  /**
   * Start a break
   */
  const startBreak = useCallback((isLong = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const breakMinutes = isLong ? settings.longBreak : settings.shortBreak;
    const breakSeconds = breakMinutes * 60;
    
    setIsBreak(true);
    setBreakRemaining(breakSeconds);
    setStatus(FOCUS_STATUS.BREAK);

    timerRef.current = setInterval(() => {
      setBreakRemaining(prev => {
        const next = prev - 1;
        
        if (next <= 0) {
          clearInterval(timerRef.current);
          setStatus(FOCUS_STATUS.IDLE);
          setIsBreak(false);
          showNotification('Break over!', 'Ready to focus again?');
          return 0;
        }
        
        return next;
      });
    }, 1000);
  }, [settings.shortBreak, settings.longBreak, showNotification]);

  /**
   * Skip break
   */
  const skipBreak = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus(FOCUS_STATUS.IDLE);
    setIsBreak(false);
    setBreakRemaining(0);
  }, []);

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset to idle
   */
  const resetToIdle = useCallback(() => {
    setStatus(FOCUS_STATUS.IDLE);
    setRemainingSeconds(settings.defaultDuration * 60);
    setTotalSeconds(settings.defaultDuration * 60);
  }, [settings.defaultDuration]);

  /**
   * Get session history
   */
  const getSessionHistory = useCallback((limit = 10) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return (data.sessions || []).slice(0, limit);
      }
    } catch {
      // Ignore
    }
    return [];
  }, []);

  // Computed values
  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  }, [totalSeconds, remainingSeconds]);

  const isActive = status === FOCUS_STATUS.RUNNING || status === FOCUS_STATUS.PAUSED;
  const isRunning = status === FOCUS_STATUS.RUNNING;
  const isPaused = status === FOCUS_STATUS.PAUSED;
  const isCompleted = status === FOCUS_STATUS.COMPLETED;

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const formattedTime = formatTime(remainingSeconds);
  const formattedBreakTime = formatTime(breakRemaining);

  const value = {
    status,
    remainingSeconds,
    totalSeconds,
    currentTask,
    currentProject,
    sessionStartTime,
    sessionsToday,
    totalFocusTimeToday,
    isBreak,
    breakRemaining,
    settings,
    progress,
    isActive,
    isRunning,
    isPaused,
    isCompleted,
    formattedTime,
    formattedBreakTime,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    startBreak,
    skipBreak,
    updateSettings,
    resetToIdle,
    getSessionHistory,
    formatTime,
    FOCUS_STATUS,
    FOCUS_DURATIONS,
    BREAK_DURATIONS,
  };

  return (
    <FocusSessionContext.Provider value={value}>
      {children}
    </FocusSessionContext.Provider>
  );
}

export function useFocusSession() {
  const context = useContext(FocusSessionContext);
  
  if (!context) {
    return {
      status: FOCUS_STATUS.IDLE,
      remainingSeconds: 25 * 60,
      totalSeconds: 25 * 60,
      progress: 0,
      isActive: false,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      formattedTime: '25:00',
      startSession: () => {},
      pauseSession: () => {},
      resumeSession: () => {},
      cancelSession: () => {},
      completeSession: () => {},
      FOCUS_STATUS,
      FOCUS_DURATIONS,
    };
  }
  
  return context;
}

export default FocusSessionContext;
