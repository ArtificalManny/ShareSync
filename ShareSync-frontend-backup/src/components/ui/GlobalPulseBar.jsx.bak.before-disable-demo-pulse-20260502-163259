// src/components/ui/GlobalPulseBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Global Pulse Bar - Blinks when anyone ships (FIXED for Vite)
// + useGlobalPulse hook for triggering from other components
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import './GlobalPulseBar.css';

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL PULSE CONTEXT - Allows any component to trigger a pulse
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalPulseContext = createContext(null);

/**
 * Hook to trigger global pulse events from any component
 * @returns {{ triggerPulse: Function, isAnimating: boolean }}
 */
export function useGlobalPulse() {
  const context = useContext(GlobalPulseContext);
  
  // If used outside provider, return a no-op function
  if (!context) {
    return {
      triggerPulse: (event) => {
        // Fallback: use window event
        if (typeof window !== 'undefined' && window.triggerGlobalPulse) {
          window.triggerGlobalPulse(event);
        } else {
          console.warn('[GlobalPulse] No provider found, pulse not triggered');
        }
      },
      isAnimating: false,
      lastPulse: null,
    };
  }
  
  return context;
}

/**
 * Provider component that wraps the app and provides pulse functionality
 */
export function GlobalPulseProvider({ children }) {
  const [pulse, setPulse] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerPulse = useCallback((event) => {
    setPulse(event);
    setIsAnimating(true);

    // Reset after animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);

    // Clear pulse data after fade
    setTimeout(() => {
      setPulse(null);
    }, 3000);
  }, []);

  // Expose trigger function globally for testing/external use
  useEffect(() => {
    window.triggerGlobalPulse = triggerPulse;
    return () => { delete window.triggerGlobalPulse; };
  }, [triggerPulse]);

  const value = {
    triggerPulse,
    isAnimating,
    lastPulse: pulse,
  };

  return (
    <GlobalPulseContext.Provider value={value}>
      {children}
    </GlobalPulseContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL PULSE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GlobalPulseBar() {
  const [pulse, setPulse] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerPulse = useCallback((event) => {
    setPulse(event);
    setIsAnimating(true);

    // Reset after animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);

    // Clear pulse data after fade
    setTimeout(() => {
      setPulse(null);
    }, 3000);
  }, []);

  // Expose trigger function globally for testing
  useEffect(() => {
    window.triggerGlobalPulse = triggerPulse;
    return () => { delete window.triggerGlobalPulse; };
  }, [triggerPulse]);

  // Listen for ship events
  useEffect(() => {
    const handleShipEvent = (event) => {
      const { user, project, action } = event.detail || {};
      if (user && project) {
        triggerPulse({
          user: user.name || user,
          action: action || 'shipped',
          target: project.name || project,
        });
      }
    };

    window.addEventListener('team-ship', handleShipEvent);
    window.addEventListener('global-pulse', handleShipEvent);
    
    return () => {
      window.removeEventListener('team-ship', handleShipEvent);
      window.removeEventListener('global-pulse', handleShipEvent);
    };
  }, [triggerPulse]);

  // Demo: Random pulse every 30-60 seconds (remove in production)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) { // 15% chance
        triggerPulse({
          user: 'Sarah',
          action: 'shipped',
          target: 'API v2 endpoint',
        });
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [triggerPulse]);

  return (
    <div className="global-pulse-bar">
      {/* Base line */}
      <div className="global-pulse-base" />

      {/* Pulse animation */}
      <div className={`global-pulse-animation ${isAnimating ? 'active' : ''}`}>
        {/* Glow effect */}
        <div className={`global-pulse-glow ${isAnimating ? 'animate' : ''}`} />

        {/* Ripple from center */}
        <div className={`global-pulse-ripple ${isAnimating ? 'animate' : ''}`} />
      </div>

      {/* Toast notification (optional) */}
      {pulse && isAnimating && (
        <div className="global-pulse-toast">
          <div className="global-pulse-toast-content">
            <div className="global-pulse-dot" />
            <span className="global-pulse-text">
              <span className="global-pulse-user">{pulse.user}</span>
              {' '}{pulse.action}{' '}
              <span className="global-pulse-target">{pulse.target}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
