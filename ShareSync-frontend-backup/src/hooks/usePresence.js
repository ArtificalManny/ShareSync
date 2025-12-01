/**
 * usePresence.js
 * Custom hook for managing user presence (online/idle/focus)
 * 
 * Features:
 * - Automatic idle detection
 * - Focus mode management
 * - Ghost/team mode switching
 * - Activity heartbeat
 * - Presence analytics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCursorContext } from '../context/CursorContext';

// Presence states
export const PresenceStatus = {
  ONLINE: 'online',
  IDLE: 'idle',
  FOCUS: 'focus',
  OFFLINE: 'offline',
};

export const PresenceMode = {
  GHOST: 'ghost',   // Anonymous viewing
  TEAM: 'team',     // Full visibility
  FOCUS: 'focus',   // Deep work mode
};

export function usePresence(options = {}) {
  const {
    idleTimeout = 5 * 60 * 1000,        // 5 minutes
    heartbeatInterval = 30 * 1000,      // 30 seconds
    autoDetectIdle = true,
    autoSendHeartbeat = true,
  } = options;

  const { sendHeartbeat, cursors, isConnected } = useCursorContext();

  // User's presence state
  const [status, setStatus] = useState(PresenceStatus.ONLINE);
  const [mode, setMode] = useState(PresenceMode.TEAM);

  // Timers
  const idleTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  // ============================================
  // IDLE DETECTION
  // ============================================

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now();

    // If was idle, set back to online
    if (status === PresenceStatus.IDLE) {
      setStatus(PresenceStatus.ONLINE);
      console.log('🔄 Presence: Back to ONLINE');
    }

    // Clear and restart idle timer
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    if (autoDetectIdle) {
      idleTimer.current = setTimeout(() => {
        setStatus(PresenceStatus.IDLE);
        console.log('😴 Presence: Now IDLE');
      }, idleTimeout);
    }
  }, [status, autoDetectIdle, idleTimeout]);

  // Track user activity to reset idle timer
  useEffect(() => {
    if (!autoDetectIdle) return;

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Listen to various activity events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [autoDetectIdle, resetIdleTimer]);

  // ============================================
  // HEARTBEAT
  // ============================================

  useEffect(() => {
    if (!autoSendHeartbeat || !isConnected) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Send periodic heartbeats
    heartbeatTimer.current = setInterval(() => {
      // Only send if not offline
      if (status !== PresenceStatus.OFFLINE) {
        sendHeartbeat();
      }
    }, heartbeatInterval);

    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
      }
    };
  }, [autoSendHeartbeat, isConnected, sendHeartbeat, heartbeatInterval, status]);

  // ============================================
  // PRESENCE MODE MANAGEMENT
  // ============================================

  const enterGhostMode = useCallback(() => {
    setMode(PresenceMode.GHOST);
    console.log('🎭 Presence: Entered GHOST mode');
  }, []);

  const enterTeamMode = useCallback(() => {
    setMode(PresenceMode.TEAM);
    console.log('👥 Presence: Entered TEAM mode');
  }, []);

  const enterFocusMode = useCallback((duration) => {
    setMode(PresenceMode.FOCUS);
    setStatus(PresenceStatus.FOCUS);
    console.log('🔥 Presence: Entered FOCUS mode');

    // Auto-exit after duration (if specified)
    if (duration) {
      setTimeout(() => {
        exitFocusMode();
      }, duration);
    }
  }, []);

  const exitFocusMode = useCallback(() => {
    setMode(PresenceMode.TEAM);
    setStatus(PresenceStatus.ONLINE);
    console.log('✅ Presence: Exited FOCUS mode');
  }, []);

  // ============================================
  // PRESENCE ANALYTICS
  // ============================================

  // Get presence stats for current project
  const getProjectStats = useCallback(() => {
    if (!cursors || cursors.length === 0) {
      return {
        total: 0,
        online: 0,
        idle: 0,
        focus: 0,
      };
    }

    return {
      total: cursors.length,
      online: cursors.filter(c => c.status === PresenceStatus.ONLINE).length,
      idle: cursors.filter(c => c.status === PresenceStatus.IDLE).length,
      focus: cursors.filter(c => c.status === PresenceStatus.FOCUS).length,
    };
  }, [cursors]);

  // Get users by status
  const getUsersByStatus = useCallback((targetStatus) => {
    return cursors.filter(c => c.status === targetStatus);
  }, [cursors]);

  // Get users by mode
  const getUsersByMode = useCallback((targetMode) => {
    return cursors.filter(c => c.mode === targetMode);
  }, [cursors]);

  // Check if user is active (online or focus)
  const isUserActive = useCallback((userId) => {
    const cursor = cursors.find(c => c.userId === userId);
    return cursor && (cursor.status === PresenceStatus.ONLINE || cursor.status === PresenceStatus.FOCUS);
  }, [cursors]);

  // Get time since last activity
  const getTimeSinceActivity = useCallback(() => {
    return Date.now() - lastActivity.current;
  }, []);

  // ============================================
  // RETURN VALUE
  // ============================================

  return {
    // Current user's state
    status,
    mode,
    isOnline: status === PresenceStatus.ONLINE,
    isIdle: status === PresenceStatus.IDLE,
    isFocus: status === PresenceStatus.FOCUS,
    
    // Mode management
    enterGhostMode,
    enterTeamMode,
    enterFocusMode,
    exitFocusMode,
    
    // Activity
    resetIdleTimer,
    lastActivity: lastActivity.current,
    timeSinceActivity: getTimeSinceActivity(),
    
    // Analytics
    projectStats: getProjectStats(),
    getUsersByStatus,
    getUsersByMode,
    isUserActive,
  };
}

// ============================================
// SPECIALIZED PRESENCE HOOKS
// ============================================

/**
 * Hook for monitoring team activity
 */
