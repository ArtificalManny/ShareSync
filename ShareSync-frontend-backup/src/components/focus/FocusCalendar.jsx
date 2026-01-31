// src/components/focus/FocusCalendar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS FORTRESS: Calendar Integration
// Shows available focus windows and integrates with calendar
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Zap, ChevronRight, CheckCircle2,
  AlertCircle, Play, CalendarPlus, Sun, Moon, Coffee
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS WINDOW TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const FOCUS_WINDOW_QUALITY = {
  OPTIMAL: 'optimal',     // 2+ hours uninterrupted
  GOOD: 'good',           // 1-2 hours
  LIMITED: 'limited',     // 30-60 minutes
  TIGHT: 'tight',         // Less than 30 minutes
};

const QUALITY_CONFIG = {
  [FOCUS_WINDOW_QUALITY.OPTIMAL]: {
    color: 'text-success-500',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
    label: 'Optimal',
    icon: Zap,
  },
  [FOCUS_WINDOW_QUALITY.GOOD]: {
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    borderColor: 'border-brand-500/30',
    label: 'Good',
    icon: CheckCircle2,
  },
  [FOCUS_WINDOW_QUALITY.LIMITED]: {
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    label: 'Limited',
    icon: Clock,
  },
  [FOCUS_WINDOW_QUALITY.TIGHT]: {
    color: 'text-text-tertiary',
    bgColor: 'bg-surface-2',
    borderColor: 'border-white/[0.06]',
    label: 'Tight',
    icon: AlertCircle,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getWindowQuality(durationMinutes) {
  if (durationMinutes >= 120) return FOCUS_WINDOW_QUALITY.OPTIMAL;
  if (durationMinutes >= 60) return FOCUS_WINDOW_QUALITY.GOOD;
  if (durationMinutes >= 30) return FOCUS_WINDOW_QUALITY.LIMITED;
  return FOCUS_WINDOW_QUALITY.TIGHT;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS WINDOW CARD
// ═══════════════════════════════════════════════════════════════════════════════

function FocusWindowCard({
  window,
  onStartFocus,
  onBlockCalendar,
  isRecommended = false,
}) {
  const quality = getWindowQuality(window.durationMinutes);
  const config = QUALITY_CONFIG[quality];
  const Icon = config.icon;
  
  return (
    <div className={`
      p-4 rounded-xl border transition-all duration-200
      ${config.bgColor} ${config.borderColor}
      ${isRecommended ? 'ring-2 ring-brand-500/30' : ''}
    `}>
      {isRecommended && (
        <div className="flex items-center gap-1 mb-2">
          <Zap className="w-3 h-3 text-brand-400" />
          <span className="text-xs font-medium text-brand-400">Recommended</span>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label} Window
            </span>
          </div>
          
          <div className="text-lg font-semibold text-text-primary mb-1">
            {formatTime(window.start)} - {formatTime(window.end)}
          </div>
          
          <div className="text-sm text-text-tertiary">
            {formatDuration(window.durationMinutes)} of uninterrupted time
          </div>
          
          {window.beforeEvent && (
            <div className="mt-2 text-xs text-text-tertiary">
              Before: {window.beforeEvent.title}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onStartFocus?.(window)}
            className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            <span>Focus</span>
          </button>
          
          {onBlockCalendar && (
            <button
              onClick={() => onBlockCalendar?.(window)}
              className="px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors flex items-center gap-1"
            >
              <CalendarPlus className="w-3 h-3" />
              <span>Block</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPCOMING MEETING INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function UpcomingMeeting({ event, minutesUntil }) {
  const isUrgent = minutesUntil <= 15;
  
  return (
    <div className={`
      p-3 rounded-xl border
      ${isUrgent 
        ? 'bg-warning-500/10 border-warning-500/30' 
        : 'bg-surface-1 border-white/[0.06]'
      }
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isUrgent ? 'bg-warning-500/20' : 'bg-surface-2'}
        `}>
          <Calendar className={`w-5 h-5 ${isUrgent ? 'text-warning-500' : 'text-text-tertiary'}`} />
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary truncate">
            {event.title}
          </div>
          <div className={`text-xs ${isUrgent ? 'text-warning-500' : 'text-text-tertiary'}`}>
            {minutesUntil <= 0 
              ? 'Starting now'
              : `In ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`
            }
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-text-tertiary" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FOCUS CALENDAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FocusCalendar - Shows available focus windows for today
 */
export function FocusCalendar({
  events = [],
  workHours = { start: 9, end: 18 },
  onStartFocus,
  onBlockCalendar,
  className = '',
}) {
  // Calculate focus windows between events
  const focusWindows = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const workStart = new Date(today.getTime() + workHours.start * 60 * 60 * 1000);
    const workEnd = new Date(today.getTime() + workHours.end * 60 * 60 * 1000);
    
    // Sort events by start time
    const sortedEvents = [...events]
      .filter(e => new Date(e.end) > now) // Only future events
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    
    const windows = [];
    let windowStart = now > workStart ? now : workStart;
    
    for (const event of sortedEvents) {
      const eventStart = new Date(event.start);
      
      if (eventStart > windowStart) {
        const durationMinutes = Math.floor((eventStart - windowStart) / (1000 * 60));
        
        if (durationMinutes >= 15) { // Only show windows >= 15 min
          windows.push({
            start: new Date(windowStart),
            end: eventStart,
            durationMinutes,
            beforeEvent: event,
          });
        }
      }
      
      windowStart = new Date(event.end);
    }
    
    // Add window after last event until end of work day
    if (windowStart < workEnd) {
      const durationMinutes = Math.floor((workEnd - windowStart) / (1000 * 60));
      
      if (durationMinutes >= 15) {
        windows.push({
          start: new Date(windowStart),
          end: workEnd,
          durationMinutes,
          beforeEvent: null,
        });
      }
    }
    
    return windows;
  }, [events, workHours]);
  
  // Find recommended window (longest optimal/good window)
  const recommendedWindow = useMemo(() => {
    const goodWindows = focusWindows.filter(w => w.durationMinutes >= 60);
    if (goodWindows.length === 0) return focusWindows[0];
    return goodWindows.reduce((best, current) => 
      current.durationMinutes > best.durationMinutes ? current : best
    );
  }, [focusWindows]);
  
  // Find upcoming meeting
  const upcomingEvent = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter(e => new Date(e.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
    
    if (!upcoming) return null;
    
    const minutesUntil = Math.floor((new Date(upcoming.start) - now) / (1000 * 60));
    return { event: upcoming, minutesUntil };
  }, [events]);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Focus Windows
              </div>
              <div className="text-sm text-text-tertiary">
                Today's available time
              </div>
            </div>
          </div>
          
          {focusWindows.length > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-brand-400">
                {formatDuration(focusWindows.reduce((sum, w) => sum + w.durationMinutes, 0))}
              </div>
              <div className="text-xs text-text-tertiary">total available</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Upcoming meeting alert */}
      {upcomingEvent && upcomingEvent.minutesUntil <= 60 && (
        <div className="p-4 border-b border-white/[0.06]">
          <UpcomingMeeting
            event={upcomingEvent.event}
            minutesUntil={upcomingEvent.minutesUntil}
          />
        </div>
      )}
      
      {/* Focus windows */}
      <div className="p-4 space-y-3">
        {focusWindows.length > 0 ? (
          focusWindows.map((window, idx) => (
            <FocusWindowCard
              key={idx}
              window={window}
              onStartFocus={onStartFocus}
              onBlockCalendar={onBlockCalendar}
              isRecommended={window === recommendedWindow}
            />
          ))
        ) : (
          <div className="py-8 text-center">
            <Calendar className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <div className="text-sm text-text-tertiary">
              No focus windows available today
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              Try blocking time on your calendar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURRENT WINDOW BANNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CurrentWindowBanner - Shows current focus opportunity
 */
export function CurrentWindowBanner({
  window,
  nextEvent,
  onStartFocus,
  className = '',
}) {
  if (!window) return null;
  
  const quality = getWindowQuality(window.durationMinutes);
  const config = QUALITY_CONFIG[quality];
  
  return (
    <div className={`
      p-4 rounded-xl
      bg-gradient-to-r from-brand-500/10 to-purple-500/10
      border border-brand-500/30
      ${className}
    `}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-brand-400" />
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-brand-400 mb-0.5">
            Focus Window Available
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {formatDuration(window.durationMinutes)} of uninterrupted time
          </div>
          {nextEvent && (
            <div className="text-xs text-text-tertiary mt-1">
              Before your {formatTime(new Date(nextEvent.start))} {nextEvent.title}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onStartFocus?.(window)}
          className="
            px-4 py-2 rounded-lg
            bg-brand-500 text-white font-medium
            hover:bg-brand-400 transition-colors
            flex items-center gap-2
          "
        >
          <Play className="w-4 h-4" />
          <span>Start Focus</span>
        </button>
      </div>
    </div>
  );
}

export default FocusCalendar;
