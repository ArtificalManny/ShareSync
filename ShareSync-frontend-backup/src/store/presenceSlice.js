/**
 * presenceSlice.js
 * Zustand store for user presence and status
 * 
 * Tracks:
 * - Who's online/offline
 * - User activity states (idle, active, focus)
 * - Project presence (who's in which project)
 * - Status updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Presence Store
 */
export const usePresenceStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================

      // Map of userId -> presence state
      users: new Map(),

      // Map of projectId -> Set of userIds
      projectPresence: new Map(),

      // Current user's own presence
      ownPresence: {
        status: 'online', // 'online' | 'idle' | 'focus' | 'offline'
        mode: 'team', // 'team' | 'ghost' | 'focus'
        lastActive: Date.now(),
        currentProject: null,
      },

      // Activity tracking
      activityLog: [],
      maxActivityLogSize: 100,

      // Stats
      stats: {
        totalOnline: 0,
        totalActive: 0,
        totalIdle: 0,
        totalFocus: 0,
        peakOnline: 0,
        lastUpdate: Date.now(),
      },

      // ============================================
      // ACTIONS - User Presence
      // ============================================

      setUserPresence: (userId, presenceData) =>
        set(
          (state) => {
            const newUsers = new Map(state.users);
            newUsers.set(userId, {
              userId,
              ...presenceData,
              lastUpdate: Date.now(),
            });

            // Update stats
            const totalOnline = Array.from(newUsers.values()).filter(
              (u) => u.status !== 'offline'
            ).length;

            return {
              users: newUsers,
              stats: {
                ...state.stats,
                totalOnline,
                peakOnline: Math.max(state.stats.peakOnline, totalOnline),
                lastUpdate: Date.now(),
              },
            };
          },
          false,
          'presence/setUser'
        ),

      updateUserPresence: (userId, updates) =>
        set(
          (state) => {
            const newUsers = new Map(state.users);
            const existing = newUsers.get(userId);

            if (existing) {
              newUsers.set(userId, {
                ...existing,
                ...updates,
                lastUpdate: Date.now(),
              });
            }

            return { users: newUsers };
          },
          false,
          'presence/updateUser'
        ),

      removeUserPresence: (userId) =>
        set(
          (state) => {
            const newUsers = new Map(state.users);
            newUsers.delete(userId);

            return { users: newUsers };
          },
          false,
          'presence/removeUser'
        ),

      // ============================================
      // ACTIONS - Own Presence
      // ============================================

      updateOwnPresence: (updates) =>
        set(
          (state) => ({
            ownPresence: {
              ...state.ownPresence,
              ...updates,
              lastActive: Date.now(),
            },
          }),
          false,
          'presence/updateOwn'
        ),

      setStatus: (status) =>
        set(
          (state) => ({
            ownPresence: {
              ...state.ownPresence,
              status,
              lastActive: Date.now(),
            },
          }),
          false,
          'presence/setStatus'
        ),

      setMode: (mode) =>
        set(
          (state) => ({
            ownPresence: {
              ...state.ownPresence,
              mode,
            },
          }),
          false,
          'presence/setMode'
        ),

      // ============================================
      // ACTIONS - Project Presence
      // ============================================

      joinProject: (projectId, userId) =>
        set(
          (state) => {
            const newProjectPresence = new Map(state.projectPresence);
            const projectUsers = newProjectPresence.get(projectId) || new Set();
            projectUsers.add(userId);
            newProjectPresence.set(projectId, projectUsers);

            return { projectPresence: newProjectPresence };
          },
          false,
          'presence/joinProject'
        ),

      leaveProject: (projectId, userId) =>
        set(
          (state) => {
            const newProjectPresence = new Map(state.projectPresence);
            const projectUsers = newProjectPresence.get(projectId);

            if (projectUsers) {
              projectUsers.delete(userId);
              if (projectUsers.size === 0) {
                newProjectPresence.delete(projectId);
              } else {
                newProjectPresence.set(projectId, projectUsers);
              }
            }

            return { projectPresence: newProjectPresence };
          },
          false,
          'presence/leaveProject'
        ),

      clearProjectPresence: (projectId) =>
        set(
          (state) => {
            const newProjectPresence = new Map(state.projectPresence);
            newProjectPresence.delete(projectId);
            return { projectPresence: newProjectPresence };
          },
          false,
          'presence/clearProject'
        ),

      // ============================================
      // ACTIONS - Activity Logging
      // ============================================

      logActivity: (userId, activity) =>
        set(
          (state) => {
            const entry = {
              userId,
              activity,
              timestamp: Date.now(),
            };

            const newLog = [entry, ...state.activityLog].slice(
              0,
              state.maxActivityLogSize
            );

            return { activityLog: newLog };
          },
          false,
          'presence/logActivity'
        ),

      clearActivityLog: () =>
        set(
          () => ({ activityLog: [] }),
          false,
          'presence/clearLog'
        ),

      // ============================================
      // SELECTORS
      // ============================================

      getUserPresence: (userId) => {
        const { users } = get();
        return users.get(userId);
      },

      getAllUsers: () => {
        const { users } = get();
        return Array.from(users.values());
      },

      getOnlineUsers: () => {
        const { users } = get();
        return Array.from(users.values()).filter(
          (user) => user.status !== 'offline'
        );
      },

      getActiveUsers: () => {
        const { users } = get();
        const now = Date.now();
        const idleThreshold = 5 * 60 * 1000; // 5 minutes

        return Array.from(users.values()).filter(
          (user) =>
            user.status !== 'offline' &&
            now - user.lastUpdate < idleThreshold
        );
      },

      getUsersInProject: (projectId) => {
        const { projectPresence, users } = get();
        const userIds = projectPresence.get(projectId);

        if (!userIds) return [];

        return Array.from(userIds)
          .map((userId) => users.get(userId))
          .filter(Boolean);
      },

      getProjectCount: (projectId) => {
        const { projectPresence } = get();
        const userIds = projectPresence.get(projectId);
        return userIds ? userIds.size : 0;
      },

      // ============================================
      // STATS CALCULATIONS
      // ============================================

      updateStats: () => {
        const { users } = get();
        const allUsers = Array.from(users.values());

        const totalOnline = allUsers.filter((u) => u.status !== 'offline').length;
        const totalActive = allUsers.filter((u) => u.status === 'online').length;
        const totalIdle = allUsers.filter((u) => u.status === 'idle').length;
        const totalFocus = allUsers.filter((u) => u.status === 'focus').length;

        set(
          (state) => ({
            stats: {
              ...state.stats,
              totalOnline,
              totalActive,
              totalIdle,
              totalFocus,
              peakOnline: Math.max(state.stats.peakOnline, totalOnline),
              lastUpdate: Date.now(),
            },
          }),
          false,
          'presence/updateStats'
        );
      },

      // ============================================
      // CLEANUP
      // ============================================

      cleanupStaleUsers: () => {
        const now = Date.now();
        const staleThreshold = 30000; // 30 seconds

        set(
          (state) => {
            const newUsers = new Map();

            for (const [userId, user] of state.users) {
              if (now - user.lastUpdate < staleThreshold) {
                newUsers.set(userId, user);
              }
            }

            return { users: newUsers };
          },
          false,
          'presence/cleanup'
        );

        // Update stats after cleanup
        get().updateStats();
      },
    }),
    {
      name: 'presence-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook to get a specific user's presence
 */
export const useUserPresence = (userId) => {
  return usePresenceStore((state) => state.users.get(userId));
};

/**
 * Hook to get all online users
 */
export const useOnlineUsers = () => {
  return usePresenceStore((state) => state.getOnlineUsers());
};

/**
 * Hook to get users in a specific project
 */
export const useProjectPresence = (projectId) => {
  return usePresenceStore((state) => state.getUsersInProject(projectId));
};

/**
 * Hook to get presence stats
 */
export const usePresenceStats = () => {
  return usePresenceStore((state) => state.stats);
};

/**
 * Hook to get own presence
 */
export const useOwnPresence = () => {
  return usePresenceStore((state) => state.ownPresence);
};

/**
 * Hook to get activity log
 */
export const useActivityLog = () => {
  return usePresenceStore((state) => state.activityLog);
};

// ============================================
// AUTOMATIC CLEANUP AND STATS
// ============================================

if (typeof window !== 'undefined') {
  // Cleanup stale users every 10 seconds
  setInterval(() => {
    usePresenceStore.getState().cleanupStaleUsers();
  }, 10000);

  // Update stats every 5 seconds
  setInterval(() => {
    usePresenceStore.getState().updateStats();
  }, 5000);
}

export default usePresenceStore;