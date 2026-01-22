// src/hooks/usePomodoroTimer.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Pomodoro Timer Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Standalone timer hook that can be used independently of the context.
// Useful for lightweight timer needs or custom implementations.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * usePomodoroTimer - Standalone Pomodoro timer hook
 * 
 * @param {object} options
 * @param {number} options.initialMinutes - Starting minutes (default: 25)
 * @param {function} options.onComplete - Callback when timer completes
 * @param {function} options.onTick - Callback on each tick (receives remaining seconds)
 * @param {boolean} options.autoStart - Start automatically (default: false)
 */
export default function usePomodoroTimer(options = {}) {
  const {
    initialMinutes = 25,
    onComplete,
    onTick,
    autoStart = false,
  } = options;

  const [status, setStatus] = useState(autoStart ? 'running' : 'idle');
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && status === 'idle') {
      start();
    }
  }, [autoStart]);

  /**
   * Start the timer
   */
  const start = useCallback((minutes) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const seconds = minutes ? minutes * 60 : remainingSeconds;
    setTotalSeconds(minutes ? minutes * 60 : totalSeconds);
    setRemainingSeconds(seconds);
    setStatus('running');

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        
        // Call onTick callback
        if (onTickRef.current) {
          onTickRef.current(next);
        }
        
        if (next <= 0) {
          clearInterval(timerRef.current);
          setStatus('completed');
          
          // Call onComplete callback
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          
          return 0;
        }
        
        return next;
      });
    }, 1000);
  }, [remainingSeconds, totalSeconds]);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus('paused');
  }, []);

  /**
   * Resume the timer
   */
  const resume = useCallback(() => {
    if (status !== 'paused') return;
    
    setStatus('running');
    
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        
        if (onTickRef.current) {
          onTickRef.current(next);
        }
        
        if (next <= 0) {
          clearInterval(timerRef.current);
          setStatus('completed');
          
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          
          return 0;
        }
        
        return next;
      });
    }, 1000);
  }, [status]);

  /**
   * Reset the timer
   */
  const reset = useCallback((minutes = initialMinutes) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setStatus('idle');
  }, [initialMinutes]);

  /**
   * Toggle play/pause
   */
  const toggle = useCallback(() => {
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
  }, [status, pause, resume, start]);

  /**
   * Add time to the timer
   */
  const addTime = useCallback((minutes) => {
    setRemainingSeconds(prev => prev + minutes * 60);
    setTotalSeconds(prev => prev + minutes * 60);
  }, []);

  // Computed values
  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  }, [totalSeconds, remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  
  const formattedTime = useMemo(() => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [minutes, seconds]);

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';

  return {
    // State
    status,
    remainingSeconds,
    totalSeconds,
    minutes,
    seconds,
    
    // Computed
    formattedTime,
    progress,
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    
    // Actions
    start,
    pause,
    resume,
    reset,
    toggle,
    addTime,
  };
}

/**
 * useCountdown - Simple countdown hook
 * Useful for breaks or simple timers
 */
export function useCountdown(initialSeconds = 0, onComplete) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback((startSeconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSeconds(startSeconds || initialSeconds);
    setIsRunning(true);
    
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds, onComplete]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  const formatted = useMemo(() => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [seconds]);

  return { seconds, formatted, isRunning, start, stop, reset };
}
