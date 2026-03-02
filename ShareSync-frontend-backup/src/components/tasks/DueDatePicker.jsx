// src/components/tasks/DueDatePicker.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Dropdown calendar picker
// Quick-select buttons: Today, Tomorrow, Next Week, Custom
// Natural language parsing: "fri" → next Friday, "2d" → 2 days from now
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Sun, Sunrise, CalendarDays } from 'lucide-react';

// ── Date shorthand parser (reused from QuickAddBar) ──────────────────────
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const FULL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseDateShorthand(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.trim().toLowerCase();

  if (lower === 'today' || lower === 'tod') return new Date();

  if (lower === 'tomorrow' || lower === 'tom') {
    const d = new Date(); d.setDate(d.getDate() + 1); return d;
  }

  const daysMatch = lower.match(/^(\d+)d$/);
  if (daysMatch) {
    const d = new Date(); d.setDate(d.getDate() + parseInt(daysMatch[1], 10)); return d;
  }

  const weeksMatch = lower.match(/^(\d+)w$/);
  if (weeksMatch) {
    const d = new Date(); d.setDate(d.getDate() + parseInt(weeksMatch[1], 10) * 7); return d;
  }

  let dayIndex = DAY_NAMES.indexOf(lower.slice(0, 3));
  if (dayIndex === -1) dayIndex = FULL_DAY_NAMES.indexOf(lower);
  if (dayIndex !== -1) {
    const d = new Date();
    let diff = dayIndex - d.getDay();
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // Try native date parse as fallback
  const native = new Date(text);
  if (!isNaN(native.getTime()) && native.getFullYear() > 2000) return native;

  return null;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toDateString(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Quick select options ─────────────────────────────────────────────────
function getQuickOptions() {
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + (8 - nextWeek.getDay())); // Next Monday

  const inTwoWeeks = new Date(today);
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

  return [
    { label: 'Today', date: today, icon: Sun },
    { label: 'Tomorrow', date: tomorrow, icon: Sunrise },
    { label: 'Next week', date: nextWeek, icon: CalendarDays },
    { label: 'In 2 weeks', date: inTwoWeeks, icon: Calendar },
  ];
}

// ── Calendar grid helper ─────────────────────────────────────────────────
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const days = [];

  // Padding from previous month
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthLast - i), isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Pad to fill 6 rows (42 cells)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  return days;
}

export default function DueDatePicker({
  value = null,        // Date object or ISO string
  onChange,             // (date: Date | null) => void
  onClose,
  showQuickSelect = true,
  showTextInput = true,
  className = '',
}) {
  const today = new Date();
  const currentValue = value ? (value instanceof Date ? value : new Date(value)) : null;

  const [viewYear, setViewYear] = useState(currentValue?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentValue?.getMonth() ?? today.getMonth());
  const [textInput, setTextInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);

  const containerRef = useRef(null);

  // Navigate months
  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  // Text input parsing
  const handleTextChange = useCallback((val) => {
    setTextInput(val);
    const parsed = parseDateShorthand(val);
    setParsedPreview(parsed);
  }, []);

  const handleTextKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && parsedPreview) {
      e.preventDefault();
      onChange?.(parsedPreview);
      setTextInput('');
      setParsedPreview(null);
    }
    if (e.key === 'Escape') {
      onClose?.();
    }
  }, [parsedPreview, onChange, onClose]);

  const handleDayClick = useCallback((date) => {
    onChange?.(date);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange?.(null);
  }, [onChange]);

  const calendarDays = getCalendarDays(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      ref={containerRef}
      className={`
        w-72 rounded-xl
        bg-white dark:bg-[#1a1a1e]
        border border-slate-200 dark:border-white/10
        shadow-xl shadow-slate-900/10 dark:shadow-black/40
        overflow-hidden
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Text input for shorthand */}
      {showTextInput && (
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder='Type "fri", "2d", "tomorrow"...'
              autoFocus
              className="
                w-full px-3 py-2 rounded-lg text-sm
                bg-slate-50 dark:bg-white/5
                border border-slate-200 dark:border-white/10
                text-slate-700 dark:text-zinc-200
                placeholder-slate-400 dark:placeholder-zinc-600
                outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                transition-colors
              "
            />
            {parsedPreview && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-violet-500 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded">
                {formatDate(parsedPreview)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick select buttons */}
      {showQuickSelect && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {getQuickOptions().map((opt) => {
            const isSelected = currentValue && isSameDay(currentValue, opt.date);
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleDayClick(opt.date)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                  transition-colors
                  ${isSelected
                    ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/10 hover:bg-violet-50 dark:hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-400'
                  }
                `}
              >
                <OptIcon className="w-3 h-3" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-white/5" />

      {/* Month navigation */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
        </button>
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 px-3">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 dark:text-zinc-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-3 pb-3">
        {calendarDays.map((day, i) => {
          const isToday = isSameDay(day.date, today);
          const isSelected = currentValue && isSameDay(day.date, currentValue);
          const isPast = day.date < today && !isSameDay(day.date, today);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(day.date)}
              className={`
                w-8 h-8 mx-auto rounded-lg text-xs font-medium
                transition-all duration-100
                flex items-center justify-center
                ${!day.isCurrentMonth
                  ? 'text-slate-300 dark:text-zinc-700'
                  : isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : isToday
                      ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-bold'
                      : isPast
                        ? 'text-slate-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-white/5'
                        : 'text-slate-700 dark:text-zinc-200 hover:bg-violet-50 dark:hover:bg-violet-500/5'
                }
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-white/5">
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-slate-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
        >
          Clear date
        </button>
        {currentValue && (
          <span className="text-[11px] text-violet-500 font-medium">
            {formatDate(currentValue)}
          </span>
        )}
      </div>
    </div>
  );
}
