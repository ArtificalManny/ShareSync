// src/components/kanban/KanbanCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.3: Individual kanban card
// Shows title, assignee avatar, priority dot, due date badge.
// Draggable. Click to open task detail.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { GripVertical, Check } from 'lucide-react';
import DueDateBadge from '../tasks/DueDateBadge';

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-400',
};

export default function KanbanCard({
  task,
  index,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
  onComplete,
}) {
  const taskId = task.id || task._id;
  const isComplete = Boolean(task.completed || task.completedAt);
  const assigneeName = task.assignee?.name || task.assigneeName || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

  const handleDragStart = useCallback((e) => {
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, index }));
    } catch { /* non-fatal */ }
    onDragStart?.();
  }, [taskId, index, onDragStart]);

  const handleComplete = useCallback((e) => {
    e.stopPropagation();
    onComplete?.();
  }, [onComplete]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`
        p-3 rounded-xl
        bg-white dark:bg-[#1a1a1e]
        border border-slate-200 dark:border-white/10
        shadow-sm
        cursor-pointer
        group
        transition-all duration-150
        hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/20
        ${isDragging ? 'opacity-30 scale-95 rotate-1' : 'opacity-100'}
        ${isComplete ? 'opacity-60' : ''}
      `}
    >
      {/* Top row: drag handle + title */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div className="
          flex-shrink-0 mt-0.5 p-0.5 rounded cursor-grab active:cursor-grabbing
          opacity-0 group-hover:opacity-100
          text-slate-300 dark:text-zinc-600
          transition-opacity duration-150
        ">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Title */}
        <p className={`
          flex-1 text-sm font-medium leading-snug min-w-0
          ${isComplete
            ? 'text-slate-400 dark:text-zinc-600 line-through'
            : 'text-slate-800 dark:text-white'
          }
        `}>
          {task.title}
        </p>

        {/* Complete checkbox */}
        <button
          type="button"
          onClick={handleComplete}
          className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2
            flex items-center justify-center
            transition-all duration-200 mt-0.5
            ${isComplete
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 dark:border-zinc-600 hover:border-violet-400 dark:hover:border-violet-500'
            }
          `}
        >
          {isComplete && <Check className="w-3 h-3" />}
        </button>
      </div>

      {/* Bottom row: priority, due date, assignee */}
      <div className="flex items-center gap-2 mt-2.5 pl-6">
        {/* Priority dot */}
        {task.priority && PRIORITY_DOT[task.priority] && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
            title={task.priority}
          />
        )}

        {/* Due date */}
        {task.dueDate && (
          <DueDateBadge
            dueDate={task.dueDate}
            completedAt={task.completedAt}
            size="xs"
            showIcon={false}
            showTooltip={true}
          />
        )}

        {/* Tags (max 2) */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Assignee avatar */}
        {assigneeInitial && (
          <div
            className="
              w-5 h-5 rounded-full flex-shrink-0
              bg-violet-100 dark:bg-violet-500/15
              flex items-center justify-center
            "
            title={assigneeName}
          >
            <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300">
              {assigneeInitial}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
