/**
 * cursorSlice.js
 * Zustand store for cursor positions and state
 * 
 * Why Zustand instead of Redux:
 * - Simpler API (no boilerplate)
 * - Better performance (selective subscriptions)
 * - Smaller bundle size
 * - Perfect for real-time updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Cursor Store
 * Central state management for all cursor data
 */
export const useCursorStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================

      // Map of userId -> cursor state
      cursors: new Map(),

      // Current user's own cursor position
      ownCursor: {
        x: 0,
        y: 0,
        activity: 'idle',
        lastUpdate: Date.now(),
      },

      // Connection status
      isConnected: false,
      socketId: null,

      // Settings
      settings: {
        enabled: true,
        showOwnCursor: false,
        ghostTrail: true,
        trailLength: 10,
        showNames: true,
        flashEnabled: true,
        syncPulseEnabled: true,
        proximityThreshold: 50,
        breathingSpeed: 'normal',
        cursorSize: 'medium',
      },

      // Performance metrics
      metrics: {
        fps: 60,
        latency: 0,
        updateCount: 0,
        lastUpdate: Date.now(),
      },

      // ============================================
      // ACTIONS - Connection
      // ============================================

      setConnected: (connected, socketId = null) =>
        set(
          (state) => ({
            isConnected: connected,
            socketId,
          }),
          false,
          'cursor/setConnected'
        ),

      // ============================================
      // ACTIONS - Cursor Management
      // ============================================

      addCursor: (userId, cursorData) =>
        set(
          (state) => {
            const newCursors = new Map(state.cursors);
            newCursors.set(userId, {
              userId,
              ...cursorData,
              lastUpdate: Date.now(),
            });
            return { cursors: newCursors };
          },
          false,
          'cursor/add'
        ),

      updateCursor: (userId, updates) =>
        set(
          (state) => {
            const newCursors = new Map(state.cursors);
            const existing = newCursors.get(userId);
            
            if (existing) {
              newCursors.set(userId, {
                ...existing,
                ...updates,
                lastUpdate: Date.now(),
              });
            }
            
            return { cursors: newCursors };
          },
          false,
          'cursor/update'
        ),

      removeCursor: (userId) =>
        set(
          (state) => {
            const newCursors = new Map(state.cursors);
            newCursors.delete(userId);
            return { cursors: newCursors };
          },
          false,
          'cursor/remove'
        ),

      clearAllCursors: () =>
        set(
          () => ({ cursors: new Map() }),
          false,
          'cursor/clearAll'
        ),

      // ============================================
      // ACTIONS - Own Cursor
      // ============================================

      updateOwnCursor: (updates) =>
        set(
          (state) => ({
            ownCursor: {
              ...state.ownCursor,
              ...updates,
              lastUpdate: Date.now(),
            },
          }),
          false,
          'cursor/updateOwn'
        ),

      // ============================================
      // ACTIONS - Settings
      // ============================================

      updateSettings: (newSettings) =>
        set(
          (state) => ({
            settings: {
              ...state.settings,
              ...newSettings,
            },
          }),
          false,
          'cursor/updateSettings'
        ),

      loadSettings: () => {
        try {
          const saved = localStorage.getItem('cursor_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            set(
              (state) => ({
                settings: {
                  ...state.settings,
                  ...parsed,
                },
              }),
              false,
              'cursor/loadSettings'
            );
          }
        } catch (error) {
          console.error('Failed to load cursor settings:', error);
        }
      },

      saveSettings: () => {
        const { settings } = get();
        try {
          localStorage.setItem('cursor_settings', JSON.stringify(settings));
        } catch (error) {
          console.error('Failed to save cursor settings:', error);
        }
      },

      // ============================================
      // ACTIONS - Performance Metrics
      // ============================================

      updateMetrics: (metrics) =>
        set(
          (state) => ({
            metrics: {
              ...state.metrics,
              ...metrics,
              lastUpdate: Date.now(),
            },
          }),
          false,
          'cursor/updateMetrics'
        ),

      // ============================================
      // SELECTORS (Helper methods)
      // ============================================

      getCursor: (userId) => {
        const { cursors } = get();
        return cursors.get(userId);
      },

      getAllCursors: () => {
        const { cursors } = get();
        return Array.from(cursors.values());
      },

      getCursorCount: () => {
        const { cursors } = get();
        return cursors.size;
      },

      getActiveCursors: () => {
        const { cursors } = get();
        const now = Date.now();
        const staleThreshold = 30000; // 30 seconds

        return Array.from(cursors.values()).filter(
          (cursor) => now - cursor.lastUpdate < staleThreshold
        );
      },

      // ============================================
      // CLEANUP
      // ============================================

      cleanupStaleCursors: () => {
        const now = Date.now();
        const staleThreshold = 30000; // 30 seconds

        set(
          (state) => {
            const newCursors = new Map();
            
            for (const [userId, cursor] of state.cursors) {
              if (now - cursor.lastUpdate < staleThreshold) {
                newCursors.set(userId, cursor);
              }
            }
            
            return { cursors: newCursors };
          },
          false,
          'cursor/cleanup'
        );
      },
    }),
    {
      name: 'cursor-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook to get a specific cursor by userId
 */
export const useCursor = (userId) => {
  return useCursorStore((state) => state.cursors.get(userId));
};

/**
 * Hook to get all cursors as array
 */
export const useAllCursors = () => {
  return useCursorStore((state) => Array.from(state.cursors.values()));
};

/**
 * Hook to get only active cursors (not stale)
 */
export const useActiveCursors = () => {
  return useCursorStore((state) => state.getActiveCursors());
};

/**
 * Hook to get cursor count
 */
export const useCursorCount = () => {
  return useCursorStore((state) => state.cursors.size);
};

/**
 * Hook to get connection status
 */
export const useConnectionStatus = () => {
  return useCursorStore((state) => ({
    isConnected: state.isConnected,
    socketId: state.socketId,
  }));
};

/**
 * Hook to get cursor settings
 */
export const useCursorSettings = () => {
  return useCursorStore((state) => state.settings);
};

/**
 * Hook to get performance metrics
 */
export const useCursorMetrics = () => {
  return useCursorStore((state) => state.metrics);
};

// ============================================
// AUTOMATIC CLEANUP
// ============================================

// Run cleanup every 10 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCursorStore.getState().cleanupStaleCursors();
  }, 10000);
}

export default useCursorStore;