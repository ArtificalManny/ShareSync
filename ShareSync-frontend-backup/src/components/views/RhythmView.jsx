// src/components/views/RhythmView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// RHYTHM VIEW: Energy-aware calendar
// Schedule work based on energy levels, protect focus time
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, Calendar, Clock,
  Zap, Sun, Moon, Coffee, Brain, Shield, Users,
  AlertTriangle, CheckCircle2, MoreHorizontal
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME SLOTS
// ═══════════════════════════════════════════════════════════════════════════════

const TIME_SLOTS = [
  { hour: 8, label: '8 AM' },
  { hour: 9, label: '9 AM' },
  { hour: 10, label: '10 AM' },
  { hour: 11, label: '11 AM' },
  { hour: 12, label: '12 PM' },
  { hour: 13, label: '1 PM' },
  { hour: 14, label: '2 PM' },
  { hour: 15, label: '3 PM' },
  { hour: 16, label: '4 PM' },
  { hour: 17, label: '5 PM' },
  { hour: 18, label: '6 PM' },
];

const ENERGY_ZONES = [
  { hours: [8, 9, 10, 11], label: 'High Energy', icon: Sun, color: 'text-warning-400', bg: 'bg-warning-500/5' },
  { hours: [12, 13, 14], label: 'Medium Energy', icon: Coffee, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
  { hours: [15, 16, 17, 18], label: 'Lower Energy', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/5' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR EVENT
// ═══════════════════════════════════════════════════════════════════════════════

function CalendarEvent({ event, onEventClick }) {
  const getEventColor = () => {
    switch (event.type) {
      case 'focus': return 'bg-brand-500/20 border-brand-500/30 text-brand-400';
      case 'meeting': return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400';
      case 'task': return 'bg-success-500/20 border-success-500/30 text-success-400';
      case 'break': return 'bg-surface-2 border-white/[0.08] text-text-tertiary';
      default: return 'bg-surface-2 border-white/[0.08] text-text-secondary';
    }
  };
  
  const height = (event.duration / 60) * 64; // 64px per hour
  
  return (
    <div
      onClick={() => onEventClick?.(event)}
      className={`
        absolute left-1 right-1 rounded-lg border px-3 py-2
        cursor-pointer hover:brightness-110 transition-all
        ${getEventColor()}
      `}
      style={{ 
        top: `${((event.startHour - 8) + event.startMinute / 60) * 64}px`,
        height: `${Math.max(height, 48)}px`
      }}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      {height >= 48 && (
        <div className="text-xs opacity-70 mt-0.5">
          {event.startHour}:{String(event.startMinute).padStart(2, '0')} - 
          {Math.floor(event.startHour + event.duration / 60)}:{String((event.startMinute + event.duration) % 60).padStart(2, '0')}
        </div>
      )}
      {event.xp > 0 && height >= 64 && (
        <div className="flex items-center gap-1 mt-1 text-xs">
          <Zap className="w-3 h-3" />
          <span>+{event.xp} XP</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAY COLUMN
// ═══════════════════════════════════════════════════════════════════════════════

function DayColumn({ day, events, isToday, workload, onAddEvent }) {
  const getWorkloadColor = () => {
    if (workload > 100) return 'bg-error-500';
    if (workload > 80) return 'bg-warning-500';
    if (workload > 50) return 'bg-success-500';
    return 'bg-cyan-500';
  };
  
  return (
    <div className="flex-1 min-w-[140px]">
      {/* Day header */}
      <div className={`
        sticky top-0 z-10 px-3 py-3 border-b border-white/[0.06]
        ${isToday ? 'bg-brand-500/10' : 'bg-surface-0'}
      `}>
        <div className="text-center">
          <div className={`text-sm font-medium ${isToday ? 'text-brand-400' : 'text-text-secondary'}`}>
            {day.dayName}
          </div>
          <div className={`text-2xl font-bold ${isToday ? 'text-brand-400' : 'text-text-primary'}`}>
            {day.date}
          </div>
        </div>
        
        {/* Workload bar */}
        <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${getWorkloadColor()}`}
            style={{ width: `${Math.min(workload, 100)}%` }}
          />
        </div>
        <div className={`text-[10px] text-center mt-1 ${workload > 100 ? 'text-error-400' : 'text-text-tertiary'}`}>
          {workload}% capacity
        </div>
      </div>
      
      {/* Time slots */}
      <div className="relative">
        {TIME_SLOTS.map((slot, idx) => {
          const zone = ENERGY_ZONES.find(z => z.hours.includes(slot.hour));
          return (
            <div 
              key={slot.hour}
              className={`h-16 border-b border-white/[0.04] ${zone?.bg || ''}`}
              onClick={() => onAddEvent?.(day, slot.hour)}
            />
          );
        })}
        
        {/* Events */}
        {events.map(event => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

function EnergySidebar() {
  return (
    <div className="w-24 flex-shrink-0 border-r border-white/[0.06]">
      {/* Header spacer */}
      <div className="h-[88px] border-b border-white/[0.06]" />
      
      {/* Time labels with energy indicators */}
      {TIME_SLOTS.map((slot) => {
        const zone = ENERGY_ZONES.find(z => z.hours.includes(slot.hour));
        const Icon = zone?.icon || Clock;
        const isZoneStart = zone?.hours[0] === slot.hour;
        
        return (
          <div key={slot.hour} className="h-16 relative border-b border-white/[0.04]">
            <div className="absolute -top-3 left-3 text-xs text-text-tertiary">
              {slot.label}
            </div>
            
            {isZoneStart && (
              <div className={`absolute top-1/2 -translate-y-1/2 right-2 ${zone.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS TIME SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

function FocusTimeSettings({ protectedHours, onToggleProtection }) {
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-brand-400" />
        <div>
          <div className="text-sm font-medium text-text-primary">Focus Time Protection</div>
          <div className="text-xs text-text-tertiary">Block distractions during deep work</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center justify-between p-3 rounded-lg bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-warning-400" />
            <span className="text-sm text-text-secondary">Protect mornings (8-11 AM)</span>
          </div>
          <input 
            type="checkbox" 
            checked={protectedHours.includes('morning')}
            onChange={() => onToggleProtection?.('morning')}
            className="w-4 h-4 rounded border-white/[0.12] bg-surface-3 checked:bg-brand-500"
          />
        </label>
        
        <label className="flex items-center justify-between p-3 rounded-lg bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-text-secondary">Protect post-lunch (1-3 PM)</span>
          </div>
          <input 
            type="checkbox"
            checked={protectedHours.includes('afternoon')}
            onChange={() => onToggleProtection?.('afternoon')}
            className="w-4 h-4 rounded border-white/[0.12] bg-surface-3 checked:bg-brand-500"
          />
        </label>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-tertiary">Protected this week:</span>
          <span className="font-semibold text-success-400">12 hours</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RhythmView({ 
  events = [],
  onAddEvent,
  onEventClick 
}) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [protectedHours, setProtectedHours] = useState(['morning']);
  
  // Generate week days
  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        date: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date,
        isToday: date.toDateString() === new Date().toDateString()
      };
    });
  }, [currentWeek]);
  
  // Mock events
  const mockEvents = [
    { id: 1, title: 'Deep Work: API', type: 'focus', startHour: 9, startMinute: 0, duration: 120, xp: 150, day: 0 },
    { id: 2, title: 'Team Standup', type: 'meeting', startHour: 11, startMinute: 30, duration: 30, xp: 0, day: 0 },
    { id: 3, title: 'Code Review', type: 'task', startHour: 14, startMinute: 0, duration: 60, xp: 80, day: 0 },
    { id: 4, title: 'Focus: Features', type: 'focus', startHour: 9, startMinute: 0, duration: 180, xp: 200, day: 1 },
    { id: 5, title: '1:1 with Sarah', type: 'meeting', startHour: 15, startMinute: 0, duration: 45, xp: 0, day: 2 },
    { id: 6, title: 'Sprint Planning', type: 'meeting', startHour: 10, startMinute: 0, duration: 90, xp: 0, day: 4 },
  ];
  
  const displayEvents = events.length > 0 ? events : mockEvents;
  
  // Calculate workload per day
  const workloads = weekDays.map((_, idx) => {
    const dayEvents = displayEvents.filter(e => e.day === idx);
    const totalMinutes = dayEvents.reduce((sum, e) => sum + e.duration, 0);
    return Math.round((totalMinutes / 480) * 100); // 8 hour day
  });
  
  const handleToggleProtection = (period) => {
    setProtectedHours(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period)
        : [...prev, period]
    );
  };
  
  return (
    <div className="p-10 max-w-full mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onAddEvent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
          
          <div className="flex items-center gap-1 px-1 py-1 rounded-xl bg-surface-1 border border-white/[0.08]">
            <button className="px-3 py-1.5 rounded-lg text-sm bg-brand-500/10 text-brand-400 font-medium">
              Week
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-text-tertiary hover:text-text-secondary transition-colors">
              Month
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const prev = new Date(currentWeek);
              prev.setDate(prev.getDate() - 7);
              setCurrentWeek(prev);
            }}
            className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08] text-sm text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Today
          </button>
          
          <div className="px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08]">
            <span className="text-sm font-medium text-text-primary">
              {weekDays[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
              {weekDays[4].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <button 
            onClick={() => {
              const next = new Date(currentWeek);
              next.setDate(next.getDate() + 7);
              setCurrentWeek(next);
            }}
            className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 rounded-xl border border-white/[0.06] bg-surface-0 overflow-hidden">
          <div className="flex">
            <EnergySidebar />
            
            {weekDays.map((day, idx) => (
              <DayColumn
                key={idx}
                day={day}
                events={displayEvents.filter(e => e.day === idx)}
                isToday={day.isToday}
                workload={workloads[idx]}
                onAddEvent={onAddEvent}
              />
            ))}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Energy Legend */}
          <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
            <h3 className="text-sm font-medium text-text-primary mb-3">Energy Zones</h3>
            <div className="space-y-2">
              {ENERGY_ZONES.map(zone => {
                const Icon = zone.icon;
                return (
                  <div key={zone.label} className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${zone.color}`} />
                    <span className="text-sm text-text-secondary">{zone.label}</span>
                    <span className="text-xs text-text-tertiary ml-auto">
                      {zone.hours[0]}:00 - {zone.hours[zone.hours.length - 1] + 1}:00
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-text-tertiary mt-3">
              💡 Schedule complex tasks during high energy periods
            </p>
          </div>
          
          {/* Focus Time Settings */}
          <FocusTimeSettings 
            protectedHours={protectedHours}
            onToggleProtection={handleToggleProtection}
          />
          
          {/* Week Summary */}
          <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
            <h3 className="text-sm font-medium text-text-primary mb-3">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Focus time</span>
                <span className="text-sm font-semibold text-brand-400">8h 30m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Meetings</span>
                <span className="text-sm font-semibold text-cyan-400">4h 15m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Available</span>
                <span className="text-sm font-semibold text-success-400">27h 15m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
