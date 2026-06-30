// src/components/onboarding/FirstTaskCreator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9.2: Instant Gratification - Quick Task Creation
// ═══════════════════════════════════════════════════════════════════════════════
//
// A streamlined task creator that appears after onboarding completion.
// Goal: User creates their first task within 60 seconds of signing up.
//
// Features:
// - Pre-filled with their onboarding task (if they provided one)
// - Encouraging microcopy
// - Immediate visual feedback on creation
// - No overwhelming options - just title and go
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { Check, Sparkles, ArrowRight, Zap } from 'lucide-react';

/**
 * FirstTaskCreator - Streamlined task creation for new users
 * 
 * @param {string} prefillTask - Task from onboarding to pre-fill
 * @param {string} userName - User's first name for personalization
 * @param {function} onTaskCreated - Callback when task is created
 * @param {function} onSkip - Callback to skip task creation
 */
export default function FirstTaskCreator({ 
  prefillTask = '', 
  userName = '',
  onTaskCreated,
  onSkip,
}) {
  const [task, setTask] = useState(prefillTask);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async () => {
    if (!task.trim()) return;
    
    setIsCreating(true);
    
    // Simulate creation (replace with real API call)
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setIsCreating(false);
    setIsCreated(true);
    setShowConfetti(true);
    
    // Callback after animation
    setTimeout(() => {
      onTaskCreated?.(task.trim());
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && task.trim() && !isCreating) {
      handleCreate();
    }
  };

  // Success state
  if (isCreated) {
    return (
      <div className="relative p-8 rounded-2xl bg-surface-1 border border-success/20 text-center">
        {/* Confetti effect */}
        {showConfetti && <ConfettiEffect />}
        
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
          <Check className="w-8 h-8 text-success" />
        </div>
        
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          First mission created!
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          You just started building momentum, {userName || 'Captain'}.
        </p>
        
        {/* Task preview */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 text-sm text-text-primary">
          <Zap className="w-4 h-4 text-brand" />
          <span className="truncate max-w-[200px]">{task}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Your first mission awaits
          </h3>
          <p className="text-xs text-text-tertiary">
            Start small. Ship fast. Build momentum.
          </p>
        </div>
      </div>
      
      {/* Input */}
      <div className="relative mb-4">
        <input
          ref={inputRef}
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What will you ship first?"
          maxLength={100}
          className="
            w-full px-4 py-3.5 pr-12 rounded-xl
            bg-surface-2 border border-white/[0.06]
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20
            transition-all duration-200
          "
        />
        
        {/* Character count */}
        {task.length > 50 && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
            {task.length}/100
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Skip for now
        </button>
        
        <button
          onClick={handleCreate}
          disabled={!task.trim() || isCreating}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
            transition-all duration-300
            ${task.trim() && !isCreating
              ? 'bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand' 
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
            }
          `}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Mission
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      
      {/* Encouragement text */}
      {task.length > 5 && (
        <p className="mt-4 text-center text-xs text-success animate-fade-in">
          Great choice! Small wins compound into big momentum.
        </p>
      )}
    </div>
  );
}

/**
 * Simple confetti effect using CSS
 */
function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            '--x': `${Math.random() * 100}%`,
            '--delay': `${Math.random() * 0.5}s`,
            '--color': ['#A855F7', '#D946EF', '#14B8A6', '#F59E0B'][Math.floor(Math.random() * 4)],
          }}
        />
      ))}
      
      <style>{`
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          background: var(--color);
          left: var(--x);
          top: 50%;
          border-radius: 2px;
          animation: confetti-fall 1.5s ease-out var(--delay) forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          Available {
            transform: translateY(-100px) rotate(720deg) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Compact inline version for dashboard use
 */
export function FirstTaskInline({ onTaskCreated }) {
  const [task, setTask] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!task.trim() || isCreating) return;
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    onTaskCreated?.(task.trim());
    setTask('');
    setIsCreating(false);
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-1 border border-white/[0.06]">
      <Zap className="w-4 h-4 text-brand shrink-0" />
      <input
        type="text"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        placeholder="Quick add a task..."
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
      {task.trim() && (
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="px-3 py-1 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-600 transition-colors"
        >
          {isCreating ? '...' : 'Add'}
        </button>
      )}
    </div>
  );
}
