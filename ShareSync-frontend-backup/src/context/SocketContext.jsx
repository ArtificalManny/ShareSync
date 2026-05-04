// src/context/SocketContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCKET CONTEXT - Provides WebSocket connection to the entire app
//
// PRESENCE FIX PASS:
// - Resolve auth identity from _id, id, userId, or sub
// - Resolve token from all token storage keys used by AuthContext
// - Join user rooms with the correct gateway payload shape
// - Join project rooms with the explicit joinProject contract
// - Send presence:update with { projectId, isInvisible } instead of bare status
// ═══════════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useSocket from '../hooks/useSocket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

function resolveUserId(user) {
  return user?._id || user?.id || user?.userId || user?.sub || null;
}

function resolveAuthToken(user) {
  return (
    user?.token ||
    localStorage.getItem('ss.jwt') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    null
  );
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = resolveUserId(user);
  const token = resolveAuthToken(user);
  const queryClient = useQueryClient();

  const [activeRooms, setActiveRooms] = useState([]);
  const [eventHandlers, setEventHandlers] = useState({});

  const onEvents = useMemo(
    () => ({
      'message:new': (data) => eventHandlers['message:new']?.forEach((h) => h(data)),
      'new_message': (data) => eventHandlers['new_message']?.forEach((h) => h(data)),
      'typing:user': (data) => eventHandlers['typing:user']?.forEach((h) => h(data)),
      'presence:change': (data) => eventHandlers['presence:change']?.forEach((h) => h(data)),
      'notification:new': (data) => eventHandlers['notification:new']?.forEach((h) => h(data)),
      'new_notification': (data) => eventHandlers['new_notification']?.forEach((h) => h(data)),
      'activity:new': (data) => eventHandlers['activity:new']?.forEach((h) => h(data)),
      'team:activity_updated': (data) => eventHandlers['team:activity_updated']?.forEach((h) => h(data)),
      activityCreated: (data) => eventHandlers.activityCreated?.forEach((h) => h(data)),
      'activity:created': (data) => eventHandlers['activity:created']?.forEach((h) => h(data)),

      'user:velocity-updated': (data) => eventHandlers['user:velocity-updated']?.forEach((h) => h(data)),
      'velocity:updated': (data) => eventHandlers['velocity:updated']?.forEach((h) => h(data)),
      'stats:updated': (data) => eventHandlers['stats:updated']?.forEach((h) => h(data)),
      'streak:update': (data) => eventHandlers['streak:update']?.forEach((h) => h(data)),
      'momentum:update': (data) => eventHandlers['momentum:update']?.forEach((h) => h(data)),

      taskCompleted: (data) => {
        queryClient.invalidateQueries({ queryKey: ['movesToday'] });
        window.dispatchEvent(new CustomEvent('task.completed', { detail: data }));
        eventHandlers.taskCompleted?.forEach((h) => h(data));
        eventHandlers['task.completed']?.forEach((h) => h(data));
      },
      'task:completed': (data) => {
        queryClient.invalidateQueries({ queryKey: ['movesToday'] });
        window.dispatchEvent(new CustomEvent('task.completed', { detail: data }));
        eventHandlers['task:completed']?.forEach((h) => h(data));
        eventHandlers['task.completed']?.forEach((h) => h(data));
      },

      projectCompleted: (data) => {
        window.dispatchEvent(new CustomEvent('project.completed', { detail: data }));
        eventHandlers.projectCompleted?.forEach((h) => h(data));
        eventHandlers['project.completed']?.forEach((h) => h(data));
      },
      'project.completed': (data) => {
        window.dispatchEvent(new CustomEvent('project.completed', { detail: data }));
        eventHandlers['project.completed']?.forEach((h) => h(data));
      },
      'project:lifecycle-updated': (data) => {
        window.dispatchEvent(new CustomEvent('project:lifecycle-updated', { detail: data }));
        eventHandlers['project:lifecycle-updated']?.forEach((h) => h(data));
      },

      'task:update': (data) => eventHandlers['task:update']?.forEach((h) => h(data)),
      taskUpdated: (data) => {
        eventHandlers.taskUpdated?.forEach((h) => h(data));
        eventHandlers['task:update']?.forEach((h) => h(data));
      },
      'milestone:update': (data) => eventHandlers['milestone:update']?.forEach((h) => h(data)),
      'public:project:update': (data) => eventHandlers['public:project:update']?.forEach((h) => h(data)),
      'task.completed': (data) => {
        queryClient.invalidateQueries({ queryKey: ['movesToday'] });
        window.dispatchEvent(new CustomEvent('task.completed', { detail: data }));
        eventHandlers['task.completed']?.forEach((h) => h(data));
      },
      'presence.updated': (data) => {
        queryClient.invalidateQueries({ queryKey: ['intelligence'] });
        window.dispatchEvent(new CustomEvent('presence.updated', { detail: data }));
        eventHandlers['presence.updated']?.forEach((h) => h(data));
      },
      'room:users': (data) => eventHandlers['room:users']?.forEach((h) => h(data)),
      userJoined: (data) => eventHandlers.userJoined?.forEach((h) => h(data)),
      userLeft: (data) => eventHandlers.userLeft?.forEach((h) => h(data)),
    }),
    [eventHandlers, queryClient]
  );

  const { socket, state, emit, joinRoom, leaveRoom } = useSocket(activeRooms, {
    userId,
    token,
    onEvents,
    enabled: !!userId,
  });

  useEffect(() => {
    if (!state.isConnected || !userId || !emit) return;

    console.log(`🚀 [SocketContext] Connection solid! Registering rooms for user: ${userId}`);
    emit('joinUser', { userId });
  }, [state.isConnected, userId, emit]);

  useEffect(() => {
    if (!state.isConnected || !userId || !emit) return;

    activeRooms.forEach((room) => {
      if (typeof room !== 'string') return;

      if (room.startsWith('project:')) {
        const projectId = room.split(':')[1];
        if (projectId) {
          emit('joinProject', {
            projectId,
            userId,
            isInvisible: false,
          });
        }
        return;
      }

      if (room.startsWith('public:project:')) {
        joinRoom(room);
        return;
      }

      if (room.startsWith('conversation:')) {
        joinRoom(room);
        return;
      }

      if (room.startsWith('user:')) {
        const uid = room.split(':')[1];
        if (uid) emit('joinUser', { userId: uid });
      }
    });
  }, [state.isConnected, activeRooms, userId, emit, joinRoom]);

  const joinUserRoom = useCallback(
    (uid) => {
      const id = uid || userId;
      if (!id) return;

      const room = `user:${id}`;
      setActiveRooms((prev) => (prev.includes(room) ? prev : [...prev, room]));

      if (state.isConnected && emit) {
        emit('joinUser', { userId: id });
      }
    },
    [userId, state.isConnected, emit]
  );

  const leaveUserRoom = useCallback(
    (uid) => {
      const id = uid || userId;
      if (!id) return;

      const room = `user:${id}`;
      setActiveRooms((prev) => prev.filter((r) => r !== room));

      if (emit) {
        emit('leaveUser', { userId: id });
      }
    },
    [userId, emit]
  );

  useEffect(() => {
    if (userId) joinUserRoom(userId);
  }, [userId, joinUserRoom]);

  const joinProjectRoom = useCallback(
    (projectId, options = {}) => {
      if (!projectId) return;

      const room = `project:${projectId}`;
      setActiveRooms((prev) => (prev.includes(room) ? prev : [...prev, room]));

      if (state.isConnected && emit) {
        emit('joinProject', {
          projectId,
          userId,
          isInvisible: options?.isInvisible === true,
        });
      }
    },
    [state.isConnected, emit, userId]
  );

  const leaveProjectRoom = useCallback(
    (projectId) => {
      if (!projectId) return;

      const room = `project:${projectId}`;
      setActiveRooms((prev) => prev.filter((r) => r !== room));

      if (emit) {
        emit('leaveProject', {
          projectId,
          userId,
        });
      }

      leaveRoom(room);
    },
    [emit, userId, leaveRoom]
  );

  const joinPublicProjectRoom = useCallback(
    (projectId) => {
      if (!projectId) return;

      const room = `public:project:${projectId}`;
      setActiveRooms((prev) => (prev.includes(room) ? prev : [...prev, room]));
      joinRoom(room);
    },
    [joinRoom]
  );

  const joinConversationRoom = useCallback(
    (conversationId) => {
      if (!conversationId) return;

      const room = `conversation:${conversationId}`;
      setActiveRooms((prev) => (prev.includes(room) ? prev : [...prev, room]));
      joinRoom(room);
    },
    [joinRoom]
  );

  const leaveConversationRoom = useCallback(
    (conversationId) => {
      if (!conversationId) return;

      const room = `conversation:${conversationId}`;
      setActiveRooms((prev) => prev.filter((r) => r !== room));
      leaveRoom(room);
    },
    [leaveRoom]
  );

  const subscribe = useCallback((event, handler) => {
    setEventHandlers((prev) => ({
      ...prev,
      [event]: [...(prev[event] || []), handler],
    }));

    return () =>
      setEventHandlers((prev) => ({
        ...prev,
        [event]: (prev[event] || []).filter((h) => h !== handler),
      }));
  }, []);

  const sendTypingStart = useCallback(
    (conversationId) => emit('typing:start', { conversationId }),
    [emit]
  );

  const sendTypingStop = useCallback(
    (conversationId) => emit('typing:stop', { conversationId }),
    [emit]
  );

  const updatePresence = useCallback(
    (payloadOrStatus, maybeOptions = {}) => {
      if (!emit) return;

      const payload =
        typeof payloadOrStatus === 'object' && payloadOrStatus !== null
          ? payloadOrStatus
          : { status: payloadOrStatus, ...(maybeOptions || {}) };

      if (!payload?.projectId) return;

      emit('presence:update', {
        projectId: payload.projectId,
        isInvisible: payload.isInvisible === true,
        status: payload.status,
      });
    },
    [emit]
  );

  const getPresence = useCallback(
    (userIds) => {
      return new Promise((resolve) => {
        if (!socket || !socket.connected) {
          return resolve({ users: {} });
        }
        socket.emit('presence:get', { userIds }, resolve);
      });
    },
    [socket]
  );

  const value = useMemo(
    () => ({
      socket,
      isConnected: state.isConnected,
      isConnecting: state.isConnecting,
      connectionError: state.error,
      emit,
      subscribe,
      joinUserRoom,
      leaveUserRoom,
      joinProjectRoom,
      leaveProjectRoom,
      joinPublicProjectRoom,
      joinConversationRoom,
      leaveConversationRoom,
      activeRooms,
      sendTypingStart,
      sendTypingStop,
      updatePresence,
      getPresence,
    }),
    [
      socket,
      state,
      emit,
      subscribe,
      joinUserRoom,
      leaveUserRoom,
      joinProjectRoom,
      leaveProjectRoom,
      joinPublicProjectRoom,
      joinConversationRoom,
      leaveConversationRoom,
      activeRooms,
      sendTypingStart,
      sendTypingStop,
      updatePresence,
      getPresence,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);

  if (!context) {
    return {
      socket: null,
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      emit: () => {},
      subscribe: () => () => {},
      joinUserRoom: () => {},
      leaveUserRoom: () => {},
      joinProjectRoom: () => {},
      leaveProjectRoom: () => {},
      joinPublicProjectRoom: () => {},
      joinConversationRoom: () => {},
      leaveConversationRoom: () => {},
      activeRooms: [],
      sendTypingStart: () => {},
      sendTypingStop: () => {},
      updatePresence: () => {},
      getPresence: async () => ({ users: {} }),
    };
  }

  return context;
}

export function useSocketEvent(event, handler) {
  const { subscribe } = useSocketContext();

  useEffect(() => {
    if (!handler) return;
    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
  }, [event, handler, subscribe]);
}

export function useSocketStatus() {
  const { isConnected, isConnecting, connectionError } = useSocketContext();
  return { isConnected, isConnecting, connectionError };
}

export function useTypingIndicator(conversationId) {
  const { sendTypingStart, sendTypingStop, subscribe } = useSocketContext();
  const [typingUsers, setTypingUsers] = useState([]);
  const timeoutsRef = useRef({});

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribe('typing:user', (data) => {
      if (data.conversationId !== conversationId) return;

      if (data.isTyping) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        });

        if (timeoutsRef.current[data.userId]) {
          clearTimeout(timeoutsRef.current[data.userId]);
        }

        timeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }, 3000);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        if (timeoutsRef.current[data.userId]) {
          clearTimeout(timeoutsRef.current[data.userId]);
        }
      }
    });

    return () => {
      unsubscribe();
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [conversationId, subscribe]);

  const startTyping = useCallback(() => {
    sendTypingStart(conversationId);
  }, [conversationId, sendTypingStart]);

  const stopTyping = useCallback(() => {
    sendTypingStop(conversationId);
  }, [conversationId, sendTypingStop]);

  return { typingUsers, startTyping, stopTyping };
}

export default SocketContext;
