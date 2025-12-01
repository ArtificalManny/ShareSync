/**
 * CursorContext.jsx
 * React context for Live Human Cursor state management
 * 
 * NOW WITH:
 * - Zustand store integration
 * - Performance optimizations
 * - Spatial indexing
 * - Web Worker support
 */

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import useCursorStore from '../store/cursorSlice';
import usePresenceStore from '../store/presenceSlice';
import { throttleFPS, smartThrottle } from '../utils/cursorThrottle';
import { SpatialIndex } from '../utils/spatialIndex';

// ============================================
// CURSOR CONTEXT
// ============================================

const CursorContext = createContext(null);

export const useCursorContext = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursorContext must be used within CursorProvider');
  }
  return context;
};

// ============================================
// CURSOR PROVIDER
// ============================================

export function CursorProvider({ children }) {
  const { user, token } = useAuth();
  
  // ⭐ ZUSTAND STORES
  const {
    cursors: cursorsMap,
    isConnected,
    setConnected,
    addCursor,
    updateCursor,
    removeCursor,
    updateOwnCursor,
    clearAllCursors,
    settings,
    loadSettings,
  } = useCursorStore();

  const {
    setUserPresence,
    updateUserPresence,
    removeUserPresence,
    joinProject: joinProjectPresence,
    leaveProject: leaveProjectPresence,
    updateOwnPresence,
  } = usePresenceStore();

  // Socket.IO connection
  const socketRef = useRef(null);
  
  // Current project
  const currentProjectRef = useRef(null);
  
  // ⭐ SPATIAL INDEX for proximity detection
  const spatialIndexRef = useRef(new SpatialIndex({ gridSize: 50 }));
  
  // User's own cursor position (for throttling)
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef(0);

  // ⭐ PERFORMANCE: Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ============================================
  // SOCKET CONNECTION
  // ============================================

  useEffect(() => {
    // Don't connect if not authenticated
    if (!user || !token) {
      console.log('⏸️ Cursor: Waiting for auth...');
      return;
    }

    console.log('🔌 Cursor: Connecting to WebSocket...');

    // Create Socket.IO connection
    const socket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/cursors`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Cursor: Connected', socket.id);
      setConnected(true, socket.id);
      updateOwnPresence({ status: 'online' });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Cursor: Disconnected', reason);
      setConnected(false);
      clearAllCursors();
      spatialIndexRef.current.clear();
      updateOwnPresence({ status: 'offline' });
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Cursor: Connection error', error);
    });

    // ============================================
    // CURSOR EVENTS
    // ============================================

    // Initial cursor state when joining project
    socket.on('cursor:state', (data) => {
      console.log('📍 Cursor: Initial state', data.cursors.length, 'cursors');
      
      data.cursors.forEach((cursor) => {
        // ⭐ ADD TO ZUSTAND STORE
        addCursor(cursor.userId, cursor);
        
        // ⭐ ADD TO SPATIAL INDEX
        spatialIndexRef.current.update(cursor.userId, cursor.x, cursor.y);
        
        // ⭐ ADD TO PRESENCE STORE
        setUserPresence(cursor.userId, {
          userName: cursor.userName,
          status: 'online',
          lastUpdate: Date.now(),
        });
      });
    });

    // Someone joined the project
    socket.on('cursor:joined', (data) => {
      console.log('👋 Cursor: Someone joined', data.cursor.userName);
      
      addCursor(data.cursor.userId, data.cursor);
      spatialIndexRef.current.update(data.cursor.userId, data.cursor.x, data.cursor.y);
      setUserPresence(data.cursor.userId, {
        userName: data.cursor.userName,
        status: 'online',
      });
    });

    // Someone left the project
    socket.on('cursor:removed', (data) => {
      console.log('👋 Cursor: Someone left', data.userId);
      
      removeCursor(data.userId);
      spatialIndexRef.current.remove(data.userId);
      removeUserPresence(data.userId);
    });

    // Cursor position update
    socket.on('cursor:update', (data) => {
      // ⭐ UPDATE ZUSTAND STORE
      updateCursor(data.userId, {
        x: data.x,
        y: data.y,
        activity: data.activity || 'idle',
        lastSeen: data.timestamp,
      });
      
      // ⭐ UPDATE SPATIAL INDEX
      spatialIndexRef.current.update(data.userId, data.x, data.y);
      
      // ⭐ UPDATE PRESENCE
      updateUserPresence(data.userId, {
        lastActive: data.timestamp,
        status: 'online',
      });
    });

    // Activity flash
    socket.on('cursor:flash', (data) => {
      updateCursor(data.userId, {
        flashType: data.type,
        flashTimestamp: data.timestamp,
      });
    });

    // Ship flash (gold celebration!)
    socket.on('cursor:ship-flash', (data) => {
      console.log('🚢 Cursor: SHIP FLASH from', data.userId);
      
      window.dispatchEvent(new CustomEvent('cursor:ship', {
        detail: { userId: data.userId, timestamp: data.timestamp }
      }));
    });

    // Sync pulse (proximity)
    socket.on('cursor:sync-pulse', (data) => {
      console.log('💓 Cursor: Sync pulse', data.user1, '<->', data.user2);
      
      // Haptic feedback
      if (navigator.vibrate && (data.user1 === user.id || data.user2 === user.id)) {
        navigator.vibrate(50);
      }
      
      // Update cursors with sync pulse
      [data.user1, data.user2].forEach((userId) => {
        updateCursor(userId, {
          syncPulse: true,
          syncTimestamp: data.timestamp,
        });
        
        // Clear after animation
        setTimeout(() => {
          updateCursor(userId, { syncPulse: false });
        }, 1500);
      });
      
      // Trigger visual animation
      window.dispatchEvent(new CustomEvent('cursor:sync-pulse', {
        detail: data
      }));
    });

    // Focus together
    socket.on('cursor:focus-target', (data) => {
      console.log('👀 Cursor: Focus target', data.userId, data.x, data.y);
      
      window.dispatchEvent(new CustomEvent('cursor:focus', {
        detail: data
      }));
    });

    // Heartbeat
    socket.on('cursor:heartbeat', (data) => {
      updateUserPresence(data.userId, {
        lastActivity: data.timestamp,
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cursor: Disconnecting...');
      socket.close();
      socketRef.current = null;
    };
  }, [user, token, addCursor, updateCursor, removeCursor, clearAllCursors, setConnected, setUserPresence, updateUserPresence, removeUserPresence, updateOwnPresence]);

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  const joinProject = useCallback((projectId) => {
    const socket = socketRef.current;
    
    if (!socket || !socket.connected) {
      console.warn('⚠️ Cannot join project: Socket not connected');
      return;
    }

    console.log('🎯 Cursor: Joining project', projectId);
    
    // Leave previous project first
    if (currentProjectRef.current && currentProjectRef.current !== projectId) {
      socket.emit('cursor:leave', { projectId: currentProjectRef.current });
      leaveProjectPresence(currentProjectRef.current, user?.id);
    }

    // Join new project
    socket.emit('cursor:join', { projectId });
    currentProjectRef.current = projectId;
    
    // Update presence
    joinProjectPresence(projectId, user?.id);
    updateOwnPresence({ currentProject: projectId });
  }, [user, joinProjectPresence, leaveProjectPresence, updateOwnPresence]);

  const leaveProject = useCallback(() => {
    const socket = socketRef.current;
    const projectId = currentProjectRef.current;
    
    if (!socket || !projectId) return;

    console.log('👋 Cursor: Leaving project', projectId);
    socket.emit('cursor:leave', { projectId });
    
    // Update stores
    currentProjectRef.current = null;
    clearAllCursors();
    spatialIndexRef.current.clear();
    
    leaveProjectPresence(projectId, user?.id);
    updateOwnPresence({ currentProject: null });
  }, [user, clearAllCursors, leaveProjectPresence, updateOwnPresence]);

  // ============================================
  // CURSOR UPDATES (with performance optimizations)
  // ============================================

  // ⭐ SMART THROTTLE: Only sends when position changes significantly
  const updateCursorPositionThrottled = useRef(
    smartThrottle((x, y, activity) => {
      const socket = socketRef.current;
      const projectId = currentProjectRef.current;
      
      if (!socket || !socket.connected || !projectId) return;

      // Emit to server
      socket.emit('cursor:move', {
        projectId,
        x,
        y,
        activity,
      });

      // Update own cursor in store
      updateOwnCursor({ x, y, activity });
      
      // Update spatial index
      if (user?.id) {
        spatialIndexRef.current.update(user.id, x, y);
      }
    }, {
      fps: 30,
      minDistance: 0.5, // 0.5% of viewport
      minTimeGap: 33, // 33ms = 30fps
    })
  ).current;

  const updateCursorPosition = useCallback((x, y, activity = 'idle') => {
    updateCursorPositionThrottled({ x, y }, activity);
  }, []);

  // ⭐ THROTTLED FLASH
  const sendFlash = useRef(
    throttleFPS((type) => {
      const socket = socketRef.current;
      const projectId = currentProjectRef.current;
      
      if (!socket || !socket.connected || !projectId) return;

      socket.emit('cursor:flash', { projectId, type });
    }, 10) // Max 10 flashes per second
  ).current;

  const sendFlashThrottled = useCallback((type) => {
    sendFlash(type);
  }, []);

  const focusTogether = useCallback((targetUserId) => {
    const socket = socketRef.current;
    const projectId = currentProjectRef.current;
    
    if (!socket || !socket.connected || !projectId) return;

    socket.emit('cursor:focus-together', {
      projectId,
      targetUserId,
    });
  }, []);

  const sendProximity = useCallback((nearUserId) => {
    const socket = socketRef.current;
    const projectId = currentProjectRef.current;
    
    if (!socket || !socket.connected || !projectId) return;

    socket.emit('cursor:proximity', {
      projectId,
      nearUserId,
    });
  }, []);

  const sendHeartbeat = useCallback(() => {
    const socket = socketRef.current;
    const projectId = currentProjectRef.current;
    
    if (!socket || !socket.connected || !projectId) return;

    socket.emit('cursor:heartbeat', { projectId });
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // Connection state
    isConnected,
    socket: socketRef.current,
    
    // Cursor state (from Zustand)
    cursors: Array.from(cursorsMap.values()),
    cursorsMap,
    ownCursor: user ? cursorsMap.get(user.id) : null,
    
    // Project
    currentProject: currentProjectRef.current,
    joinProject,
    leaveProject,
    
    // Cursor updates
    updateCursorPosition,
    sendFlash: sendFlashThrottled,
    focusTogether,
    sendProximity,
    sendHeartbeat,
    
    // Settings
    settings,
    
    // ⭐ SPATIAL INDEX (exposed for advanced use)
    spatialIndex: spatialIndexRef.current,
  };

  return (
    <CursorContext.Provider value={value}>
      {children}
    </CursorContext.Provider>
  );
}

export default CursorContext;