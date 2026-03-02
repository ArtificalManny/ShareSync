// src/components/calendar/CalendarDayPopover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Popover for a single calendar day
// Lists tasks due that day with title, project, priority badge, completion checkbox
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { X, Check, Circle, Flag } from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Urgent' },
  high: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', label: 'High' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Medium' },
  low: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Low' },
};

function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color} ${config.bg}`}>
      <Flag className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

export default function CalendarDayPopover({
  date,
  tasks = [],
  onTaskClick,
  onTaskComplete,
  onClose,
  className = '',
}) {
  const dateLabel = date
    ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  const isToday = (() => {
    if (!date) return false;
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  })();

  const handleComplete = useCallback((task, e) => {
    e.stopPropagation();
    onTaskComplete?.(task);
  }, [onTaskComplete]);

  return (
    <div
      className={`
        rounded-xl
        bg-slate-50 dark:bg-white/5
        border border-slate-200 dark:border-white/10
        overflow-hidden
        animate-in fade-in slide-in-from-top-2 duration-200
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {dateLabel}
          </span>
          {isToday && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
              Today
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Task list */}
      <div className="px-4 py-3">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">
            No tasks due this day
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const taskId = task.id || task._id;
              const isComplete = Boolean(task.completed || task.completedAt);

              return (
                <div
                  key={taskId}
                  className={`
                    flex items-start gap-3 p-2.5 rounded-lg
                    transition-colors cursor-pointer
                    ${isComplete
                      ? 'bg-white/50 dark:bg-white/[0.02]'
                      : 'bg-white dark:bg-[#1f1f23] hover:bg-violet-50 dark:hover:bg-violet-500/5'
                    }
                    border border-slate-100 dark:border-white/5
                  `}
                  onClick={() => onTaskClick?.(task)}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => handleComplete(task, e)}
                    className={`
                      flex-shrink-0 mt-0.5
                      w-5 h-5 rounded-full border-2
                      flex items-center justify-center
                      transition-all duration-200
                      ${isComplete
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-zinc-600 hover:border-violet-400 dark:hover:border-violet-500'
                      }
                    `}
                  >
                    {isComplete && <Check className="w-3 h-3" />}
                  </button>

                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`
                        text-sm font-medium leading-tight
                        ${isComplete
                          ? 'text-slate-400 dark:text-zinc-600 line-through'
                          : 'text-slate-800 dark:text-white'
                        }
                      `}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Project name */}
                      {(task.projectName || task.project?.name) && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                          {task.projectName || task.project?.name}
                        </span>
                      )}

                      {/* Priority badge */}
                      {task.priority && <PriorityBadge priority={task.priority} />}

                      {/* Due time */}
                      {task.dueDate && (() => {
                        const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
                        const h = due.getHours();
                        const m = due.getMinutes();
                        if (h === 0 && m === 0) return null;
                        return (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      {tasks.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5">
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} ·{' '}
            {tasks.filter((t) => t.completed || t.completedAt).length} complete
          </p>
        </div>
      )}
    </div>
  );
}
