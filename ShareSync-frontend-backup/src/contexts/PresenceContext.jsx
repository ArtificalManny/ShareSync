// src/contexts/PresenceContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Real-Time Presence Context
// ═══════════════════════════════════════════════════════════════════════════════
//
// Manages real-time presence state for all team members.
// Features:
// - Who's online right now
// - What task they're working on (opt-in)
// - Activity status (active/idle/away/focus)
// - Last seen timestamps
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const PresenceContext = createContext(null);

// Presence status types
export const PRESENCE_STATUS = {
  ONLINE: 'online',
  ACTIVE: 'active',      // Actively working (recent activity)
  IDLE: 'idle',          // Online but no recent activity
  FOCUS: 'focus',        // In focus mode (DND)
  AWAY: 'away',          // Away from keyboard
  OFFLINE: 'offline',
};

// Activity types
export const ACTIVITY_TYPES = {
  VIEWING: 'viewing',
  EDITING: 'editing',
  SHIPPING: 'shipping',
  REVIEWING: 'reviewing',
  FOCUS_SESSION: 'focus_session',
};

// Default preferences
const DEFAULT_PREFERENCES = {
  shareActivity: true,      // Share what task you're working on
  shareStatus: true,        // Share online/focus status
  showInArena: true,        // Appear in the Live Arena
  allowCoworkRequests: true, // Allow others to request co-work
};

