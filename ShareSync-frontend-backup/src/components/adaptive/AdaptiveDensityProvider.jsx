// src/components/adaptive/AdaptiveDensityProvider.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Adaptive Density Provider
// Provides adaptive UI density context to the entire app
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useAdaptiveDensity, useAdaptiveClasses, DENSITY_MODES } from '../../hooks/useAdaptiveDensity';
import { useMomentumContext } from '../../contexts/MomentumContext';
import { useFlowState } from '../../contexts/FlowStateContext';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const AdaptiveDensityContext = createContext(null);

/**
 * Hook to access adaptive density context
 */
export function useAdaptive() {
  const context = useContext(AdaptiveDensityContext);
  if (!context) {
    // Return sensible defaults if used outside provider
    return {
      density: DENSITY_MODES.BALANCED,
      config: {
        cardPadding: 'p-4',
        cardGap: 'gap-4',
        fontSize: 'text-sm',
        headerSize: 'text-lg',
        gridCols: 'lg:grid-cols-3',
        sidebarWidth: 'w-[260px]',
        showSecondaryInfo: true,
        animationSpeed: 'duration-300',
        breathingIntensity: 0.5,
        showMotivationalMessages: true,
        reducedNotifications: false,
        contentDensity: 0.8,
      },
      classes: {},
      setDensity: () => {},
      resetToAuto: () => {},
    };
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AdaptiveDensityProvider - Wraps app with adaptive density context
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} props.userName - User's name for greetings
 * @param {boolean} props.enabled - Whether adaptive density is enabled
 */
export function AdaptiveDensityProvider({ 
  children, 
  userName = 'there',
  enabled = true,
}) {
  // Get momentum and flow state
  const momentum = useMomentumContext?.() || { glowLevel: 0, isFireMode: false };
  const flowState = useFlowState?.() || { isInFlow: false };
  
  // Initialize adaptive density hook
  const adaptiveDensity = useAdaptiveDensity({
    isInFocus: flowState.isInFlow,
    momentumLevel: momentum.glowLevel,
    userName,
  });
  
  // Get CSS classes for current density
  const classes = useAdaptiveClasses(adaptiveDensity.config);
  
  // Apply density CSS variables to document
  useEffect(() => {
    if (!enabled) return;
    
    const { config } = adaptiveDensity;
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty('--density-padding', config.cardPadding.replace('p-', ''));
    root.style.setProperty('--density-gap', config.cardGap.replace('gap-', ''));
    root.style.setProperty('--density-animation', config.animationSpeed.replace('duration-', ''));
    root.style.setProperty('--density-breathing', config.breathingIntensity.toString());
    root.style.setProperty('--density-content', config.contentDensity.toString());
    
    // Add density class to body
    document.body.dataset.density = adaptiveDensity.density;
    
    return () => {
      root.style.removeProperty('--density-padding');
      root.style.removeProperty('--density-gap');
      root.style.removeProperty('--density-animation');
      root.style.removeProperty('--density-breathing');
      root.style.removeProperty('--density-content');
      delete document.body.dataset.density;
    };
  }, [enabled, adaptiveDensity.density, adaptiveDensity.config]);
  
  // Memoize context value
  const value = useMemo(() => ({
    ...adaptiveDensity,
    classes,
    enabled,
  }), [adaptiveDensity, classes, enabled]);
  
  return (
    <AdaptiveDensityContext.Provider value={value}>
      {children}
    </AdaptiveDensityContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DENSITY INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DensityIndicator - Shows current density mode with option to change
 */
export function DensityIndicator({ showLabel = true, className = '' }) {
  const { density, config, timePeriod, energyLevel, setDensity, resetToAuto, isManualOverride, availableModes } = useAdaptive();
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef(null);
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);
  
  const modeIcons = {
    [DENSITY_MODES.SPACIOUS]: '🌅',
    [DENSITY_MODES.BALANCED]: '⚖️',
    [DENSITY_MODES.COMPACT]: '📊',
    [DENSITY_MODES.MINIMAL]: '🌙',
    [DENSITY_MODES.FOCUS]: '🎯',
  };
  
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 transition-all duration-200
          ${isManualOverride ? 'border-brand-500/30' : ''}
        `}
        title={`Density: ${config.name}`}
      >
        <span className="text-sm">{modeIcons[density]}</span>
        {showLabel && (
          <span className="text-xs text-text-secondary">{config.name}</span>
        )}
        {isManualOverride && (
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        )}
      </button>
      
      {showMenu && (
        <div className="
          absolute top-full right-0 mt-2 w-56
          bg-surface-1 border border-white/[0.08] rounded-xl
          shadow-xl z-50 overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-xs font-medium text-text-secondary">UI Density</div>
            <div className="text-[10px] text-text-tertiary mt-1">
              {timePeriod} · {energyLevel}
            </div>
          </div>
          
          <div className="p-2">
            {Object.entries(availableModes).map(([key, mode]) => (
              <button
                key={mode}
                onClick={() => {
                  setDensity(mode);
                  setShowMenu(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-all duration-150
                  ${density === mode 
                    ? 'bg-brand-500/10 text-brand-400' 
                    : 'hover:bg-surface-2 text-text-secondary'
                  }
                `}
              >
                <span>{modeIcons[mode]}</span>
                <span className="text-sm flex-1 text-left">{key}</span>
                {density === mode && (
                  <span className="text-xs text-brand-400">Active</span>
                )}
              </button>
            ))}
          </div>
          
          {isManualOverride && (
            <div className="p-2 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  resetToAuto();
                  setShowMenu(false);
                }}
                className="
                  w-full flex items-center justify-center gap-2 px-3 py-2
                  text-xs text-text-tertiary hover:text-text-secondary
                  transition-colors
                "
              >
                <span>↻</span>
                <span>Reset to Auto</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTIVE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AdaptiveCard - Card that responds to current density
 */
export function AdaptiveCard({ 
  children, 
  className = '', 
  breathe = false,
  ...props 
}) {
  const { config, classes } = useAdaptive();
  const { glowLevel } = useMomentumContext?.() || { glowLevel: 0 };
  
  const breathingStyle = breathe && glowLevel >= 3 ? {
    animation: `breathe ${3 - glowLevel * 0.3}s ease-in-out infinite`,
  } : {};
  
  return (
    <div
      className={`
        ${classes.card}
        transition-all ${config.animationSpeed}
        ${className}
      `}
      style={breathingStyle}
      {...props}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTIVE GRID COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AdaptiveGrid - Grid that responds to current density
 */
export function AdaptiveGrid({ 
  children, 
  className = '',
  ...props 
}) {
  const { classes, config } = useAdaptive();
  
  return (
    <div
      className={`
        ${classes.grid}
        transition-all ${config.animationSpeed}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTIVE TEXT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AdaptiveText - Text that responds to current density
 */
export function AdaptiveText({ 
  children, 
  variant = 'body', 
  className = '',
  as: Component = 'span',
  ...props 
}) {
  const { config } = useAdaptive();
  
  const sizeClass = variant === 'header' ? config.headerSize : config.fontSize;
  
  return (
    <Component
      className={`${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default AdaptiveDensityProvider;
