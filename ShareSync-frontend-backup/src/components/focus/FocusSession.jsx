// src/components/focus/FocusSession.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Main Focus Session UI
// ═══════════════════════════════════════════════════════════════════════════════
//
// Full-featured focus session interface with:
// - Timer display
// - Task selection
// - Session controls
// - Stats display
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Target, 
  Clock, 
  Play, 
  Pause, 
  Check, 
  Flame,
  Coffee,
  X,
  Zap,
} from 'lucide-react';
import useFocusSession, { useFocusStats } from '../../hooks/useFocusSession';
import PomodoroTimer, { TimerPresets } from './PomodoroTimer';

/**
 * FocusSession - Main focus session component
 * 
 * @param {object} defaultTask - Pre-selected task
 * @param {boolean} fullScreen - Full screen mode
 * @param {function} onComplete - Completion callback
 */
export default function FocusSession({
  defaultTask = null,
  fullScreen = false,
  onComplete,
}) {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [taskInput, setTaskInput] = useState(defaultTask?.title || '');
  
  const {
    status,
    remainingSeconds,
    totalSeconds,
    formattedTime,
    progress,
    isActive,
    isRunning,
    isPaused,
    isCompleted,
    currentTask,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    startBreak,
  } = useFocusSession();

  const { today } = useFocusStats();

  const handleStart = () => {
    startSession({
      minutes: selectedDuration,
      task: taskInput || null,
    });
  };

  const handleComplete = () => {
    completeSession();
    onComplete?.();
  };

  // Idle state - show start interface
  if (!isActive) {
    return (
      <div className={`
        ${fullScreen ? 'min-h-screen flex items-center justify-center' : ''}
        p-8 rounded-2xl bg-surface-1 border border-white/[0.06]
      `}>
        <div className="max-w-md mx-auto text-center">
          {/* Header */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-accent-500 flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Start Focus Session
          </h2>
          <p className="text-text-secondary mb-8">
            Block distractions and get into deep work mode.
          </p>

          {/* Duration selection */}
          <div className="mb-6">
            <label className="text-sm text-text-tertiary block mb-3">
              How long do you want to focus?
            </label>
            <TimerPresets 
              onSelect={setSelectedDuration} 
              activeMinutes={selectedDuration}
            />
          </div>

          {/* Task input */}
          <div className="mb-6">
            <label className="text-sm text-text-tertiary block mb-2 text-left">
              What are you focusing on? (optional)
            </label>
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g., Finish the landing page design"
              className="
                w-full px-4 py-3 rounded-xl
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20
                transition-all
              "
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="
              w-full py-4 rounded-xl
              bg-brand text-white text-lg font-semibold
              hover:bg-brand-600 hover:shadow-glow-brand
              transition-all
            "
          >
            Start {selectedDuration} Minute Focus
          </button>

          {/* Today's stats */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-text-secondary">
                  <Flame className="w-4 h-4 text-warning" />
                  <span className="text-xl font-bold text-text-primary">{today.sessions}</span>
                </div>
                <span className="text-xs text-text-tertiary">Sessions today</span>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-text-secondary">
                  <Clock className="w-4 h-4 text-brand" />
                  <span className="text-xl font-bold text-text-primary">{today.totalMinutes}</span>
                </div>
                <span className="text-xs text-text-tertiary">Minutes focused</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active session state
  return (
    <div className={`
      ${fullScreen ? 'min-h-screen flex items-center justify-center bg-surface-0' : ''}
      p-8 rounded-2xl bg-surface-1 border border-white/[0.06]
      ${isRunning ? 'border-brand/30 shadow-lg shadow-brand/10' : ''}
    `}>
      <div className="max-w-md mx-auto text-center">
        {/* Status badge */}
        <div className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6
          ${isRunning 
            ? 'bg-brand/10 text-brand' 
            : isPaused 
              ? 'bg-warning/10 text-warning' 
              : 'bg-success/10 text-success'
          }
        `}>
          {isRunning && (
            <>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="font-medium">In Focus</span>
            </>
          )}
          {isPaused && (
            <>
              <Pause className="w-4 h-4" />
              <span className="font-medium">Paused</span>
            </>
          )}
          {isCompleted && (
            <>
              <Check className="w-4 h-4" />
              <span className="font-medium">Completed!</span>
            </>
          )}
        </div>

        {/* Timer */}
        <PomodoroTimer
          remainingSeconds={remainingSeconds}
          totalSeconds={totalSeconds}
          status={status}
          onPlay={isActive ? resumeSession : handleStart}
          onPause={pauseSession}
          onReset={cancelSession}
          onComplete={handleComplete}
          size="xl"
          showControls={false}
        />

        {/* Task display */}
        {currentTask && (
          <div className="mt-6 p-4 rounded-xl bg-surface-2">
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4 text-brand" />
              <span className="text-text-secondary">Focusing on:</span>
            </div>
            <p className="font-medium text-text-primary mt-1">{currentTask}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {/* Reset */}
          <button
            onClick={cancelSession}
            className="
              p-3 rounded-xl
              bg-surface-2 hover:bg-surface-3
              text-text-tertiary hover:text-error
              transition-colors
            "
            title="Cancel session"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={isRunning ? pauseSession : resumeSession}
            className={`
              w-16 h-16 rounded-2xl
              flex items-center justify-center
              transition-all duration-300
              ${isRunning 
                ? 'bg-warning/10 hover:bg-warning/20 text-warning' 
                : 'bg-brand hover:bg-brand-600 text-white shadow-lg shadow-brand/25'
              }
            `}
          >
            {isRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </button>

          {/* Complete Early */}
          <button
            onClick={handleComplete}
            className="
              p-3 rounded-xl
              bg-success/10 hover:bg-success/20
              text-success
              transition-colors
            "
            title="Complete session"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div 
              className={`
                h-full rounded-full transition-all duration-300
                ${isRunning 
                  ? 'bg-gradient-to-r from-brand to-accent-500' 
                  : isPaused 
                    ? 'bg-warning' 
                    : 'bg-success'
                }
              `}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-text-tertiary">
            <span>{Math.floor((totalSeconds - remainingSeconds) / 60)}m elapsed</span>
            <span>{Math.ceil(remainingSeconds / 60)}m remaining</span>
          </div>
        </div>

        {/* Quick break suggestion */}
        {isPaused && (
          <div className="mt-6 p-4 rounded-xl bg-surface-2">
            <p className="text-sm text-text-secondary mb-3">
              Need a quick break?
            </p>
            <button
              onClick={() => startBreak(false)}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-lg
                bg-success/10 text-success text-sm font-medium
                hover:bg-success/20
                transition-colors
              "
            >
              <Coffee className="w-4 h-4" />
              Take 5-minute break
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FocusSessionCompact - Smaller version for sidebar/dock
 */
export function FocusSessionCompact({ onExpand }) {
  const {
    isActive,
    isRunning,
    formattedTime,
    progress,
    currentTask,
    pauseSession,
    resumeSession,
    completeSession,
  } = useFocusSession();

  if (!isActive) return null;

  return (
    <div className={`
      p-4 rounded-xl
      ${isRunning ? 'bg-brand/10 border border-brand/20' : 'bg-surface-1 border border-white/[0.06]'}
    `}>
      {/* Timer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className={`w-4 h-4 ${isRunning ? 'text-brand' : 'text-warning'}`} />
          <span className="text-sm text-text-secondary">
            {isRunning ? 'Focusing' : 'Paused'}
          </span>
        </div>
        <span className="font-mono font-bold text-text-primary tabular-nums">
          {formattedTime}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full ${isRunning ? 'bg-brand' : 'bg-warning'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task */}
      {currentTask && (
        <p className="text-xs text-text-tertiary truncate mb-3">
          {currentTask}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={isRunning ? pauseSession : resumeSession}
          className={`
            flex-1 py-2 rounded-lg text-sm font-medium
            ${isRunning 
              ? 'bg-warning/10 text-warning' 
              : 'bg-brand text-white'
            }
          `}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={completeSession}
          className="p-2 rounded-lg bg-success/10 text-success"
        >
          <Check className="w-4 h-4" />
        </button>
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-2 rounded-lg bg-surface-2 text-text-tertiary hover:text-text-primary"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * FocusSessionWidget - Dashboard widget version
 */
export function FocusSessionWidget() {
  const { isActive, sessionsToday, totalFocusTimeToday, startSession } = useFocusSession();

  if (isActive) {
    return <FocusSessionCompact />;
  }

  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4 text-brand" />
          Focus Sessions
        </h3>
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <span>{sessionsToday} today</span>
          <span>{totalFocusTimeToday}m</span>
        </div>
      </div>

      <button
        onClick={() => startSession({ minutes: 25 })}
        className="
          w-full py-3 rounded-xl
          bg-brand text-white font-medium
          hover:bg-brand-600
          transition-colors
        "
      >
        Start 25-minute Focus
      </button>
    </div>
  );
}
