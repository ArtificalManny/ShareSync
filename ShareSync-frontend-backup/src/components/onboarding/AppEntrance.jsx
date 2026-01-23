// src/components/onboarding/AppEntrance.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// APP ENTRANCE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════
// Makes the first 5 seconds unforgettable.
//
// Timeline (1.5 seconds total):
// 0ms     → 200ms  : Deep Violet glow emanates from center
// 200ms   → 1000ms : XP ring animates from 0 to current value
// 400ms   → 1000ms : Welcome message fades in
// 1000ms  → 1200ms : Recommended task pulses once
// 1200ms  → 1500ms : Everything settles
//
// User feels: "This app knows me."
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect } from 'react';
import useEntranceAnimation, { ENTRANCE_PHASES } from '../../hooks/useEntranceAnimation';
import EntranceGlow from './EntranceGlow';
import { WelcomeToast } from './WelcomeMessage';

// Context for entrance state (so Sidebar/other components can react)
const EntranceContext = createContext(null);

export const useEntrance = () => {
  const context = useContext(EntranceContext);
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      phase: ENTRANCE_PHASES.COMPLETE,
      isComplete: true,
      progress: 100,
      isAnimatingRing: false,
      isShowingWelcome: false,
      isHighlighting: false,
    };
  }
  return context;
};

export default function AppEntrance({
  children,
  userName = 'there',
  streakDays = 0,
  enabled = true,
  showWelcomeToast = true,
}) {
  const entrance = useEntranceAnimation({ enabled });
  
  const {
    phase,
    isComplete,
    progress,
    isGlowing,
    isShowingWelcome,
    isHighlighting,
  } = entrance;

  // Add entrance class to body during animation
  useEffect(() => {
    if (!isComplete) {
      document.body.classList.add('app-entrance-active');
      document.body.setAttribute('data-entrance-phase', phase);
    } else {
      document.body.classList.remove('app-entrance-active');
      document.body.removeAttribute('data-entrance-phase');
    }

    return () => {
      document.body.classList.remove('app-entrance-active');
      document.body.removeAttribute('data-entrance-phase');
    };
  }, [isComplete, phase]);

  // Dispatch custom event when highlighting phase starts
  // (so other components can react, like the recommended task)
  useEffect(() => {
    if (isHighlighting) {
      window.dispatchEvent(new CustomEvent('entrance:highlight', {
        detail: { phase: 'highlight' }
      }));
    }
  }, [isHighlighting]);

  return (
    <EntranceContext.Provider value={entrance}>
      {/* The glow layer */}
      <EntranceGlow 
        isActive={isGlowing}
        duration={0.8}
        color="brand"
        intensity="normal"
      />

      {/* Welcome toast */}
      {showWelcomeToast && (
        <WelcomeToast
          isVisible={isShowingWelcome && !isComplete}
          userName={userName}
          streakDays={streakDays}
          onDismiss={() => {}} // Auto-dismisses with animation
        />
      )}

      {/* Main content */}
      {children}
    </EntranceContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRANCE-AWARE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wrapper that applies highlight pulse to its children during entrance
 * Use this on the "Recommended for Today" section
 */
export function EntranceHighlight({ 
  children, 
  className = '',
  pulseColor = 'brand', 
}) {
  const { isHighlighting } = useEntrance();

  const pulseClasses = {
    brand: 'ring-brand-500/30',
    cyan: 'ring-cyan-500/30',
    success: 'ring-success-500/30',
  };

  return (
    <div 
      className={`
        transition-all duration-300
        ${isHighlighting ? `ring-2 ${pulseClasses[pulseColor]} animate-pulse-once` : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Animated XP ring that responds to entrance animation
 * This wraps your existing ProgressRing component
 */
export function EntranceProgressRing({ 
  children, 
  actualProgress = 75,
  ...props 
}) {
  const { isAnimatingRing, progress, isComplete } = useEntrance();

  // During entrance, use animated progress. After, use actual.
  const displayProgress = isComplete ? actualProgress : (progress / 100) * actualProgress;

  return React.cloneElement(children, {
    ...props,
    progress: displayProgress / 100, // Convert to 0-1 range
    isAnimating: isAnimatingRing,
  });
}

/**
 * Hook for components to listen to entrance highlight event
 */
export function useEntranceHighlight(callback) {
  useEffect(() => {
    const handler = (event) => {
      if (callback) callback(event.detail);
    };

    window.addEventListener('entrance:highlight', handler);
    return () => window.removeEventListener('entrance:highlight', handler);
  }, [callback]);
}
