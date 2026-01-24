// src/components/momentum/MomentumEngine.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Core Orchestrator
// ═══════════════════════════════════════════════════════════════════════════════
//
// This component orchestrates all momentum responses across the app.
// It sets CSS variables, manages body attributes, and coordinates celebrations.
//
// Place this high in your component tree (e.g., in App.jsx) to enable
// the full Momentum Engine experience.
//
// FEATURES:
// - Sets body[data-momentum] attribute
// - Updates CSS custom properties
// - Manages smooth level transitions
// - Triggers celebrations
// - Coordinates fire mode
// - Heartbeat system (30-second breathing)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback, useRef } from 'react';
import { useMomentumEngine } from '../../hooks/useMomentumEngine';
import MomentumMessage from './MomentumMessage';
import FireModeBadge from './FireModeBadge';
import { getMomentumScore } from '../../contexts/MomentumContext';

/**
 * Heartbeat interval (ms) - how often to update momentum visuals
 */
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * CSS variables to set on :root based on momentum
 */
const CSS_VARIABLES = {
  // Level and score
  '--momentum-level': (level) => level,
  '--momentum-score': (_, score) => score,
  '--momentum-progress': (_, __, progress) => progress,
  
  // Animation timing (slower at low momentum, faster at high)
  '--momentum-animation-speed': (level) => {
    const speeds = [1.5, 1.3, 1.1, 0.9, 0.8, 0.7];
    return speeds[level] || 1;
  },
  
  // Glow intensity
  '--momentum-glow-intensity': (level) => {
    const intensities = [0, 0.1, 0.2, 0.35, 0.5, 0.7];
    return intensities[level] || 0;
  },
  
  // Background warmth
  '--momentum-warmth': (level) => {
    const warmths = [0, 0.02, 0.04, 0.06, 0.08, 0.12];
    return warmths[level] || 0;
  },
  
  // Hover responsiveness
  '--momentum-hover-lift': (level) => {
    const lifts = ['2px', '3px', '4px', '5px', '6px', '8px'];
    return lifts[level] || '2px';
  },
  
  // Fire mode
  '--momentum-fire': (_, __, ___, isFireMode) => isFireMode ? 1 : 0,
};

/**
 * Level names for body attribute
 */
const LEVEL_NAMES = ['idle', 'warming', 'building', 'flowing', 'peak', 'fire'];

/**
 * MomentumEngine - Core orchestration component
 */
