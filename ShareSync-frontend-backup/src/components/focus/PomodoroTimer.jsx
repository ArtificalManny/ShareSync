// src/components/focus/PomodoroTimer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Pomodoro Timer Display
// ═══════════════════════════════════════════════════════════════════════════════
//
// Beautiful circular timer with progress ring.
// Can be used standalone or within the FocusSession component.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

/**
 * PomodoroTimer - Circular progress timer
 * 
 * @param {number} remainingSeconds - Seconds remaining
 * @param {number} totalSeconds - Total session seconds
 * @param {string} status - 'idle' | 'running' | 'paused' | 'completed'
 * @param {function} onPlay - Play/resume callback
 * @param {function} onPause - Pause callback
 * @param {function} onReset - Reset callback
 * @param {function} onComplete - Complete early callback
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} showControls - Show play/pause/reset buttons
 */
export default function PomodoroTimer({
  remainingSeconds = 25 * 60,
  totalSeconds = 25 * 60,
  status = 'idle',
  onPlay,
  onPause,
  onReset,
  onComplete,
  size = 'lg',
  showControls = true,
}) {
  // Calculate progress
  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  }, [totalSeconds, remainingSeconds]);

  // Format time
  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remainingSeconds]);

  // Size configurations
  const sizes = {
    sm: { container: 'w-24 h-24', text: 'text-xl', stroke: 4, radius: 40 },
    md: { container: 'w-36 h-36', text: 'text-2xl', stroke: 5, radius: 60 },
    lg: { container: 'w-48 h-48', text: 'text-4xl', stroke: 6, radius: 85 },
    xl: { container: 'w-64 h-64', text: 'text-5xl', stroke: 8, radius: 115 },
  };

  const s = sizes[size] || sizes.lg;
  const circumference = 2 * Math.PI * s.radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Status-based colors
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'text-brand stroke-brand';
      case 'paused':
        return 'text-warning stroke-warning';
      case 'completed':
        return 'text-success stroke-success';
      default:
        return 'text-text-secondary stroke-text-tertiary';
    }
  };

  const statusColor = getStatusColor();
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer Ring */}
      <div className={`relative ${s.container}`}>
        {/* Background ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={s.radius}
            fill="none"
            strokeWidth={s.stroke}
            className="stroke-surface-2"
          />
          {/* Progress ring */}
          <circle
            cx="50%"
            cy="50%"
            r={s.radius}
            fill="none"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            className={`${statusColor} transition-all duration-300`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Glow effect when running */}
          {isRunning && (
            <div className="absolute inset-4 rounded-full bg-brand/10 animate-pulse" />
          )}
          
          {/* Time display */}
          <span className={`
            relative font-bold tabular-nums ${s.text}
            ${status === 'completed' ? 'text-success' : 'text-text-primary'}
          `}>
            {status === 'completed' ? '🎉' : formattedTime}
          </span>
          
          {/* Status text */}
          <span className="text-xs text-text-tertiary mt-1">
            {status === 'running' && 'Focus'}
            {status === 'paused' && 'Paused'}
            {status === 'completed' && 'Complete!'}
            {status === 'idle' && 'Ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-3">
          {/* Reset */}
          {!isIdle && (
            <button
              onClick={onReset}
              className="
                w-10 h-10 rounded-full
                bg-surface-2 hover:bg-surface-3
                text-text-tertiary hover:text-text-primary
                flex items-center justify-center
                transition-colors
              "
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Play/Pause */}
          <button
            onClick={isRunning ? onPause : onPlay}
            className={`
              w-14 h-14 rounded-full
              flex items-center justify-center
              transition-all duration-300
              ${isRunning 
                ? 'bg-warning/10 hover:bg-warning/20 text-warning' 
                : 'bg-brand hover:bg-brand-600 text-white shadow-lg shadow-brand/25'
              }
            `}
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          {/* Complete Early */}
          {(isRunning || isPaused) && onComplete && (
            <button
              onClick={onComplete}
              className="
                w-10 h-10 rounded-full
                bg-success/10 hover:bg-success/20
                text-success
                flex items-center justify-center
                transition-colors
              "
              title="Complete Early"
            >
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MiniPomodoroTimer - Compact version for dock/sidebar
 */
export function MiniPomodoroTimer({
  remainingSeconds,
  totalSeconds,
  status,
  onToggle,
}) {
  const progress = totalSeconds > 0 
    ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 
    : 0;
  
  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const isRunning = status === 'running';

  return (
    <button
      onClick={onToggle}
      className={`
        relative w-16 h-16 rounded-xl
        flex flex-col items-center justify-center
        transition-all duration-300
        ${isRunning 
          ? 'bg-brand/10 border-2 border-brand shadow-lg shadow-brand/10' 
          : 'bg-surface-2 border border-white/[0.06] hover:bg-surface-3'
        }
      `}
    >
      {/* Progress ring */}
      <svg className="absolute inset-1 w-14 h-14 -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="24"
          fill="none"
          strokeWidth="3"
          className="stroke-surface-3"
        />
        <circle
          cx="50%"
          cy="50%"
          r="24"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={isRunning ? 'stroke-brand' : 'stroke-text-tertiary'}
          style={{
            strokeDasharray: 2 * Math.PI * 24,
            strokeDashoffset: 2 * Math.PI * 24 * (1 - progress / 100),
            transition: 'stroke-dashoffset 0.3s',
          }}
        />
      </svg>
      
      {/* Time */}
      <span className={`
        relative text-xs font-bold tabular-nums
        ${isRunning ? 'text-brand' : 'text-text-secondary'}
      `}>
        {formattedTime}
      </span>
    </button>
  );
}

/**
 * TimerPresets - Quick duration selection
 */
export function TimerPresets({ onSelect, activeMinutes }) {
  const presets = [
    { minutes: 15, label: '15m', description: 'Quick focus' },
    { minutes: 25, label: '25m', description: 'Standard' },
    { minutes: 45, label: '45m', description: 'Deep work' },
    { minutes: 60, label: '60m', description: 'Extended' },
  ];

  return (
    <div className="flex items-center gap-2">
      {presets.map(preset => (
        <button
          key={preset.minutes}
          onClick={() => onSelect(preset.minutes)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${activeMinutes === preset.minutes
              ? 'bg-brand text-white shadow-lg shadow-brand/25'
              : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary'
            }
          `}
          title={preset.description}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
