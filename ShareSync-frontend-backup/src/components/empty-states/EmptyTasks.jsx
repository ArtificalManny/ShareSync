// src/components/empty-states/EmptyTasks.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Empty Tasks
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shown when a project has no tasks yet.
// This is a creative opportunity, not a void!
//
// Key messaging:
// - "This project is a blank canvas"
// - Encouraging the first action
// - Quick task entry
// - AI-powered suggestions
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  Zap, 
  Target,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  ListTodo,
  Clock,
  Command,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { CanvasIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ADD TASK INPUT
// ═══════════════════════════════════════════════════════════════════════════════
const QuickAddTask = ({ onAdd, autoFocus = false }) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const { glowLevel } = useMomentumContext();
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && onAdd) {
      onAdd(value.trim());
      setValue('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`
        relative flex items-center gap-2
        px-4 py-3 rounded-xl
        bg-surface-2 border
        transition-all duration-200
        ${isFocused 
          ? 'border-brand-500/50 ring-2 ring-brand-500/20' 
          : 'border-white/[0.08]'
        }
        ${glowLevel >= 4 && isFocused ? 'shadow-glow-brand' : ''}
      `}>
        <Plus className={`w-5 h-5 transition-colors ${isFocused ? 'text-brand-400' : 'text-text-tertiary'}`} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Add your first task..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              type="submit"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 transition-colors"
            >
              Add
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Keyboard hint */}
      <div className="flex justify-center mt-2">
        <span className="text-[10px] text-text-tertiary flex items-center gap-1">
          Press <kbd className="px-1 py-0.5 rounded bg-surface-2 font-mono">Enter</kbd> to add
        </span>
      </div>
    </form>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI SUGGESTED TASKS
// ═══════════════════════════════════════════════════════════════════════════════
const SuggestedTasks = ({ projectName, onSelectTask }) => {
  const { glowLevel } = useMomentumContext();
  
  // These would come from AI in real implementation
  const suggestions = [
    { text: 'Define project scope and goals', icon: Target },
    { text: 'Break down into milestones', icon: ListTodo },
    { text: 'Set initial deadlines', icon: Clock },
    { text: 'Identify first deliverable', icon: CheckCircle2 },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-warning-500" />
        <span className="text-xs text-text-tertiary">Suggested first tasks</span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            onClick={() => onSelectTask(suggestion.text)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-surface-2 border border-white/[0.06]
              hover:bg-surface-3 hover:border-brand-500/20
              transition-all duration-200
              text-sm text-text-secondary hover:text-text-primary
              ${glowLevel >= 3 ? 'hover:shadow-sm' : ''}
            `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <suggestion.icon className="w-4 h-4 text-brand-400" />
            <span>{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASK TYPE QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TaskTypeActions = ({ onSelectType }) => {
  const types = [
    { id: 'task', label: 'Task', icon: CheckCircle2, color: 'brand' },
    { id: 'milestone', label: 'Milestone', icon: Target, color: 'cyan' },
    { id: 'bug', label: 'Bug', icon: Zap, color: 'energy' },
  ];
  
  return (
    <div className="flex justify-center gap-2 mt-4">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelectType(type.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-xs font-medium
            bg-surface-2 hover:bg-surface-3
            text-text-secondary hover:text-text-primary
            border border-white/[0.06]
            transition-all duration-200
          `}
        >
          <type.icon className="w-3.5 h-3.5" />
          {type.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyTasks({
  projectName = 'this project',
  onAddTask,
  onSelectSuggestion,
  showSuggestions = true,
  showQuickAdd = true,
  variant = 'illustrated', // 'minimal' | 'illustrated' | 'animated'
  className = '',
}) {
  const { glowLevel, isFireMode, recordActivity } = useMomentumContext();
  
  const handleAddTask = (taskText) => {
    if (onAddTask) {
      onAddTask(taskText);
      // Record activity for momentum
      if (recordActivity) {
        recordActivity('TASK_CREATE', { projectName });
      }
    }
  };
  
  const handleSelectSuggestion = (suggestionText) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestionText);
    } else {
      handleAddTask(suggestionText);
    }
  };
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-6 ${className}`}>
        <CheckCircle2 className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-sm text-text-secondary mb-3">No tasks yet</p>
        {showQuickAdd && (
          <div className="max-w-sm mx-auto">
            <QuickAddTask onAdd={handleAddTask} />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <EmptyState
        illustration={CanvasIllustration}
        title="This project is a blank canvas"
        description={`Every masterpiece starts with a single stroke. Add your first task to ${projectName} and begin building something amazing.`}
        variant={variant}
        size="default"
        accentColor={isFireMode ? 'energy' : 'brand'}
      >
        {/* Quick Add Input */}
        {showQuickAdd && (
          <motion.div
            className="max-w-md mx-auto mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuickAddTask onAdd={handleAddTask} autoFocus />
          </motion.div>
        )}
        
        {/* AI Suggestions */}
        {showSuggestions && (
          <SuggestedTasks 
            projectName={projectName}
            onSelectTask={handleSelectSuggestion}
          />
        )}
      </EmptyState>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for kanban columns, small panels)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyTasksCompact({ onAddTask, columnName, className = '' }) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);
  
  const handleSubmit = () => {
    if (value.trim() && onAddTask) {
      onAddTask(value.trim());
      setValue('');
      setIsAdding(false);
    }
  };
  
  if (isAdding) {
    return (
      <div className={`p-2 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setIsAdding(false);
          }}
          onBlur={() => {
            if (!value) setIsAdding(false);
          }}
          placeholder="Task title..."
          className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-brand-500/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-xs hover:bg-surface-3 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => setIsAdding(true)}
      className={`
        w-full flex items-center justify-center gap-2 p-4 rounded-lg
        border border-dashed border-white/[0.08]
        hover:border-brand-500/30 hover:bg-surface-2/50
        transition-all duration-200
        text-text-tertiary hover:text-text-secondary
        ${className}
      `}
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm">Add task{columnName ? ` to ${columnName}` : ''}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE VARIANT (for task lists)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyTasksInline({ onAddTask, message = 'No tasks yet', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
      <span className="text-sm text-text-tertiary">{message}</span>
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add one
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION VARIANT (all tasks completed!)
// ═══════════════════════════════════════════════════════════════════════════════
export function AllTasksComplete({ projectName, onAddMore, className = '' }) {
  const { glowLevel, isFireMode } = useMomentumContext();
  
  return (
    <div className={`text-center py-12 ${className}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className={`
          w-16 h-16 rounded-2xl mx-auto mb-4
          ${isFireMode ? 'bg-energy-500/10' : 'bg-success-500/10'}
          flex items-center justify-center
          ${glowLevel >= 4 ? (isFireMode ? 'shadow-glow-energy' : 'shadow-glow-success') : ''}
        `}
      >
        <CheckCircle2 className={`w-8 h-8 ${isFireMode ? 'text-energy-500' : 'text-success-500'}`} />
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-text-primary mb-2"
      >
        All tasks complete! 🎉
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-text-secondary mb-6"
      >
        You've crushed it in {projectName}. What's next?
      </motion.p>
      
      {onAddMore && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onAddMore}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add more tasks
        </motion.button>
      )}
    </div>
  );
}