export function useTeamPresence() {
  const { cursors } = useCursorContext();
  const [teamActivity, setTeamActivity] = useState({
    isActive: false,
    activeCount: 0,
    message: '',
  });

  useEffect(() => {
    if (!cursors || cursors.length === 0) {
      setTeamActivity({
        isActive: false,
        activeCount: 0,
        message: 'Waiting for team...',
      });
      return;
    }

    const activeUsers = cursors.filter(c => 
      c.status === PresenceStatus.ONLINE || c.status === PresenceStatus.FOCUS
    );

    const count = activeUsers.length;

    let message = '';
    if (count === 0) {
      message = 'Team is quiet';
    } else if (count === 1) {
      message = '1 person working';
    } else if (count <= 3) {
      message = `${count} people working`;
    } else if (count <= 7) {
      message = `Team is active! (${count} online)`;
    } else {
      message = `🔥 Team is on FIRE! (${count} online)`;
    }

    setTeamActivity({
      isActive: count > 0,
      activeCount: count,
      message,
    });
  }, [cursors]);

  return teamActivity;
}

/**
 * Hook for focus mode timer
 */
export function useFocusTimer(duration) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    setIsActive(true);
    setTimeRemaining(duration);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current);
          setIsActive(false);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  }, [duration]);

  const pause = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(duration);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [duration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time remaining as MM:SS
  const formatted = `${Math.floor(timeRemaining / 60000)}:${String(Math.floor((timeRemaining % 60000) / 1000)).padStart(2, '0')}`;

  return {
    timeRemaining,
    formatted,
    isActive,
    progress: ((duration - timeRemaining) / duration) * 100,
    start,
    pause,
    reset,
  };
}

/**
 * Hook for detecting cursor loneliness (you're the only one)
 */
export function useLonelinessDetection() {
  const { cursors } = useCursorContext();
  const [isAlone, setIsAlone] = useState(false);
  const [justJoined, setJustJoined] = useState(null);

  useEffect(() => {
    const activeUsers = cursors.filter(c => 
      c.status === PresenceStatus.ONLINE || c.status === PresenceStatus.FOCUS
    );

    const wasAlone = isAlone;
    const nowAlone = activeUsers.length === 0;

    setIsAlone(nowAlone);

    // Detect when someone joins while you're alone
    if (wasAlone && !nowAlone && activeUsers.length === 1) {
      const newUser = activeUsers[0];
      setJustJoined(newUser);
      
      // Clear notification after 5 seconds
      setTimeout(() => {
        setJustJoined(null);
      }, 5000);

      console.log(`🎉 ${newUser.userName} just joined! You're not alone anymore.`);
    }
  }, [cursors, isAlone]);

  return {
    isAlone,
    justJoined,
    message: isAlone 
      ? "You're working solo right now"
      : justJoined 
        ? `${justJoined.userName} just joined!`
        : `${cursors.length} ${cursors.length === 1 ? 'person' : 'people'} here`,
  };
}

export default usePresence;