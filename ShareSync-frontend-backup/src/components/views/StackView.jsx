// src/components/views/StackView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// STACK VIEW: Your prioritized work queue
// Tasks grouped by purpose ("Why Chain"), sorted by impact
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Plus, Filter, SlidersHorizontal, Search, ChevronDown, ChevronRight,
  Zap, Users, Clock, CheckCircle2, Circle, AlertCircle, Lock,
  MoreHorizontal, Play, GripVertical, Target, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SORT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const SORT_OPTIONS = [
  { id: 'impact', label: 'Impact Score', icon: Zap },
  { id: 'unblocking', label: 'Unblocking Power', icon: Users },
  { id: 'quickWins', label: 'Quick Wins', icon: Sparkles },
  { id: 'dueSoon', label: 'Due Soon', icon: Clock },
  { id: 'myFocus', label: 'My Focus (AI)', icon: Target },
];

const GROUP_OPTIONS = [
  { id: 'objective', label: 'By Objective (Why)' },
  { id: 'assignee', label: 'By Assignee' },
  { id: 'status', label: 'By Status' },
  { id: 'priority', label: 'By Priority' },
  { id: 'none', label: 'No Grouping' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TASK ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TaskRow({ task, onComplete, onSelect, isSelected }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'border-error-500';
      case 'high': return 'border-warning-500';
      case 'medium': return 'border-brand-500';
      default: return 'border-transparent';
    }
  };
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate && !isOverdue && 
    (new Date(task.dueDate) - new Date()) < 2 * 24 * 60 * 60 * 1000;
  
  return (
    <div
      className={`
        group flex items-center gap-3 px-4 py-3 rounded-xl
        border-l-4 ${getPriorityColor(task.priority)}
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'bg-brand-500/10 border-brand-500' : 'bg-surface-2/50 hover:bg-surface-2'}
        ${task.isBlocked ? 'opacity-60' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(task)}
    >
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-100 cursor-grab text-text-tertiary">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete?.(task);
        }}
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 
          flex items-center justify-center transition-all
          ${task.completed 
            ? 'bg-success-500 border-success-500' 
            : 'border-text-tertiary hover:border-brand-400'
          }
        `}
      >
        {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>
      
      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${task.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
            {task.title}
          </span>
          
          {task.isBlocked && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-500/15 text-error-400 text-xs">
              <Lock className="w-3 h-3" />
              Blocked
            </span>
          )}
        </div>
        
        {/* Meta info */}
        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-surface-3 flex items-center justify-center text-[10px]">
                {task.assignee.avatar || task.assignee.name?.charAt(0)}
              </div>
              <span>{task.assignee.name}</span>
            </div>
          )}
          
          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-error-400' : isDueSoon ? 'text-warning-400' : ''}`}>
              <Clock className="w-3 h-3" />
              <span>
                {isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* XP reward */}
      {task.xp > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-sm font-medium">
          <Zap className="w-3.5 h-3.5" />
          <span>+{task.xp}</span>
        </div>
      )}
      
      {/* Unblocks count */}
      {task.unblocksCount > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">
          <Users className="w-3.5 h-3.5" />
          <span>{task.unblocksCount}</span>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Start working on task
          }}
          className="p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-400 transition-colors"
        >
          <Play className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg hover:bg-surface-3 text-text-tertiary transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBJECTIVE GROUP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ObjectiveGroup({ objective, tasks, onTaskComplete, onTaskSelect }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const completedCount = tasks.filter(t => t.completed).length;
  const totalXP = tasks.reduce((sum, t) => sum + (t.xp || 0), 0);
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  
  return (
    <div className="mb-6">
      {/* Objective header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-white/[0.06] hover:bg-surface-2 transition-colors group"
      >
        <div className="text-text-tertiary">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
        
        <Target className="w-5 h-5 text-brand-400" />
        
        <div className="flex-1 text-left">
          <div className="font-semibold text-text-primary">{objective.title}</div>
          {objective.why && (
            <div className="text-xs text-text-tertiary mt-0.5">Why: {objective.why}</div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-tertiary">
            {completedCount}/{tasks.length} tasks
          </span>
          <span className="flex items-center gap-1 text-brand-400">
            <Zap className="w-4 h-4" />
            {totalXP} XP
          </span>
        </div>
      </button>
      
      {/* Tasks */}
      {isExpanded && (
        <div className="mt-2 ml-8 space-y-2">
          {tasks.map(task => (
            <TaskRow 
              key={task.id} 
              task={task}
              onComplete={onTaskComplete}
              onSelect={onTaskSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function StackToolbar({ 
  sortBy, 
  onSortChange, 
  groupBy, 
  onGroupChange,
  searchQuery,
  onSearchChange,
  onAddTask 
}) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const currentSort = SORT_OPTIONS.find(o => o.id === sortBy) || SORT_OPTIONS[0];
  const currentGroup = GROUP_OPTIONS.find(o => o.id === groupBy) || GROUP_OPTIONS[0];
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* Add Task */}
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
        
        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
        
        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Sort: {currentSort.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute top-full left-0 mt-2 w-48 bg-surface-1 border border-white/[0.08] rounded-xl shadow-xl z-20 overflow-hidden">
                {SORT_OPTIONS.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        onSortChange(option.id);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                        ${sortBy === option.id ? 'bg-brand-500/10 text-brand-400' : 'text-text-secondary hover:bg-white/[0.04]'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        
        {/* Group */}
        <div className="relative">
          <button
            onClick={() => setShowGroupDropdown(!showGroupDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors"
          >
            <span>Group: {currentGroup.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showGroupDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowGroupDropdown(false)} />
              <div className="absolute top-full left-0 mt-2 w-48 bg-surface-1 border border-white/[0.08] rounded-xl shadow-xl z-20 overflow-hidden">
                {GROUP_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onGroupChange(option.id);
                      setShowGroupDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                      ${groupBy === option.id ? 'bg-brand-500/10 text-brand-400' : 'text-text-secondary hover:bg-white/[0.04]'}
                    `}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08]">
        <Search className="w-4 h-4 text-text-tertiary" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..." 
          className="bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none w-48"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyState({ onAddTask }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/[0.08]">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-success-400" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">All caught up!</h3>
      <p className="text-sm text-text-tertiary mb-6">No tasks in your stack right now</p>
      <button
        onClick={onAddTask}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add First Task</span>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function StackView({ 
  tasks = [], 
  objectives = [],
  onTaskComplete,
  onTaskSelect,
  onAddTask 
}) {
  const [sortBy, setSortBy] = useState('impact');
  const [groupBy, setGroupBy] = useState('objective');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);
  
  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    switch (sortBy) {
      case 'impact':
        return sorted.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      case 'unblocking':
        return sorted.sort((a, b) => (b.unblocksCount || 0) - (a.unblocksCount || 0));
      case 'quickWins':
        return sorted.sort((a, b) => (a.estimatedMinutes || 999) - (b.estimatedMinutes || 999));
      case 'dueSoon':
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      default:
        return sorted;
    }
  }, [filteredTasks, sortBy]);
  
  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ id: 'all', title: 'All Tasks', tasks: sortedTasks }];
    }
    
    if (groupBy === 'objective') {
      // Group by objective
      const groups = {};
      const noObjective = [];
      
      sortedTasks.forEach(task => {
        if (task.objectiveId) {
          if (!groups[task.objectiveId]) {
            const obj = objectives.find(o => o.id === task.objectiveId);
            groups[task.objectiveId] = {
              id: task.objectiveId,
              title: obj?.title || 'Unknown Objective',
              why: obj?.why,
              tasks: []
            };
          }
          groups[task.objectiveId].tasks.push(task);
        } else {
          noObjective.push(task);
        }
      });
      
      const result = Object.values(groups);
      if (noObjective.length > 0) {
        result.push({ id: 'backlog', title: 'Backlog', tasks: noObjective });
      }
      return result;
    }
    
    // Add other grouping options as needed
    return [{ id: 'all', title: 'All Tasks', tasks: sortedTasks }];
  }, [sortedTasks, groupBy, objectives]);
  
  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalXP = tasks.reduce((sum, t) => sum + (t.xp || 0), 0);
  
  return (
    <div className="p-10 max-w-[1400px] mx-auto">
      {/* Header stats */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="text-text-tertiary">
          <span className="text-text-primary font-semibold">{totalTasks - completedTasks}</span> tasks remaining
        </div>
        <div className="text-text-tertiary">
          <span className="text-success-400 font-semibold">{completedTasks}</span> completed
        </div>
        <div className="flex items-center gap-1 text-brand-400">
          <Zap className="w-4 h-4" />
          <span className="font-semibold">{totalXP}</span>
          <span className="text-text-tertiary">XP available</span>
        </div>
      </div>
      
      {/* Toolbar */}
      <StackToolbar
        sortBy={sortBy}
        onSortChange={setSortBy}
        groupBy={groupBy}
        onGroupChange={setGroupBy}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddTask={onAddTask}
      />
      
      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <EmptyState onAddTask={onAddTask} />
      ) : (
        <div>
          {groupedTasks.map(group => (
            <ObjectiveGroup
              key={group.id}
              objective={group}
              tasks={group.tasks}
              onTaskComplete={onTaskComplete}
              onTaskSelect={onTaskSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
