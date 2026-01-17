// src/hooks/useActivityTracker.js
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW STATE - Activity Tracker
// ═══════════════════════════════════════════════════════════════════════════════
// Monitors user activity to detect flow state:
// - Keyboard activity (typing)
// - Mouse activity (clicks, movement, scrolling)
// - Tab visibility (focus/blur)
// - Idle detection
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

// Configuration
const CONFIG = {
  // How often to check activity status (ms)
  TICK_INTERVAL: 1000,
  
  // Activity within this window counts as "active" (ms)
  ACTIVITY_WINDOW: 5000,
  
  // No activity for this long = idle (ms)
  IDLE_THRESHOLD: 30000,
  
  // Debounce rapid events (ms)
  EVENT_DEBOUNCE: 100,
};

export default function useActivityTracker() {
  // Activity state
  const [isActive, setIsActive] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [activityScore, setActivityScore] = useState(0); // 0-100
  
  // Refs for tracking
  const lastEventTimeRef = useRef(Date.now());
  const activityCountRef = useRef(0);
  const tickIntervalRef = useRef(null);

  // Record activity event
  const recordActivity = useCallback(() => {
    const now = Date.now();
    
    // Debounce rapid events
    if (now - lastEventTimeRef.current < CONFIG.EVENT_DEBOUNCE) {
      return;
    }
    
    lastEventTimeRef.current = now;
    activityCountRef.current += 1;
    setLastActivityTime(now);
    setIsIdle(false);
    setIsActive(true);
  }, []);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const visible = !document.hidden;
    setIsTabVisible(visible);
    
    if (visible) {
      // Tab became visible - record as activity
      recordActivity();
    }
  }, [recordActivity]);

  // Handle window focus/blur
  const handleWindowFocus = useCallback(() => {
    recordActivity();
  }, [recordActivity]);

  const handleWindowBlur = useCallback(() => {
    // Don't immediately mark as inactive - user might just be
    // clicking outside briefly
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Activity events
    const activityEvents = [
      'keydown',
      'mousedown',
      'mousemove',
      'scroll',
      'touchstart',
      'wheel',
    ];

    // Throttled handler for high-frequency events
    let moveTimeout = null;
    const handleMouseMove = () => {
      if (moveTimeout) return;
      moveTimeout = setTimeout(() => {
        recordActivity();
        moveTimeout = null;
      }, 500); // Only count mouse movement every 500ms
    };

    // Add listeners
    activityEvents.forEach(event => {
      if (event === 'mousemove') {
        window.addEventListener(event, handleMouseMove, { passive: true });
      } else {
        window.addEventListener(event, recordActivity, { passive: true });
      }
    });

    // Visibility API
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        if (event === 'mousemove') {
          window.removeEventListener(event, handleMouseMove);
        } else {
          window.removeEventListener(event, recordActivity);
        }
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      if (moveTimeout) clearTimeout(moveTimeout);
    };
  }, [recordActivity, handleVisibilityChange, handleWindowFocus, handleWindowBlur]);

  // Activity tick - runs every second to update state
  useEffect(() => {
    tickIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastEventTimeRef.current;
      
      // Check if user is idle
      if (timeSinceLastActivity > CONFIG.IDLE_THRESHOLD) {
        setIsIdle(true);
        setIsActive(false);
        setActivityScore(0);
      } else if (timeSinceLastActivity > CONFIG.ACTIVITY_WINDOW) {
        // Not idle, but not actively doing things
        setIsActive(false);
        // Decay the activity score
        setActivityScore(prev => Math.max(0, prev - 5));
      } else {
        // Active
        setIsActive(true);
        // Increase activity score based on recent activity count
        const recentActivity = activityCountRef.current;
        activityCountRef.current = 0; // Reset counter
        
        // Score increases with activity, caps at 100
        setActivityScore(prev => Math.min(100, prev + (recentActivity * 10)));
      }
    }, CONFIG.TICK_INTERVAL);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  return {
    // Current state
    isActive,           // User has done something recently
    isTabVisible,       // Tab is visible (not switched away)
    isIdle,             // User hasn't done anything for IDLE_THRESHOLD
    lastActivityTime,   // Timestamp of last activity
    activityScore,      // 0-100 score of recent activity level
    
    // Derived state
    isEngaged: isActive && isTabVisible && !isIdle,
    
    // Manual trigger (for custom events)
    recordActivity,
  };
}
