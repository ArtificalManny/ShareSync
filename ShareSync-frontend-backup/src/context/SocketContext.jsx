// src/context/SocketContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCKET CONTEXT - Provides WebSocket connection to the entire app
// ⭐ FIX: Solved the handshake race condition (waiting for isConnected)
// ⭐ RESTORED: Convenience hooks (useSocketEvent, etc.) at the bottom
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useSocket from '../hooks/useSocket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;
  const token = user?.token || localStorage.getItem('token') || null; 
  const queryClient = useQueryClient();

  const [activeRooms, setActiveRooms] = useState([]);
  const [eventHandlers, setEventHandlers] = useState({});

  const onEvents = useMemo(() => ({
      'message:new': (data) => eventHandlers['message:new']?.forEach((h) => h(data)),
      'new_message': (data) => eventHandlers['new_message']?.forEach((h) => h(data)),
      'typing:user': (data) => eventHandlers['typing:user']?.forEach((h) => h(data)),
      'presence:change': (data) => eventHandlers['presence:change']?.forEach((h) => h(data)),
      'notification:new': (data) => eventHandlers['notification:new']?.forEach((h) => h(data)),
      'new_notification': (data) => eventHandlers['new_notification']?.forEach((h) => h(data)),
      'activity:new': (data) => eventHandlers['activity:new']?.forEach((h) => h(data)),
      'team:activity_updated': (data) => eventHandlers['team:activity_updated']?.forEach((h) => h(data)),
      'task:update': (data) => eventHandlers['task:update']?.forEach((h) => h(data)),
      'taskUpdated': (data) => {
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
      'userJoined': (data) => eventHandlers['userJoined']?.forEach((h) => h(data)),
      'userLeft': (data) => eventHandlers['userLeft']?.forEach((h) => h(data))
    }), [eventHandlers, queryClient]);

  const { socket, state, emit, joinRoom, leaveRoom } = useSocket(activeRooms, {
    userId, token, onEvents, enabled: !!userId
  });

  // ⭐ THE FIX: Only shake hands AFTER the socket officially connects
  useEffect(() => {
    if (state.isConnected && userId && emit) {
      console.log(`🚀 [SocketContext] Connection solid! Registering rooms for user: ${userId}`);
      emit('joinUser', userId);
      emit('joinRoom', userId);
      const room = `user:${userId}`;
      joinRoom(room);
    }
  }, [state.isConnected, userId, emit, joinRoom]);

  const joinUserRoom = useCallback((uid) => {
    const id = uid || userId;
    if (!id) return;
    setActiveRooms((prev) => prev.includes(`user:${id}`) ? prev : [...prev, `user:${id}`]);
  }, [userId]);

  const leaveUserRoom = useCallback((uid) => {
    const id = uid || userId;
    if (!id) return;
    setActiveRooms((prev) => prev.filter((r) => r !== `user:${id}`));
    leaveRoom(`user:${id}`);
  }, [leaveRoom, userId]);

  useEffect(() => {
    if (userId) joinUserRoom(userId);
  }, [userId, joinUserRoom]);

  const joinProjectRoom = useCallback((projectId) => {
    if (!projectId) return;
    setActiveRooms((prev) => prev.includes(`project:${projectId}`) ? prev : [...prev, `project:${projectId}`]);
    joinRoom(`project:${projectId}`);
  }, [joinRoom]);

  const leaveProjectRoom = useCallback((projectId) => {
    if (!projectId) return;
    setActiveRooms((prev) => prev.filter((r) => r !== `project:${projectId}`));
    leaveRoom(`project:${projectId}`);
  }, [leaveRoom]);

  const joinPublicProjectRoom = useCallback((projectId) => {
    if (!projectId) return;
    setActiveRooms((prev) => prev.includes(`public:project:${projectId}`) ? prev : [...prev, `public:project:${projectId}`]);
    joinRoom(`public:project:${projectId}`);
  }, [joinRoom]);

  const joinConversationRoom = useCallback((conversationId) => {
    if (!conversationId) return;
    setActiveRooms((prev) => prev.includes(`conversation:${conversationId}`) ? prev : [...prev, `conversation:${conversationId}`]);
    joinRoom(`conversation:${conversationId}`);
  }, [joinRoom]);

  const leaveConversationRoom = useCallback((conversationId) => {
    if (!conversationId) return;
    setActiveRooms((prev) => prev.filter((r) => r !== `conversation:${conversationId}`));
    leaveRoom(`conversation:${conversationId}`);
  }, [leaveRoom]);

  const subscribe = useCallback((event, handler) => {
    setEventHandlers((prev) => ({ ...prev, [event]: [...(prev[event] || []), handler] }));
    return () => setEventHandlers((prev) => ({ ...prev, [event]: (prev[event] || []).filter((h) => h !== handler) }));
  }, []);

  const sendTypingStart = useCallback((conversationId) => emit('typing:start', { conversationId }), [emit]);
  const sendTypingStop = useCallback((conversationId) => emit('typing:stop', { conversationId }), [emit]);
  const updatePresence = useCallback((status) => emit('presence:update', { status }), [emit]);
  
  const getPresence = useCallback((userIds) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) return resolve({ users: {} });
      socket.emit('presence:get', { userIds }, resolve);
    });
  }, [socket]);

  const value = useMemo(() => ({
    socket, isConnected: state.isConnected, isConnecting: state.isConnecting, connectionError: state.error,
    emit, subscribe, joinUserRoom, leaveUserRoom, joinProjectRoom, leaveProjectRoom, joinPublicProjectRoom, 
    joinConversationRoom, leaveConversationRoom, activeRooms, sendTypingStart, sendTypingStop, updatePresence, getPresence
  }), [socket, state, emit, subscribe, joinUserRoom, leaveUserRoom, joinProjectRoom, leaveProjectRoom, joinPublicProjectRoom, joinConversationRoom, leaveConversationRoom, activeRooms, sendTypingStart, sendTypingStop, updatePresence, getPresence]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    return { socket: null, isConnected: false, isConnecting: false, connectionError: null, emit: () => {}, subscribe: () => () => {}, joinUserRoom: () => {}, leaveUserRoom: () => {}, joinProjectRoom: () => {}, leaveProjectRoom: () => {}, joinPublicProjectRoom: () => {}, joinConversationRoom: () => {}, leaveConversationRoom: () => {}, activeRooms: [], sendTypingStart: () => {}, sendTypingStop: () => {}, updatePresence: () => {}, getPresence: async () => ({ users: {} }) };
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook to subscribe to a specific socket event
 */
export function useSocketEvent(event, handler) {
  const { subscribe } = useSocketContext();

  useEffect(() => {
    if (!handler) return;
    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
  }, [event, handler, subscribe]);
}

/**
 * Hook to track connection status
 */
export function useSocketStatus() {
  const { isConnected, isConnecting, connectionError } = useSocketContext();
  return { isConnected, isConnecting, connectionError };
}

/**
 * Hook for typing indicators in a conversation
 */
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
