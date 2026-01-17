// src/components/projects/ProjectTasks.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: Visual Cohesion - Task List Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features:
// - Empty state with encouraging copy
// - Progress bars use purple intensity
// - Consistent with design token system
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Plus, CheckCircle2, Circle, Clock, ChevronRight,
  GripVertical, MoreHorizontal, Trash2, Edit3
} from 'lucide-react';
import { EmptyTasks, AllTasksComplete } from '../ui/EmptyState';

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS COLOR - Phase 7: Purple intensity
───────────────────────────────────────────────────────────────────────── */
const getProgressFillClass = (percentage) => {
  if (percentage >= 100) return 'bg-success';
  if (percentage >= 67) return 'bg-brand-400';
  if (percentage >= 34) return 'bg-brand';
  return 'bg-brand-700';
};

/* ─────────────────────────────────────────────────────────────────────────
   TASK ITEM
───────────────────────────────────────────────────────────────────────── */
function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const isComplete = task.status === 'completed' || task.completed;

  return (
    <div 
      className={`
        group flex items-center gap-3 p-3 rounded-lg
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isComplete ? 'opacity-60' : ''}
      `}
    >
      {/* Drag Handle */}
      <button className="opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab">
        <GripVertical className="w-4 h-4 text-text-tertiary" />
      </button>

      {/* Checkbox */}
      <button 
        onClick={() => onToggle?.(task)}
        className="flex-shrink-0"
      >
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-text-tertiary hover:text-brand transition-colors" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`
          text-sm font-medium truncate
          ${isComplete ? 'text-text-tertiary line-through' : 'text-text-primary'}
        `}>
          {task.title || task.name}
        </h4>
        {task.dueDate && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-text-tertiary">
            <Clock className="w-3 h-3" />
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>

      {/* Progress (if subtasks) */}
      {task.subtasks?.length > 0 && (
        <div className="w-20 hidden sm:block">
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressFillClass(task.progress || 0)}`}
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit?.(task)}
          className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => onDelete?.(task)}
          className="p-1.5 rounded-md hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ADD TASK INPUT
───────────────────────────────────────────────────────────────────────── */
function AddTaskInput({ onAdd }) {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd?.(value.trim());
      setValue('');
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="
          flex items-center gap-2 w-full p-3 rounded-lg
          border border-dashed border-white/[0.08]
          text-text-tertiary hover:text-text-secondary
          hover:border-white/[0.12] hover:bg-surface-1
          transition-all duration-200
        "
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add task</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        className="
          flex-1 px-3 py-2.5 rounded-lg text-sm
          bg-surface-1 border border-white/[0.1]
          text-text-primary placeholder:text-text-tertiary
          focus:border-brand/50 focus:outline-none
          transition-colors
        "
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="
          px-4 py-2.5 rounded-lg text-sm font-medium
          bg-brand text-white
          hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => { setIsExpanded(false); setValue(''); }}
        className="
          px-3 py-2.5 rounded-lg text-sm
          text-text-tertiary hover:text-text-primary
          transition-colors
        "
      >
        Cancel
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function ProjectTasks({ 
  tasks = [], 
  projectName,
  onAddTask, 
  onToggleTask, 
  onEditTask, 
  onDeleteTask,
  showCompleted = true,
}) {
  const activeTasks = tasks.filter(t => t.status !== 'completed' && !t.completed);
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.completed);
  const allComplete = tasks.length > 0 && activeTasks.length === 0;

  // No tasks at all
  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyTasks 
          projectName={projectName}
          onAddTask={() => {/* Focus the add input */}}
        />
        <AddTaskInput onAdd={onAddTask} />
      </div>
    );
  }

  // All tasks complete - celebration!
  if (allComplete && !showCompleted) {
    return (
      <div className="space-y-4">
        <AllTasksComplete />
        <AddTaskInput onAdd={onAddTask} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-2">
          {activeTasks.map(task => (
            <TaskItem 
              key={task._id || task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Add Task */}
      <AddTaskInput onAdd={onAddTask} />

      {/* Completed Tasks */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/[0.06]">
          <h3 className="text-xs text-text-tertiary uppercase tracking-wider mb-3">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskItem 
                key={task._id || task.id}
                task={task}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
