// src/components/kanban/KanbanBoard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.3: Full kanban board component
// Columns = task statuses. Drag cards between columns to change status.
// Drag within column to reorder.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import { Columns3 } from 'lucide-react';
import KanbanColumn from './KanbanColumn';

const DEFAULT_COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-amber-500' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500' },
];

export default function KanbanBoard({
  tasks = [],
  columns = DEFAULT_COLUMNS,
  projectId = null,
  onTaskClick,
  onStatusChange,
  onReorder,
  onTaskComplete,
  className = '',
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    const map = {};
    columns.forEach((col) => { map[col.id] = []; });

    tasks.forEach((task) => {
      const status = task.status || 'todo';
      if (map[status]) {
        map[status].push(task);
      } else {
        // Unknown status → put in first column
        map[columns[0]?.id || 'todo']?.push(task);
      }
    });

    // Sort each column by order field
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return map;
  }, [tasks, columns]);

  // ── Drag start from a card ─────────────────────────────────────────
  const handleCardDragStart = useCallback((task, sourceColumn) => {
    setDraggedTask({ task, sourceColumn });
  }, []);

  // ── Drag over a column ─────────────────────────────────────────────
  const handleColumnDragOver = useCallback((columnId, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleColumnDragLeave = useCallback((columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  }, [dragOverColumn]);

  // ── Drop on a column ───────────────────────────────────────────────
  const handleColumnDrop = useCallback((targetColumn) => {
    if (!draggedTask) return;

    const { task, sourceColumn } = draggedTask;
    const taskId = task.id || task._id;

    if (sourceColumn !== targetColumn) {
      // Move to new column (change status)
      onStatusChange?.(taskId, targetColumn, projectId);
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  }, [draggedTask, onStatusChange, projectId]);

  // ── Reorder within a column ────────────────────────────────────────
  const handleColumnReorder = useCallback((columnId, fromIndex, toIndex) => {
    const columnTasks = tasksByColumn[columnId] || [];
    const taskIds = columnTasks.map((t) => t.id || t._id);

    // Reorder
    const [moved] = taskIds.splice(fromIndex, 1);
    taskIds.splice(toIndex, 0, moved);

    onReorder?.(projectId, taskIds, columnId);
  }, [tasksByColumn, onReorder, projectId]);

  // ── Drag end (cleanup) ─────────────────────────────────────────────
  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Columns3 className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Board View</h2>
        <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByColumn[col.id] || []}
            isDragOver={dragOverColumn === col.id}
            draggedTaskId={draggedTask?.task?.id || draggedTask?.task?._id}
            onCardDragStart={(task) => handleCardDragStart(task, col.id)}
            onDragOver={(e) => handleColumnDragOver(col.id, e)}
            onDragLeave={() => handleColumnDragLeave(col.id)}
            onDrop={() => handleColumnDrop(col.id)}
            onDragEnd={handleDragEnd}
            onReorder={(from, to) => handleColumnReorder(col.id, from, to)}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
          />
        ))}
      </div>
    </div>
  );
}
