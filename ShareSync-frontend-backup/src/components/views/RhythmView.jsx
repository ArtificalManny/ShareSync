// src/components/views/RhythmView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// RhythmView — Weekly rhythm map with energy zones + session scheduling
// Visual polish only: preserves project rhythm loading, session creation, week nav,
// selected slot behavior, modal wiring, and lowered z-index safety.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Sun,
  Moon,
  Coffee,
  Brain,
  Shield,
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
  {
    hours: [8, 9, 10, 11],
    label: 'High Energy',
    shortLabel: 'High',
    icon: Sun,
    color: 'text-amber-500 dark:text-amber-300',
    bg: 'bg-amber-50/60 dark:bg-amber-500/[0.05]',
    ring: 'border-amber-200 dark:border-amber-400/20',
  },
  {
    hours: [12, 13, 14],
    label: 'Medium Energy',
    shortLabel: 'Mid',
    icon: Coffee,
    color: 'text-cyan-500 dark:text-cyan-300',
    bg: 'bg-cyan-50/60 dark:bg-cyan-500/[0.05]',
    ring: 'border-cyan-200 dark:border-cyan-400/20',
  },
  {
    hours: [15, 16, 17, 18],
    label: 'Lower Energy',
    shortLabel: 'Low',
    icon: Moon,
    color: 'text-violet-500 dark:text-violet-300',
    bg: 'bg-violet-50/60 dark:bg-violet-500/[0.05]',
    ring: 'border-violet-200 dark:border-violet-400/20',
  },
];

function formatSessionTime(hour, minute = 0) {
  const safeHour = Number.isFinite(Number(hour)) ? Number(hour) : 8;
  const safeMinute = Number.isFinite(Number(minute)) ? Number(minute) : 0;
  const displayHour = safeHour > 12 ? safeHour - 12 : safeHour === 0 ? 12 : safeHour;
  const suffix = safeHour >= 12 ? 'PM' : 'AM';

  return `${displayHour}:${String(safeMinute).padStart(2, '0')} ${suffix}`;
}

function getEventMeta(type) {
  switch (type) {
    case 'focus':
      return {
        label: 'Focus',
        icon: Brain,
        shell:
          'border-violet-300/70 bg-violet-50/95 text-violet-900 shadow-violet-500/10 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-100',
        rail: 'from-violet-500 to-fuchsia-400',
        chip:
          'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-400/10 dark:text-violet-200 dark:border-violet-400/20',
      };
    case 'meeting':
      return {
        label: 'Meeting',
        icon: Zap,
        shell:
          'border-cyan-300/70 bg-cyan-50/95 text-cyan-900 shadow-cyan-500/10 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-100',
        rail: 'from-cyan-500 to-sky-400',
        chip:
          'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-200 dark:border-cyan-400/20',
      };
    case 'task':
      return {
        label: 'Task',
        icon: Shield,
        shell:
          'border-emerald-300/70 bg-emerald-50/95 text-emerald-900 shadow-emerald-500/10 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-100',
        rail: 'from-emerald-500 to-teal-400',
        chip:
          'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-400/20',
      };
    default:
      return {
        label: 'Session',
        icon: Clock,
        shell:
          'border-slate-300/70 bg-white/95 text-slate-800 shadow-slate-500/10 dark:border-white/[0.10] dark:bg-white/[0.08] dark:text-white',
        rail: 'from-slate-400 to-slate-300',
        chip:
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/[0.10]',
      };
  }
}

// ─── CalendarEvent ──────────────────────────────────────────────────────────

