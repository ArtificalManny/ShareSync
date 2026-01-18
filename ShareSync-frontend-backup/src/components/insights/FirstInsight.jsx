// src/components/insights/FirstInsight.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9.3: The "Aha" Moment - First Insight Display
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is THE moment where ShareSync proves it understands the user.
// After ~5 completed tasks, we show them a behavioral insight.
//
// Design: Celebratory but credible. Like a coach who noticed something about you.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Lightbulb, ChevronRight, Brain } from 'lucide-react';

/**
 * FirstInsight - Modal/card displaying the user's first behavioral insight
 * 
 * @param {object} insight - The insight object from useFirstInsight
 * @param {function} onDismiss - Callback when dismissed
 * @param {function} onExplore - Callback to explore more insights
 * @param {boolean} isModal - Show as modal overlay vs inline card
 */
export default function FirstInsight({ 
  insight, 
  onDismiss, 
  onExplore,
  isModal = true,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Show tip after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (!insight) return null;

  const content = (
    <div className={`
      relative max-w-md w-full p-8 rounded-2xl
      bg-surface-1 border border-brand/20
      shadow-2xl shadow-brand/10
      transition-all duration-500 ease-out
      ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
    `}>
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        {/* Icon */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand to-accent-500 opacity-20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-brand to-accent-500 flex items-center justify-center shadow-lg">
            <span className="text-4xl">{insight.emoji}</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium mb-3">
          <Sparkles className="w-3 h-3" />
          First Insight Unlocked
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {insight.title}
        </h2>
      </div>

      {/* Insight message */}
      <div className="p-4 rounded-xl bg-surface-2 border border-white/[0.06] mb-4">
        <p className="text-text-primary text-center leading-relaxed">
          {insight.message}
        </p>
      </div>

      {/* Tip (appears after delay) */}
      {showTip && insight.tip && (
        <div className={`
          flex items-start gap-3 p-4 rounded-xl
          bg-success/5 border border-success/20
          animate-fade-in
        `}>
          <Lightbulb className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-success mb-0.5">Pro Tip</p>
            <p className="text-sm text-text-secondary">{insight.tip}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleDismiss}
          className="
            w-full py-3 rounded-xl font-semibold
            bg-brand text-white
            hover:bg-brand-600 hover:shadow-glow-brand
            transition-all duration-300
          "
        >
          Got It!
        </button>
        
        {onExplore && (
          <button
            onClick={() => {
              handleDismiss();
              onExplore();
            }}
            className="
              w-full py-2.5 rounded-xl text-sm font-medium
              text-text-secondary hover:text-brand hover:bg-surface-2
              transition-colors
            "
          >
            <span className="flex items-center justify-center gap-2">
              See More Insights
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        )}
      </div>

      {/* Category tag */}
      <div className="absolute bottom-4 left-4">
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
          {insight.category} insight
        </span>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300
        ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}
      `}>
        {content}
      </div>
    );
  }

  return content;
}

/**
 * InsightCard - Compact card version for dashboard
 */
export function InsightCard({ insight, onClick }) {
  if (!insight) return null;

  return (
    <button
      onClick={onClick}
      className="
        w-full p-4 rounded-xl text-left
        bg-gradient-to-r from-brand/5 to-accent-500/5
        border border-brand/10
        hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5
        transition-all duration-300 group
      "
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-xl shrink-0">
          {insight.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {insight.title}
            </h4>
            <Brain className="w-3.5 h-3.5 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">
            {insight.message}
          </p>
        </div>
      </div>
    </button>
  );
}

/**
 * InsightProgress - Shows progress toward first insight
 */
export function InsightProgress({ 
  completedTasks, 
  requiredTasks = 5,
  compact = false,
}) {
  const progress = Math.min(100, (completedTasks / requiredTasks) * 100);
  const remaining = Math.max(0, requiredTasks - completedTasks);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-brand" />
        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-text-tertiary tabular-nums">
          {completedTasks}/{requiredTasks}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-text-primary">
            First Insight Loading...
          </h4>
          <p className="text-xs text-text-secondary">
            {remaining > 0 
              ? `Ship ${remaining} more task${remaining === 1 ? '' : 's'} to unlock`
              : 'Analyzing your patterns...'
            }
          </p>
        </div>
      </div>
      
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-brand to-accent-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-[10px] text-text-tertiary">
        <span>{completedTasks} shipped</span>
        <span>{requiredTasks} needed</span>
      </div>
    </div>
  );
}

/**
 * InsightTeaser - Teaser shown before first insight unlocks
 */
export function InsightTeaser({ tasksRemaining = 5 }) {
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-dashed border-brand/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <span className="text-xl">🔮</span>
        </div>
        <div>
          <h4 className="text-sm font-medium text-text-primary">
            Your first insight awaits
          </h4>
          <p className="text-xs text-text-secondary">
            Ship {tasksRemaining} more task{tasksRemaining === 1 ? '' : 's'} to unlock 
            personalized insights about your work style.
          </p>
        </div>
      </div>
    </div>
  );
}
