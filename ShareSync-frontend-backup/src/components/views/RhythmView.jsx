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
import { getProjectRhythm, createEvent, updateEvent } from '../../api/calendar';
import CreateSessionModal from '../../calendar/CreateSessionModal';

const DEFAULT_SESSION_COLOR = '#8B5CF6';

const getSessionColor = (session) =>
  session?.color || session?.originalData?.color || DEFAULT_SESSION_COLOR;

const getSessionCardStyle = (session, extraStyle = {}) => {
  const sessionColor = getSessionColor(session);

  return {
    ...extraStyle,
    borderLeft: `6px solid ${sessionColor}`,
    background: `linear-gradient(135deg, ${sessionColor}26, rgba(255,255,255,0.72))`,
  };
};


const TIME_SLOTS = [
  { hour: 7, label: '7 AM' },
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
  { hour: 19, label: '7 PM' },
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


function getEventStartMinutes(event) {
  const hour = Number.isFinite(Number(event?.startHour)) ? Number(event.startHour) : 7;
  const minute = Number.isFinite(Number(event?.startMinute)) ? Number(event.startMinute) : 0;
  return hour * 60 + minute;
}

function getEventDurationMinutes(event) {
  const duration = Number(event?.duration);
  return Number.isFinite(duration) && duration > 0 ? duration : 30;
}

function layoutCalendarEvents(events = []) {
  const minVisualHeightPx = 40;
  const gapPx = 6;
  const hourHeightPx = 64;
  const dayStartMinutes = 7 * 60;

  const sorted = [...events].sort((a, b) => getEventStartMinutes(a) - getEventStartMinutes(b));
  let lastVisualBottom = -Infinity;

  return sorted.map((event) => {
    const start = getEventStartMinutes(event);
    const duration = getEventDurationMinutes(event);
    const exactTop = ((start - dayStartMinutes) / 60) * hourHeightPx;
    const height = Math.max((duration / 60) * hourHeightPx, minVisualHeightPx);
    const visualTop = Math.max(exactTop, lastVisualBottom + gapPx);

    lastVisualBottom = visualTop + height;

    return {
      ...event,
      _layout: {
        top: `${visualTop}px`,
        height: `${height}px`,
        left: '8px',
        width: 'calc(100% - 16px)',
      },
    };
  });
}

// ─── CalendarEvent ──────────────────────────────────────────────────────────

function CalendarEvent({ event, onEdit }) {
  const meta = getEventMeta(event.type);
  const Icon = meta.icon;

  const height = (event.duration / 60) * 64;
  const startHour = Number.isFinite(Number(event.startHour)) ? Number(event.startHour) : 7;
  const startMinute = Number.isFinite(Number(event.startMinute)) ? Number(event.startMinute) : 0;
  const canEdit = Boolean(event.editable && typeof onEdit === 'function');

  const handleEdit = () => {
    if (!canEdit) return;
    onEdit(event);
  };

  const handleKeyDown = (keyEvent) => {
    if (!canEdit) return;

    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      keyEvent.preventDefault();
      handleEdit();
    }
  };

  return (
    <div
      role={canEdit ? 'button' : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={handleEdit}
      onKeyDown={handleKeyDown}
      data-openshare-schedule-session-edit={canEdit ? 'enabled-v1' : undefined}
      aria-label={canEdit ? `Edit scheduled session ${event.title || ''}`.trim() : undefined}
        className={`
          rhythm-calendar-event absolute overflow-hidden rounded-lg border px-2 py-1.5
          ${canEdit ? 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-violet-300/35' : 'cursor-default'}
          bg-white/95 text-slate-900 shadow-md backdrop-blur-xl transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-lg dark:bg-[#18181d]/95 dark:text-white
        `}
        style={getSessionCardStyle(event, {
          top: event?._layout?.top || `${((startHour - 7) + startMinute / 60) * 64}px`,
          height: event?._layout?.height || `${Math.max(height, 40)}px`,
          zIndex: 5 + Number(event?._layout?.lane || 0),
          left: event?._layout?.left || '8px',
          width: event?._layout?.width || 'calc(100% - 16px)',
          right: 'auto',
          borderColor: `${getSessionColor(event)}66`,
          boxShadow: `0 8px 18px ${getSessionColor(event)}22`,
        })}
      title={canEdit ? 'Click to edit this scheduled session' : undefined}
    >
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: getSessionColor(event) }} />

      <div className="flex items-start gap-1.5 pl-1">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm dark:bg-white/[0.08]">
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-black leading-5">
            {event.title}
          </div>

          {height >= 48 && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${meta.chip}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-bold opacity-70">
                {formatSessionTime(startHour, startMinute)}
              </span>
              {canEdit ? (
                <span className="ml-auto rounded-full border border-white/40 bg-white/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-violet-700 shadow-sm dark:border-white/[0.10] dark:bg-white/[0.08] dark:text-violet-200">
                  Edit
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DayColumn ──────────────────────────────────────────────────────────────

function DayColumn({ day, events, isToday, workload, onAddEvent, onEditEvent, readOnly = false }) {
  const getWorkloadTone = () => {
    if (workload > 100) return 'from-rose-500 to-orange-400';
    if (workload > 80) return 'from-amber-500 to-orange-400';
    if (workload > 50) return 'from-emerald-500 to-cyan-400';
    return 'from-violet-500 to-cyan-400';
  };

  const workloadLabel =
    workload > 100 ? 'Overloaded' : workload > 80 ? 'Heavy' : workload > 50 ? 'Healthy' : 'Open';

  return (
    <div className="rhythm-day-column min-w-[170px] flex-1 border-r border-slate-200/70 last:border-r-0 dark:border-white/[0.06]">
      <div
        className={`
          rhythm-day-header sticky top-0 z-[8] border-b px-3 py-4 backdrop-blur-xl
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
                rhythm-time-cell group relative h-16 cursor-pointer border-b border-slate-100 transition-all
                hover:bg-white hover:shadow-[inset_0_0_0_1px_rgba(124,58,237,0.14)]
                dark:border-white/[0.04] dark:hover:bg-white/[0.04]
                ${zone?.bg || ''}
              `}
              onClick={() => !readOnly && onAddEvent?.(day.fullDate, slot.hour)}
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

        {layoutCalendarEvents(events).map((event) => (
          <CalendarEvent key={event.id} event={event} onEdit={onEditEvent} />
        ))}
      </div>
    </div>
  );
}

// ─── EnergySidebar ──────────────────────────────────────────────────────────

function EnergySidebar() {
  return (
    <div
      className="rhythm-energy-sidebar w-28 flex-shrink-0 border-r border-slate-200/80 bg-slate-50/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#111116]/90"
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

export default function RhythmView({ projectId, readOnly = false }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [realEvents, setRealEvents] = useState([]);
  const [agendaEvents, setAgendaEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  const getSessionColor = (session) =>
    session?.color || session?.originalData?.color || '#8B5CF6';

  const getSessionCardStyle = (session, extraStyle = {}) => {
    const sessionColor = getSessionColor(session);

    return {
      ...extraStyle,
      borderLeft: `6px solid ${sessionColor}`,
      background: `linear-gradient(135deg, ${sessionColor}26, rgba(255,255,255,0.72))`,
    };
  };


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

  const mapRhythmItems = (items = [], { restrictToWorkWeek = true } = {}) =>
    items
      .map((item) => {
        const startDate = new Date(item.startAt);
        const endDate = new Date(item.endAt);

        if (Number.isNaN(startDate.getTime())) return null;

        const safeEndDate = Number.isNaN(endDate.getTime())
          ? new Date(startDate.getTime() + 60 * 60000)
          : endDate;

        const dayIndex = startDate.getDay() - 1;

        let duration = Math.round((safeEndDate.getTime() - startDate.getTime()) / 60000);
        if (isNaN(duration) || duration <= 0) duration = 60;

        const itemKind = String(item.type || '').toLowerCase();
        const rawType = String(item.sourceType || item.type || '').toLowerCase();
        const itemTitle = String(item.title || 'Scheduled session');
        const editableTypes = ['event', 'meeting', 'focus', 'custom', 'deep_work', 'standup', 'reminder'];

        let uiType = 'task';
        if (itemKind === 'event' || rawType === 'meeting' || rawType === 'standup') uiType = 'meeting';
        if (
          rawType === 'focus' ||
          rawType === 'deep_work' ||
          rawType === 'custom' ||
          itemTitle.toLowerCase().includes('focus')
        ) {
          uiType = 'focus';
        }

        return {
          id: item.id || item._id,
          title: itemTitle,
          description: item.description || item.originalData?.description || '',
          notes: item.notes || item.description || item.originalData?.notes || item.originalData?.description || '',
          color: item.color || item.originalData?.color || '#8B5CF6',
          kind: itemKind,
          sourceType: rawType,
          editable: itemKind === 'event' || editableTypes.includes(rawType),
          type: uiType,
          startAt: item.startAt,
          endAt: item.endAt,
          startHour: startDate.getHours(),
          startMinute: startDate.getMinutes(),
          duration,
          day: dayIndex,
          originalData: item.originalData || item,
        };
      })
      .filter(Boolean)
      .filter((event) => !restrictToWorkWeek || (event.day >= 0 && event.day <= 4));

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

      const weekEvents = payload?.data
        ? mapRhythmItems(payload.data, { restrictToWorkWeek: true })
        : [];

      setRealEvents(weekEvents);

      const historyStart = new Date();
      historyStart.setFullYear(historyStart.getFullYear() - 5);
      historyStart.setHours(0, 0, 0, 0);

      const historyEnd = new Date();
      historyEnd.setFullYear(historyEnd.getFullYear() + 5);
      historyEnd.setHours(23, 59, 59, 999);

      try {
        const historyPayload = await getProjectRhythm(
          projectId,
          historyStart.toISOString(),
          historyEnd.toISOString()
        );

        const allScheduledEvents = historyPayload?.data
          ? mapRhythmItems(historyPayload.data, { restrictToWorkWeek: false }).filter(
              (event) => event.editable
            )
          : [];

        setAgendaEvents(allScheduledEvents);
      } catch (historyError) {
        console.warn('Unable to load full schedule history:', historyError);
        setAgendaEvents(weekEvents.filter((event) => event.editable));
      }
    } catch (error) {
      console.error('Failed to load project rhythm:', error);
      setRealEvents([]);
      setAgendaEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRhythmData();
  }, [projectId, currentWeek]);

  const handleAddEventClick = (date, hour) => {
    if (readOnly) return;
    setEditingSession(null);
    setSelectedSlot({ date, hour });
    setIsModalOpen(true);
  };

  const handleEditEventClick = (session) => {
    if (!session?.editable) return;

    const startDate = weekDays[session.day]?.fullDate
      ? new Date(weekDays[session.day].fullDate)
      : new Date();

    startDate.setHours(
      Number.isFinite(Number(session.startHour)) ? Number(session.startHour) : 9,
      Number.isFinite(Number(session.startMinute)) ? Number(session.startMinute) : 0,
      0,
      0
    );

    const durationMinutes = Number.isFinite(Number(session.duration)) && Number(session.duration) > 0
      ? Number(session.duration)
      : 60;

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    setSelectedSlot(null);
    const sessionNotes =
      session.notes ||
      session.description ||
      session.originalData?.notes ||
      session.originalData?.description ||
      '';

    setEditingSession({
      ...session,
      mode: 'edit',
      date: startDate,
      startDate,
      endDate,
      hour: startDate.getHours(),
      minute: startDate.getMinutes(),
      notes: sessionNotes,
      description: sessionNotes,
    
        color: session.color ?? session.originalData?.color ?? '#8B5CF6',});
    setIsModalOpen(true);
  };

  const closeSessionModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setEditingSession(null);
  };


  function buildScheduleUpdatePayload(eventData) {
    const {
      // Backend UpdateEventDto rejects these on edit.
      projectId: _projectId,
      type: _type,

      // Avoid sending frontend/read-only fields if present.
      id: _id,
      _id: __id,
      originalData: _originalData,
      createdBy: _createdBy,
      attendees: _attendees,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      mode: _mode,
      editable: _editable,
      day: _day,
      hour: _hour,
      minute: _minute,
      startHour: _startHour,
      startMinute: _startMinute,
      duration: _duration,

      ...allowedUpdatePayload
    } = eventData || {};

    return allowedUpdatePayload;
  }

  const handleSaveSession = async (eventData) => {
    const isEditing = Boolean(editingSession?.id);

    try {
      if (isEditing) {
        const updatePayload = buildScheduleUpdatePayload(eventData);
        await updateEvent(editingSession.id, updatePayload);
        console.log('✅ Successfully updated event');
      } else {
        await createEvent(eventData);
        console.log('✅ Successfully created event');
      }

      await loadRhythmData();
    } catch (err) {
      const status = err?.response?.status;
      const backendData = err?.response?.data;
      const backendMessage =
        backendData?.message ||
        backendData?.error ||
        err?.message ||
        'Unknown error';

      console.error(isEditing ? 'Failed to update event' : 'Failed to save event', {
        status,
        backendData,
        message: backendMessage,
        rawError: err,
        editingSession,
        eventData,
      });

      alert(
        isEditing
          ? `Failed to update session: ${backendMessage}`
          : `Failed to save session: ${backendMessage}`
      );
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
    <section className="rhythm-command-map relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">
      <style className="rhythm-visual-command-style">
        {`
          .rhythm-command-map {
            isolation: isolate;
          }

          .rhythm-command-map .rhythm-shell {
            border-color: rgba(167, 139, 250, 0.46) !important;
            background:
              radial-gradient(circle at 9% 14%, rgba(139, 92, 246, 0.17), transparent 30%),
              radial-gradient(circle at 86% 16%, rgba(34, 211, 238, 0.18), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,253,250,0.78)) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255,255,255,0.9) !important;
          }

          .dark .rhythm-command-map .rhythm-shell {
            border-color: rgba(167, 139, 250, 0.22) !important;
            background:
              radial-gradient(circle at 10% 12%, rgba(139, 92, 246, 0.18), transparent 32%),
              radial-gradient(circle at 86% 14%, rgba(34, 211, 238, 0.14), transparent 35%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
            box-shadow:
              0 32px 100px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255,255,255,0.08) !important;
          }

          .rhythm-command-map .rhythm-primary-action,
          .rhythm-command-map button.rhythm-primary-action,
          .rhythm-command-map button.rhythm-primary-action:disabled,
          .rhythm-command-map button.rhythm-primary-action[disabled] {
            background-color: #7c3aed !important;
            background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
            border: 1px solid rgba(221, 214, 254, 0.92) !important;
            box-shadow:
              0 18px 42px rgba(109, 40, 217, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28) !important;
          }

          .rhythm-command-map .rhythm-primary-action *,
          .rhythm-command-map button.rhythm-primary-action * {
            color: #ffffff !important;
            stroke: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
          }

          .rhythm-command-map .rhythm-primary-action:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background-image: linear-gradient(135deg, #9333ea 0%, #7e22ce 48%, #5b21b6 Available) !important;
            box-shadow:
              0 22px 52px rgba(109, 40, 217, 0.52),
              inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
          }

          .rhythm-command-map .rhythm-stat-card {
            position: relative;
            overflow: hidden;
            border-width: 1px !important;
            background:
              radial-gradient(circle at 12% 15%, rgba(255,255,255,0.98), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,250,252,0.82)) !important;
            box-shadow:
              0 16px 42px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255,255,255,0.88) !important;
          }

          .dark .rhythm-command-map .rhythm-stat-card {
            background:
              radial-gradient(circle at 12% 15%, rgba(255,255,255,0.08), transparent 36%),
              linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035)) !important;
            box-shadow:
              0 18px 50px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255,255,255,0.08) !important;
          }

          .rhythm-command-map .rhythm-stat-card::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #34d399);
            opacity: 0.95;
          }

          .rhythm-command-map .rhythm-energy-chip,
          .rhythm-command-map .rhythm-realtime-chip {
            box-shadow:
              0 12px 30px rgba(15, 23, 42, 0.07),
              inset 0 1px 0 rgba(255,255,255,0.86) !important;
          }

          .rhythm-command-map .rhythm-calendar-grid {
            border-color: rgba(148, 163, 184, 0.38) !important;
            background:
              linear-gradient(135deg, rgba(255,255,255,0.94), rgba(241,245,249,0.82)) !important;
            box-shadow:
              0 22px 68px rgba(15, 23, 42, 0.11),
              inset 0 1px 0 rgba(255,255,255,0.9) !important;
          }

          .dark .rhythm-command-map .rhythm-calendar-grid {
            background:
              linear-gradient(135deg, rgba(15,23,42,0.92), rgba(2,6,23,0.88)) !important;
            border-color: rgba(255,255,255,0.10) !important;
          }

          .rhythm-command-map .rhythm-day-header {
            box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.28);
          }

          .rhythm-command-map .rhythm-time-cell {
            background-image:
              linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px),
              linear-gradient(rgba(148,163,184,0.045) 1px, transparent 1px);
            background-size: 44px 44px;
          }

          .rhythm-command-map .rhythm-time-cell:hover {
            background-color: rgba(139, 92, 246, 0.075) !important;
          }

          .rhythm-command-map .rhythm-calendar-event {
            box-shadow:
              0 16px 36px rgba(15, 23, 42, 0.14),
              inset 0 1px 0 rgba(255,255,255,0.70) !important;
          }

          .rhythm-command-map .rhythm-empty-state {
            border-color: rgba(167, 139, 250, 0.48) !important;
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,253,250,0.72)) !important;
            box-shadow:
              0 18px 54px rgba(15, 23, 42, 0.09),
              inset 0 1px 0 rgba(255,255,255,0.90) !important;
          }

          .dark .rhythm-command-map .rhythm-empty-state {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.18), transparent 38%),
              linear-gradient(135deg, rgba(15,23,42,0.88), rgba(2,6,23,0.82)) !important;
          }
        `}
      </style>
      <div className="rhythm-shell relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">
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
                onClick={() => !readOnly && handleAddEventClick(new Date(), 9)}
                className="rhythm-primary-action inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Session</span>
              </button>
            </div>
          </div>

          {/* Rhythm signals */}
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rhythm-stat-card rhythm-stat-violet rounded-3xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                Sessions
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.sessions}
              </div>
            </div>

            <div className="rhythm-stat-card rhythm-stat-cyan rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                Scheduled Hours
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.hours}
              </div>
            </div>

            <div className="rhythm-stat-card rhythm-stat-emerald rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                Focus Blocks
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {rhythmStats.focusCount}
              </div>
            </div>

            <div className="rhythm-stat-card rhythm-stat-slate rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">
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
                  className={`rhythm-energy-chip inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-2 text-xs font-black shadow-sm backdrop-blur-xl dark:bg-white/[0.05] ${zone.ring}`}
                >
                  <Icon className={`h-4 w-4 ${zone.color}`} />
                  <span className="text-slate-600 dark:text-zinc-300">{zone.label}</span>
                </div>
              );
            })}

            <div className="rhythm-realtime-chip inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Realtime rhythm
            </div>
          </div>

          {/* Calendar grid */}
          <div className="rhythm-calendar-grid mt-7 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30">
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
                      onAddEvent={readOnly ? undefined : handleAddEventClick}
                      readOnly={readOnly}
                      onEditEvent={handleEditEventClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!loading && agendaEvents.length > 0 && (
              <div className="rhythm-agenda mt-7 overflow-hidden rounded-[2.25rem] border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50 shadow-[0_24px_90px_rgba(124,58,237,0.18)] backdrop-blur-xl dark:border-violet-400/20 dark:from-violet-950/30 dark:via-[#111113] dark:to-cyan-950/20 dark:shadow-black/40">
                <div className="relative overflow-hidden border-b border-white/70 p-6 dark:border-white/[0.08]">
                  <div className="absolute right-8 top-6 h-24 w-24 rounded-full bg-violet-400/20 blur-3xl" />
                  <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-cyan-400/20 blur-3xl" />

                  <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 dark:text-violet-200">
                        Project Timeline
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                        Schedule History
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600 dark:text-zinc-300">
                        Upcoming sessions and past schedule blocks for this project, not just the week currently visible above.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <span className="rounded-2xl border border-violet-200 bg-white/80 px-4 py-2 text-center text-xs font-black text-violet-700 shadow-sm dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
                        {agendaEvents.length} total
                      </span>
                      <span className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-2 text-center text-xs font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-white/[0.06] dark:text-emerald-200">
                        {agendaEvents.filter((event) => new Date(event.startAt || 0).getTime() >= Date.now()).length} upcoming
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative p-5">
                  <div className="pointer-events-none absolute bottom-6 left-8 top-6 hidden w-px bg-gradient-to-b from-violet-300 via-cyan-300 to-slate-200 sm:block dark:from-violet-500/60 dark:via-cyan-500/40 dark:to-white/10" />

                  <div className="max-h-[560px] overflow-y-auto pr-2 overscroll-contain [scrollbar-gutter:stable]">
                    <div className="space-y-4">
                    {agendaEvents
                      .slice()
                      .sort((a, b) => {
                        const now = Date.now();
                        const aTime = new Date(a.startAt || 0).getTime();
                        const bTime = new Date(b.startAt || 0).getTime();

                        const aPast = aTime < now;
                        const bPast = bTime < now;

                        if (aPast !== bPast) return aPast ? 1 : -1;
                        return aPast ? bTime - aTime : aTime - bTime;
                      })
                      .map((event, index) => {
                        const eventColor =
                          event.color || event.originalData?.color || '#8B5CF6';

                        const startDate = event.startAt ? new Date(event.startAt) : null;
                        const endDate = event.endAt ? new Date(event.endAt) : null;
                        const isPast = startDate ? startDate.getTime() < Date.now() : false;

                        const dayLabel = startDate
                          ? startDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Unscheduled';

                        const timeLabel =
                          startDate && endDate
                            ? `${startDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })} – ${endDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}`
                            : 'Time TBD';

                        const notes =
                          event.notes ||
                          event.description ||
                          event.originalData?.notes ||
                          event.originalData?.description ||
                          '';

                        const eventType = String(
                          event.sourceType || event.type || 'session'
                        ).replace(/_/g, ' ');

                        return (
                          <button
                            key={event.id || `${event.title}-${event.startAt}-${index}`}
                            type="button"
                            onClick={() => handleEditEventClick(event)}
                            className="group relative flex w-full gap-4 rounded-[1.75rem] border border-white/80 bg-white/80 p-4 text-left shadow-[0_14px_45px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(124,58,237,0.16)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:shadow-black/20"
                          >
                            <span
                              className="absolute left-0 top-5 h-16 w-1.5 rounded-r-full"
                              style={{ backgroundColor: eventColor }}
                            />

                            <span
                              className="relative z-[1] mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-lg sm:flex dark:border-white/[0.08] dark:bg-[#111113]"
                              style={{
                                color: eventColor,
                                boxShadow: `0 12px 30px ${eventColor}22`,
                              }}
                            >
                              <Clock className="h-5 w-5" />
                            </span>

                            <div className="min-w-0 flex-1 pl-2 sm:pl-0">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: eventColor }}
                                    />

                                    <p className="truncate text-base font-black text-slate-950 dark:text-white">
                                      {event.title || 'Scheduled session'}
                                    </p>
                                  </div>

                                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-zinc-400">
                                    {dayLabel} · {timeLabel}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <span
                                    className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm ${
                                      isPast
                                        ? 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                                    }`}
                                  >
                                    {isPast ? 'History' : 'Upcoming'}
                                  </span>

                                  <span className="inline-flex w-fit shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                                    {eventType}
                                  </span>
                                </div>
                                </div>
                              </div>

                              {notes && (
                                <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-600 dark:text-zinc-300">
                                  {notes}
                                </p>
                              )}

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                                  #{index + 1} schedule entry
                                </span>

                                <span className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-violet-200">
                                  Edit session
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={closeSessionModal}
        initialData={editingSession || selectedSlot}
        onSave={handleSaveSession}
        projectId={projectId}
      />
    </section>
  );
}
