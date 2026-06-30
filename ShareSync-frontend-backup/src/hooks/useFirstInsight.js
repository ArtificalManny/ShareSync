// src/hooks/useFirstInsight.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9.3: The "Aha" Moment - First Insight Detection
// ═══════════════════════════════════════════════════════════════════════════════
//
// Tracks user's task completion patterns and generates their first behavioral
// insight after ~5 completed tasks.
//
// Example insights:
// - "You shipped 3 tasks before noon - you might be a morning person"
// - "You complete tasks fastest on Tuesdays"
// - "You prefer working in 2-hour focused bursts"
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'ss.first-insight';
const TASK_HISTORY_KEY = 'ss.task-completions';
const MIN_TASKS_FOR_INSIGHT = 5;

/**
 * Insight templates based on detected patterns
 */
const INSIGHT_TEMPLATES = {
  morningPerson: {
    id: 'morning-person',
    emoji: '🌅',
    title: 'Early Bird Detected',
    template: "You've shipped {count} tasks before noon. You might be a morning person.",
    tip: 'Consider scheduling your hardest work before lunch.',
    category: 'time',
  },
  afternoonWarrior: {
    id: 'afternoon-warrior', 
    emoji: '☀️',
    title: 'Afternoon Warrior',
    template: "Most of your ships happen between 1-5pm. Your afternoon focus is strong.",
    tip: 'Protect this time - minimize meetings here.',
    category: 'time',
  },
  nightOwl: {
    id: 'night-owl',
    emoji: '🦉',
    title: 'Night Owl Mode',
    template: "You've shipped {count} tasks after 6pm. You thrive when the world quiets down.",
    tip: 'Embrace it, but watch your sleep.',
    category: 'time',
  },
  consistentShipper: {
    id: 'consistent-shipper',
    emoji: '📈',
    title: 'Consistency King',
    template: "You've shipped tasks on {count} different days. Consistency builds momentum.",
    tip: 'Keep the streak alive!',
    category: 'habit',
  },
  burstWorker: {
    id: 'burst-worker',
    emoji: '⚡',
    title: 'Burst Worker',
    template: "You shipped {count} tasks in a single session. You work in powerful bursts.",
    tip: 'Plan for recovery time between bursts.',
    category: 'style',
  },
  quickStarter: {
    id: 'quick-starter',
    emoji: '🚀',
    title: 'Quick Starter',
    template: "Your average time from task creation to completion is under {time}. You don't procrastinate.",
    tip: 'Your bias toward action is a superpower.',
    category: 'style',
  },
  weekdayWarrior: {
    id: 'weekday-warrior',
    emoji: '💼',
    title: 'Weekday Warrior',
    template: "All your ships happen Monday-Friday. You protect your weekends.",
    tip: 'Great work-life boundary setting.',
    category: 'habit',
  },
  weekendHustler: {
    id: 'weekend-hustler',
    emoji: '🏠',
    title: 'Weekend Builder',
    template: "You've shipped {count} tasks on weekends. Side projects thrive with you.",
    tip: 'Just remember to rest too.',
    category: 'habit',
  },
  focusedFinisher: {
    id: 'focused-finisher',
    emoji: '🎯',
    title: 'Focused Finisher',
    template: "You complete tasks {percent}% faster than average. Deep focus is your edge.",
    tip: 'Protect your focus time religiously.',
    category: 'style',
  },
};

/**
 * Analyze task completion data and detect patterns
 */
