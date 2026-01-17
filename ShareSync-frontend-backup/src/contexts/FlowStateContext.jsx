// src/contexts/FlowStateContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW STATE - Global Context Provider
// ═══════════════════════════════════════════════════════════════════════════════
// Provides flow state to the entire app so components can react:
// - Sidebar can collapse
// - Notifications can mute
// - Focus areas can highlight
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from 'react';
import useFlowDetection, { FLOW_PHASES } from '../hooks/useFlowDetection';

const FlowStateContext = createContext(null);

export function FlowStateProvider({ children, enabled = true }) {
  // User preferences
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem('sharesync_flow_preferences');
      return stored ? JSON.parse(stored) : {
        enabled: true,
        collapseSidebar: true,
        dimNotifications: true,
        showIndicator: true,
        playSoundOnEnter: false,
      };
    } catch {
      return {
        enabled: true,
        collapseSidebar: true,
        dimNotifications: true,
        showIndicator: true,
        playSoundOnEnter: false,
      };
    }
  });

  // Flow detection hook
  const flow = useFlowDetection({ 
    enabled: enabled && preferences.enabled 
  });

  // Update preferences
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('sharesync_flow_preferences', JSON.stringify(next));
      } catch {
        // localStorage might be unavailable
      }
      return next;
    });
  }, []);

  // Toggle flow detection on/off
  const toggleFlowDetection = useCallback(() => {
    updatePreferences({ enabled: !preferences.enabled });
  }, [preferences.enabled, updatePreferences]);

  // Computed states for UI components
  const shouldCollapseSidebar = flow.isInFlow && preferences.collapseSidebar;
  const shouldDimNotifications = flow.isInFlow && preferences.dimNotifications;
  const shouldShowIndicator = (flow.isInFlow || flow.isBuilding) && preferences.showIndicator;

  const value = {
    // Flow state
    ...flow,
    
    // Computed UI states
    shouldCollapseSidebar,
    shouldDimNotifications,
    shouldShowIndicator,
    
    // Preferences
    preferences,
    updatePreferences,
    toggleFlowDetection,
    
    // Constants for reference
    PHASES: FLOW_PHASES,
  };

  return (
    <FlowStateContext.Provider value={value}>
      {children}
    </FlowStateContext.Provider>
  );
}

export function useFlowState() {
  const context = useContext(FlowStateContext);
  
  if (!context) {
    // Return a safe default if used outside provider
    // This allows components to work without flow state
    return {
      phase: FLOW_PHASES.IDLE,
      isInFlow: false,
      isBuilding: false,
      flowProgress: 0,
      flowDuration: 0,
      flowDurationFormatted: '0s',
      activityScore: 0,
      isTabVisible: true,
      shouldCollapseSidebar: false,
      shouldDimNotifications: false,
      shouldShowIndicator: false,
      preferences: {
        enabled: false,
        collapseSidebar: true,
        dimNotifications: true,
        showIndicator: true,
      },
      updatePreferences: () => {},
      toggleFlowDetection: () => {},
      exitFlow: () => {},
      toggleFlow: () => {},
      PHASES: FLOW_PHASES,
    };
  }
  
  return context;
}

export default FlowStateContext;
