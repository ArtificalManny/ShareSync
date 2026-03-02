// src/components/kanban/KanbanColumn.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.3: Single kanban column
// Header with status name + task count. Drop zone with visual feedback.
// Scrollable card list.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({
  columnId,
  label,
  color = 'bg-slate-500',
  tasks = [],
  isDragOver = false,
  draggedTaskId = null,
  onCardDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onReorder,
  onTaskClick,
  onTaskComplete,
}) {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    onDrop?.();
  }, [onDrop]);

  return (
    <div
      className={`
        flex flex-col
        w-72 min-w-[288px] flex-shrink-0
        rounded-xl
        bg-slate-50 dark:bg-[#0f0f11]
        border transition-all duration-200
        ${isDragOver
          ? 'border-violet-300 dark:border-violet-500/40 bg-violet-50/50 dark:bg-violet-500/5 ring-1 ring-violet-200 dark:ring-violet-500/20'
          : 'border-slate-200 dark:border-white/10'
        }
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            {label}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Card list */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[60vh] min-h-[100px]">
        {tasks.length === 0 ? (
          <div
            className={`
              flex items-center justify-center
              py-8 rounded-lg border-2 border-dashed
              transition-colors duration-200
              ${isDragOver
                ? 'border-violet-300 dark:border-violet-500/30 text-violet-400'
                : 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-zinc-700'
              }
            `}
          >
            <span className="text-xs font-medium">
              {isDragOver ? 'Drop here' : 'No tasks'}
            </span>
          </div>
        ) : (
          tasks.map((task, index) => {
            const taskId = task.id || task._id;
            const isBeingDragged = draggedTaskId === taskId;

            return (
              <KanbanCard
                key={taskId}
                task={task}
                index={index}
                isDragging={isBeingDragged}
                onDragStart={() => onCardDragStart?.(task)}
                onDragEnd={onDragEnd}
                onClick={() => onTaskClick?.(task)}
                onComplete={() => onTaskComplete?.(task)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
