// src/components/focus/FocusStartButton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Start Button CTA
// ═══════════════════════════════════════════════════════════════════════════════
//
// Eye-catching button to initiate a focus session.
// Multiple variants for different contexts.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Play, Target, Clock, Zap, ChevronDown } from 'lucide-react';
import useFocusSession from '../../hooks/useFocusSession';

/**
 * FocusStartButton - Primary CTA to start focus session
 * 
 * @param {object} task - Optional task to focus on
 * @param {object} project - Optional project context
 * @param {string} variant - 'default' | 'compact' | 'hero' | 'fab'
 * @param {function} onStart - Callback when session starts
 */
export default function FocusStartButton({
  task = null,
  project = null,
  variant = 'default',
  onStart,
}) {
  const [showDurations, setShowDurations] = useState(false);
  const { startSession, isActive, statusText } = useFocusSession();

  const durations = [
    { minutes: 15, label: '15 min', description: 'Quick sprint' },
    { minutes: 25, label: '25 min', description: 'Standard focus' },
    { minutes: 45, label: '45 min', description: 'Deep work' },
    { minutes: 60, label: '60 min', description: 'Extended session' },
  ];

  const handleStart = (minutes = 25) => {
    startSession({ minutes, task: task?.title || task, project });
    setShowDurations(false);
    onStart?.({ minutes, task, project });
  };

  // If already in a session, show status instead
  if (isActive) {
    return (
      <div className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl
        bg-brand/10 border border-brand/20
        ${variant === 'compact' ? 'text-sm' : ''}
      `}>
        <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
        <span className="text-brand font-medium">{statusText}</span>
      </div>
    );
  }

  // Variant: FAB (Floating Action Button)
  if (variant === 'fab') {
    return (
      <button
        onClick={() => handleStart(25)}
        className="
          w-14 h-14 rounded-full
          bg-brand text-white
          flex items-center justify-center
          shadow-xl shadow-brand/30
          hover:bg-brand-600 hover:shadow-brand/40 hover:scale-105
          active:scale-95
          transition-all duration-300
        "
        title="Start 25-minute focus session"
      >
        <Target className="w-6 h-6" />
      </button>
    );
  }

  // Variant: Compact (for toolbars)
  if (variant === 'compact') {
    return (
      <button
        onClick={() => handleStart(25)}
        className="
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          bg-brand text-white text-sm font-medium
          hover:bg-brand-600
          transition-colors
        "
      >
        <Target className="w-4 h-4" />
        Focus
      </button>
    );
  }

  // Variant: Hero (for landing pages, onboarding)
  if (variant === 'hero') {
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => handleStart(25)}
          className="
            group relative px-8 py-4 rounded-2xl
            bg-gradient-to-r from-brand to-accent-500
            text-white text-lg font-bold
            shadow-2xl shadow-brand/30
            hover:shadow-brand/40 hover:scale-105
            active:scale-95
            transition-all duration-300
          "
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
          
          <span className="relative flex items-center gap-3">
            <Target className="w-6 h-6" />
            Start Focus Session
          </span>
        </button>
        
        {/* Duration options */}
        <div className="flex items-center gap-2">
          {durations.map(d => (
            <button
              key={d.minutes}
              onClick={() => handleStart(d.minutes)}
              className="
                px-3 py-1.5 rounded-lg text-sm
                text-text-secondary hover:text-text-primary
                hover:bg-surface-2
                transition-colors
              "
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative inline-block">
      <div className="flex items-center">
        {/* Main button */}
        <button
          onClick={() => handleStart(25)}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-l-xl
            bg-brand text-white font-medium
            hover:bg-brand-600
            transition-colors
          "
        >
          <Target className="w-5 h-5" />
          <span>Start Focus</span>
          <span className="text-brand-200">25:00</span>
        </button>

        {/* Dropdown trigger */}
        <button
          onClick={() => setShowDurations(!showDurations)}
          className="
            px-2 py-2.5 rounded-r-xl border-l border-brand-600
            bg-brand text-white
            hover:bg-brand-600
            transition-colors
          "
          aria-label="Select duration"
        >
          <ChevronDown className={`
            w-5 h-5 transition-transform
            ${showDurations ? 'rotate-180' : ''}
          `} />
        </button>
      </div>

      {/* Duration dropdown */}
      {showDurations && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDurations(false)} 
          />
          
          {/* Dropdown */}
          <div className="
            absolute top-full left-0 mt-2 z-20
            w-56 p-2 rounded-xl
            bg-surface-1 border border-white/[0.08]
            shadow-2xl
          ">
            {durations.map(d => (
              <button
                key={d.minutes}
                onClick={() => handleStart(d.minutes)}
                className="
                  w-full flex items-center gap-3 p-3 rounded-lg
                  text-left
                  hover:bg-surface-2
                  transition-colors
                "
              >
                <Clock className="w-4 h-4 text-text-tertiary" />
                <div>
                  <div className="font-medium text-text-primary">{d.label}</div>
                  <div className="text-xs text-text-tertiary">{d.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * QuickFocusButton - Minimal one-click start
 */
export function QuickFocusButton({ minutes = 25, task, onStart }) {
  const { startSession, isActive } = useFocusSession();

  const handleClick = () => {
    if (isActive) return;
    startSession({ minutes, task });
    onStart?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isActive}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        text-sm font-medium transition-all
        ${isActive
          ? 'bg-brand/10 text-brand cursor-not-allowed'
          : 'bg-surface-2 text-text-secondary hover:bg-brand hover:text-white'
        }
      `}
    >
      <Zap className="w-4 h-4" />
      {isActive ? 'In Focus' : `Focus ${minutes}m`}
    </button>
  );
}

/**
 * TaskFocusButton - Focus button attached to a task
 */
export function TaskFocusButton({ task, onStart }) {
  const { startSession, isActive, currentTask } = useFocusSession();
  const isThisTask = currentTask === task?.title;

  const handleClick = () => {
    if (isActive) return;
    startSession({ minutes: 25, task: task?.title });
    onStart?.(task);
  };

  if (isActive && isThisTask) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        Focusing
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isActive}
      className={`
        p-1.5 rounded-lg transition-colors
        ${isActive
          ? 'text-text-tertiary cursor-not-allowed'
          : 'text-text-tertiary hover:text-brand hover:bg-brand/10'
        }
      `}
      title={isActive ? 'Already in a focus session' : 'Start focus session on this task'}
    >
      <Target className="w-4 h-4" />
    </button>
  );
}