function analyzePatterns(completions) {
  if (completions.length < MIN_TASKS_FOR_INSIGHT) {
    return null;
  }

  const patterns = {
    morningCount: 0,      // Before noon
    afternoonCount: 0,    // 12-5pm
    eveningCount: 0,      // After 5pm
    weekdayCount: 0,
    weekendCount: 0,
    uniqueDays: new Set(),
    sameDayBursts: 0,     // Multiple tasks same day
    avgCompletionTime: 0, // Hours from creation to completion
  };

  let lastDate = null;
  let sameDayCount = 0;
  let totalCompletionTime = 0;
  let tasksWithTime = 0;

  completions.forEach(completion => {
    const date = new Date(completion.completedAt);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const dateKey = date.toDateString();

    // Time of day
    if (hour < 12) patterns.morningCount++;
    else if (hour < 17) patterns.afternoonCount++;
    else patterns.eveningCount++;

    // Day of week
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      patterns.weekendCount++;
    } else {
      patterns.weekdayCount++;
    }

    // Unique days
    patterns.uniqueDays.add(dateKey);

    // Same-day bursts
    if (lastDate === dateKey) {
      sameDayCount++;
    } else {
      if (sameDayCount >= 3) patterns.sameDayBursts++;
      sameDayCount = 1;
      lastDate = dateKey;
    }

    // Completion time (if we have creation time)
    if (completion.createdAt) {
      const createdDate = new Date(completion.createdAt);
      const hoursToComplete = (date - createdDate) / (1000 * 60 * 60);
      if (hoursToComplete > 0 && hoursToComplete < 168) { // Under a week
        totalCompletionTime += hoursToComplete;
        tasksWithTime++;
      }
    }
  });

  // Final burst check
  if (sameDayCount >= 3) patterns.sameDayBursts++;

  // Calculate average completion time
  if (tasksWithTime > 0) {
    patterns.avgCompletionTime = totalCompletionTime / tasksWithTime;
  }

  return patterns;
}

/**
 * Generate the best insight based on patterns
 */
function generateInsight(patterns, totalTasks) {
  if (!patterns) return null;

  const total = totalTasks;
  const insights = [];

  // Morning person (>60% before noon)
  if (patterns.morningCount / total > 0.6) {
    insights.push({
      ...INSIGHT_TEMPLATES.morningPerson,
      message: INSIGHT_TEMPLATES.morningPerson.template.replace('{count}', patterns.morningCount),
      strength: patterns.morningCount / total,
    });
  }

  // Afternoon warrior (>50% between 12-5)
  if (patterns.afternoonCount / total > 0.5) {
    insights.push({
      ...INSIGHT_TEMPLATES.afternoonWarrior,
      message: INSIGHT_TEMPLATES.afternoonWarrior.template,
      strength: patterns.afternoonCount / total,
    });
  }

  // Night owl (>40% after 5pm)
  if (patterns.eveningCount / total > 0.4) {
    insights.push({
      ...INSIGHT_TEMPLATES.nightOwl,
      message: INSIGHT_TEMPLATES.nightOwl.template.replace('{count}', patterns.eveningCount),
      strength: patterns.eveningCount / total,
    });
  }

  // Consistent shipper (tasks on 4+ different days)
  if (patterns.uniqueDays.size >= 4) {
    insights.push({
      ...INSIGHT_TEMPLATES.consistentShipper,
      message: INSIGHT_TEMPLATES.consistentShipper.template.replace('{count}', patterns.uniqueDays.size),
      strength: patterns.uniqueDays.size / 7,
    });
  }

  // Burst worker (completed 3+ tasks in one session)
  if (patterns.sameDayBursts > 0) {
    insights.push({
      ...INSIGHT_TEMPLATES.burstWorker,
      message: INSIGHT_TEMPLATES.burstWorker.template.replace('{count}', '3+'),
      strength: 0.7,
    });
  }

  // Quick starter (avg completion under 4 hours)
  if (patterns.avgCompletionTime > 0 && patterns.avgCompletionTime < 4) {
    const timeStr = patterns.avgCompletionTime < 1 
      ? `${Math.round(patterns.avgCompletionTime * 60)} minutes`
      : `${Math.round(patterns.avgCompletionTime)} hours`;
    insights.push({
      ...INSIGHT_TEMPLATES.quickStarter,
      message: INSIGHT_TEMPLATES.quickStarter.template.replace('{time}', timeStr),
      strength: 0.8,
    });
  }

  // Weekday warrior (Available weekdays)
  if (patterns.weekdayCount === total && total >= 5) {
    insights.push({
      ...INSIGHT_TEMPLATES.weekdayWarrior,
      message: INSIGHT_TEMPLATES.weekdayWarrior.template,
      strength: 0.9,
    });
  }

  // Weekend hustler (>30% on weekends)
  if (patterns.weekendCount / total > 0.3) {
    insights.push({
      ...INSIGHT_TEMPLATES.weekendHustler,
      message: INSIGHT_TEMPLATES.weekendHustler.template.replace('{count}', patterns.weekendCount),
      strength: patterns.weekendCount / total,
    });
  }

  // Return the strongest insight
  if (insights.length === 0) return null;
  
  insights.sort((a, b) => b.strength - a.strength);
  return insights[0];
}

