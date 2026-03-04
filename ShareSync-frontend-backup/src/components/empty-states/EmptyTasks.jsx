// src/components/empty-states/EmptyTasks.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4.1: Empty States That Sell - Empty Tasks
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
    <div className="w-full">
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
            placeholder="Add your first move..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <AnimatePresence>
            {value && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-4 py-1.5 rounded-lg btn-primary text-white text-xs font-semibold hover:scale-105 transition-all"
              >
                Add Move
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>
      
      {/* ⭐ PHASE 4.1: Pro Tip Added */}
      <div className="flex justify-center mt-5">
        <span className="text-xs font-medium text-text-tertiary bg-surface-2/50 px-4 py-2 rounded-full border border-white/[0.04]">
          💡 <strong className="text-text-secondary">Pro tip:</strong> Start with just 3 moves. You can always add more.
        </span>
      </div>
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
  variant = 'illustrated',
  className = '',
}) {
  const { glowLevel, isFireMode, recordActivity } = useMomentumContext();
  
  const handleAddTask = (taskText) => {
    if (onAddTask) {
      onAddTask(taskText);
      if (recordActivity) recordActivity('TASK_CREATE', { projectName });
    }
  };
  
  const handleSelectSuggestion = (suggestionText) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestionText);
    } else {
      handleAddTask(suggestionText);
    }
  };
  
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
        title="A blank canvas"
        description="Break your vision into moves. What's the first thing to ship?"
        variant={variant}
        size="default"
        accentColor={isFireMode ? 'energy' : 'brand'}
      >
        {/* Quick Add Input */}
        {showQuickAdd && (
          <motion.div
            className="max-w-md mx-auto mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuickAddTask onAdd={handleAddTask} autoFocus />
          </motion.div>
        )}
      </EmptyState>
    </div>
  );
}

// Compact and Inline exports remaining the same as original
export function EmptyTasksCompact({ onAddTask, columnName, className = '' }) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
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
          onBlur={() => { if (!value) setIsAdding(false); }}
          placeholder="First move..."
          className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-brand-500/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={handleSubmit} disabled={!value.trim()} className="flex-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 disabled:opacity-50 transition-colors">Add</button>
          <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-xs hover:bg-surface-3 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }
  
  return (
    <button onClick={() => setIsAdding(true)} className={`w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-white/[0.08] hover:border-brand-500/30 hover:bg-surface-2/50 transition-all duration-200 text-text-tertiary hover:text-text-secondary ${className}`}>
      <Plus className="w-4 h-4" />
      <span className="text-sm">Add move{columnName ? ` to ${columnName}` : ''}</span>
    </button>
  );
}

export function EmptyTasksInline({ onAddTask, message = 'No moves yet', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
      <span className="text-sm text-text-tertiary">{message}</span>
      {onAddTask && (
        <button onClick={onAddTask} className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add one
        </button>
      )}
    </div>
  );
}

export function AllTasksComplete({ projectName, onAddMore, className = '' }) {
  const { glowLevel, isFireMode } = useMomentumContext();
  return (
    <div className={`text-center py-12 ${className}`}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className={`w-16 h-16 rounded-2xl mx-auto mb-4 ${isFireMode ? 'bg-energy-500/10' : 'bg-success-500/10'} flex items-center justify-center ${glowLevel >= 4 ? (isFireMode ? 'shadow-glow-energy' : 'shadow-glow-success') : ''}`}>
        <CheckCircle2 className={`w-8 h-8 ${isFireMode ? 'text-energy-500' : 'text-success-500'}`} />
      </motion.div>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg font-semibold text-text-primary mb-2">All moves complete! 🎉</motion.h3>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-sm text-text-secondary mb-6">You've crushed it in {projectName}. What's next?</motion.p>
      {onAddMore && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={onAddMore} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
          <Plus className="w-4 h-4" /> Add more moves
        </motion.button>
      )}
    </div>
  );
}