function CalendarEvent({ event }) {
  const meta = getEventMeta(event.type);
  const Icon = meta.icon;

  const height = (event.duration / 60) * 64;
  const startHour = Number.isFinite(Number(event.startHour)) ? Number(event.startHour) : 8;
  const startMinute = Number.isFinite(Number(event.startMinute)) ? Number(event.startMinute) : 0;

  return (
    <div
      className={`
        absolute left-2 right-2 overflow-hidden rounded-2xl border px-3 py-2.5
        cursor-pointer shadow-lg backdrop-blur-xl transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-xl ${meta.shell}
      `}
      style={{
        top: `${((startHour - 8) + startMinute / 60) * 64}px`,
        height: `${Math.max(height, 52)}px`,
        zIndex: 5,
      }}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${meta.rail}`} />

      <div className="flex items-start gap-2 pl-1">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm dark:bg-white/[0.08]">
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black leading-5">
            {event.title}
          </div>

          {height >= 48 && (
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${meta.chip}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-bold opacity-70">
                {formatSessionTime(startHour, startMinute)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DayColumn ──────────────────────────────────────────────────────────────

function DayColumn({ day, events, isToday, workload, onAddEvent }) {
  const getWorkloadTone = () => {
    if (workload > 100) return 'from-rose-500 to-orange-400';
    if (workload > 80) return 'from-amber-500 to-orange-400';
    if (workload > 50) return 'from-emerald-500 to-cyan-400';
    return 'from-violet-500 to-cyan-400';
  };

  const workloadLabel =
    workload > 100 ? 'Overloaded' : workload > 80 ? 'Heavy' : workload > 50 ? 'Healthy' : 'Open';

  return (
    <div className="min-w-[170px] flex-1 border-r border-slate-200/70 last:border-r-0 dark:border-white/[0.06]">
      <div
        className={`
          sticky top-0 z-[8] border-b px-3 py-4 backdrop-blur-xl
          ${
            isToday
              ? 'border-violet-200 bg-violet-50/90 dark:border-violet-400/20 dark:bg-violet-500/10'
              : 'border-slate-200 bg-white/85 dark:border-white/[0.06] dark:bg-[#15151a]/90'
          }
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div
              className={`text-xs font-black uppercase tracking-[0.18em] ${
                isToday
                  ? 'text-violet-600 dark:text-violet-300'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {day.dayName}
            </div>

            <div
              className={`mt-1 text-3xl font-black tracking-tight ${
                isToday
                  ? 'text-violet-700 dark:text-violet-200'
                  : 'text-slate-950 dark:text-white'
              }`}
            >
              {day.date}
            </div>
          </div>

          <span
            className={`
              rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em]
              ${
                isToday
                  ? 'border-violet-200 bg-white text-violet-700 dark:border-violet-400/20 dark:bg-white/[0.08] dark:text-violet-200'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-400'
              }
            `}
          >
            {workloadLabel}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.08]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getWorkloadTone()} transition-all duration-500`}
            style={{ width: `${Math.min(workload, 100)}%` }}
          />
        </div>
      </div>

      <div className="relative bg-white/80 dark:bg-[#101014]/80">
        {TIME_SLOTS.map((slot) => {
          const zone = ENERGY_ZONES.find((z) => z.hours.includes(slot.hour));
          const ZoneIcon = zone?.icon || Clock;

          return (
            <div
              key={slot.hour}
              className={`
                group relative h-16 cursor-pointer border-b border-slate-100 transition-all
                hover:bg-white hover:shadow-[inset_0_0_0_1px_rgba(124,58,237,0.14)]
                dark:border-white/[0.04] dark:hover:bg-white/[0.04]
                ${zone?.bg || ''}
              `}
              onClick={() => onAddEvent(day.fullDate, slot.hour)}
            >
              <div className="absolute inset-2 flex items-center justify-center rounded-2xl border border-dashed border-transparent opacity-0 transition-all group-hover:border-violet-200 group-hover:bg-violet-50/70 group-hover:opacity-100 dark:group-hover:border-violet-400/20 dark:group-hover:bg-violet-500/10">
                <div className="flex items-center gap-2 text-xs font-black text-violet-600 dark:text-violet-200">
                  <Plus className="h-4 w-4" />
                  Add block
                </div>
              </div>

              <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-60">
                <ZoneIcon className={`h-3.5 w-3.5 ${zone?.color || 'text-slate-300'}`} />
              </div>
            </div>
          );
        })}

        {events.map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// ─── EnergySidebar ──────────────────────────────────────────────────────────

function EnergySidebar() {
  return (
    <div
      className="w-28 flex-shrink-0 border-r border-slate-200/80 bg-slate-50/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#111116]/90"
      style={{ zIndex: 6 }}
    >
      <div className="flex h-[101px] items-center justify-center border-b border-slate-200/80 dark:border-white/[0.06]">
        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2 text-center shadow-sm dark:border-violet-400/20 dark:bg-white/[0.06]">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-200">
            Energy
          </div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            Zones
          </div>
        </div>
      </div>

      {TIME_SLOTS.map((slot) => {
        const zone = ENERGY_ZONES.find((z) => z.hours.includes(slot.hour));
        const Icon = zone?.icon || Clock;
        const isZoneStart = zone?.hours[0] === slot.hour;

        return (
          <div key={slot.hour} className="relative h-16 border-b border-slate-100 dark:border-white/[0.04]">
            <div className="absolute -top-3 left-3 rounded-full bg-slate-50 px-2 text-[11px] font-black text-slate-400 dark:bg-[#111116] dark:text-white/30">
              {slot.label}
            </div>

            {isZoneStart && (
              <div className={`absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 ${zone.color}`}>
                <Icon className="h-4 w-4" />
                <span className="hidden text-[9px] font-black uppercase tracking-[0.14em] xl:inline">
                  {zone.shortLabel}
                </span>
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

  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay() + 1);

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      return {
        date: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date,
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  }, [currentWeek]);

  const loadRhythmData = async () => {
    if (!projectId) return;

    setLoading(true);

    try {
      const startBound = new Date(weekDays[0].fullDate);
      startBound.setHours(0, 0, 0, 0);

      const endBound = new Date(weekDays[4].fullDate);
      endBound.setHours(23, 59, 59, 999);

      const payload = await getProjectRhythm(
        projectId,
        startBound.toISOString(),
        endBound.toISOString()
      );

      console.log('📅 Loaded Rhythm Payload:', payload);

      if (payload?.data) {
        const mapped = payload.data
          .map((item) => {
            const startDate = new Date(item.startAt);
            const endDate = new Date(item.endAt);
            const dayIndex = startDate.getDay() - 1;

            let duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
            if (isNaN(duration) || duration <= 0) duration = 60;

            let uiType = 'task';
            if (item.type === 'event' || item.type === 'meeting') uiType = 'meeting';
            if (item.title.toLowerCase().includes('focus')) uiType = 'focus';

            return {
              id: item.id,
              title: item.title,
              type: uiType,
              startHour: startDate.getHours(),
              startMinute: startDate.getMinutes(),
              duration,
              day: dayIndex,
            };
          })
          .filter((event) => event.day >= 0 && event.day <= 4);

        setRealEvents(mapped);
      }
    } catch (err) {
      console.error('Failed to load Rhythm timeline', err);
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
      console.log('✅ Successfully created event');
      await loadRhythmData();
    } catch (err) {
      console.error('Failed to save event', err);
      alert('Failed to save session! Check the console.');
    }
  };

  const workloads = weekDays.map((_, idx) => {
    const dayEvents = realEvents.filter((event) => event.day === idx);
    const totalMinutes = dayEvents.reduce((sum, event) => sum + event.duration, 0);
    return Math.round((totalMinutes / 480) * 100);
  });

  const rhythmStats = useMemo(() => {
    const totalMinutes = realEvents.reduce((sum, event) => sum + Number(event.duration || 0), 0);
    const focusCount = realEvents.filter((event) => event.type === 'focus').length;
    const meetingCount = realEvents.filter((event) => event.type === 'meeting').length;
    const taskCount = realEvents.filter((event) => event.type === 'task').length;
    const openSlots = Math.max(0, TIME_SLOTS.length * weekDays.length - realEvents.length);

    return {
      sessions: realEvents.length,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      focusCount,
      meetingCount,
      taskCount,
      openSlots,
    };
  }, [realEvents, weekDays.length]);

  return (
    <section className="relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 dark:opacity-20" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
                <Clock className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    Schedule
                  </h2>

                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                    Rhythm Map
                  </span>

                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                    Live Week
                  </span>
                </div>

                <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                  Protect focus blocks, coordinate meetings, and shape the project’s execution rhythm across the week.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <button
                onClick={() => {
                  const previous = new Date(currentWeek);
                  previous.setDate(previous.getDate() - 7);
                  setCurrentWeek(previous);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.10] dark:hover:text-white"
                title="Previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => setCurrentWeek(new Date())}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-200 dark:hover:bg-white/[0.10]"
              >
                Today
              </button>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white">
                {weekDays[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {weekDays[4].fullDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>

              <button
                onClick={() => {
                  const next = new Date(currentWeek);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeek(next);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.10] dark:hover:text-white"
                title="Next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => handleAddEventClick(new Date(), 9)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Session</span>
              </button>
            </div>
          </div>

          {/* Rhythm signals */}
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                Sessions
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.sessions}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                Scheduled Hours
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.hours}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                Focus Blocks
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.focusCount}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
                Open Slots
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.openSlots}
              </div>
            </div>
          </div>

          {/* Energy legend */}
          <div className="mt-5 flex flex-wrap gap-2">
            {ENERGY_ZONES.map((zone) => {
              const Icon = zone.icon;

              return (
                <div
                  key={zone.label}
                  className={`inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-2 text-xs font-black shadow-sm backdrop-blur-xl dark:bg-white/[0.05] ${zone.ring}`}
                >
                  <Icon className={`h-4 w-4 ${zone.color}`} />
                  <span className="text-slate-600 dark:text-zinc-300">{zone.label}</span>
                </div>
              );
            })}

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Realtime rhythm
            </div>
          </div>

          {/* Calendar grid */}
          <div className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30">
            <div className="relative">
              {loading && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-white/65 backdrop-blur-sm dark:bg-black/40"
                  style={{ zIndex: 15 }}
                >
                  <div className="rounded-3xl border border-violet-200 bg-white px-5 py-4 shadow-xl dark:border-violet-400/20 dark:bg-[#111113]">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    <div className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                      Loading rhythm
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="flex min-w-[980px]">
                  <EnergySidebar />

                  {weekDays.map((day, idx) => (
                    <DayColumn
                      key={idx}
                      day={day}
                      events={realEvents.filter((event) => event.day === idx)}
                      isToday={day.isToday}
                      workload={workloads[idx]}
                      onAddEvent={handleAddEventClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!loading && realEvents.length === 0 && (
            <div className="mt-6 overflow-hidden rounded-[2rem] border border-dashed border-violet-200 bg-white/75 p-10 text-center shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-white/[0.04]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-violet-200 bg-violet-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                <Clock className="h-7 w-7" />
              </div>

              <p className="text-base font-black text-slate-900 dark:text-white">
                No sessions scheduled this week
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500 dark:text-zinc-400">
                Click any time slot or schedule your first focus block to protect deep work, meetings, and execution windows.
              </p>

              <button
                onClick={() => handleAddEventClick(new Date(), 9)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                Schedule Your First Session
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedSlot}
        onSave={handleSaveSession}
        projectId={projectId}
      />
    </section>
  );
}
