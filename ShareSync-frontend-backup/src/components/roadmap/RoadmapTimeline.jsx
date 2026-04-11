// src/components/roadmap/RoadmapTimeline.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.3: Horizontal timeline with draggable task bars
// Positioned by start/due date. Drag to reschedule. Zoom week/month/quarter.
// Complements existing RoadmapView.jsx — does NOT replace it.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react';

// ── Time constants ───────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

const ZOOM_LEVELS = [
  { id: 'week', label: '1W', days: 7, dayWidth: 80 },
  { id: 'twoweek', label: '2W', days: 14, dayWidth: 50 },
  { id: 'month', label: '1M', days: 30, dayWidth: 28 },
  { id: 'quarter', label: '3M', days: 90, dayWidth: 10 },
];

// Keep existing priority palette intact.
// The bug fix is surgical: force the title text itself to be high-contrast.
const PRIORITY_COLORS = {
  urgent: { bar: 'bg-red-500', light: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-900 dark:text-red-50' },
  high: { bar: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-900 dark:text-orange-50' },
  medium: { bar: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-900 dark:text-amber-50' },
  low: { bar: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-900 dark:text-blue-50' },
  none: { bar: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-900 dark:text-violet-50' },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function formatDayHeader(date, zoom) {
  if (zoom.days <= 14) {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  }
  if (zoom.days <= 30) {
    return date.getDate().toString();
  }
  return '';
}

export default function RoadmapTimeline({
  tasks = [],
  onTaskClick,
  onReschedule,     // (taskId, newStartDate, newDueDate) => void
  className = '',
}) {
  const [zoomIndex, setZoomIndex] = useState(2); // month by default
  const [viewStart, setViewStart] = useState(() => startOfDay(new Date()));
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const dragTask = useRef(null);
  const dragStartX = useRef(0);
  const dragStartDate = useRef(null);

  const zoom = ZOOM_LEVELS[zoomIndex] || ZOOM_LEVELS[2];
  const viewEnd = addDays(viewStart, zoom.days);

  // Generate day columns
  const dayCols = useMemo(() => {
    const cols = [];
    for (let i = 0; i < zoom.days; i++) {
      cols.push(addDays(viewStart, i));
    }
    return cols;
  }, [viewStart, zoom.days]);

  // Filter tasks that have dates and overlap with view
  const timelineTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate || t.createdAt)
      .map((t) => {
        const due = t.dueDate ? new Date(t.dueDate) : addDays(new Date(t.createdAt), 3);
        const start = t.startDate ? new Date(t.startDate) : addDays(due, -1);
        return { ...t, _start: startOfDay(start), _end: startOfDay(due) };
      })
      .filter((t) => t._end >= viewStart && t._start <= viewEnd);
  }, [tasks, viewStart, viewEnd]);

  // ── Navigation ─────────────────────────────────────────────────────
  const panLeft = useCallback(() => {
    setViewStart((v) => addDays(v, -Math.floor(zoom.days / 2)));
  }, [zoom.days]);

  const panRight = useCallback(() => {
    setViewStart((v) => addDays(v, Math.floor(zoom.days / 2)));
  }, [zoom.days]);

  const goToToday = useCallback(() => {
    setViewStart(startOfDay(new Date()));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }, []);

  // ── Drag to reschedule ─────────────────────────────────────────────
  const handleBarMouseDown = useCallback((e, task) => {
    e.stopPropagation();
    isDragging.current = true;
    dragTask.current = task;
    dragStartX.current = e.clientX;
    dragStartDate.current = task._start;

    const handleMouseMove = (moveE) => {
      if (!isDragging.current || !dragTask.current) return;
      const dx = moveE.clientX - dragStartX.current;
      const dayShift = Math.round(dx / zoom.dayWidth);
      if (dayShift === 0) return;

      const newStart = addDays(dragStartDate.current, dayShift);
      const duration = daysBetween(dragTask.current._start, dragTask.current._end);
      const newEnd = addDays(newStart, duration);

      dragTask.current = { ...dragTask.current, _start: newStart, _end: newEnd };
      // Force re-render would be complex here; we just update on mouseup
    };

    const handleMouseUp = () => {
      if (isDragging.current && dragTask.current) {
        const dx = window.event?.clientX || 0;
        const totalDx = dx - dragStartX.current;
        const dayShift = Math.round(totalDx / zoom.dayWidth);

        if (dayShift !== 0 && dragStartDate.current) {
          const taskId = dragTask.current.id || dragTask.current._id;
          const newStart = addDays(dragStartDate.current, dayShift);
          const duration = daysBetween(dragTask.current._start, dragTask.current._end);
          const newEnd = addDays(newStart, duration);
          onReschedule?.(taskId, newStart.toISOString(), newEnd.toISOString());
        }
      }

      isDragging.current = false;
      dragTask.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [zoom.dayWidth, onReschedule]);

  const totalWidth = zoom.days * zoom.dayWidth;
  const today = startOfDay(new Date());

  return (
    <div className={`rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">Timeline</span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {timelineTasks.length} task{timelineTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-2 py-1 rounded-lg text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
            Today
          </button>

          <button onClick={panLeft} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={panRight} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          <button onClick={zoomIn} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4 text-slate-500" />
          </button>

          {/* Zoom level buttons */}
          <div className="flex items-center gap-0.5">
            {ZOOM_LEVELS.map((z, i) => (
              <button
                key={z.id}
                onClick={() => setZoomIndex(i)}
                className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors
                  ${i === zoomIndex
                    ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                  }
                `}
              >
                {z.label}
              </button>
            ))}
          </div>

          <button onClick={zoomOut} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Timeline area */}
      <div ref={scrollRef} className="overflow-x-auto">
        <div style={{ width: `${totalWidth}px`, minHeight: '200px' }} className="relative">
          {/* Day headers */}
          <div className="flex border-b border-slate-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#1f1f23] z-10">
            {dayCols.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={i}
                  style={{ width: `${zoom.dayWidth}px` }}
                  className={`
                    flex-shrink-0 py-2 text-center text-[10px] font-medium border-r border-slate-50 dark:border-white/[0.03]
                    ${isToday ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold' : ''}
                    ${isWeekend ? 'bg-slate-50 dark:bg-white/[0.02] text-slate-300 dark:text-zinc-700' : 'text-slate-400 dark:text-zinc-500'}
                  `}
                >
                  {formatDayHeader(day, zoom)}
                </div>
              );
            })}
          </div>

          {/* Today line */}
          {today >= viewStart && today <= viewEnd && (
            <div
              className="absolute top-0 bottom-0 w-px bg-violet-500 z-20 pointer-events-none"
              style={{ left: `${daysBetween(viewStart, today) * zoom.dayWidth + zoom.dayWidth / 2}px` }}
            >
              <div className="absolute -top-0 -left-1 w-2.5 h-2.5 rounded-full bg-violet-500" />
            </div>
          )}

          {/* Task bars */}
          <div className="relative py-2">
            {timelineTasks.map((task, rowIndex) => {
              const taskId = task.id || task._id;
              const startOffset = Math.max(0, daysBetween(viewStart, task._start));
              const endOffset = Math.min(zoom.days, daysBetween(viewStart, task._end));
              const barLeft = startOffset * zoom.dayWidth;
              const barWidth = Math.max(zoom.dayWidth, (endOffset - startOffset) * zoom.dayWidth);
              const priorityColors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none;
              const isComplete = Boolean(task.completed || task.completedAt);

              return (
                <div
                  key={taskId}
                  className="relative flex items-center"
                  style={{
                    height: '36px',
                    marginBottom: '4px',
                  }}
                >
                  {/* Bar */}
                  <div
                    className={`
                      absolute h-7 rounded-lg flex items-center px-2 gap-1.5
                      cursor-pointer group
                      transition-shadow duration-150
                      hover:shadow-md
                      ${isComplete ? 'opacity-50' : ''}
                      ${priorityColors.light}
                      border border-slate-200/50 dark:border-white/5
                    `}
                    style={{
                      left: `${barLeft}px`,
                      width: `${barWidth}px`,
                    }}
                    onClick={() => onTaskClick?.(task)}
                    onMouseDown={(e) => handleBarMouseDown(e, task)}
                  >
                    {/* Priority dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors.bar}`} />

                    {/* Title */}
                    {/* Surgical fix: force strong contrast regardless of inherited text color */}
                    <span
                      className={`
                        text-[11px] font-semibold text-white
                        drop-shadow-[0_1px_2px_rgba(15,23,42,0.55)]
                        truncate
                        ${isComplete ? 'line-through opacity-70' : ''}
                      `}
                    >
                      {task.title}
                    </span>

                    {/* Resize handles */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-violet-500/20 rounded-l-lg" />
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-violet-500/20 rounded-r-lg" />
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {timelineTasks.length === 0 && (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400 dark:text-zinc-500">
                No tasks with due dates in this range
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
