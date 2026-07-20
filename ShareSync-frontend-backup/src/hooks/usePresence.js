/**
 * usePresence.js
 * PRESENCE FIX:
 * - Use normal ES imports instead of silent require() fallbacks
 * - Join the project room when projectId is present
 * - Publish project-aware presence updates
 * - Keep self-fallback behavior if connected but no room payload has landed yet
 * - Preserve existing helper hooks and API shape
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCursorContext } from '../context/CursorContext';
import { useSocketContext } from '../context/SocketContext';

export const PresenceStatus = {
  ONLINE: 'online',
  IDLE: 'idle',
  AWAY: 'away',
  BUSY: 'busy',
  FOCUS: 'focus',
  OFFLINE: 'offline',
};

export const PresenceMode = {
  GHOST: 'ghost',
  TEAM: 'team',
  FOCUS: 'focus',
};

function getPresenceKey(userLike) {
  return userLike?.sessionId || userLike?.userId || userLike?.id || userLike;
}

export function usePresence(options = {}) {
  const {
    projectId,
    currentUserId = '',
    idleTimeout = 5 * 60 * 1000,
    heartbeatInterval = 30 * 1000,
    autoDetectIdle = true,
    autoSendHeartbeat = true,
  } = options;

  const cursorContext = useCursorContext() || {};
  const socketContext = useSocketContext() || {};

  const {
    cursors = [],
    isConnected: cursorConnected = false,
    sendHeartbeat: cursorHeartbeat = () => {},
  } = cursorContext;

  const {
    isConnected: socketConnected = false,
    updatePresence: socketUpdatePresence,
    subscribe,
    joinProjectRoom,
    leaveProjectRoom,
  } = socketContext;

  const isConnected = cursorConnected || socketConnected;

  const [status, setStatus] = useState(PresenceStatus.ONLINE);
  const [mode, setMode] = useState(PresenceMode.TEAM);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const idleTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!projectId || !joinProjectRoom) return;

    console.debug('[usePresence] joining project room', {
      projectId,
      isInvisible: mode === PresenceMode.GHOST,
    });

    joinProjectRoom(projectId, { isInvisible: mode === PresenceMode.GHOST });

    return () => {
      console.debug('[usePresence] leaving project room', { projectId });
      leaveProjectRoom?.(projectId);
    };
  }, [projectId, joinProjectRoom, leaveProjectRoom, mode]);

  useEffect(() => {
    if (!subscribe) return;

    const handleListUpdate = (data) => {
      console.debug('[usePresence] room:users', data);
      const users = Array.isArray(data) ? data : data?.users || [];
      setOnlineUsers(
        users.map((u) => ({
          ...u,
          status: u.status || PresenceStatus.ONLINE,
        }))
      );
    };

    const handleUserJoin = (user) => {
      console.debug('[usePresence] userJoined', user);
      if (!user) return;

      setOnlineUsers((prev) => {
        const uniqueId = getPresenceKey(user);
        if (!uniqueId) return prev;
        if (prev.some((u) => getPresenceKey(u) === uniqueId)) return prev;

        return [
          ...prev,
          {
            ...user,
            status: user.status || PresenceStatus.ONLINE,
          },
        ];
      });
    };

    const handleUserLeave = (data) => {
      console.debug('[usePresence] userLeft', data);
      const uniqueId = getPresenceKey(data);
      setOnlineUsers((prev) =>
        prev.filter((u) => getPresenceKey(u) !== uniqueId)
      );
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

  const sendPresenceUpdate = useCallback(
    (newStatus, overrideInvisible) => {
      if (socketUpdatePresence && projectId) {
        const payload = {
          projectId,
          status: newStatus,
          isInvisible:
            typeof overrideInvisible === 'boolean'
              ? overrideInvisible
              : mode === PresenceMode.GHOST,
        };

        console.debug('[usePresence] presence:update', payload);
        socketUpdatePresence(payload);
      }

      if (cursorHeartbeat) {
        cursorHeartbeat();
      }
    },
    [socketUpdatePresence, cursorHeartbeat, projectId, mode]
  );

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now();

    if (status === PresenceStatus.IDLE || status === PresenceStatus.AWAY) {
      setStatus(PresenceStatus.ONLINE);
      sendPresenceUpdate(PresenceStatus.ONLINE);
    }

    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

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

    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    resetIdleTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [autoDetectIdle, resetIdleTimer]);

  useEffect(() => {
    if (!autoSendHeartbeat || !isConnected) return;

    sendPresenceUpdate(status);

    heartbeatTimer.current = setInterval(() => {
      if (status !== PresenceStatus.OFFLINE) {
        sendPresenceUpdate(status);
      }
    }, heartbeatInterval);

    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
      }
    };
  }, [
    autoSendHeartbeat,
    isConnected,
    heartbeatInterval,
    status,
    sendPresenceUpdate,
  ]);

  const resolveUsers = useCallback(() => {
    const liveUsers = onlineUsers.length > 0 ? onlineUsers : cursors || [];
    if (liveUsers.length > 0) return liveUsers;

    if (isConnected && currentUserId) {
      return [
        {
          userId: String(currentUserId),
          id: String(currentUserId),
          sessionId: `self-${projectId || 'global'}`,
          status,
          mode,
          isSelfFallback: true,
        },
      ];
    }

    return [];
  }, [onlineUsers, cursors, isConnected, currentUserId, projectId, status, mode]);

  const enterGhostMode = useCallback(() => {
    setMode(PresenceMode.GHOST);
    sendPresenceUpdate(status, true);
  }, [sendPresenceUpdate, status]);

  const enterTeamMode = useCallback(() => {
    setMode(PresenceMode.TEAM);
    sendPresenceUpdate(status, false);
  }, [sendPresenceUpdate, status]);

  const enterFocusMode = useCallback(
    (duration) => {
      setMode(PresenceMode.FOCUS);
      setStatus(PresenceStatus.FOCUS);
      sendPresenceUpdate(PresenceStatus.FOCUS, false);

      if (duration) {
        setTimeout(() => exitFocusMode(), duration);
      }
    },
    [sendPresenceUpdate]
  );

  const exitFocusMode = useCallback(() => {
    setMode(PresenceMode.TEAM);
    setStatus(PresenceStatus.ONLINE);
    sendPresenceUpdate(PresenceStatus.ONLINE, false);
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

  // presence-count-normalization-v1
  const getProjectStats = useCallback(() => {
    const users = resolveUsers();

    if (!Array.isArray(users) || users.length === 0) {
      return {
        total: 0,
        online: 0,
        idle: 0,
        focus: 0,
        away: 0,
        busy: 0,
      };
    }

    /*
     * Presence events can contain one entry per browser, phone,
     * tab, or socket. Normalize those entries to one person so
     * the same account on desktop and iPhone still counts once.
     */
    const getIdentityKey = (entry, index) => {
      const directUserId = entry?.userId;

      const rawUserId =
        directUserId?._id ||
        directUserId?.id ||
        (
          typeof directUserId === "string" ||
          typeof directUserId === "number"
            ? directUserId
            : ""
        ) ||
        entry?.id ||
        entry?._id ||
        "";

      const normalizedUserId =
        String(rawUserId || "").trim();

      if (normalizedUserId) {
        return `user:${normalizedUserId}`;
      }

      const rawSessionId =
        entry?.sessionId ||
        entry?.socketId ||
        entry?.connectionId ||
        "";

      const normalizedSessionId =
        String(rawSessionId || "").trim();

      if (normalizedSessionId) {
        return `session:${normalizedSessionId}`;
      }

      return `presence:${index}`;
    };

    /*
     * When one person has multiple sessions, retain their most
     * active status for the status breakdown.
     */
    const getStatusPriority = (value) => {
      const resolvedStatus =
        value || PresenceStatus.ONLINE;

      if (resolvedStatus === PresenceStatus.ONLINE) return 6;
      if (resolvedStatus === PresenceStatus.FOCUS) return 5;
      if (resolvedStatus === PresenceStatus.BUSY) return 4;
      if (resolvedStatus === PresenceStatus.IDLE) return 3;
      if (resolvedStatus === PresenceStatus.AWAY) return 2;
      if (resolvedStatus === PresenceStatus.OFFLINE) return 1;

      return 6;
    };

    const uniqueUsersById = users.reduce(
      (map, entry, index) => {
        const key = getIdentityKey(entry, index);

        const candidate = {
          ...entry,
          status:
            entry?.status || PresenceStatus.ONLINE,
        };

        const existing = map.get(key);

        if (
          !existing ||
          getStatusPriority(candidate.status) >
            getStatusPriority(existing.status)
        ) {
          map.set(key, candidate);
        }

        return map;
      },
      new Map()
    );

    const uniqueUsers = Array.from(
      uniqueUsersById.values()
    );

    /*
     * "Online" means connected to the project. Idle, focus,
     * busy, and away are presence states—not disconnections.
     */
    const connectedUsers = uniqueUsers.filter(
      (entry) =>
        (entry?.status || PresenceStatus.ONLINE) !==
        PresenceStatus.OFFLINE
    );

    return {
      total: uniqueUsers.length,
      online: connectedUsers.length,
      idle: uniqueUsers.filter(
        (entry) =>
          entry.status === PresenceStatus.IDLE
      ).length,
      focus: uniqueUsers.filter(
        (entry) =>
          entry.status === PresenceStatus.FOCUS
      ).length,
      away: uniqueUsers.filter(
        (entry) =>
          entry.status === PresenceStatus.AWAY
      ).length,
      busy: uniqueUsers.filter(
        (entry) =>
          entry.status === PresenceStatus.BUSY
      ).length,
    };
  }, [resolveUsers]);

  const getUsersByStatus = useCallback(
    (targetStatus) => {
      return resolveUsers().filter(
        (c) => (c.status || PresenceStatus.ONLINE) === targetStatus
      );
    },
    [resolveUsers]
  );

  const getUsersByMode = useCallback(
    (targetMode) => {
      return resolveUsers().filter((c) => c.mode === targetMode);
    },
    [resolveUsers]
  );

  const isUserActive = useCallback(
    (userId) => {
      const user = resolveUsers().find((c) => (c.userId || c.id) === userId);
      if (!user) return false;

      const resolvedStatus = user.status || PresenceStatus.ONLINE;
      return (
        resolvedStatus === PresenceStatus.ONLINE ||
        resolvedStatus === PresenceStatus.FOCUS ||
        resolvedStatus === PresenceStatus.BUSY
      );
    },
    [resolveUsers]
  );

  const getTimeSinceActivity = useCallback(
    () => Date.now() - lastActivity.current,
    []
  );

  return {
    status,
    mode,
    isOnline: status === PresenceStatus.ONLINE,
    isIdle: status === PresenceStatus.IDLE,
    isFocus: status === PresenceStatus.FOCUS,
    isAway: status === PresenceStatus.AWAY,
    isBusy: status === PresenceStatus.BUSY,
    isConnected,
    setOnline,
    setAway,
    setBusy,
    enterGhostMode,
    enterTeamMode,
    enterFocusMode,
    exitFocusMode,
    resetIdleTimer,
    lastActivity: lastActivity.current,
    timeSinceActivity: getTimeSinceActivity(),
    projectStats: getProjectStats(),
    getUsersByStatus,
    getUsersByMode,
    isUserActive,
    onlineUsers: resolveUsers(),
  };
}

