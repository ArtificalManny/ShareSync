// src/components/calendar/CalendarView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Basic month-view calendar
// Each day cell shows task dots colored by priority.
// Click a day to see tasks due that day in a popover.
// Navigate months with arrows. Highlights today.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import CalendarDayPopover from './CalendarDayPopover';

// ── Priority → dot color ─────────────────────────────────────────────────
const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  none: 'bg-slate-400 dark:bg-zinc-500',
};

function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.none;
}

// ── Calendar grid helpers ────────────────────────────────────────────────
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];

  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthLast - i), isCurrentMonth: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  return days;
}

// ── Get tasks for a specific day ─────────────────────────────────────────
function getTasksForDay(tasks, date) {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    return isSameDay(due, date);
  });
}

export default function CalendarView({
  tasks = [],
  onTaskClick,
  onTaskComplete,
  onDateSelect,
  className = '',
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [popoverAnchor, setPopoverAnchor] = useState(null);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  }, [viewMonth]);

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(null);
  }, [today]);

  const handleDayClick = useCallback((date, event) => {
    const dayTasks = getTasksForDay(tasks, date);

    if (selectedDay && isSameDay(selectedDay, date)) {
      // Toggle off
      setSelectedDay(null);
      setPopoverAnchor(null);
    } else {
      setSelectedDay(date);
      setPopoverAnchor(event?.currentTarget || null);
      onDateSelect?.(date);
    }
  }, [tasks, selectedDay, onDateSelect]);

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build a map of day → tasks for quick lookup
  const tasksByDay = useMemo(() => {
    const map = new Map();
    if (!tasks || !Array.isArray(tasks)) return map;
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      if (isNaN(due.getTime())) return;
      const key = `${due.getFullYear()}-${due.getMonth()}-${due.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    return map;
  }, [tasks]);

  const getTasksForDate = useCallback((date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return tasksByDay.get(key) || [];
  }, [tasksByDay]);

  const selectedDayTasks = selectedDay ? getTasksForDate(selectedDay) : [];

  return (
    <div className={`rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Calendar</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200 min-w-[140px] text-center">
              {monthLabel}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 px-4 pt-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-slate-400 dark:text-zinc-600 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-4 pb-4">
        {calendarDays.map((day, i) => {
          const isToday = isSameDay(day.date, today);
          const isSelected = selectedDay && isSameDay(day.date, selectedDay);
          const dayTasks = getTasksForDate(day.date);
          const hasTasks = dayTasks.length > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={(e) => handleDayClick(day.date, e)}
              className={`
                relative flex flex-col items-center justify-start
                py-2 min-h-[56px] rounded-lg
                transition-all duration-100
                ${!day.isCurrentMonth
                  ? 'text-slate-300 dark:text-zinc-700'
                  : isSelected
                    ? 'bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-300 dark:ring-violet-500/30'
                    : isToday
                      ? 'bg-violet-50 dark:bg-violet-500/5'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }
              `}
            >
              {/* Day number */}
              <span
                className={`
                  text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday
                    ? 'bg-violet-600 text-white'
                    : day.isCurrentMonth
                      ? 'text-slate-700 dark:text-zinc-200'
                      : ''
                  }
                `}
              >
                {day.date.getDate()}
              </span>

              {/* Task dots */}
              {hasTasks && (
                <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                  {dayTasks.slice(0, 4).map((task, j) => (
                    <div
                      key={task.id || task._id || j}
                      className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="text-[8px] text-slate-400 ml-0.5">+{dayTasks.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day popover */}
      {selectedDay && (
        <div className="px-4 pb-4">
          <CalendarDayPopover
            date={selectedDay}
            tasks={selectedDayTasks}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onClose={() => setSelectedDay(null)}
          />
        </div>
      )}
    </div>
  );
}