/**
 * useFirstInsight - Hook to track and generate first behavioral insight
 */
export default function useFirstInsight() {
  const [completions, setCompletions] = useState([]);
  const [insight, setInsight] = useState(null);
  const [hasShownInsight, setHasShownInsight] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCompletions = localStorage.getItem(TASK_HISTORY_KEY);
      const storedInsight = localStorage.getItem(STORAGE_KEY);
      
      if (storedCompletions) {
        setCompletions(JSON.parse(storedCompletions));
      }
      
      if (storedInsight) {
        const parsed = JSON.parse(storedInsight);
        setInsight(parsed.insight);
        setHasShownInsight(parsed.shown);
      }
    } catch (e) {
      console.error('[FirstInsight] Failed to load:', e);
    }
    setIsReady(true);
  }, []);

  // Save completions to localStorage
  useEffect(() => {
    if (!isReady) return;
    try {
      localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(completions));
    } catch (e) {
      console.error('[FirstInsight] Failed to save completions:', e);
    }
  }, [completions, isReady]);

  // Save insight to localStorage
  useEffect(() => {
    if (!isReady || !insight) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        insight,
        shown: hasShownInsight,
        generatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('[FirstInsight] Failed to save insight:', e);
    }
  }, [insight, hasShownInsight, isReady]);

  /**
   * Record a task completion
   */
  const recordCompletion = useCallback((taskData = {}) => {
    const completion = {
      id: taskData.id || `task-${Date.now()}`,
      completedAt: new Date().toISOString(),
      createdAt: taskData.createdAt || null,
      category: taskData.category || null,
    };

    setCompletions(prev => {
      const updated = [...prev, completion];
      
      // Check if we should generate insight
      if (updated.length >= MIN_TASKS_FOR_INSIGHT && !insight) {
        const patterns = analyzePatterns(updated);
        const newInsight = generateInsight(patterns, updated.length);
        if (newInsight) {
          setInsight(newInsight);
        }
      }
      
      return updated;
    });
  }, [insight]);

  /**
   * Mark insight as shown
   */
  const markInsightShown = useCallback(() => {
    setHasShownInsight(true);
  }, []);

  /**
   * Reset for testing
   */
  const reset = useCallback(() => {
    setCompletions([]);
    setInsight(null);
    setHasShownInsight(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TASK_HISTORY_KEY);
  }, []);

  // Derived state
  const tasksUntilInsight = Math.max(0, MIN_TASKS_FOR_INSIGHT - completions.length);
  const shouldShowInsight = insight && !hasShownInsight;
  const progress = Math.min(100, (completions.length / MIN_TASKS_FOR_INSIGHT) * 100);

  return {
    // State
    completions,
    insight,
    hasShownInsight,
    isReady,
    
    // Derived
    tasksUntilInsight,
    shouldShowInsight,
    progress,
    totalCompletions: completions.length,
    
    // Actions
    recordCompletion,
    markInsightShown,
    reset,
  };
}

/**
 * Get insight templates (for preview/testing)
 */
export function getInsightTemplates() {
  return INSIGHT_TEMPLATES;
}
