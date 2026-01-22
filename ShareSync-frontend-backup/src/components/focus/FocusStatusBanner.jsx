// src/components/focus/FocusStatusBanner.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Status Banner
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows focus status to others: "[Name] is in focus mode"
// Also used as a self-status banner showing current session info.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { Target, Clock, Coffee, X, Bell, BellOff } from 'lucide-react';
import useFocusSession from '../../hooks/useFocusSession';

/**
 * FocusStatusBanner - Banner showing someone's focus status
 * 
 * @param {string} userName - Name to display (or "You" for self)
 * @param {string} avatar - User's avatar emoji/image
 * @param {string} taskName - What they're working on
 * @param {number} remainingMinutes - Minutes remaining
 * @param {boolean} isSelf - Is this the current user's banner
 * @param {function} onEndSession - Callback to end session (self only)
 */
export default function FocusStatusBanner({
  userName = 'Someone',
  avatar = '��',
  taskName,
  remainingMinutes,
  isSelf = false,
  onEndSession,
}) {
  const formattedTime = useMemo(() => {
    if (!remainingMinutes) return null;
    if (remainingMinutes < 1) return 'Less than a minute';
    return `${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''} left`;
  }, [remainingMinutes]);

  return (
    <div className={`
      flex items-center gap-3 p-4 rounded-xl
      ${isSelf 
        ? 'bg-brand/10 border border-brand/20' 
        : 'bg-surface-1 border border-white/[0.06]'
      }
    `}>
      {/* Avatar with pulse */}
      <div className="relative">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center text-xl
          ${isSelf ? 'bg-brand/20' : 'bg-surface-2'}
        `}>
          {avatar}
        </div>
        {/* Pulsing indicator */}
        <div className="absolute -bottom-0.5 -right-0.5">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-brand" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-brand animate-ping" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">
            {isSelf ? 'You are' : `${userName} is`} in focus mode
          </span>
          <BellOff className="w-4 h-4 text-text-tertiary" />
        </div>
        
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          {taskName && (
            <span className="truncate max-w-[200px]">
              Working on: <span className="text-text-primary">{taskName}</span>
            </span>
          )}
          {formattedTime && (
            <span className="flex items-center gap-1 text-text-tertiary whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              {formattedTime}
            </span>
          )}
        </div>
      </div>

      {/* End button (self only) */}
      {isSelf && onEndSession && (
        <button
          onClick={onEndSession}
          className="
            p-2 rounded-lg
            text-text-tertiary hover:text-error hover:bg-error/10
            transition-colors
          "
          title="End focus session"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/**
 * FocusModeBadge - Compact badge for team lists
 */
export function FocusModeBadge({ userName, remainingMinutes }) {
  return (
    <div className="
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      bg-brand/10 border border-brand/20
    ">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-brand" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-brand animate-ping" />
      </div>
      <span className="text-xs font-medium text-brand">
        {userName ? `${userName} • ` : ''}Focus Mode
      </span>
      {remainingMinutes && (
        <span className="text-xs text-brand/70">{remainingMinutes}m</span>
      )}
    </div>
  );
}

/**
 * SelfFocusBanner - Banner for your own focus session
 */
export function SelfFocusBanner({ onCancel }) {
  const { 
    isActive, 
    isRunning, 
    isPaused,
    formattedTime, 
    currentTask, 
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    progress,
  } = useFocusSession();

  if (!isActive) return null;

  return (
    <div className="
      fixed top-0 left-0 right-0 z-50
      px-4 py-2
      bg-gradient-to-r from-brand/90 to-accent-500/90
      backdrop-blur-xl
      shadow-lg shadow-brand/20
    ">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Left: Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Target className="w-5 h-5 text-white" />
            {isRunning && (
              <div className="absolute inset-0 w-5 h-5 animate-ping">
                <Target className="w-5 h-5 text-white/50" />
              </div>
            )}
          </div>
          
          <div className="text-white">
            <span className="font-semibold">{isPaused ? 'Paused' : 'In Focus'}</span>
            {currentTask && (
              <span className="text-white/80 ml-2">
                • {currentTask}
              </span>
            )}
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="hidden sm:block w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Time */}
          <span className="text-white font-mono text-lg font-bold tabular-nums">
            {formattedTime}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Pause/Resume */}
          <button
            onClick={isRunning ? pauseSession : resumeSession}
            className="
              px-3 py-1.5 rounded-lg
              bg-white/20 hover:bg-white/30
              text-white text-sm font-medium
              transition-colors
            "
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          
          {/* Complete */}
          <button
            onClick={completeSession}
            className="
              px-3 py-1.5 rounded-lg
              bg-white text-brand
              text-sm font-medium
              hover:bg-white/90
              transition-colors
            "
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TeamFocusIndicator - Shows how many team members are in focus
 */
export function TeamFocusIndicator({ focusedMembers = [] }) {
  if (focusedMembers.length === 0) return null;

  return (
    <div className="
      flex items-center gap-2 px-3 py-2 rounded-xl
      bg-brand/5 border border-brand/10
    ">
      <div className="flex -space-x-2">
        {focusedMembers.slice(0, 3).map((member, i) => (
          <div
            key={member.id || i}
            className="
              w-6 h-6 rounded-full
              bg-brand/20 border-2 border-surface-0
              flex items-center justify-center text-xs
            "
            title={member.name}
          >
            {member.avatar || member.name?.charAt(0)}
          </div>
        ))}
        {focusedMembers.length > 3 && (
          <div className="
            w-6 h-6 rounded-full
            bg-surface-2 border-2 border-surface-0
            flex items-center justify-center text-xs text-text-tertiary
          ">
            +{focusedMembers.length - 3}
          </div>
        )}
      </div>
      
      <span className="text-xs text-text-secondary">
        {focusedMembers.length === 1 
          ? `${focusedMembers[0].name} is focusing`
          : `${focusedMembers.length} teammates focusing`
        }
      </span>
    </div>
  );
}

/**
 * FocusDoNotDisturb - DND indicator
 */
export function FocusDoNotDisturb({ enabled = true, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        transition-colors
        ${enabled 
          ? 'bg-warning/10 text-warning' 
          : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
        }
      `}
    >
      {enabled ? (
        <>
          <BellOff className="w-4 h-4" />
          <span className="text-sm font-medium">DND On</span>
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">DND Off</span>
        </>
      )}
    </button>
  );
}
