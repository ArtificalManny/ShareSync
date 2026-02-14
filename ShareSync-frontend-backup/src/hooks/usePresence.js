/**
 * usePresence.js
 * Custom hook for managing user presence (online/idle/focus)
 * 
 * ⭐ PHASE 2D: Enhanced to work with both CursorContext AND SocketContext
 * 
 * Features:
 * - Automatic idle detection
 * - Focus mode management
 * - Ghost/team mode switching
 * - Activity heartbeat
 * - Presence analytics
 * - WebSocket integration via SocketContext
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Try to import both contexts (they may not both exist)
let useCursorContext = () => ({ cursors: [], isConnected: false, sendHeartbeat: () => {} });
let useSocketContext = () => null;

try {
  const cursorModule = require('../context/CursorContext');
  if (cursorModule?.useCursorContext) {
    useCursorContext = cursorModule.useCursorContext;
  }
} catch (e) {
  // CursorContext not available
}

try {
  const socketModule = require('../context/SocketContext');
  if (socketModule?.useSocketContext) {
    useSocketContext = socketModule.useSocketContext;
  }
} catch (e) {
  // SocketContext not available
}

// Presence states
export const PresenceStatus = {
  ONLINE: 'online',
  IDLE: 'idle',
  AWAY: 'away',
  BUSY: 'busy',
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

  // Try both contexts
  const cursorContext = useCursorContext?.() || {};
  const socketContext = useSocketContext?.() || {};

  // Use whichever context is available
  const { 
    cursors = [], 
    isConnected: cursorConnected = false, 
    sendHeartbeat: cursorHeartbeat = () => {},
  } = cursorContext;

  const {
    isConnected: socketConnected = false,
    updatePresence: socketUpdatePresence,
    getPresence: socketGetPresence,
  } = socketContext;

  const isConnected = cursorConnected || socketConnected;

  // User's presence state
  const [status, setStatus] = useState(PresenceStatus.ONLINE);
  const [mode, setMode] = useState(PresenceMode.TEAM);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Timers
  const idleTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  // ============================================
  // SEND PRESENCE UPDATE (via WebSocket)
  // ============================================

  const sendPresenceUpdate = useCallback((newStatus) => {
    // Try SocketContext first (new system)
    if (socketUpdatePresence) {
      socketUpdatePresence(newStatus);
    }
    // Fallback to CursorContext heartbeat
    if (cursorHeartbeat) {
      cursorHeartbeat();
    }
  }, [socketUpdatePresence, cursorHeartbeat]);

  // ============================================
  // IDLE DETECTION
  // ============================================

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now();

    // If was idle, set back to online
    if (status === PresenceStatus.IDLE || status === PresenceStatus.AWAY) {
      setStatus(PresenceStatus.ONLINE);
      sendPresenceUpdate(PresenceStatus.ONLINE);
      console.log('🔄 Presence: Back to ONLINE');
    }

    // Clear and restart idle timer
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    if (autoDetectIdle) {
      idleTimer.current = setTimeout(() => {
        setStatus(PresenceStatus.IDLE);
        sendPresenceUpdate(PresenceStatus.IDLE);
        console.log('😴 Presence: Now IDLE');
      }, idleTimeout);
    }
  }, [status, autoDetectIdle, idleTimeout, sendPresenceUpdate]);

  // Track user activity to reset idle timer
  useEffect(() => {
    if (!autoDetectIdle) return;

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Listen to various activity events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
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

    // Send initial heartbeat/presence
    sendPresenceUpdate(status);

    // Send periodic heartbeats
    heartbeatTimer.current = setInterval(() => {
      // Only send if not offline
      if (status !== PresenceStatus.OFFLINE) {
        sendPresenceUpdate(status);
      }
    }, heartbeatInterval);

    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
      }
    };
  }, [autoSendHeartbeat, isConnected, heartbeatInterval, status, sendPresenceUpdate]);

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
    sendPresenceUpdate(PresenceStatus.FOCUS);
    console.log('🔥 Presence: Entered FOCUS mode');

    // Auto-exit after duration (if specified)
    if (duration) {
      setTimeout(() => {
        exitFocusMode();
      }, duration);
    }
  }, [sendPresenceUpdate]);

  const exitFocusMode = useCallback(() => {
    setMode(PresenceMode.TEAM);
    setStatus(PresenceStatus.ONLINE);
    sendPresenceUpdate(PresenceStatus.ONLINE);
    console.log('✅ Presence: Exited FOCUS mode');
  }, [sendPresenceUpdate]);

  const setAway = useCallback(() => {
    setStatus(PresenceStatus.AWAY);
    sendPresenceUpdate(PresenceStatus.AWAY);
  }, [sendPresenceUpdate]);

  const setBusy = useCallback(() => {
    setStatus(PresenceStatus.BUSY);
    sendPresenceUpdate(PresenceStatus.BUSY);
  }, [sendPresenceUpdate]);

  const setOnline = useCallback(() => {
    setStatus(PresenceStatus.ONLINE);
    sendPresenceUpdate(PresenceStatus.ONLINE);
  }, [sendPresenceUpdate]);

  // ============================================
  // PRESENCE ANALYTICS
  // ============================================

  // Get presence stats for current project
  const getProjectStats = useCallback(() => {
    const users = cursors.length > 0 ? cursors : onlineUsers;
    
    if (!users || users.length === 0) {
      return {
        total: 0,
        online: 0,
        idle: 0,
        focus: 0,
        away: 0,
        busy: 0,
      };
    }

    return {
      total: users.length,
      online: users.filter(c => c.status === PresenceStatus.ONLINE).length,
      idle: users.filter(c => c.status === PresenceStatus.IDLE).length,
      focus: users.filter(c => c.status === PresenceStatus.FOCUS).length,
      away: users.filter(c => c.status === PresenceStatus.AWAY).length,
      busy: users.filter(c => c.status === PresenceStatus.BUSY).length,
    };
  }, [cursors, onlineUsers]);

  // Get users by status
  const getUsersByStatus = useCallback((targetStatus) => {
    const users = cursors.length > 0 ? cursors : onlineUsers;
    return users.filter(c => c.status === targetStatus);
  }, [cursors, onlineUsers]);

  // Get users by mode
  const getUsersByMode = useCallback((targetMode) => {
    const users = cursors.length > 0 ? cursors : onlineUsers;
    return users.filter(c => c.mode === targetMode);
  }, [cursors, onlineUsers]);

  // Check if user is active (online or focus)
  const isUserActive = useCallback((userId) => {
    const users = cursors.length > 0 ? cursors : onlineUsers;
    const user = users.find(c => c.userId === userId);
    return user && (
      user.status === PresenceStatus.ONLINE || 
      user.status === PresenceStatus.FOCUS ||
      user.status === PresenceStatus.BUSY
    );
  }, [cursors, onlineUsers]);

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
    isAway: status === PresenceStatus.AWAY,
    isBusy: status === PresenceStatus.BUSY,
    isConnected,
    
    // Status setters
    setOnline,
    setAway,
    setBusy,
    
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
    onlineUsers: cursors.length > 0 ? cursors : onlineUsers,
  };
}

// ============================================
// SPECIALIZED PRESENCE HOOKS
// ============================================

/**
 * Hook for monitoring team activity
 */
