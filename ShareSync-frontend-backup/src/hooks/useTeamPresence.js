// src/hooks/useTeamPresence.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Team Presence Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Convenience hook for components that need team presence data.
// Provides filtered views and computed properties.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { usePresence, PRESENCE_STATUS } from '../contexts/PresenceContext';

/**
 * useTeamPresence - Get team presence with filtering options
 * 
 * @param {object} options
 * @param {boolean} options.activeOnly - Only show active members
 * @param {boolean} options.excludeFocused - Exclude members in focus mode
 * @param {string} options.projectFilter - Filter by project name
 * @param {number} options.limit - Max members to return
 */
export default function useTeamPresence(options = {}) {
  const {
    activeOnly = false,
    excludeFocused = false,
    projectFilter = null,
    limit = null,
  } = options;

  const {
    teamPresence,
    getTeamMembers,
    getActiveMembers,
    getFocusedMembers,
    getMember,
    isConnected,
  } = usePresence();

  // Filter and sort team members
  const members = useMemo(() => {
    let result = getTeamMembers();

    // Filter active only
    if (activeOnly) {
      result = result.filter(m => 
        m.status === PRESENCE_STATUS.ACTIVE || 
        m.status === PRESENCE_STATUS.FOCUS ||
        m.status === PRESENCE_STATUS.ONLINE
      );
    }

    // Exclude focused
    if (excludeFocused) {
      result = result.filter(m => m.status !== PRESENCE_STATUS.FOCUS);
    }

    // Filter by project
    if (projectFilter) {
      result = result.filter(m => 
        m.currentProject?.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }

    // Sort by activity (most recent first), then by status
    result.sort((a, b) => {
      // Focus mode users first
      if (a.status === PRESENCE_STATUS.FOCUS && b.status !== PRESENCE_STATUS.FOCUS) return -1;
      if (b.status === PRESENCE_STATUS.FOCUS && a.status !== PRESENCE_STATUS.FOCUS) return 1;
      
      // Then active users
      if (a.status === PRESENCE_STATUS.ACTIVE && b.status !== PRESENCE_STATUS.ACTIVE) return -1;
      if (b.status === PRESENCE_STATUS.ACTIVE && a.status !== PRESENCE_STATUS.ACTIVE) return 1;
      
      // Then by last activity
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    // Apply limit
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [teamPresence, activeOnly, excludeFocused, projectFilter, limit, getTeamMembers]);

  // Computed stats
  const stats = useMemo(() => {
    const all = getTeamMembers();
    const active = all.filter(m => 
      m.status === PRESENCE_STATUS.ACTIVE || m.status === PRESENCE_STATUS.FOCUS
    );
    const focused = all.filter(m => m.status === PRESENCE_STATUS.FOCUS);
    const idle = all.filter(m => m.status === PRESENCE_STATUS.IDLE);
    const away = all.filter(m => m.status === PRESENCE_STATUS.AWAY);

    return {
      total: all.length,
      active: active.length,
      focused: focused.length,
      idle: idle.length,
      away: away.length,
      online: all.filter(m => m.status !== PRESENCE_STATUS.OFFLINE).length,
    };
  }, [teamPresence, getTeamMembers]);

  // Get members working on same project
  const getCoworkers = useCallback((projectName) => {
    return getTeamMembers().filter(m => 
      m.currentProject?.toLowerCase() === projectName?.toLowerCase() &&
      (m.status === PRESENCE_STATUS.ACTIVE || m.status === PRESENCE_STATUS.FOCUS)
    );
  }, [getTeamMembers]);

  // Check if someone is available for co-work (not in focus)
  const isAvailableForCowork = useCallback((userId) => {
    const member = getMember(userId);
    return member && 
      member.status !== PRESENCE_STATUS.FOCUS && 
      member.status !== PRESENCE_STATUS.AWAY &&
      member.status !== PRESENCE_STATUS.OFFLINE;
  }, [getMember]);

  // Format "last seen" text
  const formatLastSeen = useCallback((lastActivity) => {
    const now = new Date();
    const last = new Date(lastActivity);
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Over a day ago';
  }, []);

  return {
    // Filtered members
    members,
    
    // Stats
    stats,
    
    // Helpers
    getCoworkers,
    isAvailableForCowork,
    formatLastSeen,
    getMember,
    
    // Connection state
    isConnected,
    
    // Raw data access
    teamPresence,
  };
}

/**
 * useMyPresence - Hook for managing own presence
 */
export function useMyPresence() {
  const {
    myPresence,
    updateMyActivity,
    setCurrentTask,
    startFocusSession,
    endFocusSession,
    goAway,
    comeBack,
    preferences,
    updatePreferences,
  } = usePresence();

  return {
    ...myPresence,
    updateMyActivity,
    setCurrentTask,
    startFocusSession,
    endFocusSession,
    goAway,
    comeBack,
    preferences,
    updatePreferences,
  };
}
