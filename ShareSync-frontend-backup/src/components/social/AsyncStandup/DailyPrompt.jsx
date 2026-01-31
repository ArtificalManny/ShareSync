// src/components/social/AsyncStandup/DailyPrompt.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Async Standup - Daily Prompt
// "What will you ship today?" - No meetings required
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Rocket, Send, X, ChevronRight, Clock, Sparkles,
  CheckCircle2, AlertCircle, Coffee, Target, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// STANDUP PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

const DAILY_PROMPTS = [
  { emoji: '🚀', text: "What will you ship today?" },
  { emoji: '🎯', text: "What's your #1 focus?" },
  { emoji: '⚡', text: "What will move the needle today?" },
  { emoji: '🔥', text: "What are you most excited to work on?" },
  { emoji: '💪', text: "What's your biggest priority?" },
];

const BLOCKER_PROMPTS = [
  "Anything blocking you?",
  "Need help with anything?",
  "Waiting on anyone?",
];

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUICK SELECT
// ═══════════════════════════════════════════════════════════════════════════════

function TaskQuickSelect({ tasks, selectedTasks, onToggle }) {
  if (tasks.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="text-xs text-text-tertiary">
        Or pick from your tasks:
      </div>
      <div className="flex flex-wrap gap-2">
        {tasks.slice(0, 5).map(task => (
          <button
            key={task.id}
            onClick={() => onToggle(task)}
            className={`
              px-3 py-1.5 rounded-lg text-xs
              border transition-all duration-200
              ${selectedTasks.find(t => t.id === task.id)
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                : 'bg-surface-2 border-white/[0.06] text-text-secondary hover:border-white/[0.1]'
              }
            `}
          >
            {task.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DAILY PROMPT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DailyPrompt - Modal/card for daily standup prompt
 */
export function DailyPrompt({
  isOpen,
  onClose,
  onSubmit,
  suggestedTasks = [],
  userName = 'there',
  previousUpdate = null,
  className = '',
}) {
  const [focusText, setFocusText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [blockerText, setBlockerText] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get today's prompt (rotate based on day of week)
  const todayPrompt = DAILY_PROMPTS[new Date().getDay() % DAILY_PROMPTS.length];
  const blockerPrompt = BLOCKER_PROMPTS[new Date().getDay() % BLOCKER_PROMPTS.length];
  
  const handleToggleTask = useCallback((task) => {
    setSelectedTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) {
        return prev.filter(t => t.id !== task.id);
      }
      return [...prev, task];
    });
  }, []);
  
  const handleSubmit = useCallback(async () => {
    if (!focusText.trim() && selectedTasks.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        focus: focusText.trim(),
        tasks: selectedTasks,
        blocker: hasBlocker ? blockerText.trim() : null,
        timestamp: new Date().toISOString(),
      });
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  }, [focusText, selectedTasks, hasBlocker, blockerText, onSubmit, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-lg
        bg-surface-0 border border-white/[0.08] rounded-2xl
        shadow-2xl overflow-hidden
        animate-in fade-in zoom-in-95 duration-300
        ${className}
      `}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <span className="text-2xl">{todayPrompt.emoji}</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-text-primary">
                  Good morning, {userName}!
                </div>
                <div className="text-sm text-text-tertiary flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Daily check-in</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-text-tertiary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main prompt */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {todayPrompt.text}
            </label>
            <textarea
              value={focusText}
              onChange={(e) => setFocusText(e.target.value)}
              placeholder="I'm going to..."
              className="
                w-full px-4 py-3 rounded-xl
                bg-surface-1 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50
                resize-none
              "
              rows={3}
            />
          </div>
          
          {/* Task quick select */}
          <TaskQuickSelect
            tasks={suggestedTasks}
            selectedTasks={selectedTasks}
            onToggle={handleToggleTask}
          />
          
          {/* Selected tasks preview */}
          {selectedTasks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-xs"
                >
                  <Target className="w-3 h-3" />
                  <span>{task.title}</span>
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="ml-1 hover:text-brand-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Blocker section */}
          <div>
            <button
              onClick={() => setHasBlocker(!hasBlocker)}
              className={`
                flex items-center gap-2 text-sm
                ${hasBlocker ? 'text-warning-500' : 'text-text-tertiary hover:text-text-secondary'}
                transition-colors
              `}
            >
              <AlertCircle className="w-4 h-4" />
              <span>{blockerPrompt}</span>
            </button>
            
            {hasBlocker && (
              <textarea
                value={blockerText}
                onChange={(e) => setBlockerText(e.target.value)}
                placeholder="What's in your way?"
                className="
                  mt-2 w-full px-4 py-3 rounded-xl
                  bg-warning-500/5 border border-warning-500/20
                  text-text-primary placeholder:text-text-tertiary
                  focus:outline-none focus:border-warning-500/50
                  resize-none
                "
                rows={2}
              />
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-text-tertiary hover:text-text-secondary"
          >
            Skip for today
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!focusText.trim() && selectedTasks.length === 0)}
            className="
              px-4 py-2 rounded-lg
              bg-brand-500 text-white font-medium
              hover:bg-brand-400 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            "
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Sharing...' : 'Share with team'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI DAILY PROMPT BANNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DailyPromptBanner - Compact banner to trigger daily prompt
 */
export function DailyPromptBanner({
  onOpen,
  hasCompleted = false,
  className = '',
}) {
  if (hasCompleted) {
    return (
      <div className={`
        flex items-center gap-3 p-3 rounded-xl
        bg-success-500/10 border border-success-500/30
        ${className}
      `}>
        <CheckCircle2 className="w-5 h-5 text-success-500" />
        <span className="text-sm text-success-400">
          Daily check-in complete! Your team can see your focus.
        </span>
      </div>
    );
  }
  
  return (
    <button
      onClick={onOpen}
      className={`
        w-full flex items-center gap-3 p-4 rounded-xl
        bg-gradient-to-r from-brand-500/10 to-purple-500/10
        border border-brand-500/30
        hover:border-brand-500/50 transition-all duration-200
        text-left group
        ${className}
      `}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
        <Rocket className="w-5 h-5 text-brand-400" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">
          What will you ship today?
        </div>
        <div className="text-xs text-text-tertiary">
          Share your focus with the team
        </div>
      </div>
      
      <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

export default DailyPrompt;
