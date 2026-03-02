// src/hooks/useDueDateStatus.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Due date status calculation hook
//
// Takes a dueDate and returns color-coded status information.
// Recalculates on a 60-second interval so badges stay current.
//
// Usage:
//   const { status, color, label, isOverdue, isUrgent } = useDueDateStatus(task.dueDate);
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';

// ── Time constants ───────────────────────────────────────────────────────
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ── Core calculation (pure function, no hooks) ───────────────────────────
export function calculateDueDateStatus(dueDate) {
  if (!dueDate) {
    return {
      status: 'none',
      color: 'text-slate-400 dark:text-zinc-500',
      bgColor: 'bg-slate-50 dark:bg-white/5',
      borderColor: 'border-slate-200 dark:border-white/10',
      label: '',
      isOverdue: false,
      isUrgent: false,
      timeRemaining: null,
      fullDate: '',
    };
  }

  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (isNaN(due.getTime())) {
    return {
      status: 'invalid',
      color: 'text-slate-400 dark:text-zinc-500',
      bgColor: 'bg-slate-50 dark:bg-white/5',
      borderColor: 'border-slate-200 dark:border-white/10',
      label: 'Invalid date',
      isOverdue: false,
      isUrgent: false,
      timeRemaining: null,
      fullDate: '',
    };
  }

  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isOverdue = diff < 0;

  // Full date for tooltip
  const fullDate = due.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Overdue ────────────────────────────────────────────────────────
  if (isOverdue) {
    let label;
    if (absDiff < HOUR) {
      const mins = Math.floor(absDiff / MINUTE);
      label = `${mins}m overdue`;
    } else if (absDiff < DAY) {
      const hrs = Math.floor(absDiff / HOUR);
      label = `${hrs}h overdue`;
    } else {
      const days = Math.floor(absDiff / DAY);
      label = days === 1 ? '1 day overdue' : `${days} days overdue`;
    }

    return {
      status: 'overdue',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/10',
      borderColor: 'border-red-200 dark:border-red-500/20',
      label,
      isOverdue: true,
      isUrgent: true,
      timeRemaining: diff,
      fullDate,
    };
  }

  // ── Due within 24 hours (urgent) ───────────────────────────────────
  if (diff < DAY) {
    let label;
    if (diff < HOUR) {
      const mins = Math.max(1, Math.floor(diff / MINUTE));
      label = `Due in ${mins}m`;
    } else {
      const hrs = Math.floor(diff / HOUR);
      label = `Due in ${hrs}h`;
    }

    return {
      status: 'urgent',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-200 dark:border-amber-500/20',
      label,
      isOverdue: false,
      isUrgent: true,
      timeRemaining: diff,
      fullDate,
    };
  }

  // ── Due within 48 hours (soon) ─────────────────────────────────────
  if (diff < 2 * DAY) {
    return {
      status: 'soon',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
      borderColor: 'border-yellow-200 dark:border-yellow-500/20',
      label: 'Due tomorrow',
      isOverdue: false,
      isUrgent: false,
      timeRemaining: diff,
      fullDate,
    };
  }

  // ── Due within 7 days ──────────────────────────────────────────────
  if (diff < 7 * DAY) {
    const days = Math.ceil(diff / DAY);
    const dayName = due.toLocaleDateString('en-US', { weekday: 'short' });

    return {
      status: 'upcoming',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-200 dark:border-blue-500/20',
      label: `Due ${dayName}`,
      isOverdue: false,
      isUrgent: false,
      timeRemaining: diff,
      fullDate,
    };
  }

  // ── Due later (>7 days) ────────────────────────────────────────────
  const shortDate = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    status: 'later',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-500/20',
    label: `Due ${shortDate}`,
    isOverdue: false,
    isUrgent: false,
    timeRemaining: diff,
    fullDate,
  };
}

// ── Hook: recalculates every 60 seconds ──────────────────────────────────
export function useDueDateStatus(dueDate) {
  const [tick, setTick] = useState(0);

  // Re-render every 60 seconds to keep relative times fresh
  useEffect(() => {
    if (!dueDate) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [dueDate]);

  // Recalculate on each tick
  const result = useMemo(() => {
    return calculateDueDateStatus(dueDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueDate, tick]);

  return result;
}

export default useDueDateStatus;