export function PresenceProvider({ children, enabled = true }) {
  const { user } = useAuth();
  
  // My presence state
  const [myPresence, setMyPresence] = useState({
    status: PRESENCE_STATUS.ONLINE,
    currentTask: null,
    currentProject: null,
    activityType: null,
    focusSessionActive: false,
    lastActivity: new Date().toISOString(),
  });

  // Team presence state (map of userId -> presence)
  const [teamPresence, setTeamPresence] = useState(new Map());
  
  // Preferences
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem('ss.presence.preferences');
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // WebSocket connection ref
  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('ss.presence.preferences', JSON.stringify(preferences));
    } catch {
      // Ignore
    }
  }, [preferences]);

  // Mock team data for demo (replace with real WebSocket)
  useEffect(() => {
    if (!enabled) return;

    // Simulate team members coming online
    const mockTeam = [
      {
        userId: 'user-1',
        name: 'Sarah Chen',
        avatar: '👩‍💻',
        status: PRESENCE_STATUS.ACTIVE,
        currentTask: 'Auth Refactor',
        currentProject: 'ShareSync Core',
        activityType: ACTIVITY_TYPES.EDITING,
        focusSessionActive: false,
        lastActivity: new Date().toISOString(),
      },
      {
        userId: 'user-2',
        name: 'Mike Rodriguez',
        avatar: '👨‍🎨',
        status: PRESENCE_STATUS.FOCUS,
        currentTask: 'Design System Updates',
        currentProject: 'UI Library',
        activityType: ACTIVITY_TYPES.FOCUS_SESSION,
        focusSessionActive: true,
        lastActivity: new Date().toISOString(),
      },
      {
        userId: 'user-3',
        name: 'Alex Kim',
        avatar: '🧑‍🔬',
        status: PRESENCE_STATUS.IDLE,
        currentTask: null,
        currentProject: 'ML Pipeline',
        activityType: null,
        focusSessionActive: false,
        lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
      },
      {
        userId: 'user-4',
        name: 'Emma Wilson',
        avatar: '👩‍��',
        status: PRESENCE_STATUS.ACTIVE,
        currentTask: 'API Integration',
        currentProject: 'Backend Services',
        activityType: ACTIVITY_TYPES.SHIPPING,
        focusSessionActive: false,
        lastActivity: new Date().toISOString(),
      },
      {
        userId: 'user-5',
        name: 'Jordan Lee',
        avatar: '👨‍��',
        status: PRESENCE_STATUS.AWAY,
        currentTask: null,
        currentProject: null,
        activityType: null,
        focusSessionActive: false,
        lastActivity: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
      },
    ];

    const presenceMap = new Map();
    mockTeam.forEach(member => {
      presenceMap.set(member.userId, member);
    });
    setTeamPresence(presenceMap);

    // Simulate random activity updates
    const interval = setInterval(() => {
      setTeamPresence(prev => {
        const newMap = new Map(prev);
        const members = Array.from(newMap.values());
        const randomMember = members[Math.floor(Math.random() * members.length)];
        
        if (randomMember && Math.random() > 0.7) {
          newMap.set(randomMember.userId, {
            ...randomMember,
            lastActivity: new Date().toISOString(),
            status: randomMember.focusSessionActive 
              ? PRESENCE_STATUS.FOCUS 
              : PRESENCE_STATUS.ACTIVE,
          });
        }
        
        return newMap;
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  // Update my activity
  const updateMyActivity = useCallback((activity) => {
    setMyPresence(prev => ({
      ...prev,
      ...activity,
      lastActivity: new Date().toISOString(),
      status: activity.focusSessionActive 
        ? PRESENCE_STATUS.FOCUS 
        : PRESENCE_STATUS.ACTIVE,
    }));

    // Reset idle timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    activityTimeoutRef.current = setTimeout(() => {
      setMyPresence(prev => ({
        ...prev,
        status: PRESENCE_STATUS.IDLE,
      }));
    }, 5 * 60 * 1000); // 5 minutes of no activity = idle
  }, []);

  // Set current task
  const setCurrentTask = useCallback((task, project = null) => {
    if (!preferences.shareActivity) return;
    
    updateMyActivity({
      currentTask: task?.title || task,
      currentProject: project?.name || project,
      activityType: task ? ACTIVITY_TYPES.EDITING : null,
    });
  }, [preferences.shareActivity, updateMyActivity]);

  // Start focus session
  const startFocusSession = useCallback(() => {
    updateMyActivity({
      focusSessionActive: true,
      activityType: ACTIVITY_TYPES.FOCUS_SESSION,
    });
  }, [updateMyActivity]);

  // End focus session
  const endFocusSession = useCallback(() => {
    updateMyActivity({
      focusSessionActive: false,
      activityType: null,
    });
  }, [updateMyActivity]);

  // Go away
  const goAway = useCallback(() => {
    setMyPresence(prev => ({
      ...prev,
      status: PRESENCE_STATUS.AWAY,
    }));
  }, []);

  // Come back
  const comeBack = useCallback(() => {
    setMyPresence(prev => ({
      ...prev,
      status: prev.focusSessionActive ? PRESENCE_STATUS.FOCUS : PRESENCE_STATUS.ONLINE,
      lastActivity: new Date().toISOString(),
    }));
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Get team members list
  const getTeamMembers = useCallback(() => {
    return Array.from(teamPresence.values());
  }, [teamPresence]);

  // Get active team members
  const getActiveMembers = useCallback(() => {
    return Array.from(teamPresence.values()).filter(
      m => m.status === PRESENCE_STATUS.ACTIVE || m.status === PRESENCE_STATUS.FOCUS
    );
  }, [teamPresence]);

  // Get members in focus mode
  const getFocusedMembers = useCallback(() => {
    return Array.from(teamPresence.values()).filter(
      m => m.status === PRESENCE_STATUS.FOCUS
    );
  }, [teamPresence]);

  // Get member by ID
  const getMember = useCallback((userId) => {
    return teamPresence.get(userId) || null;
  }, [teamPresence]);

  const value = {
    // My presence
    myPresence,
    updateMyActivity,
    setCurrentTask,
    startFocusSession,
    endFocusSession,
    goAway,
    comeBack,
    
    // Team presence
    teamPresence,
    getTeamMembers,
    getActiveMembers,
    getFocusedMembers,
    getMember,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Constants
    PRESENCE_STATUS,
    ACTIVITY_TYPES,
    
    // State
    enabled,
    isConnected: true, // Would be based on WebSocket state
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  
  if (!context) {
    return {
      myPresence: { status: PRESENCE_STATUS.OFFLINE },
      teamPresence: new Map(),
      getTeamMembers: () => [],
      getActiveMembers: () => [],
      getFocusedMembers: () => [],
      getMember: () => null,
      preferences: DEFAULT_PREFERENCES,
      updatePreferences: () => {},
      setCurrentTask: () => {},
      startFocusSession: () => {},
      endFocusSession: () => {},
      enabled: false,
      isConnected: false,
      PRESENCE_STATUS,
      ACTIVITY_TYPES,
    };
  }
  
  return context;
}

export default PresenceContext;
