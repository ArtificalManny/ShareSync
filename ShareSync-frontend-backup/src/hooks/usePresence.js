/**
 * usePresence.js
 * ⭐ FIX: Switched deduplication from `userId` to `sessionId` to support same-user multi-tab testing!
 */

import { useState, useEffect, useCallback, useRef } from 'react';

let useCursorContext = () => ({ cursors: [], isConnected: false, sendHeartbeat: () => {} });
let useSocketContext = () => null;

try {
  const cursorModule = require('../context/CursorContext');
  if (cursorModule?.useCursorContext) useCursorContext = cursorModule.useCursorContext;
} catch (e) {}

try {
  const socketModule = require('../context/SocketContext');
  if (socketModule?.useSocketContext) useSocketContext = socketModule.useSocketContext;
} catch (e) {}

export const PresenceStatus = {
  ONLINE: 'online', IDLE: 'idle', AWAY: 'away', BUSY: 'busy', FOCUS: 'focus', OFFLINE: 'offline',
};

export const PresenceMode = {
  GHOST: 'ghost', TEAM: 'team', FOCUS: 'focus',
};

export function usePresence(options = {}) {
  const {
    projectId,
    idleTimeout = 5 * 60 * 1000,
    heartbeatInterval = 30 * 1000,
    autoDetectIdle = true,
    autoSendHeartbeat = true,
  } = options;

  const cursorContext = useCursorContext?.() || {};
  const socketContext = useSocketContext?.() || {};

  const { 
    cursors = [], 
    isConnected: cursorConnected = false, 
    sendHeartbeat: cursorHeartbeat = () => {},
  } = cursorContext;

  const {
    isConnected: socketConnected = false,
    updatePresence: socketUpdatePresence,
    subscribe,
  } = socketContext;

  const isConnected = cursorConnected || socketConnected;

  const [status, setStatus] = useState(PresenceStatus.ONLINE);
  const [mode, setMode] = useState(PresenceMode.TEAM);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const idleTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!subscribe) return;

    const handleListUpdate = (data) => {
      console.log("🔥 [WebSockets] RECEIVED room:users payload!", data);
      const users = Array.isArray(data) ? data : (data?.users || []);
      if (users.length > 0) {
          setOnlineUsers(users.map(u => ({ ...u, status: u.status || PresenceStatus.ONLINE })));
      }
    };

    const handleUserJoin = (user) => {
      console.log("🔥 [WebSockets] RECEIVED userJoined!", user);
      if (!user) return;
      setOnlineUsers(prev => {
        // ⭐ DEDUPE BY SESSION ID NOW
        const uniqueId = user.sessionId || user.userId || user.id;
        if (prev.some(u => (u.sessionId || u.userId || u.id) === uniqueId)) return prev;
        return [...prev, { ...user, status: user.status || PresenceStatus.ONLINE }];
      });
    };

    const handleUserLeave = (data) => {
      console.log("🔥 [WebSockets] RECEIVED userLeft!", data);
      const uniqueId = data?.sessionId || data?.userId || data?.id || data;
      setOnlineUsers(prev => prev.filter(u => (u.sessionId || u.userId || u.id) !== uniqueId));
    };

    const unsub1 = subscribe('room:users', handleListUpdate);
    const unsub2 = subscribe('userJoined', handleUserJoin);
    const unsub3 = subscribe('userLeft', handleUserLeave);

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [subscribe]);


  const sendPresenceUpdate = useCallback((newStatus) => {
    if (socketUpdatePresence) socketUpdatePresence(newStatus);
    if (cursorHeartbeat) cursorHeartbeat();
  }, [socketUpdatePresence, cursorHeartbeat]);

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now();
    if (status === PresenceStatus.IDLE || status === PresenceStatus.AWAY) {
      setStatus(PresenceStatus.ONLINE);
      sendPresenceUpdate(PresenceStatus.ONLINE);
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (autoDetectIdle) {
      idleTimer.current = setTimeout(() => {
        setStatus(PresenceStatus.IDLE);
        sendPresenceUpdate(PresenceStatus.IDLE);
      }, idleTimeout);
    }
  }, [status, autoDetectIdle, idleTimeout, sendPresenceUpdate]);

  useEffect(() => {
    if (!autoDetectIdle) return;
    const handleActivity = () => resetIdleTimer();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [autoDetectIdle, resetIdleTimer]);

  useEffect(() => {
    if (!autoSendHeartbeat || !isConnected) return;
    sendPresenceUpdate(status);
    heartbeatTimer.current = setInterval(() => {
      if (status !== PresenceStatus.OFFLINE) sendPresenceUpdate(status);
    }, heartbeatInterval);
    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [autoSendHeartbeat, isConnected, heartbeatInterval, status, sendPresenceUpdate]);

  const enterGhostMode = useCallback(() => setMode(PresenceMode.GHOST), []);
  const enterTeamMode = useCallback(() => setMode(PresenceMode.TEAM), []);
  const enterFocusMode = useCallback((duration) => {
    setMode(PresenceMode.FOCUS);
    setStatus(PresenceStatus.FOCUS);
    sendPresenceUpdate(PresenceStatus.FOCUS);
    if (duration) setTimeout(() => exitFocusMode(), duration);
  }, [sendPresenceUpdate]);

  const exitFocusMode = useCallback(() => {
    setMode(PresenceMode.TEAM);
    setStatus(PresenceStatus.ONLINE);
    sendPresenceUpdate(PresenceStatus.ONLINE);
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

  const getProjectStats = useCallback(() => {
    const users = onlineUsers.length > 0 ? onlineUsers : (cursors || []);
    if (!users || users.length === 0) return { total: 0, online: 0, idle: 0, focus: 0, away: 0, busy: 0 };
    return {
      total: users.length,
      online: users.filter(c => c.status === PresenceStatus.ONLINE || !c.status).length,
      idle: users.filter(c => c.status === PresenceStatus.IDLE).length,
      focus: users.filter(c => c.status === PresenceStatus.FOCUS).length,
      away: users.filter(c => c.status === PresenceStatus.AWAY).length,
      busy: users.filter(c => c.status === PresenceStatus.BUSY).length,
    };
  }, [cursors, onlineUsers]);

  const getUsersByStatus = useCallback((targetStatus) => {
    const users = onlineUsers.length > 0 ? onlineUsers : cursors;
    return users.filter(c => (c.status || PresenceStatus.ONLINE) === targetStatus);
  }, [cursors, onlineUsers]);

  const getUsersByMode = useCallback((targetMode) => {
    const users = onlineUsers.length > 0 ? onlineUsers : cursors;
    return users.filter(c => c.mode === targetMode);
  }, [cursors, onlineUsers]);

  const isUserActive = useCallback((userId) => {
    const users = onlineUsers.length > 0 ? onlineUsers : cursors;
    const user = users.find(c => (c.userId || c.id) === userId);
    if (!user) return false;
    const s = user.status || PresenceStatus.ONLINE;
    return s === PresenceStatus.ONLINE || s === PresenceStatus.FOCUS || s === PresenceStatus.BUSY;
  }, [cursors, onlineUsers]);

  const getTimeSinceActivity = useCallback(() => Date.now() - lastActivity.current, []);

  return {
    status, mode,
    isOnline: status === PresenceStatus.ONLINE,
    isIdle: status === PresenceStatus.IDLE,
    isFocus: status === PresenceStatus.FOCUS,
    isAway: status === PresenceStatus.AWAY,
    isBusy: status === PresenceStatus.BUSY,
    isConnected, setOnline, setAway, setBusy,
    enterGhostMode, enterTeamMode, enterFocusMode, exitFocusMode,
    resetIdleTimer, lastActivity: lastActivity.current, timeSinceActivity: getTimeSinceActivity(),
    projectStats: getProjectStats(), getUsersByStatus, getUsersByMode, isUserActive,
    onlineUsers: onlineUsers.length > 0 ? onlineUsers : cursors,
  };
}

export function useTeamPresence() {
  let cursors = [];
  try {
    const ctx = useCursorContext?.();
    cursors = ctx?.cursors || [];
  } catch (e) {}

  const [teamActivity, setTeamActivity] = useState({ isActive: false, activeCount: 0, message: '' });

  useEffect(() => {
    if (!cursors || cursors.length === 0) {
      setTeamActivity({ isActive: false, activeCount: 0, message: 'Waiting for team...' });
      return;
    }
    const activeUsers = cursors.filter(c => {
      const s = c.status || PresenceStatus.ONLINE;
      return s === PresenceStatus.ONLINE || s === PresenceStatus.FOCUS || s === PresenceStatus.BUSY;
    });
    const count = activeUsers.length;
    let message = '';
    if (count === 0) message = 'Team is quiet';
    else if (count === 1) message = '1 person working';
    else if (count <= 3) message = `${count} people working`;
    else if (count <= 7) message = `Team is active! (${count} online)`;
    else message = `🔥 Team is on FIRE! (${count} online)`;
    setTeamActivity({ isActive: count > 0, activeCount: count, message });
  }, [cursors]);

  return teamActivity;
}

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
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(duration);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [duration]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return { timeRemaining, formatted, isActive, progress: ((duration - timeRemaining) / duration) * 100, start, pause, reset };
}

export function useLonelinessDetection() {
  let cursors = [];
  try {
    const ctx = useCursorContext?.();
    cursors = ctx?.cursors || [];
  } catch (e) {}

  const [isAlone, setIsAlone] = useState(false);
  const [justJoined, setJustJoined] = useState(null);

  useEffect(() => {
    const activeUsers = (cursors || []).filter(c => {
      const s = c.status || PresenceStatus.ONLINE;
      return s === PresenceStatus.ONLINE || s === PresenceStatus.FOCUS;
    });
    const wasAlone = isAlone;
    const nowAlone = activeUsers.length === 0;
    setIsAlone(nowAlone);
    if (wasAlone && !nowAlone && activeUsers.length === 1) {
      const newUser = activeUsers[0];
      setJustJoined(newUser);
      setTimeout(() => setJustJoined(null), 5000);
    }
  }, [cursors, isAlone]);

  const userCount = cursors?.length || 0;
  return {
    isAlone, justJoined,
    message: isAlone ? "You're working solo right now" : justJoined ? `${justJoined.userName || 'Someone'} just joined!` : `${userCount} ${userCount === 1 ? 'person' : 'people'} here`,
  };
}

export function useSimplePresence() {
  const { status, isConnected, setOnline, setAway, setBusy } = usePresence({ autoDetectIdle: true, autoSendHeartbeat: true });
  return { status, isConnected, setOnline, setAway, setBusy };
}

export default usePresence;
