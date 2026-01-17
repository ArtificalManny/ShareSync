// src/hooks/useFlowDetection.js
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW STATE - Detection Logic
// ═══════════════════════════════════════════════════════════════════════════════
// Determines when user enters and exits "flow state" based on:
// - Sustained activity without tab switches
// - Consistent engagement over time
// - No idle periods
//
// Flow state requires EARNING your way in (sustained focus)
// but exits quickly when broken (immediate on tab switch)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useActivityTracker from './useActivityTracker';

// Configuration - tune these for the right feel
const FLOW_CONFIG = {
  // Time of sustained activity before entering flow (ms)
  // 5 minutes = user is clearly focused
  ENTRY_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  
  // For testing, you can lower this:
  // ENTRY_THRESHOLD: 30 * 1000, // 30 seconds (for testing)
  
  // Minimum activity score to count toward flow (0-100)
  MIN_ACTIVITY_SCORE: 20,
  
  // How long after tab switch before exiting flow (ms)
  // Immediate exit on tab switch
  TAB_SWITCH_EXIT_DELAY: 0,
  
  // How long of inactivity before exiting flow (ms)
  INACTIVITY_EXIT_THRESHOLD: 60 * 1000, // 1 minute
  
  // Grace period when returning to tab (ms)
  // If user switches back quickly, don't reset flow timer
  TAB_RETURN_GRACE: 10 * 1000, // 10 seconds
  
  // Navigation changes that break flow
  // (switching between major sections)
  FLOW_BREAKING_ROUTES: ['/settings', '/profile', '/admin'],
};

// Flow state phases
export const FLOW_PHASES = {
  IDLE: 'idle',           // Not tracking toward flow
  BUILDING: 'building',   // Accumulating focus time
  IN_FLOW: 'in_flow',     // User is in flow state
  EXITING: 'exiting',     // About to exit flow (grace period)
};

