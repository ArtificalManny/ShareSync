// src/hooks/useEntranceAnimation.js
// ═══════════════════════════════════════════════════════════════════════════════
// ENTRANCE ANIMATION ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════
// Manages the 1.5-second entrance sequence when the app loads.
// This creates the "this app knows me" feeling.
//
// Timeline:
// 0ms     → 200ms  : Glow phase (violet emanates from center)
// 200ms   → 1000ms : Ring phase (XP animates from 0)
// 400ms   → 1000ms : Welcome phase (message fades in)
// 1000ms  → 1200ms : Highlight phase (recommended task pulses)
// 1200ms  → 1500ms : Complete (everything settles)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

// Entrance phases
export const ENTRANCE_PHASES = {
  INITIAL: 'initial',      // Before anything starts
  GLOW: 'glow',            // Deep Violet glow expanding
  RING: 'ring',            // XP ring animating
  WELCOME: 'welcome',      // Welcome message fading in
  HIGHLIGHT: 'highlight',  // Recommended task pulsing
  COMPLETE: 'complete',    // Entrance finished
};

// Timing configuration (in ms)
const TIMING = {
  GLOW_START: 0,
  GLOW_DURATION: 200,
  RING_START: 200,
  RING_DURATION: 800,
  WELCOME_START: 400,
  WELCOME_DURATION: 600,
  HIGHLIGHT_START: 1000,
  HIGHLIGHT_DURATION: 200,
  COMPLETE: 1500,
};

// Session storage key to track if entrance has played this session
const SESSION_KEY = 'ss.entrance.played';

export default function useEntranceAnimation(options = {}) {
  const {
    enabled = true,
    playOnce = true,        // Only play once per session
    skipIfReturning = false, // Skip for returning users (within session)
  } = options;

  const [phase, setPhase] = useState(ENTRANCE_PHASES.INITIAL);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100 for XP ring animation
  const hasPlayedRef = useRef(false);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  // Check if we should skip the entrance
  const shouldSkip = useCallback(() => {
    if (!enabled) return true;
    
    if (playOnce && hasPlayedRef.current) return true;
    
    if (skipIfReturning) {
      try {
        const played = sessionStorage.getItem(SESSION_KEY);
        if (played === '1') return true;
      } catch (e) {
        // sessionStorage not available
      }
    }
    
    return false;
  }, [enabled, playOnce, skipIfReturning]);

  // Main animation loop
  const runAnimation = useCallback(() => {
    if (shouldSkip()) {
      setPhase(ENTRANCE_PHASES.COMPLETE);
      setIsComplete(true);
      setProgress(100);
      return;
    }

    startTimeRef.current = performance.now();
    hasPlayedRef.current = true;

    // Mark as played in session
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (e) {
      // Ignore
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;

      // Update phase based on elapsed time
      if (elapsed < TIMING.GLOW_DURATION) {
        setPhase(ENTRANCE_PHASES.GLOW);
      } else if (elapsed < TIMING.RING_START + TIMING.RING_DURATION) {
        setPhase(ENTRANCE_PHASES.RING);
        
        // Calculate ring progress (0-100)
        const ringElapsed = elapsed - TIMING.RING_START;
        const ringProgress = Math.min(100, (ringElapsed / TIMING.RING_DURATION) * 100);
        
        // Easing function for smooth animation
        const eased = easeOutCubic(ringProgress / 100) * 100;
        setProgress(eased);
      } else if (elapsed < TIMING.HIGHLIGHT_START) {
        setPhase(ENTRANCE_PHASES.WELCOME);
        setProgress(100);
      } else if (elapsed < TIMING.COMPLETE) {
        setPhase(ENTRANCE_PHASES.HIGHLIGHT);
      } else {
        setPhase(ENTRANCE_PHASES.COMPLETE);
        setIsComplete(true);
        return; // Stop animation loop
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [shouldSkip]);

  // Start animation on mount
  useEffect(() => {
    runAnimation();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [runAnimation]);

  // Replay function (for testing)
  const replay = useCallback(() => {
    setPhase(ENTRANCE_PHASES.INITIAL);
    setIsComplete(false);
    setProgress(0);
    hasPlayedRef.current = false;
    
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // Ignore
    }

    // Small delay then restart
    setTimeout(runAnimation, 50);
  }, [runAnimation]);

  // Skip to end (for impatient users)
  const skip = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setPhase(ENTRANCE_PHASES.COMPLETE);
    setIsComplete(true);
    setProgress(100);
  }, []);

  return {
    phase,
    isComplete,
    progress,        // 0-100 for XP ring
    replay,
    skip,
    
    // Convenience booleans
    isGlowing: phase === ENTRANCE_PHASES.GLOW,
    isAnimatingRing: phase === ENTRANCE_PHASES.RING,
    isShowingWelcome: phase === ENTRANCE_PHASES.WELCOME || phase === ENTRANCE_PHASES.HIGHLIGHT,
    isHighlighting: phase === ENTRANCE_PHASES.HIGHLIGHT,
    
    // Phase checks
    isPhase: (p) => phase === p,
    isPastPhase: (p) => {
      const order = Object.values(ENTRANCE_PHASES);
      return order.indexOf(phase) > order.indexOf(p);
    },
  };
}

// Easing function for smooth ring animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Export timing for components that need it
export { TIMING as ENTRANCE_TIMING };
