// src/components/projects/ProjectTasks.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7.1: Contrast Audit - Task List Component
// OPTICAL TWEAKS: Muted completion states, timestamps, and drag handles so 
// the active task titles grab immediate attention.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Plus, CheckCircle2, Circle, Clock, ChevronRight,
  GripVertical, MoreHorizontal, Trash2, Edit3
} from 'lucide-react';
import { EmptyTasks, AllTasksComplete } from '../ui/EmptyState';

const getProgressFillClass = (percentage) => {
  if (percentage >= 100) return 'bg-emerald-500';
  if (percentage >= 67) return 'bg-violet-400';
  if (percentage >= 34) return 'bg-violet-500';
  return 'bg-violet-600';
};

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const isComplete = task.status === 'completed' || task.completed;

  return (
    <div 
      className={`
        group flex items-center gap-3 p-3 rounded-xl
        bg-white border border-slate-200/60
        hover:border-violet-200/60 hover:shadow-sm
        transition-all duration-200
        ${isComplete ? 'opacity-60 bg-slate-50 border-slate-100 hover:border-slate-200' : ''}
      `}
    >
      <button className="opacity-0 group-hover:opacity-40 hover:!opacity-80 cursor-grab p-1">
        <GripVertical strokeWidth={1.5} className="w-4 h-4 text-slate-400" />
      </button>

      <button 
        onClick={() => onToggle?.(task)}
        className="flex-shrink-0"
      >
        {isComplete ? (
          <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle strokeWidth={1.5} className="w-5 h-5 text-slate-300 hover:text-violet-500 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`
          text-[14px] font-medium truncate leading-tight
          ${isComplete ? 'text-slate-400 line-through' : 'text-slate-800'}
        `}>
          {task.title || task.name}
        </h4>
        {task.dueDate && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
            <Clock strokeWidth={1.5} className="w-3 h-3 relative -top-[0.5px]" />
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>

      {task.subtasks?.length > 0 && (
        <div className="w-24 hidden sm:block shrink-0 px-4">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressFillClass(task.progress || 0)}`}
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit?.(task)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Edit3 strokeWidth={1.5} className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete?.(task)}
          className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 strokeWidth={1.5} className="w-4 h-4" />
        </button>
      </div>

      <ChevronRight strokeWidth={1.5} className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
    </div>
  );
}

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
          flex items-center gap-2 w-full p-3.5 rounded-xl
          border border-dashed border-slate-200
          text-slate-500 hover:text-slate-800
          hover:border-slate-300 hover:bg-slate-50
          transition-all duration-200
        "
      >
        <Plus strokeWidth={2} className="w-4 h-4" />
        <span className="text-sm font-medium">Add task</span>
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
          flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
          bg-white border border-slate-200 shadow-sm
          text-slate-900 placeholder:text-slate-400
          focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none
          transition-all duration-200
        "
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="
          px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-violet-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]
          hover:bg-violet-700 active:translate-y-[1px] active:shadow-none
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => { setIsExpanded(false); setValue(''); }}
        className="
          px-4 py-2.5 rounded-xl text-sm font-medium
          text-slate-500 hover:text-slate-800 hover:bg-slate-50
          transition-colors
        "
      >
        Cancel
      </button>
    </form>
  );
}

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

      <AddTaskInput onAdd={onAddTask} />

      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200/60">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
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
