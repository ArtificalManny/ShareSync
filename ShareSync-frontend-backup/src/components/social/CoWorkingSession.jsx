// src/components/social/CoWorkingSession.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Co-Working Sessions
// Virtual Pomodoro together - work alongside teammates
// Includes timer sync, activity feed, and XP multiplier
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Clock, Play, Pause, Square, Zap, Trophy,
  MessageCircle, Coffee, ChevronRight, X, Plus,
  CheckCircle2, Sparkles, Bell, BellOff, Volume2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const SESSION_STATES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  BREAK: 'break',
  COMPLETED: 'completed',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CO-WORKING SESSION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useCoWorkingSession - Manages co-working session state
 */
export function useCoWorkingSession({
  duration = 25 * 60, // 25 minutes default
  breakDuration = 5 * 60, // 5 minute break
  xpMultiplier = 1.2, // 20% bonus XP
  onSessionComplete,
  onTaskComplete,
}) {
  const [state, setState] = useState(SESSION_STATES.IDLE);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [participants, setParticipants] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  
  // Timer effect
  useEffect(() => {
    if (state !== SESSION_STATES.ACTIVE) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setState(SESSION_STATES.BREAK);
          return breakDuration;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state, breakDuration]);
  
  // Break timer
  useEffect(() => {
    if (state !== SESSION_STATES.BREAK) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setState(SESSION_STATES.COMPLETED);
          onSessionComplete?.({
            tasksCompleted,
            totalXP: Math.round(totalXP * xpMultiplier),
            participants: participants.length,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state, tasksCompleted, totalXP, xpMultiplier, participants.length, onSessionComplete]);
  
  const start = useCallback(() => {
    setState(SESSION_STATES.ACTIVE);
    setTimeRemaining(duration);
    setActivityLog([{
      type: 'session_start',
      timestamp: Date.now(),
      message: 'Co-working session started!',
    }]);
  }, [duration]);
  
  const pause = useCallback(() => {
    setState(SESSION_STATES.PAUSED);
  }, []);
  
  const resume = useCallback(() => {
    setState(SESSION_STATES.ACTIVE);
  }, []);
  
  const stop = useCallback(() => {
    setState(SESSION_STATES.IDLE);
    setTimeRemaining(duration);
  }, [duration]);
  
  const addParticipant = useCallback((user) => {
    setParticipants(prev => {
      if (prev.find(p => p.id === user.id)) return prev;
      return [...prev, user];
    });
    setActivityLog(prev => [...prev, {
      type: 'join',
      user,
      timestamp: Date.now(),
      message: `${user.name} joined the session`,
    }]);
  }, []);
  
  const removeParticipant = useCallback((userId) => {
    setParticipants(prev => prev.filter(p => p.id !== userId));
  }, []);
  
  const logTaskComplete = useCallback((user, task, xp) => {
    setTasksCompleted(prev => prev + 1);
    setTotalXP(prev => prev + xp);
    setActivityLog(prev => [...prev, {
      type: 'task_complete',
      user,
      task,
      xp,
      timestamp: Date.now(),
      message: `${user.name} completed "${task.title}"`,
    }]);
    onTaskComplete?.({ user, task, xp });
  }, [onTaskComplete]);
  
  return {
    state,
    timeRemaining,
    participants,
    activityLog,
    tasksCompleted,
    totalXP,
    xpMultiplier,
    start,
    pause,
    resume,
    stop,
    addParticipant,
    removeParticipant,
    logTaskComplete,
    isActive: state === SESSION_STATES.ACTIVE,
    isPaused: state === SESSION_STATES.PAUSED,
    isBreak: state === SESSION_STATES.BREAK,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMER DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function TimerDisplay({ seconds, size = 'lg', isBreak = false }) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };
  
  return (
    <div className={`
      font-mono font-bold
      ${sizeClasses[size]}
      ${isBreak ? 'text-cyan-400' : 'text-text-primary'}
    `}>
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICIPANT AVATAR ROW
// ═══════════════════════════════════════════════════════════════════════════════

function ParticipantRow({ participants, maxShow = 5 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {participants.slice(0, maxShow).map((user, idx) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full bg-surface-2 border-2 border-surface-0 flex items-center justify-center"
            title={user.name}
            style={{ zIndex: maxShow - idx }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              <span className="text-xs font-medium text-text-secondary">
                {user.name?.charAt(0)}
              </span>
            )}
          </div>
        ))}
      </div>
      {participants.length > maxShow && (
        <span className="text-xs text-text-tertiary">
          +{participants.length - maxShow}
        </span>
      )}
      <span className="text-xs text-text-tertiary">
        {participants.length} working together
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityFeed({ activities, maxShow = 5 }) {
  const recent = activities.slice(-maxShow).reverse();
  
  const getIcon = (type) => {
    switch (type) {
      case 'task_complete': return <CheckCircle2 className="w-3 h-3 text-success-500" />;
      case 'join': return <Plus className="w-3 h-3 text-brand-400" />;
      case 'session_start': return <Play className="w-3 h-3 text-success-500" />;
      default: return <Sparkles className="w-3 h-3 text-text-tertiary" />;
    }
  };
  
  const formatTime = (timestamp) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'just now';
    return `${Math.floor(diff / 60)}m ago`;
  };
  
  return (
    <div className="space-y-2">
      {recent.map((activity, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 text-xs animate-in slide-in-from-top duration-200"
        >
          {getIcon(activity.type)}
          <span className="text-text-secondary flex-1">{activity.message}</span>
          {activity.xp && (
            <span className="text-success-400">+{activity.xp} XP</span>
          )}
          <span className="text-text-tertiary">{formatTime(activity.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CO-WORKING SESSION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CoWorkingSessionPanel - Full co-working session UI
 */
export function CoWorkingSessionPanel({
  session,
  currentUser,
  onInvite,
  onClose,
  className = '',
}) {
  const {
    state,
    timeRemaining,
    participants,
    activityLog,
    tasksCompleted,
    totalXP,
    xpMultiplier,
    start,
    pause,
    resume,
    stop,
    isActive,
    isPaused,
    isBreak,
  } = session;
  
  const [showInvite, setShowInvite] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-1 border border-white/[0.08]
      shadow-2xl
      ${className}
    `}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-brand-500/10 to-purple-500/10 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <span className="font-medium text-text-primary">Co-Working Session</span>
            {isActive && (
              <span className="px-2 py-0.5 rounded-full bg-success-500/20 text-success-400 text-xs">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-text-tertiary"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-text-tertiary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Timer Section */}
      <div className="p-6 text-center">
        {isBreak ? (
          <div className="mb-2">
            <Coffee className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <span className="text-sm text-cyan-400">Break Time!</span>
          </div>
        ) : null}
        
        <TimerDisplay seconds={timeRemaining} isBreak={isBreak} />
        
        {/* XP Multiplier badge */}
        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-500/10 border border-success-500/30">
          <Zap className="w-3 h-3 text-success-400" />
          <span className="text-xs font-medium text-success-400">
            {Math.round((xpMultiplier - 1) * 100)}% XP Bonus Active
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {state === SESSION_STATES.IDLE && (
            <button
              onClick={start}
              className="px-6 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-400 transition-colors flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Session</span>
            </button>
          )}
          
          {isActive && (
            <>
              <button
                onClick={pause}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={stop}
                className="px-4 py-2 rounded-lg bg-error-500/10 text-error-400 hover:bg-error-500/20 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
          
          {isPaused && (
            <>
              <button
                onClick={resume}
                className="px-6 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-400 transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>Resume</span>
              </button>
              <button
                onClick={stop}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Participants */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-secondary">Participants</span>
          <button
            onClick={() => setShowInvite(true)}
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Invite</span>
          </button>
        </div>
        <ParticipantRow participants={[currentUser, ...participants]} />
      </div>
      
      {/* Stats */}
      <div className="px-4 py-3 border-t border-white/[0.06] grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{tasksCompleted}</div>
          <div className="text-xs text-text-tertiary">Tasks Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-400">+{Math.round(totalXP * xpMultiplier)}</div>
          <div className="text-xs text-text-tertiary">XP Earned</div>
        </div>
      </div>
      
      {/* Activity Feed */}
      {activityLog.length > 0 && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="text-xs font-medium text-text-tertiary mb-2">Activity</div>
          <ActivityFeed activities={activityLog} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE TO CO-WORK BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * InviteToCoWorkButton - Quick invite button for user profiles/cards
 */
export function InviteToCoWorkButton({
  user,
  onInvite,
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
      onClick={() => onInvite?.(user)}
      className={`
        rounded-lg
        bg-brand-500/10 text-brand-400 border border-brand-500/30
        hover:bg-brand-500/20 transition-colors
        flex items-center gap-1.5
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Users className="w-3 h-3" />
      <span>Co-work</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CO-WORKING INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniCoWorkingIndicator - Shows active co-working session status
 */
export function MiniCoWorkingIndicator({
  session,
  onClick,
  className = '',
}) {
  if (session.state === SESSION_STATES.IDLE) return null;
  
  const minutes = Math.floor(session.timeRemaining / 60);
  const secs = session.timeRemaining % 60;
  
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
      <div className="flex -space-x-1">
        {session.participants.slice(0, 3).map(p => (
          <div
            key={p.id}
            className="w-5 h-5 rounded-full bg-surface-2 border border-surface-0"
          >
            {p.avatar ? (
              <img src={p.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              <span className="text-[8px]">{p.name?.charAt(0)}</span>
            )}
          </div>
        ))}
      </div>
      <span className="text-xs font-mono text-brand-400">
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      {session.isBreak && <Coffee className="w-3 h-3 text-cyan-400" />}
    </button>
  );
}

export default CoWorkingSessionPanel;
