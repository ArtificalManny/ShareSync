// src/components/tasks/DraggableTaskRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.3: Wrapper adding drag handle + drop indicators to task rows
// Used in Stack (list) view. Wraps any task row content as children.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { GripVertical } from 'lucide-react';

export default function DraggableTaskRow({
  index,
  dragHandlers = {},
  dropHandlers = {},
  indicatorPosition = null,  // 'before' | 'after' | null
  isDragging = false,
  isOver = false,
  children,
  className = '',
  onClick,
}) {
  return (
    <div className="relative">
      {/* Drop indicator — before */}
      {indicatorPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-500 z-10 rounded-full"
          style={{ transform: 'translateY(-1px)' }}
        >
          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-violet-500" />
        </div>
      )}

      {/* Row */}
      <div
        {...dropHandlers}
        className={`
          flex items-center gap-2 group
          transition-all duration-150
          ${isDragging ? 'opacity-30 scale-[0.98]' : 'opacity-100'}
          ${isOver ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''}
          ${className}
        `}
      >
        {/* Drag handle */}
        <div
          {...dragHandlers}
          className="
            flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing
            opacity-0 group-hover:opacity-100
            text-slate-300 dark:text-zinc-600
            hover:text-slate-500 dark:hover:text-zinc-400
            hover:bg-slate-100 dark:hover:bg-white/5
            transition-all duration-150
          "
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Task content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onClick}
        >
          {children}
        </div>
      </div>

      {/* Drop indicator — after */}
      {indicatorPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 z-10 rounded-full"
          style={{ transform: 'translateY(1px)' }}
        >
          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-violet-500" />
        </div>
      )}
    </div>
  );
}
