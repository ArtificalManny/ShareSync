// src/components/home/YourWorld.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// For GRID cards, zones stack vertically but maintain consistent order:
// ┌─────────────────────────────┐
// │ ZONE 1: Identity            │
// │ Icon + Title + Project      │
// ├─────────────────────────────┤
// │ ZONE 2: Status              │
// │ Due date / completion       │
// ├─────────────────────────────┤
// │ ZONE 3: Action (on hover)   │
// │ Quick actions               │
// └─────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { CheckCircle2, Clock, ChevronRight } from 'lucide-react';

const YourWorld = ({ 
  tasks = [
    { id: 1, title: 'Refactor Dashboard CSS', projectName: 'ShareSync v2', completed: false, dueDate: 'Today' },
    { id: 2, title: 'API Integration', projectName: 'AI Engine', completed: true, dueDate: 'Done' },
    { id: 3, title: 'User Testing', projectName: 'Mobile App', completed: false, dueDate: 'Tomorrow' }
  ],
  onTaskClick,
  onViewAll
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Your World</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Active tasks across projects</p>
        </div>
        <button 
          onClick={onViewAll}
          className="text-xs text-text-tertiary hover:text-brand transition-colors"
        >
          View All
        </button>
      </div>

      {/* Task List - Horizontal rows for consistent scanning */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className={`
              group flex items-center gap-4 p-3 rounded-xl cursor-pointer
              bg-surface-1 border border-white/[0.06]
              hover:bg-surface-2 hover:border-white/[0.1]
              transition-all duration-200
              ${task.completed ? 'opacity-60' : ''}
            `}
          >
            {/* ═══════════════════════════════════════════════════════════════
                ZONE 1: Identity (What task? Which project?)
                Status icon + Title + Project name
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Status Icon */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                ${task.completed 
                  ? 'bg-success/10 text-success' 
                  : 'bg-surface-2 text-text-tertiary group-hover:bg-brand/10 group-hover:text-brand'
                }
                transition-colors duration-200
              `}>
                {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>

              {/* Title + Project */}
              <div className="min-w-0 flex-1">
                <h4 className={`
                  text-sm font-medium truncate transition-colors
                  ${task.completed 
                    ? 'text-text-tertiary line-through' 
                    : 'text-text-primary group-hover:text-brand'
                  }
                `}>
                  {task.title}
                </h4>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {task.projectName}
                </p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ZONE 2: Status (When is it due?)
                Due date - color coded
            ═══════════════════════════════════════════════════════════════ */}
            <div className="hidden sm:block shrink-0">
              <span className={`
                text-xs font-medium
                ${task.completed 
                  ? 'text-success' 
                  : task.dueDate === 'Today' 
                    ? 'text-warning' 
                    : 'text-text-tertiary'
                }
              `}>
                {task.completed ? 'Done' : task.dueDate}
              </span>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ZONE 3: Action (Navigate to task)
                Chevron on hover
            ═══════════════════════════════════════════════════════════════ */}
            <div className="shrink-0">
              <ChevronRight className="
                w-4 h-4 text-text-tertiary
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
              " />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YourWorld;