export function useTeamPresence() {
  const { cursors = [] } = useCursorContext() || {};

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

    const activeUsers = cursors.filter((c) => {
      const resolvedStatus = c.status || PresenceStatus.ONLINE;
      return (
        resolvedStatus === PresenceStatus.ONLINE ||
        resolvedStatus === PresenceStatus.FOCUS ||
        resolvedStatus === PresenceStatus.BUSY
      );
    });

    const count = activeUsers.length;
    let message = '';

    if (count === 0) message = 'Team is quiet';
    else if (count === 1) message = '1 person working';
    else if (count <= 3) message = `${count} people working`;
    else if (count <= 7) message = `Team is active! (${count} online)`;
    else message = `🔥 Team is on FIRE! (${count} online)`;

    setTeamActivity({
      isActive: count > 0,
      activeCount: count,
      message,
    });
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

export function useLonelinessDetection() {
  const { cursors = [] } = useCursorContext() || {};

  const [isAlone, setIsAlone] = useState(false);
  const [justJoined, setJustJoined] = useState(null);

  useEffect(() => {
    const activeUsers = (cursors || []).filter((c) => {
      const resolvedStatus = c.status || PresenceStatus.ONLINE;
      return (
        resolvedStatus === PresenceStatus.ONLINE ||
        resolvedStatus === PresenceStatus.FOCUS
      );
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
    isAlone,
    justJoined,
    message: isAlone
      ? "You're working solo right now"
      : justJoined
        ? `${justJoined.userName || 'Someone'} just joined!`
        : `${userCount} ${userCount === 1 ? 'person' : 'people'} here`,
  };
}

export function useSimplePresence() {
  const { status, isConnected, setOnline, setAway, setBusy } = usePresence({
    autoDetectIdle: true,
    autoSendHeartbeat: true,
  });

  return { status, isConnected, setOnline, setAway, setBusy };
}

export default usePresence;
