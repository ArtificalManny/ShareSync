/**
 * CursorContext.jsx
 * React context for Live Human Cursor state management
 * 
 * Provides:
 * - Socket.IO connection to cursor gateway
 * - Cursor position state for all users
 * - Methods to emit cursor events
 * - Presence state integration
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
  
  // Socket.IO connection
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Cursor state
  // Structure: Map<userId, CursorState>
  const [cursors, setCursors] = useState(new Map());
  
  // Current project
  const [currentProject, setCurrentProject] = useState(null);
  
  // User's own cursor position (for throttling)
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef(0);
  
  // Activity state
  const [activity, setActivity] = useState('idle'); // 'idle' | 'typing' | 'clicking' | 'dragging'
  
  // Throttle cursor updates to 30fps
  const THROTTLE_MS = 33;

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
    const newSocket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/cursors`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Cursor: Connected', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Cursor: Disconnected', reason);
      setIsConnected(false);
      
      // Clear all cursors on disconnect
      setCursors(new Map());
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Cursor: Connection error', error);
    });

    // ============================================
    // CURSOR EVENTS
    // ============================================

    // Initial cursor state when joining project
    newSocket.on('cursor:state', (data) => {
      console.log('📍 Cursor: Initial state', data.cursors.length, 'cursors');
      
      const cursorMap = new Map();
      data.cursors.forEach((cursor) => {
        cursorMap.set(cursor.userId, cursor);
      });
      setCursors(cursorMap);
    });

    // Someone joined the project
    newSocket.on('cursor:joined', (data) => {
      console.log('👋 Cursor: Someone joined', data.cursor.userName);
      
      setCursors((prev) => {
        const updated = new Map(prev);
        updated.set(data.cursor.userId, data.cursor);
        return updated;
      });
    });

    // Someone left the project
    newSocket.on('cursor:removed', (data) => {
      console.log('👋 Cursor: Someone left', data.userId);
      
      setCursors((prev) => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    // Cursor position update
    newSocket.on('cursor:update', (data) => {
      setCursors((prev) => {
        const updated = new Map(prev);
        const cursor = updated.get(data.userId);
        
        if (cursor) {
          cursor.x = data.x;
          cursor.y = data.y;
          cursor.activity = data.activity || 'idle';
          cursor.lastSeen = data.timestamp;
          updated.set(data.userId, cursor);
        }
        
        return updated;
      });
    });

    // Activity flash (typing, clicking, ship)
    newSocket.on('cursor:flash', (data) => {
      // Trigger flash animation (handled in LiveCursor component)
      setCursors((prev) => {
        const updated = new Map(prev);
        const cursor = updated.get(data.userId);
        
        if (cursor) {
          cursor.flashType = data.type;
          cursor.flashTimestamp = data.timestamp;
          updated.set(data.userId, cursor);
        }
        
        return updated;
      });
    });

    // Ship flash (gold celebration for everyone!)
    newSocket.on('cursor:ship-flash', (data) => {
      console.log('🚢 Cursor: SHIP FLASH from', data.userId);
      
      // Trigger global ship celebration
      // (This will be picked up by ShipCelebration component)
      window.dispatchEvent(new CustomEvent('cursor:ship', {
        detail: { userId: data.userId, timestamp: data.timestamp }
      }));
    });

    // Sync pulse (two cursors near each other)
    newSocket.on('cursor:sync-pulse', (data) => {
      console.log('💓 Cursor: Sync pulse', data.user1, '<->', data.user2);
      
      // Trigger haptic feedback if supported
      if (navigator.vibrate && (data.user1 === user.id || data.user2 === user.id)) {
        navigator.vibrate(50); // Light vibration
      }
      
      // Trigger visual sync pulse animation
      setCursors((prev) => {
        const updated = new Map(prev);
        
        [data.user1, data.user2].forEach((userId) => {
          const cursor = updated.get(userId);
          if (cursor) {
            cursor.syncPulse = true;
            cursor.syncTimestamp = data.timestamp;
            updated.set(userId, cursor);
            
            // Clear sync pulse after animation
            setTimeout(() => {
              setCursors((p) => {
                const u = new Map(p);
                const c = u.get(userId);
                if (c) {
                  c.syncPulse = false;
                  u.set(userId, c);
                }
                return u;
              });
            }, 1500);
          }
        });
        
        return updated;
      });
    });

    // Focus together target position
    newSocket.on('cursor:focus-target', (data) => {
      console.log('👀 Cursor: Focus target', data.userId, data.x, data.y);
      
      // Scroll/pan to target position
      // (Handled by ProjectHome component)
      window.dispatchEvent(new CustomEvent('cursor:focus', {
        detail: data
      }));
    });

    // Heartbeat (someone active)
    newSocket.on('cursor:heartbeat', (data) => {
      // Update last activity timestamp
      setCursors((prev) => {
        const updated = new Map(prev);
        const cursor = updated.get(data.userId);
        
        if (cursor) {
          cursor.lastActivity = data.timestamp;
          updated.set(data.userId, cursor);
        }
        
        return updated;
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cursor: Disconnecting...');
      newSocket.close();
    };
  }, [user, token]);

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  const joinProject = useCallback((projectId) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot join project: Socket not connected');
      return;
    }

    console.log('🎯 Cursor: Joining project', projectId);
    
    // Leave previous project first
    if (currentProject && currentProject !== projectId) {
      socket.emit('cursor:leave', { projectId: currentProject });
    }

    // Join new project
    socket.emit('cursor:join', { projectId });
    setCurrentProject(projectId);
  }, [socket, isConnected, currentProject]);

  const leaveProject = useCallback(() => {
    if (!socket || !currentProject) return;

    console.log('👋 Cursor: Leaving project', currentProject);
    socket.emit('cursor:leave', { projectId: currentProject });
    setCurrentProject(null);
    setCursors(new Map());
  }, [socket, currentProject]);

  // ============================================
  // CURSOR UPDATES
  // ============================================

  const updateCursorPosition = useCallback((x, y, newActivity = 'idle') => {
    if (!socket || !isConnected || !currentProject) return;

    // Throttle to 30fps
    const now = Date.now();
    if (now - lastUpdate.current < THROTTLE_MS) {
      return; // Drop update
    }

    // Check if position actually changed (avoid spam)
    const dx = Math.abs(x - lastPosition.current.x);
    const dy = Math.abs(y - lastPosition.current.y);
    
    if (dx < 0.5 && dy < 0.5 && newActivity === activity) {
      return; // Position hasn't changed significantly
    }

    lastPosition.current = { x, y };
    lastUpdate.current = now;

    // Emit cursor move event
    socket.emit('cursor:move', {
      projectId: currentProject,
      x,
      y,
      activity: newActivity,
    });

    // Update local activity state
    if (newActivity !== activity) {
      setActivity(newActivity);
    }
  }, [socket, isConnected, currentProject, activity]);

  const sendFlash = useCallback((type) => {
    if (!socket || !isConnected || !currentProject) return;

    socket.emit('cursor:flash', {
      projectId: currentProject,
      type,
    });
  }, [socket, isConnected, currentProject]);

  const focusTogether = useCallback((targetUserId) => {
    if (!socket || !isConnected || !currentProject) return;

    socket.emit('cursor:focus-together', {
      projectId: currentProject,
      targetUserId,
    });
  }, [socket, isConnected, currentProject]);

  const sendProximity = useCallback((nearUserId) => {
    if (!socket || !isConnected || !currentProject) return;

    socket.emit('cursor:proximity', {
      projectId: currentProject,
      nearUserId,
    });
  }, [socket, isConnected, currentProject]);

  const sendHeartbeat = useCallback(() => {
    if (!socket || !isConnected || !currentProject) return;

    socket.emit('cursor:heartbeat', {
      projectId: currentProject,
    });
  }, [socket, isConnected, currentProject]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // Connection state
    isConnected,
    socket,
    
    // Cursor state
    cursors: Array.from(cursors.values()),
    cursorsMap: cursors,
    ownCursor: user ? cursors.get(user.id) : null,
    
    // Project
    currentProject,
    joinProject,
    leaveProject,
    
    // Cursor updates
    updateCursorPosition,
    sendFlash,
    focusTogether,
    sendProximity,
    sendHeartbeat,
    
    // Activity
    activity,
    setActivity,
  };

  return (
    <CursorContext.Provider value={value}>
      {children}
    </CursorContext.Provider>
  );
}

export default CursorContext;