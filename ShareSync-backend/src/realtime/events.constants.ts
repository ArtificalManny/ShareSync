// src/realtime/events.constants.ts
// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME EVENTS CONSTANTS
// Central place for all socket event names + room prefixes.
// Prevents typo bugs + makes refactors safe.
// ═══════════════════════════════════════════════════════════════════════════════

export const WS_ROOMS = {
  USER: (userId: string) => `user:${userId}`,
  PROJECT: (projectId: string) => `project:${projectId}`,
} as const;

export const WS_EVENTS = {
  // Generic room ops
  JOIN: 'join',
  LEAVE: 'leave',

  // App-specific emits
  PROJECT_PUBLIC_CHANGED: 'project:publicChanged',
  HABITS_UPDATED: 'habits:updated',

  // Optional: presence/ping style events (safe to add even if unused)
  AUTH_ERROR: 'auth:error',
  READY: 'ready',
} as const;