export default function MomentumEngine({ 
  children,
  enableHeartbeat = true,
  enableMessages = true,
  enableFireBadge = true,
  enableCelebrations = true,
  debug = false,
}) {
  const engine = useMomentumEngine({
    enableCelebrations,
    enableTransitions: true,
    enableHistory: true,
  });

  const {
    score,
    level,
    levelMeta,
    levelProgress,
    isFireMode,
    fireModeJustActivated,
    isTransitioning,
    message,
    celebration,
    dismissCelebration,
    enabled,
  } = engine;

  const heartbeatRef = useRef(null);
  const prevLevelRef = useRef(level);

  // Update CSS custom properties
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    
    Object.entries(CSS_VARIABLES).forEach(([variable, getValue]) => {
      const value = getValue(level, score, levelProgress, isFireMode);
      root.style.setProperty(variable, String(value));
    });
  }, [level, score, levelProgress, isFireMode, enabled]);

  // Update body attributes
  useEffect(() => {
    if (!enabled) return;

    const body = document.body;
    
    // Set momentum level
    body.setAttribute('data-momentum', String(level));
    body.setAttribute('data-momentum-name', LEVEL_NAMES[level] || 'idle');
    body.setAttribute('data-momentum-score', String(score));
    
    // Set fire mode
    if (isFireMode) {
      body.setAttribute('data-momentum-fire', 'true');
    } else {
      body.removeAttribute('data-momentum-fire');
    }
    
    // Set trend
    body.setAttribute('data-momentum-trend', engine.trend);
    
    // Debug mode
    if (debug) {
      body.setAttribute('data-momentum-debug', 'true');
    }
    
    // Transition class
    if (isTransitioning) {
      body.classList.add('momentum-transitioning');
    }

    return () => {
      body.classList.remove('momentum-transitioning');
    };
  }, [level, score, isFireMode, isTransitioning, engine.trend, debug, enabled]);

  // Level change effects
  useEffect(() => {
    if (level !== prevLevelRef.current) {
      const body = document.body;
      
      // Add level-change class for transition animations
      body.classList.add('momentum-level-change');
      
      // Level direction
      if (level > prevLevelRef.current) {
        body.classList.add('momentum-level-up');
        body.classList.remove('momentum-level-down');
      } else {
        body.classList.add('momentum-level-down');
        body.classList.remove('momentum-level-up');
      }

      // Remove classes after animation
      const timer = setTimeout(() => {
        body.classList.remove('momentum-level-change', 'momentum-level-up', 'momentum-level-down');
      }, 2000);

      prevLevelRef.current = level;
      
      return () => clearTimeout(timer);
    }
  }, [level]);

  // Heartbeat system
  useEffect(() => {
    if (!enableHeartbeat || !enabled) return;

    const heartbeat = () => {
      const currentScore = getMomentumScore();
      const currentLevel = Math.floor(currentScore / 20);
      
      // Update body attribute (in case it drifted)
      document.body.setAttribute('data-momentum', String(Math.min(currentLevel, 5)));
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('momentum-heartbeat', {
        detail: { score: currentScore, level: currentLevel }
      }));
    };

    // Initial heartbeat
    heartbeat();
    
    // Set up interval
    heartbeatRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [enableHeartbeat, enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const body = document.body;
      body.removeAttribute('data-momentum');
      body.removeAttribute('data-momentum-name');
      body.removeAttribute('data-momentum-score');
      body.removeAttribute('data-momentum-fire');
      body.removeAttribute('data-momentum-trend');
      body.removeAttribute('data-momentum-debug');
      body.classList.remove(
        'momentum-transitioning',
        'momentum-level-change',
        'momentum-level-up',
        'momentum-level-down'
      );
    };
  }, []);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Momentum message overlay */}
      {enableMessages && celebration && (
        <MomentumMessage
          type={celebration.type}
          message={celebration.message}
          subMessage={celebration.subMessage}
          onDismiss={dismissCelebration}
        />
      )}
      
      {/* Fire mode badge */}
      {enableFireBadge && isFireMode && (
        <FireModeBadge 
          justActivated={fireModeJustActivated}
          score={score}
        />
      )}
      
      {/* Debug overlay */}
      {debug && (
        <MomentumDebugOverlay
          score={score}
          level={level}
          levelMeta={levelMeta}
          isFireMode={isFireMode}
          trend={engine.trend}
          message={message}
        />
      )}
    </>
  );
}

/**
 * Debug overlay component
 */
function MomentumDebugOverlay({ score, level, levelMeta, isFireMode, trend, message }) {
  return (
    <div className="
      fixed bottom-4 left-4 z-[9999]
      p-4 rounded-xl
      bg-surface-1/95 backdrop-blur-sm
      border border-white/10
      text-xs font-mono
      shadow-lg
    ">
      <div className="text-text-tertiary mb-2 uppercase tracking-wider text-[10px]">
        Momentum Engine
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">Score:</span>
          <span className="text-text-primary font-semibold">{score}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">Level:</span>
          <span className="text-text-primary">{level} ({levelMeta.name})</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">Fire:</span>
          <span className={isFireMode ? 'text-energy' : 'text-text-tertiary'}>
            {isFireMode ? '🔥 YES' : 'No'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">Trend:</span>
          <span className={`
            ${trend === 'rising' ? 'text-success' : ''}
            ${trend === 'falling' ? 'text-warning' : ''}
            ${trend === 'stable' ? 'text-text-secondary' : ''}
          `}>
            {trend === 'rising' && '↑'} 
            {trend === 'falling' && '↓'} 
            {trend === 'stable' && '→'} 
            {trend}
          </span>
        </div>
        <div className="pt-2 mt-2 border-t border-white/10 text-text-secondary">
          "{message}"
        </div>
      </div>
    </div>
  );
}

/**
 * Provider wrapper for convenience
 */
export function MomentumEngineProvider({ children, ...props }) {
  return (
    <MomentumEngine {...props}>
      {children}
    </MomentumEngine>
  );
}
