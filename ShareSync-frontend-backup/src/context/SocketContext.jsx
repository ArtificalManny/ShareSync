// src/context/SocketContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCKET CONTEXT - Provides WebSocket connection to the entire app
// ⭐ PHASE 2A: Global socket provider for real-time features
// + PHASE N: User room auto-join (user:{userId})
// + Notifications event relay preserved (notification:new)
// + STEP 6: Public project spectator rooms (public:project:{projectId})
// ⭐ PHASE 4: Optimistic UI & React Query Cache Invalidation
// ⭐ FIX: Added presence events (room:users, userJoined, userLeft) to the master event bus
// ═══════════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useSocket from '../hooks/useSocket';
import { useAuth } from './AuthContext';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const SocketContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;
  const queryClient = useQueryClient();

  // Track which rooms we're in
  const [activeRooms, setActiveRooms] = useState([]);

  // Global event handlers for app-wide events
  const [eventHandlers, setEventHandlers] = useState({});

  // Merge all handlers
  const onEvents = useMemo(
    () => ({
      // Handle new messages globally
      'message:new': (data) => {
        eventHandlers['message:new']?.forEach((handler) => handler(data));
      },

      // Handle typing indicators
      'typing:user': (data) => {
        eventHandlers['typing:user']?.forEach((handler) => handler(data));
      },

      // Handle presence changes
      'presence:change': (data) => {
        eventHandlers['presence:change']?.forEach((handler) => handler(data));
      },

      // Handle notifications
      'notification:new': (data) => {
        eventHandlers['notification:new']?.forEach((handler) => handler(data));
      },

      // Handle activity feed updates
      'activity:new': (data) => {
        eventHandlers['activity:new']?.forEach((handler) => handler(data));
      },

      // Handle task updates (legacy name)
      'task:update': (data) => {
        eventHandlers['task:update']?.forEach((handler) => handler(data));
      },

      // ✅ Backend emits this event name (new)
      taskUpdated: (data) => {
        eventHandlers.taskUpdated?.forEach((handler) => handler(data));
        eventHandlers['task:update']?.forEach((handler) => handler(data)); // back-compat
      },

      // Handle milestone updates
      'milestone:update': (data) => {
        eventHandlers['milestone:update']?.forEach((handler) => handler(data));
      },

      // ✅ STEP 6: Public spectator stream updates
      'public:project:update': (data) => {
        eventHandlers['public:project:update']?.forEach((handler) => handler(data));
      },

      // ⭐ PHASE 4: React Query Cache Invalidation Listeners
      'task.completed': (data) => {
        // Silently tell React Query to fetch fresh Moves and Activities
        queryClient.invalidateQueries({ queryKey: ['movesToday'] });
        
        // Dispatch window event for legacy components not using React Query yet
        window.dispatchEvent(new CustomEvent('task.completed', { detail: data }));
        eventHandlers['task.completed']?.forEach((handler) => handler(data));
      },
      
      'presence.updated': (data) => {
        // Silently tell React Query to fetch fresh Intelligence data (co-working multiplier)
        queryClient.invalidateQueries({ queryKey: ['intelligence'] });
        
        // Dispatch window event for legacy components
        window.dispatchEvent(new CustomEvent('presence.updated', { detail: data }));
        eventHandlers['presence.updated']?.forEach((handler) => handler(data));
      },

      // ⭐ REAL-TIME SCOREBOARD FIX: Allow backend presence events through the bus!
      'room:users': (data) => {
        eventHandlers['room:users']?.forEach((handler) => handler(data));
      },
      'userJoined': (data) => {
        eventHandlers['userJoined']?.forEach((handler) => handler(data));
      },
      'userLeft': (data) => {
        eventHandlers['userLeft']?.forEach((handler) => handler(data));
      }
    }),
    [eventHandlers, queryClient],
  );

  // Initialize socket with user rooms
  const { socket, state, emit, joinRoom, leaveRoom } = useSocket(activeRooms, {
    userId,
    onEvents,
    enabled: !!userId, // Only connect when user is authenticated
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  const joinUserRoom = useCallback(
    (uid) => {
      const id = uid || userId;
      if (!id) return;

      const room = `user:${id}`;
      setActiveRooms((prev) => {
        if (prev.includes(room)) return prev;
        return [...prev, room];
      });

      // Best effort. If socket isn't ready yet, useSocket will rejoin from activeRooms.
      joinRoom(room);
    },
    [joinRoom, userId],
  );

  const leaveUserRoom = useCallback(
    (uid) => {
      const id = uid || userId;
      if (!id) return;

      const room = `user:${id}`;
      setActiveRooms((prev) => prev.filter((r) => r !== room));
      leaveRoom(room);
    },
    [leaveRoom, userId],
  );

  // Auto-join user room once authenticated
  useEffect(() => {
    if (!userId) return;

    // Join user:{userId} for personal notifications, etc.
    joinUserRoom(userId);

    // Optional cleanup on logout (userId changes to null)
    return () => {
      // We only leave on unmount/teardown; if userId changes, effect re-runs anyway.
      // leaveUserRoom(userId);
    };
  }, [userId, joinUserRoom]);

  const joinProjectRoom = useCallback(
    (projectId) => {
      if (!projectId) return;
      const room = `project:${projectId}`;
      setActiveRooms((prev) => {
        if (prev.includes(room)) return prev;
        return [...prev, room];
      });
      joinRoom(room);
    },
    [joinRoom],
  );

  const leaveProjectRoom = useCallback(
    (projectId) => {
      if (!projectId) return;
      const room = `project:${projectId}`;
      setActiveRooms((prev) => prev.filter((r) => r !== room));
      leaveRoom(room);
    },
    [leaveRoom],
  );

  // ✅ STEP 6: Public project spectator rooms (public:project:{projectId})
  const joinPublicProjectRoom = useCallback(
    (projectId) => {
      if (!projectId) return;
      const room = `public:project:${projectId}`;
      setActiveRooms((prev) => {
        if (prev.includes(room)) return prev;
        return [...prev, room];
      });
      joinRoom(room);
    },
    [joinRoom],
  );

  const joinConversationRoom = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      setActiveRooms((prev) => {
        if (prev.includes(room)) return prev;
        return [...prev, room];
      });
      joinRoom(room);
    },
    [joinRoom],
  );

  const leaveConversationRoom = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      setActiveRooms((prev) => prev.filter((r) => r !== room));
      leaveRoom(room);
    },
    [leaveRoom],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────────────────────

  const subscribe = useCallback((event, handler) => {
    setEventHandlers((prev) => ({
      ...prev,
      [event]: [...(prev[event] || []), handler],
    }));

    // Return unsubscribe function
    return () => {
      setEventHandlers((prev) => ({
        ...prev,
        [event]: (prev[event] || []).filter((h) => h !== handler),
      }));
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // TYPING INDICATORS
  // ─────────────────────────────────────────────────────────────────────────────

  const sendTypingStart = useCallback(
    (conversationId) => {
      emit('typing:start', { conversationId });
    },
    [emit],
  );

  const sendTypingStop = useCallback(
    (conversationId) => {
      emit('typing:stop', { conversationId });
    },
    [emit],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESENCE
  // ─────────────────────────────────────────────────────────────────────────────

  const updatePresence = useCallback(
    (status) => {
      emit('presence:update', { status });
    },
    [emit],
  );

  const getPresence = useCallback(
    (userIds) => {
      return new Promise((resolve) => {
        if (!socket || !socket.connected) {
          resolve({ users: {} });
          return;
        }
        socket.emit('presence:get', { userIds }, (response) => {
          resolve(response);
        });
      });
    },
    [socket],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBUG LOGGING
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (state.isConnected) {
        console.log('[SocketContext] Connected to WebSocket');
      } else if (state.isConnecting) {
        console.log('[SocketContext] Connecting...');
      } else if (state.error) {
        console.warn('[SocketContext] Connection error:', state.error.message);
      }
    }
  }, [state]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      // Connection state
      socket,
      isConnected: state.isConnected,
      isConnecting: state.isConnecting,
      connectionError: state.error,

      // Generic methods
      emit,
      subscribe,

      // Room management
      joinUserRoom,
      leaveUserRoom,
      joinProjectRoom,
      leaveProjectRoom,
      joinPublicProjectRoom,
      joinConversationRoom,
      leaveConversationRoom,
      activeRooms,

      // Typing
      sendTypingStart,
      sendTypingStop,

      // Presence
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
    ],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useSocketContext() {
  const context = useContext(SocketContext);

  if (!context) {
    // Return a safe fallback instead of throwing
    // This allows components to work even if socket isn't available
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

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook to subscribe to a specific socket event
 * Usage: useSocketEvent('message:new', (data) => console.log(data))
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
  const timeoutsRef = React.useRef({});

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribe('typing:user', (data) => {
      if (data.conversationId !== conversationId) return;

      if (data.isTyping) {
        // Add user to typing list
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        });

        // Clear existing timeout
        if (timeoutsRef.current[data.userId]) {
          clearTimeout(timeoutsRef.current[data.userId]);
        }

        // Auto-remove after 3 seconds of no typing
        timeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }, 3000);
      } else {
        // Remove user from typing list
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        if (timeoutsRef.current[data.userId]) {
          clearTimeout(timeoutsRef.current[data.userId]);
        }
      }
    });

    return () => {
      unsubscribe();
      // Clear all timeouts
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