export function useTeamPresence() {
  let cursors = [];
  
  try {
    const ctx = useCursorContext?.();
    cursors = ctx?.cursors || [];
  } catch (e) {
    // Context not available
  }

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
      c.status === PresenceStatus.ONLINE || 
      c.status === PresenceStatus.FOCUS ||
      c.status === PresenceStatus.BUSY
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
export function useFocusTimer(duration = 25 * 60 * 1000) {
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
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

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
  let cursors = [];
  
  try {
    const ctx = useCursorContext?.();
    cursors = ctx?.cursors || [];
  } catch (e) {
    // Context not available
  }

  const [isAlone, setIsAlone] = useState(false);
  const [justJoined, setJustJoined] = useState(null);

  useEffect(() => {
    const activeUsers = (cursors || []).filter(c => 
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

      console.log(`🎉 ${newUser.userName || 'Someone'} just joined! You're not alone anymore.`);
    }
  }, [cursors, isAlone]);

  const userCount = cursors?.length || 0;

  return {
    isAlone,
    justJoined,
    message: isAlone 
      ? "You're working solo right now"
      : justJoined 
        ? `${justJoined.userName || 'Someone'} just joined!`
        : `${userCount} ${userCount === 1 ? 'person' : 'people'} here`,
  };
}

/**
 * Hook for simple presence status
 */
export function useSimplePresence() {
  const { status, isConnected, setOnline, setAway, setBusy } = usePresence({
    autoDetectIdle: true,
    autoSendHeartbeat: true,
  });

  return {
    status,
    isConnected,
    setOnline,
    setAway,
    setBusy,
  };
}

export default usePresence;
