// src/components/focus/FocusFortress.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS FORTRESS: Main Focus Mode UI
// Escalating levels of focus protection
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Play, Pause, Square, Clock, Zap, Shield, Castle,
  ChevronUp, ChevronDown, Volume2, VolumeX, Settings,
  Maximize2, Minimize2, Target, CheckCircle2, X,
  Lock, Unlock, Eye, EyeOff, Bell, BellOff
} from 'lucide-react';
import { 
  useFocusFortress, 
  FOCUS_LEVELS, 
  FOCUS_LEVEL_CONFIG 
} from '../../hooks/useFocusFortress';

// ═══════════════════════════════════════════════════════════════════════════════
// TIMER DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function FocusTimer({ 
  timeRemaining, 
  progress, 
  size = 'lg',
  showProgress = true,
}) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };
  
  const ringSize = {
    sm: 80,
    md: 120,
    lg: 180,
    xl: 240,
  };
  
  const strokeWidth = size === 'xl' ? 8 : size === 'lg' ? 6 : 4;
  const radius = (ringSize[size] - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Progress ring */}
      {showProgress && (
        <svg 
          width={ringSize[size]} 
          height={ringSize[size]} 
          className="absolute transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={ringSize[size] / 2}
            cy={ringSize[size] / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={ringSize[size] / 2}
            cy={ringSize[size] / 2}
            r={radius}
            fill="none"
            stroke="url(#focusGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      )}
      
      {/* Timer text */}
      <div className={`font-mono font-bold text-text-primary ${sizeClasses[size]}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

function LevelSelector({ 
  currentLevel, 
  onSelect, 
  disabled = false,
  compact = false,
}) {
  const levels = [
    FOCUS_LEVELS.LEVEL_1,
    FOCUS_LEVELS.LEVEL_2,
    FOCUS_LEVELS.LEVEL_3,
    FOCUS_LEVELS.LEVEL_4,
  ];
  
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {levels.map((level) => {
          const config = FOCUS_LEVEL_CONFIG[level];
          const isActive = currentLevel === level;
          
          return (
            <button
              key={level}
              onClick={() => !disabled && onSelect(level)}
              disabled={disabled}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${isActive 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-surface-2 text-text-tertiary hover:bg-surface-3'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={`${config.name}: ${config.description}`}
            >
              <span className="text-sm">{config.icon}</span>
            </button>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {levels.map((level) => {
        const config = FOCUS_LEVEL_CONFIG[level];
        const isActive = currentLevel === level;
        
        return (
          <button
            key={level}
            onClick={() => !disabled && onSelect(level)}
            disabled={disabled}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl
              border transition-all duration-200
              ${isActive 
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
                : 'bg-surface-1 border-white/[0.06] text-text-secondary hover:bg-surface-2'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-2xl">{config.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-medium">{config.name}</div>
              <div className="text-xs text-text-tertiary">{config.description}</div>
            </div>
            {isActive && <CheckCircle2 className="w-5 h-5" />}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION PICKER
// ═══════════════════════════════════════════════════════════════════════════════

function DurationPicker({ 
  value, 
  onChange, 
  disabled = false,
}) {
  const presets = [
    { label: '15m', value: 15 * 60 },
    { label: '25m', value: 25 * 60 },
    { label: '45m', value: 45 * 60 },
    { label: '60m', value: 60 * 60 },
    { label: '90m', value: 90 * 60 },
  ];
  
  return (
    <div className="flex items-center gap-2">
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => !disabled && onChange(preset.value)}
          disabled={disabled}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${value === preset.value
              ? 'bg-brand-500 text-white'
              : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE INDICATORS
// ═══════════════════════════════════════════════════════════════════════════════

function FeatureIndicators({ features }) {
  const indicators = [
    { key: 'muteNotifications', icon: BellOff, label: 'Notifications muted' },
    { key: 'hideSidebar', icon: EyeOff, label: 'Sidebar hidden' },
    { key: 'singleTaskMode', icon: Target, label: 'Single task mode' },
    { key: 'fullScreen', icon: Maximize2, label: 'Fullscreen' },
    { key: 'zenMode', icon: Castle, label: 'Zen mode' },
  ];
  
  const activeFeatures = indicators.filter(i => features[i.key]);
  
  if (activeFeatures.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeFeatures.map(({ key, icon: Icon, label }) => (
        <div
          key={key}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs"
          title={label}
        >
          <Icon className="w-3 h-3" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FOCUS FORTRESS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FocusFortressPanel - Main focus mode UI
 */
export function FocusFortressPanel({
  fortress,
  currentTask = null,
  onTaskSelect,
  onClose,
  className = '',
}) {
  const {
    level,
    isActive,
    duration,
    timeRemaining,
    progress,
    features,
    config,
    sessionStats,
    preferences,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    changeLevel,
    extendSession,
    updatePreferences,
  } = fortress;
  
  const [selectedLevel, setSelectedLevel] = useState(preferences.defaultLevel || FOCUS_LEVELS.LEVEL_2);
  const [selectedDuration, setSelectedDuration] = useState(preferences.defaultDuration || 25 * 60);
  const [showSettings, setShowSettings] = useState(false);
  
  const handleStart = useCallback(() => {
    startSession({
      focusLevel: selectedLevel,
      sessionDuration: selectedDuration,
      task: currentTask,
    });
  }, [startSession, selectedLevel, selectedDuration, currentTask]);
  
  const handleEnd = useCallback(() => {
    if (progress < 50) {
      // Confirm early exit
      if (window.confirm('You\'re less than halfway through. End session early?')) {
        endSession(false);
      }
    } else {
      endSession(false);
    }
  }, [endSession, progress]);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${features.zenMode ? 'shadow-2xl shadow-brand-500/20' : ''}
      ${className}
    `}>
      {/* Header */}
      <div className={`
        px-6 py-4 border-b border-white/[0.06]
        ${isActive 
          ? 'bg-gradient-to-r from-brand-500/20 to-purple-500/20' 
          : 'bg-surface-1'
        }
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${isActive ? 'bg-brand-500' : 'bg-surface-2'}
            `}>
              <span className="text-2xl">{config?.icon || '🏰'}</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Focus Fortress
              </div>
              <div className="text-sm text-text-tertiary">
                {isActive ? config.name : 'Deep work protection'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isActive && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-white/10 text-text-tertiary"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-text-tertiary"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-6">
        {isActive ? (
          // Active session view
          <div className="text-center">
            {/* Timer */}
            <div className="mb-6">
              <FocusTimer
                timeRemaining={timeRemaining}
                progress={progress}
                size="lg"
              />
            </div>
            
            {/* Current task */}
            {currentTask && (
              <div className="mb-6 p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
                <div className="text-xs text-text-tertiary mb-1">Focusing on</div>
                <div className="text-lg font-medium text-text-primary">
                  {currentTask.title}
                </div>
              </div>
            )}
            
            {/* Level indicator */}
            <div className="mb-6">
              <LevelSelector
                currentLevel={level}
                onSelect={changeLevel}
                compact
              />
            </div>
            
            {/* Active features */}
            <div className="mb-6 flex justify-center">
              <FeatureIndicators features={features} />
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={pauseSession}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={handleEnd}
                className="px-6 py-2 rounded-lg bg-error-500/10 text-error-400 hover:bg-error-500/20 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                <span>End Session</span>
              </button>
              <button
                onClick={() => extendSession(5 * 60)}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
                title="Add 5 minutes"
              >
                +5m
              </button>
            </div>
            
            {/* Session stats */}
            <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {sessionStats.tasksCompleted}
                </div>
                <div className="text-xs text-text-tertiary">Tasks Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {sessionStats.interruptions}
                </div>
                <div className="text-xs text-text-tertiary">Interruptions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-text-tertiary">Complete</div>
              </div>
            </div>
          </div>
        ) : (
          // Setup view
          <div className="space-y-6">
            {/* Duration selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Session Duration
              </label>
              <DurationPicker
                value={selectedDuration}
                onChange={setSelectedDuration}
              />
            </div>
            
            {/* Level selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Focus Level
              </label>
              <LevelSelector
                currentLevel={selectedLevel}
                onSelect={setSelectedLevel}
              />
            </div>
            
            {/* Task selection hint */}
            {!currentTask && onTaskSelect && (
              <button
                onClick={onTaskSelect}
                className="w-full p-4 rounded-xl border border-dashed border-white/[0.1] text-text-tertiary hover:border-brand-500/30 hover:text-brand-400 transition-colors"
              >
                + Select a task to focus on (optional)
              </button>
            )}
            
            {currentTask && (
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30">
                <div className="text-xs text-brand-400 mb-1">Will focus on</div>
                <div className="text-sm font-medium text-text-primary">
                  {currentTask.title}
                </div>
              </div>
            )}
            
            {/* Start button */}
            <button
              onClick={handleStart}
              className="
                w-full py-4 rounded-xl
                bg-gradient-to-r from-brand-500 to-purple-500
                text-white font-semibold text-lg
                hover:from-brand-400 hover:to-purple-400
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              <Castle className="w-5 h-5" />
              <span>Enter Focus Fortress</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI FOCUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniFocusIndicator - Compact focus status for navbar/toolbar
 */
export function MiniFocusIndicator({
  fortress,
  onClick,
  className = '',
}) {
  const { isActive, level, timeRemaining, config, progress } = fortress;
  
  if (!isActive) return null;
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-brand-500/10 border border-brand-500/30
        hover:bg-brand-500/20 transition-colors
        ${className}
      `}
    >
      <span className="text-sm">{config.icon}</span>
      <span className="text-sm font-mono text-brand-400">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <div className="w-12 h-1 rounded-full bg-surface-3 overflow-hidden">
        <div 
          className="h-full bg-brand-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS START BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FocusStartButton - Quick start button for task cards
 */
export function FocusStartButton({
  task,
  onStart,
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
  };
  
  return (
    <button
      onClick={() => onStart?.(task)}
      className={`
        rounded-lg
        bg-brand-500/10 text-brand-400 border border-brand-500/30
        hover:bg-brand-500/20 transition-colors
        flex items-center gap-1.5
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Castle className="w-3 h-3" />
      <span>Focus</span>
    </button>
  );
}

export default FocusFortressPanel;
