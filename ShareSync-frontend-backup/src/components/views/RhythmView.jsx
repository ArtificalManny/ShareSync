// src/components/views/RhythmView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// RhythmView — Weekly calendar with energy zones + session scheduling
// ✅ Proper light/dark mode using ShareSync design tokens
// ✅ Lowered z-indices to avoid burying tab dropdown menus
// ✅ Violet brand button + improved visual hierarchy
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, Clock,
  Zap, Sun, Moon, Coffee, Brain, Shield
} from 'lucide-react';
import { getProjectRhythm, createEvent } from '../../api/calendar';
import CreateSessionModal from '../../calendar/CreateSessionModal';

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
  { hours: [8, 9, 10, 11], label: 'High Energy', icon: Sun, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-500/[0.04]' },
  { hours: [12, 13, 14], label: 'Medium Energy', icon: Coffee, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50/50 dark:bg-cyan-500/[0.04]' },
  { hours: [15, 16, 17, 18], label: 'Lower Energy', icon: Moon, color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50/50 dark:bg-violet-500/[0.04]' },
];

// ─── CalendarEvent ──────────────────────────────────────────────────────────

function CalendarEvent({ event }) {
  const getEventColor = () => {
    switch (event.type) {
      case 'focus':
        return 'bg-violet-100 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500/30 text-violet-800 dark:text-violet-300 shadow-sm';
      case 'meeting':
        return 'bg-cyan-100 dark:bg-cyan-500/20 border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 shadow-sm';
      case 'task':
        return 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-sm';
      default:
        return 'bg-slate-100 dark:bg-white/[0.06] border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white/70 shadow-sm';
    }
  };

  const height = (event.duration / 60) * 64;

  return (
    <div
      className={`absolute left-1 right-1 rounded-lg border px-3 py-2 cursor-pointer
        hover:brightness-110 dark:hover:brightness-125 transition-all
        ${getEventColor()}`}
      style={{
        top: `${((event.startHour - 8) + event.startMinute / 60) * 64}px`,
        height: `${Math.max(height, 48)}px`,
        /* ✅ LOWERED from z-20 to z-[5] so tab dropdown isn't buried */
        zIndex: 5,
      }}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      {height >= 48 && (
        <div className="text-xs opacity-70 mt-0.5">
          {event.startHour > 12 ? event.startHour - 12 : event.startHour}:{String(event.startMinute).padStart(2, '0')} {event.startHour >= 12 ? 'PM' : 'AM'}
        </div>
      )}
    </div>
  );
}

// ─── DayColumn ──────────────────────────────────────────────────────────────

function DayColumn({ day, events, isToday, workload, onAddEvent }) {
  const getWorkloadColor = () => {
    if (workload > 100) return 'bg-rose-500';
    if (workload > 80) return 'bg-amber-500';
    if (workload > 50) return 'bg-emerald-500';
    return 'bg-violet-500';
  };

  return (
    <div className="flex-1 min-w-[140px] border-r border-slate-100 dark:border-white/[0.04] last:border-r-0">
      {/* Day header — ✅ LOWERED from z-30 to z-[8] */}
      <div className={`sticky top-0 z-[8] px-3 py-3 border-b border-slate-200 dark:border-white/[0.06]
        ${isToday
          ? 'bg-violet-50 dark:bg-violet-500/10'
          : 'bg-white dark:bg-[#1f1f23]'
        }`}
      >
        <div className="text-center">
          <div className={`text-sm font-medium ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-white/50'}`}>
            {day.dayName}
          </div>
          <div className={`text-2xl font-bold ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-800 dark:text-white'}`}>
            {day.date}
          </div>
        </div>
        {/* Workload bar */}
        <div className="mt-2 h-1.5 bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getWorkloadColor()}`}
            style={{ width: `${Math.min(workload, 100)}%` }}
          />
        </div>
      </div>

      {/* Time slot grid */}
      <div className="relative bg-white dark:bg-[#1a1a1e]">
        {TIME_SLOTS.map((slot) => {
          const zone = ENERGY_ZONES.find(z => z.hours.includes(slot.hour));
          return (
            <div
              key={slot.hour}
              className={`h-16 border-b border-slate-100 dark:border-white/[0.04] cursor-pointer
                hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors relative group
                ${zone?.bg || ''}`}
              onClick={() => onAddEvent(day.fullDate, slot.hour)}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-5 h-5 text-slate-300 dark:text-white/20" />
              </div>
            </div>
          );
        })}
        {events.map(event => <CalendarEvent key={event.id} event={event} />)}
      </div>
    </div>
  );
}

// ─── EnergySidebar ──────────────────────────────────────────────────────────

function EnergySidebar() {
  return (
    <div className="w-24 flex-shrink-0 border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#1a1a1e]"
      /* ✅ LOWERED from z-20 to z-[6] */
      style={{ zIndex: 6 }}
    >
      {/* Spacer to align with day headers */}
      <div className="h-[88px] border-b border-slate-200 dark:border-white/[0.06]" />

      {TIME_SLOTS.map((slot) => {
        const zone = ENERGY_ZONES.find(z => z.hours.includes(slot.hour));
        const Icon = zone?.icon || Clock;
        const isZoneStart = zone?.hours[0] === slot.hour;

        return (
          <div key={slot.hour} className="h-16 relative border-b border-slate-100 dark:border-white/[0.04]">
            <div className="absolute -top-3 left-3 text-[11px] font-medium text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-[#1a1a1e] px-1">
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RhythmView({ projectId }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [realEvents, setRealEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ✅ FIX: STRICT BOUNDARIES. Clamp to exact 00:00:00 of the correct day.
  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setHours(0, 0, 0, 0); // Absolute midnight
    start.setDate(start.getDate() - start.getDay() + 1); // Monday

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        date: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date, // Safely 00:00:00
        isToday: date.toDateString() === new Date().toDateString()
      };
    });
  }, [currentWeek]);

  const loadRhythmData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Form absolute boundary strings
      const startBound = new Date(weekDays[0].fullDate);
      startBound.setHours(0, 0, 0, 0);

      const endBound = new Date(weekDays[4].fullDate);
      endBound.setHours(23, 59, 59, 999);

      const payload = await getProjectRhythm(projectId, startBound.toISOString(), endBound.toISOString());

      console.log("📅 Loaded Rhythm Payload:", payload); // Debug Log

      if (payload?.data) {
        const mapped = payload.data.map(item => {
          const startDate = new Date(item.startAt);
          const endDate = new Date(item.endAt);
          const dayIndex = startDate.getDay() - 1; // 0=Mon, 4=Fri

          let duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
          if (isNaN(duration) || duration <= 0) duration = 60; // Fallback

          let uiType = 'task';
          if (item.type === 'event' || item.type === 'meeting') uiType = 'meeting';
          if (item.title.toLowerCase().includes('focus')) uiType = 'focus';

          return {
            id: item.id,
            title: item.title,
            type: uiType,
            startHour: startDate.getHours(),
            startMinute: startDate.getMinutes(),
            duration: duration,
            day: dayIndex,
          };
        }).filter(e => e.day >= 0 && e.day <= 4);

        setRealEvents(mapped);
      }
    } catch (err) {
      console.error("Failed to load Rhythm timeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRhythmData();
  }, [projectId, currentWeek]);

  const handleAddEventClick = (date, hour) => {
    setSelectedSlot({ date, hour });
    setIsModalOpen(true);
  };

  const handleSaveSession = async (eventData) => {
    try {
      await createEvent(eventData);
      console.log("✅ Successfully created event");
      await loadRhythmData(); // Instantly fetch to update grid
    } catch (err) {
      console.error("Failed to save event", err);
      alert("Failed to save session! Check the console.");
    }
  };

  const workloads = weekDays.map((_, idx) => {
    const dayEvents = realEvents.filter(e => e.day === idx);
    const totalMinutes = dayEvents.reduce((sum, e) => sum + e.duration, 0);
    return Math.round((totalMinutes / 480) * 100);
  });

  return (
    <div className="p-6 lg:p-10 max-w-full mx-auto pb-32">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAddEventClick(new Date(), 9)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium
              transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { const p = new Date(currentWeek); p.setDate(p.getDate() - 7); setCurrentWeek(p); }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-white/40 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]
              text-sm text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors"
          >
            Today
          </button>

          <div className="px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]">
            <span className="text-sm font-medium text-slate-800 dark:text-white">
              {weekDays[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[4].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <button
            onClick={() => { const n = new Date(currentWeek); n.setDate(n.getDate() + 7); setCurrentWeek(n); }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-white/40 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Calendar Grid ──────────────────────────────────────────────── */}
      <div className="flex gap-6">
        <div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1f1f23] overflow-hidden relative shadow-sm">
          {/* Loading overlay — ✅ LOWERED from z-50 to z-[15] */}
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center"
              style={{ zIndex: 15 }}
            >
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="flex">
            <EnergySidebar />
            {weekDays.map((day, idx) => (
              <DayColumn
                key={idx}
                day={day}
                events={realEvents.filter(e => e.day === idx)}
                isToday={day.isToday}
                workload={workloads[idx]}
                onAddEvent={handleAddEventClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Empty state hint */}
      {!loading && realEvents.length === 0 && (
        <div className="mt-6 text-center py-10 bg-white dark:bg-[#1f1f23] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-violet-500" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-white/60 mb-1">No sessions scheduled this week</p>
          <p className="text-xs text-slate-400 dark:text-white/30 max-w-xs mx-auto mb-4">Click any time slot or use the button above to schedule focus sessions, meetings, or deep work blocks.</p>
          <button
            onClick={() => handleAddEventClick(new Date(), 9)}
            className="px-4 py-2 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Your First Session
          </button>
        </div>
      )}

      {/* ── Session Modal ──────────────────────────────────────────────── */}
      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedSlot}
        onSave={handleSaveSession}
        projectId={projectId}
      />
    </div>
  );
}
