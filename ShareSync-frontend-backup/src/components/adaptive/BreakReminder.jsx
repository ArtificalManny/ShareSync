// src/components/adaptive/BreakReminder.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Break Reminder Component
// Gently reminds users to take breaks based on fatigue detection
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { X, Coffee, Footprints, Eye, Wind, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useFatigueDetection, FATIGUE_LEVELS, BREAK_TYPES } from '../../hooks/useFatigueDetection';

// ═══════════════════════════════════════════════════════════════════════════════
// BREAK ICONS MAP
// ═══════════════════════════════════════════════════════════════════════════════

const BREAK_ICONS = {
  '👁️': Eye,
  '🧘': Sparkles,
  '🌬️': Wind,
  '✨': Sparkles,
  '💧': Coffee,
  '🚶': Footprints,
  '🤸': Sparkles,
  '🌳': Sparkles,
  '☕': Coffee,
  '🍎': Coffee,
  '🏃': Footprints,
  '🧘‍♀️': Sparkles,
  '🍽️': Coffee,
  '💪': Sparkles,
  '😴': Clock,
  '👋': Sparkles,
};

// ═══════════════════════════════════════════════════════════════════════════════
// BREAK REMINDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BreakReminder - Displays break suggestions based on fatigue
 */
export function BreakReminder({
  className = '',
  position = 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'center'
  onBreakStart,
  onBreakEnd,
  onDismiss,
}) {
  const {
    fatigueLevel,
    showBreakReminder,
    currentRecommendation,
    message,
    isFatigued,
    needsBreak,
    timeSinceBreak,
    sessionDuration,
    startBreak,
    endBreak,
    dismissReminder,
    FATIGUE_LEVELS: levels,
    BREAK_TYPES: types,
    BREAK_RECOMMENDATIONS,
  } = useFatigueDetection({ enabled: true });
  
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [selectedBreak, setSelectedBreak] = useState(null);
  
  // Show reminder when fatigue detected
  useEffect(() => {
    if (showBreakReminder && currentRecommendation) {
      setIsVisible(true);
      setSelectedBreak(currentRecommendation);
    }
  }, [showBreakReminder, currentRecommendation]);
  
  // Break timer
  useEffect(() => {
    if (!isOnBreak) return;
    
    const interval = setInterval(() => {
      setBreakTimer(prev => {
        if (prev <= 1) {
          handleBreakComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOnBreak]);
  
  // Handle starting a break
  const handleStartBreak = useCallback((breakOption = null) => {
    const breakToStart = breakOption || selectedBreak;
    if (!breakToStart) return;
    
    setSelectedBreak(breakToStart);
    setBreakTimer(breakToStart.duration);
    setIsOnBreak(true);
    setIsExpanded(false);
    
    startBreak(breakToStart.type);
    onBreakStart?.(breakToStart);
  }, [selectedBreak, startBreak, onBreakStart]);
  
  // Handle break completion
  const handleBreakComplete = useCallback(() => {
    setIsOnBreak(false);
    setBreakTimer(0);
    setIsVisible(false);
    setSelectedBreak(null);
    
    endBreak();
    onBreakEnd?.(selectedBreak);
  }, [selectedBreak, endBreak, onBreakEnd]);
  
  // Handle dismiss
  const handleDismiss = useCallback((snoozeMinutes = 10) => {
    setIsVisible(false);
    setIsExpanded(false);
    
    dismissReminder(snoozeMinutes);
    onDismiss?.(snoozeMinutes);
  }, [dismissReminder, onDismiss]);
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-20 right-6',
    'bottom-left': 'fixed bottom-20 left-6',
    'top-right': 'fixed top-20 right-6',
    'center': 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };
  
  // Fatigue level colors
  const fatigueColors = {
    [FATIGUE_LEVELS.FRESH]: 'bg-success-500/10 border-success-500/30 text-success-500',
    [FATIGUE_LEVELS.ENGAGED]: 'bg-brand-500/10 border-brand-500/30 text-brand-400',
    [FATIGUE_LEVELS.SUSTAINING]: 'bg-warning-500/10 border-warning-500/30 text-warning-500',
    [FATIGUE_LEVELS.TIRED]: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    [FATIGUE_LEVELS.FATIGUED]: 'bg-error-500/10 border-error-500/30 text-error-400',
    [FATIGUE_LEVELS.EXHAUSTED]: 'bg-error-500/20 border-error-500/50 text-error-500',
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`
      ${positionClasses[position]}
      z-50
      ${className}
    `}>
      {/* Main Card */}
      <div className={`
        w-80 rounded-2xl overflow-hidden
        bg-surface-1 border border-white/[0.08]
        shadow-2xl
        animate-in fade-in slide-in-from-bottom-4 duration-300
        ${needsBreak ? 'ring-2 ring-error-500/30' : ''}
      `}>
        {/* Header */}
        <div className={`
          px-4 py-3 flex items-center justify-between
          ${fatigueColors[fatigueLevel]}
          border-b border-white/[0.06]
        `}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-sm font-medium">
              {isOnBreak ? 'On Break' : 'Break Time?'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">
              {Math.floor(timeSinceBreak)} min
            </span>
            {!isOnBreak && (
              <button
                onClick={() => handleDismiss(10)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {isOnBreak ? (
            // Break in progress
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-text-primary mb-2">
                {formatTime(breakTimer)}
              </div>
              <p className="text-sm text-text-secondary mb-4">
                {selectedBreak?.description}
              </p>
              <button
                onClick={handleBreakComplete}
                className="
                  px-4 py-2 rounded-lg
                  bg-brand-500 text-white
                  hover:bg-brand-400 transition-colors
                "
              >
                I'm Back!
              </button>
            </div>
          ) : (
            // Break suggestion
            <>
              <p className="text-sm text-text-secondary mb-4">
                {message}
              </p>
              
              {selectedBreak && (
                <div className="
                  p-3 rounded-xl bg-surface-2 border border-white/[0.06]
                  mb-4
                ">
                  <div className="flex items-center gap-3">
                    <div className="
                      w-10 h-10 rounded-lg bg-brand-500/10
                      flex items-center justify-center
                    ">
                      <span className="text-xl">{selectedBreak.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {selectedBreak.title}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {Math.floor(selectedBreak.duration / 60)} min · {selectedBreak.type}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartBreak()}
                  className="
                    flex-1 py-2.5 rounded-lg
                    bg-brand-500 text-white font-medium
                    hover:bg-brand-400 transition-colors
                  "
                >
                  Start Break
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="
                    px-3 py-2.5 rounded-lg
                    bg-surface-2 text-text-secondary
                    hover:bg-surface-3 transition-colors
                  "
                >
                  <ChevronRight className={`
                    w-4 h-4 transition-transform duration-200
                    ${isExpanded ? 'rotate-90' : ''}
                  `} />
                </button>
              </div>
              
              {/* Expanded options */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                    Other break options
                  </div>
                  {Object.entries(BREAK_RECOMMENDATIONS).map(([type, options]) => (
                    <div key={type}>
                      {options.slice(0, 2).map((option, idx) => (
                        <button
                          key={`${type}-${idx}`}
                          onClick={() => handleStartBreak({ ...option, type })}
                          className="
                            w-full flex items-center gap-3 p-2 rounded-lg
                            hover:bg-surface-2 transition-colors
                            text-left
                          "
                        >
                          <span className="text-lg">{option.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-text-secondary truncate">
                              {option.title}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {Math.floor(option.duration / 60)} min
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )).slice(0, 3)}
                </div>
              )}
              
              {/* Snooze option */}
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-center">
                <button
                  onClick={() => handleDismiss(15)}
                  className="
                    text-xs text-text-tertiary
                    hover:text-text-secondary transition-colors
                  "
                >
                  Remind me in 15 minutes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI BREAK INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniBreakIndicator - Small indicator showing fatigue status
 */
export function MiniBreakIndicator({ className = '' }) {
  const { fatigueLevel, timeSinceBreak, isFatigued, needsBreak } = useFatigueDetection({ enabled: true });
  const [showTooltip, setShowTooltip] = useState(false);
  
  const statusColors = {
    [FATIGUE_LEVELS.FRESH]: 'bg-success-500',
    [FATIGUE_LEVELS.ENGAGED]: 'bg-brand-500',
    [FATIGUE_LEVELS.SUSTAINING]: 'bg-warning-500',
    [FATIGUE_LEVELS.TIRED]: 'bg-orange-500',
    [FATIGUE_LEVELS.FATIGUED]: 'bg-error-500',
    [FATIGUE_LEVELS.EXHAUSTED]: 'bg-error-500 animate-pulse',
  };
  
  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`
        w-2 h-2 rounded-full
        ${statusColors[fatigueLevel]}
        ${needsBreak ? 'ring-2 ring-error-500/30' : ''}
      `} />
      
      {showTooltip && (
        <div className="
          absolute bottom-full mb-2 left-1/2 -translate-x-1/2
          px-2 py-1 rounded bg-surface-1 border border-white/[0.08]
          shadow-lg whitespace-nowrap z-50
          animate-in fade-in duration-150
        ">
          <div className="text-xs text-text-secondary">
            {fatigueLevel} · {Math.floor(timeSinceBreak)}m since break
          </div>
        </div>
      )}
    </div>
  );
}

export default BreakReminder;
