// src/components/views/FlowView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW VIEW: Kanban board with blocking visualization
// See work in motion, identify bottlenecks, track WIP limits
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Plus, Filter, Search, MoreHorizontal, AlertTriangle,
  Clock, Zap, Lock, User, ArrowRight, GripVertical,
  ChevronDown, Users, Activity
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT COLUMNS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_COLUMNS = [
  { id: 'backlog', title: 'Backlog', wipLimit: null, color: 'text-text-tertiary' },
  { id: 'todo', title: 'To Do', wipLimit: 5, color: 'text-cyan-400' },
  { id: 'in_progress', title: 'In Progress', wipLimit: 3, color: 'text-brand-400' },
  { id: 'review', title: 'Review', wipLimit: 4, color: 'text-warning-400' },
  { id: 'done', title: 'Done', wipLimit: null, color: 'text-success-400' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TASK CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TaskCard({ task, isDragging, onDragStart, onDragEnd }) {
  const isBlocked = task.isBlocked;
  const isBlocking = task.blockingCount > 0;
  const isActive = task.isActive;
  const isAging = task.daysInColumn > 3;
  
  const getPriorityBorder = () => {
    switch (task.priority?.toLowerCase()) {
      case 'critical': return 'border-l-error-500';
      case 'high': return 'border-l-warning-500';
      case 'medium': return 'border-l-brand-500';
      default: return 'border-l-transparent';
    }
  };
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      className={`
        group relative p-4 rounded-xl border-l-4 ${getPriorityBorder()}
        bg-surface-2 border border-white/[0.06]
        hover:border-white/[0.12] hover:bg-surface-3
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isBlocked ? 'opacity-60' : ''}
        ${isActive ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-0' : ''}
        ${isAging ? 'border-warning-500/50' : ''}
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-500 animate-pulse" />
      )}
      
      {/* Blocking indicator */}
      {isBlocking && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-error-500 text-white text-[10px] font-bold">
          Blocking {task.blockingCount}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className={`font-medium text-sm leading-tight ${isBlocked ? 'text-text-tertiary' : 'text-text-primary'}`}>
          {task.title}
        </h4>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.06] text-text-tertiary transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      {/* Tags/Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 2).map((label, idx) => (
            <span 
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: label.color + '20', color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="px-2 py-0.5 rounded text-[10px] text-text-tertiary bg-surface-3">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Left: Assignee */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${isActive ? 'bg-success-500/20 text-success-400 ring-2 ring-success-500' : 'bg-surface-3 text-text-secondary'}
            `}>
              {task.assignee.avatar || task.assignee.name?.charAt(0)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center">
              <User className="w-3 h-3 text-text-tertiary" />
            </div>
          )}
          
          {isBlocked && (
            <span className="flex items-center gap-1 text-error-400 text-xs">
              <Lock className="w-3 h-3" />
              Blocked
            </span>
          )}
          
          {isAging && !isBlocked && (
            <span className="flex items-center gap-1 text-warning-400 text-xs">
              <Clock className="w-3 h-3" />
              {task.daysInColumn}d
            </span>
          )}
        </div>
        
        {/* Right: XP */}
        {task.xp > 0 && (
          <div className="flex items-center gap-1 text-brand-400 text-xs font-medium">
            <Zap className="w-3 h-3" />
            <span>+{task.xp}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Column({ column, tasks, onAddTask, onDrop, onDragOver }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const isOverWipLimit = column.wipLimit && tasks.length > column.wipLimit;
  const isAtWipLimit = column.wipLimit && tasks.length === column.wipLimit;
  const hasAgingTasks = tasks.some(t => t.daysInColumn > 3);
  const hasBlockedTasks = tasks.some(t => t.isBlocked);
  
  const getColumnHealth = () => {
    if (isOverWipLimit) return { status: 'critical', color: 'bg-error-500' };
    if (hasBlockedTasks) return { status: 'blocked', color: 'bg-error-500' };
    if (hasAgingTasks) return { status: 'aging', color: 'bg-warning-500' };
    if (isAtWipLimit) return { status: 'full', color: 'bg-warning-500' };
    return { status: 'healthy', color: 'bg-success-500' };
  };
  
  const health = getColumnHealth();
  
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask?.(column.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };
  
  return (
    <div
      className="flex-1 min-w-[280px] max-w-[320px] flex flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e, column.id);
      }}
      onDrop={(e) => onDrop?.(e, column.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <div className={`w-2 h-2 rounded-full ${health.color}`} />
          
          <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
          
          {/* Task count */}
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            ${isOverWipLimit ? 'bg-error-500/15 text-error-400' : 'bg-surface-2 text-text-tertiary'}
          `}>
            {tasks.length}
            {column.wipLimit && `/${column.wipLimit}`}
          </span>
        </div>
        
        <button
          onClick={() => setIsAddingTask(true)}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* WIP Warning */}
      {isOverWipLimit && (
        <div className="mx-2 mb-3 px-3 py-2 rounded-lg bg-error-500/10 border border-error-500/20">
          <div className="flex items-center gap-2 text-error-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Over WIP limit! Consider finishing tasks first.</span>
          </div>
        </div>
      )}
      
      {/* Tasks Container */}
      <div className="flex-1 space-y-3 px-2 pb-4 overflow-y-auto">
        {/* Quick Add */}
        {isAddingTask && (
          <div className="p-3 rounded-xl bg-surface-2 border border-brand-500/30">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setIsAddingTask(false);
              }}
              placeholder="Task title..."
              className="w-full bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none mb-2"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-400 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        {/* Task Cards */}
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        
        {/* Empty state */}
        {tasks.length === 0 && !isAddingTask && (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full p-4 rounded-xl border-2 border-dashed border-white/[0.06] hover:border-white/[0.12] text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <Plus className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">Add task</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════

function FlowMetricsBar({ tasks, columns }) {
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const blockedCount = tasks.filter(t => t.isBlocked).length;
  const completedThisWeek = tasks.filter(t => t.status === 'done' && t.completedThisWeek).length;
  
  // Calculate average cycle time
  const completedTasks = tasks.filter(t => t.status === 'done' && t.cycleTime);
  const avgCycleTime = completedTasks.length > 0 
    ? (completedTasks.reduce((sum, t) => sum + t.cycleTime, 0) / completedTasks.length).toFixed(1)
    : '--';
  
  return (
    <div className="flex items-center gap-6 px-4 py-3 mb-6 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-brand-400" />
        <span className="text-sm text-text-tertiary">In Progress:</span>
        <span className="text-sm font-semibold text-text-primary">{inProgressCount}</span>
      </div>
      
      <div className="w-px h-4 bg-white/[0.08]" />
      
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-error-400" />
        <span className="text-sm text-text-tertiary">Blocked:</span>
        <span className={`text-sm font-semibold ${blockedCount > 0 ? 'text-error-400' : 'text-text-primary'}`}>
          {blockedCount}
        </span>
      </div>
      
      <div className="w-px h-4 bg-white/[0.08]" />
      
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-text-tertiary">Avg Cycle:</span>
        <span className="text-sm font-semibold text-text-primary">{avgCycleTime} days</span>
      </div>
      
      <div className="w-px h-4 bg-white/[0.08]" />
      
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-success-400" />
        <span className="text-sm text-text-tertiary">Done this week:</span>
        <span className="text-sm font-semibold text-success-400">{completedThisWeek}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function FlowView({ 
  tasks = [], 
  columns = DEFAULT_COLUMNS,
  onAddTask,
  onMoveTask,
  onTaskClick 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [swimlane, setSwimlane] = useState('none'); // none, assignee, priority
  const [draggedTask, setDraggedTask] = useState(null);
  
  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);
  
  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped = {};
    columns.forEach(col => {
      grouped[col.id] = filteredTasks.filter(task => task.status === col.id);
    });
    return grouped;
  }, [filteredTasks, columns]);
  
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    setDraggedTask(null);
  };
  
  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      onMoveTask?.(draggedTask.id, columnId);
    }
    setDraggedTask(null);
  };
  
  const handleAddTask = (columnId, title) => {
    onAddTask?.({ title, status: columnId });
  };
  
  return (
    <div className="p-10 max-w-full mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAddTask?.({ status: 'backlog' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors">
              <Users className="w-4 h-4" />
              <span>Swimlane: {swimlane === 'none' ? 'None' : swimlane}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08]">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..." 
            className="bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none w-48"
          />
        </div>
      </div>
      
      {/* Metrics Bar */}
      <FlowMetricsBar tasks={tasks} columns={columns} />
      
      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(column => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onAddTask={handleAddTask}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          />
        ))}
      </div>
    </div>
  );
}