export default function useFlowDetection({ enabled = true } = {}) {
  const location = useLocation();
  const activity = useActivityTracker();
  
  // Flow state
  const [phase, setPhase] = useState(FLOW_PHASES.IDLE);
  const [flowStartTime, setFlowStartTime] = useState(null);
  const [focusAccumulator, setFocusAccumulator] = useState(0);
  const [flowDuration, setFlowDuration] = useState(0);
  
  // Refs for timing
  const lastTabVisibleTime = useRef(Date.now());
  const flowTickRef = useRef(null);
  const lastRouteRef = useRef(location.pathname);

  // Check if current route breaks flow
  const isFlowBreakingRoute = useCallback((path) => {
    return FLOW_CONFIG.FLOW_BREAKING_ROUTES.some(route => 
      path.startsWith(route)
    );
  }, []);

  // Enter flow state
  const enterFlow = useCallback(() => {
    if (phase === FLOW_PHASES.IN_FLOW) return;
    
    console.log('🧘 Entering flow state');
    setPhase(FLOW_PHASES.IN_FLOW);
    setFlowStartTime(Date.now());
    setFlowDuration(0);
  }, [phase]);

  // Exit flow state
  const exitFlow = useCallback((reason = 'unknown') => {
    if (phase === FLOW_PHASES.IDLE) return;
    
    console.log(`🧘 Exiting flow state (reason: ${reason})`);
    setPhase(FLOW_PHASES.IDLE);
    setFlowStartTime(null);
    setFocusAccumulator(0);
    setFlowDuration(0);
  }, [phase]);

  // Manual toggle (user can force exit)
  const toggleFlow = useCallback(() => {
    if (phase === FLOW_PHASES.IN_FLOW) {
      exitFlow('manual');
    }
  }, [phase, exitFlow]);

  // Handle tab visibility changes
  useEffect(() => {
    if (!enabled) return;

    if (activity.isTabVisible) {
      // Tab became visible
      const timeSinceHidden = Date.now() - lastTabVisibleTime.current;
      
      if (phase === FLOW_PHASES.IN_FLOW && timeSinceHidden > FLOW_CONFIG.TAB_RETURN_GRACE) {
        // Been gone too long - exit flow
        exitFlow('tab_switch_long');
      } else if (phase === FLOW_PHASES.EXITING) {
        // Came back during grace period - resume
        setPhase(FLOW_PHASES.IN_FLOW);
      }
    } else {
      // Tab became hidden
      lastTabVisibleTime.current = Date.now();
      
      if (phase === FLOW_PHASES.IN_FLOW) {
        if (FLOW_CONFIG.TAB_SWITCH_EXIT_DELAY === 0) {
          // Immediate exit
          exitFlow('tab_switch');
        } else {
          // Enter grace period
          setPhase(FLOW_PHASES.EXITING);
        }
      } else if (phase === FLOW_PHASES.BUILDING) {
        // Reset accumulator on tab switch
        setFocusAccumulator(0);
        setPhase(FLOW_PHASES.IDLE);
      }
    }
  }, [activity.isTabVisible, phase, enabled, exitFlow]);

  // Handle route changes
  useEffect(() => {
    if (!enabled) return;

    const currentRoute = location.pathname;
    const previousRoute = lastRouteRef.current;
    lastRouteRef.current = currentRoute;

    // Check if navigating to a flow-breaking route
    if (isFlowBreakingRoute(currentRoute) && phase === FLOW_PHASES.IN_FLOW) {
      exitFlow('route_change');
      return;
    }

    // Major section change (e.g., /projects to /dashboard)
    const currentSection = currentRoute.split('/')[1];
    const previousSection = previousRoute.split('/')[1];
    
    if (currentSection !== previousSection && phase === FLOW_PHASES.BUILDING) {
      // Reset building progress on major navigation
      setFocusAccumulator(prev => Math.max(0, prev - 60000)); // Reduce by 1 minute
    }
  }, [location.pathname, phase, enabled, isFlowBreakingRoute, exitFlow]);

  // Main flow detection tick
  useEffect(() => {
    if (!enabled) return;

    flowTickRef.current = setInterval(() => {
      const now = Date.now();

      // If in flow, update duration
      if (phase === FLOW_PHASES.IN_FLOW && flowStartTime) {
        setFlowDuration(now - flowStartTime);
      }

      // Check for inactivity exit
      if (phase === FLOW_PHASES.IN_FLOW && activity.isIdle) {
        exitFlow('inactivity');
        return;
      }

      // Check for prolonged inactivity while building
      if (phase === FLOW_PHASES.BUILDING && activity.isIdle) {
        setFocusAccumulator(0);
        setPhase(FLOW_PHASES.IDLE);
        return;
      }

      // Building toward flow
      if (
        phase !== FLOW_PHASES.IN_FLOW &&
        activity.isEngaged &&
        activity.activityScore >= FLOW_CONFIG.MIN_ACTIVITY_SCORE
      ) {
        // Start or continue building
        if (phase !== FLOW_PHASES.BUILDING) {
          setPhase(FLOW_PHASES.BUILDING);
        }

        // Accumulate focus time
        setFocusAccumulator(prev => {
          const newValue = prev + 1000; // Add 1 second
          
          // Check if we've hit the threshold
          if (newValue >= FLOW_CONFIG.ENTRY_THRESHOLD) {
            enterFlow();
            return 0;
          }
          
          return newValue;
        });
      } else if (phase === FLOW_PHASES.BUILDING && !activity.isEngaged) {
        // Decay accumulator when not engaged
        setFocusAccumulator(prev => Math.max(0, prev - 2000)); // Decay faster than build
        
        if (focusAccumulator <= 0) {
          setPhase(FLOW_PHASES.IDLE);
        }
      }
    }, 1000);

    return () => {
      if (flowTickRef.current) {
        clearInterval(flowTickRef.current);
      }
    };
  }, [
    enabled, 
    phase, 
    activity.isEngaged, 
    activity.isIdle, 
    activity.activityScore,
    flowStartTime,
    focusAccumulator,
    enterFlow,
    exitFlow,
  ]);

  // Calculate progress toward flow (0-100)
  const flowProgress = Math.min(
    100,
    (focusAccumulator / FLOW_CONFIG.ENTRY_THRESHOLD) * 100
  );

  // Format flow duration for display
  const formatFlowDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  return {
    // State
    phase,
    isInFlow: phase === FLOW_PHASES.IN_FLOW,
    isBuilding: phase === FLOW_PHASES.BUILDING,
    
    // Progress
    flowProgress,           // 0-100, progress toward entering flow
    flowDuration,           // ms, time spent in flow
    flowDurationFormatted: formatFlowDuration(flowDuration),
    
    // Activity passthrough
    activityScore: activity.activityScore,
    isTabVisible: activity.isTabVisible,
    
    // Actions
    exitFlow,
    toggleFlow,
    
    // Config (for UI display)
    entryThreshold: FLOW_CONFIG.ENTRY_THRESHOLD,
  };
}

export { FLOW_CONFIG };
