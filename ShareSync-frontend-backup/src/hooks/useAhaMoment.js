// src/hooks/useAhaMoment.js
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: "Aha Moment" Detection Hook
// Monitors user milestones and triggers insight toasts at key moments
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

const AHA_STORAGE_KEY = 'ss.aha';

// ── Milestone definitions ────────────────────────────────────────────────
const MILESTONES = [
  {
    id: 'first-task',
    title: 'First Task Created',
    emoji: '✅',
    message: 'You created your first task! People who create a task in their first session are 3x more likely to stick around.',
    triggerEvent: 'task:created',
    threshold: 1,
  },
  {
    id: 'first-ship',
    title: 'First Ship!',
    emoji: '🚀',
    message: 'You just shipped for the first time! Shipping is the core habit that separates builders from planners.',
    triggerEvent: 'project:shipped',
    threshold: 1,
  },
  {
    id: 'three-day-streak',
    title: '3-Day Streak',
    emoji: '🔥',
    message: 'Three days in a row! Research shows it takes 3 consecutive sessions to form a new habit loop.',
    triggerEvent: 'streak:updated',
    threshold: 3,
  },
  {
    id: 'five-tasks',
    title: 'Velocity Unlocked',
    emoji: '⚡',
    message: 'You\'ve completed 5 tasks. Your velocity is building — most users hit their flow state around task 7.',
    triggerEvent: 'task:completed',
    threshold: 5,
  },
  {
    id: 'collaborator',
    title: 'Team Player',
    emoji: '👥',
    message: 'You invited your first collaborator! Teams that ship together have 4x higher retention.',
    triggerEvent: 'member:invited',
    threshold: 1,
  },
];

function loadAhaState() {
  try {
    const raw = localStorage.getItem(AHA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[useAhaMoment] Failed to load state:', e);
  }
  return {
    seen: [],       // milestone IDs already shown
    counts: {},     // event type → count
    pending: null,  // milestone waiting to be shown
  };
}

function saveAhaState(state) {
  try {
    localStorage.setItem(AHA_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[useAhaMoment] Failed to save state:', e);
  }
}

export default function useAhaMoment() {
  const [state, setState] = useState(loadAhaState);
  const [showToast, setShowToast] = useState(false);
  const [currentInsight, setCurrentInsight] = useState(null);
  const stateRef = useRef(state);

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = state;
    saveAhaState(state);
  }, [state]);

  // ── Record an event and check milestones ───────────────────────────────
  const recordEvent = useCallback((eventType, value = 1) => {
    setState((prev) => {
      const counts = { ...prev.counts };
      counts[eventType] = (counts[eventType] || 0) + value;

      // Check if any unseen milestone is now triggered
      for (const milestone of MILESTONES) {
        if (prev.seen.includes(milestone.id)) continue;
        if (milestone.triggerEvent !== eventType) continue;

        const count = counts[eventType] || 0;
        if (count >= milestone.threshold) {
          // Trigger this milestone
          setCurrentInsight(milestone);
          setShowToast(true);

          return {
            ...prev,
            counts,
            seen: [...prev.seen, milestone.id],
            pending: milestone.id,
          };
        }
      }

      return { ...prev, counts };
    });
  }, []);

  // ── Listen for custom events from other parts of the app ───────────────
  useEffect(() => {
    const handlers = {};

    const eventTypes = [
      'task:created', 'task:completed', 'project:shipped',
      'streak:updated', 'member:invited',
    ];

    for (const type of eventTypes) {
      const handler = (e) => {
        const value = e?.detail?.value || e?.detail?.count || 1;
        recordEvent(type, typeof value === 'number' ? value : 1);
      };
      handlers[type] = handler;
      window.addEventListener(type, handler);
    }

    // Also listen for the generic "local-ship" event from Home.jsx
    const shipHandler = () => recordEvent('project:shipped', 1);
    window.addEventListener('local-ship', shipHandler);

    return () => {
      for (const [type, handler] of Object.entries(handlers)) {
        window.removeEventListener(type, handler);
      }
      window.removeEventListener('local-ship', shipHandler);
    };
  }, [recordEvent]);

  // ── Dismiss handler ────────────────────────────────────────────────────
  const dismissInsight = useCallback(() => {
    setShowToast(false);
    // Small delay before clearing so exit animation plays
    setTimeout(() => setCurrentInsight(null), 400);
  }, []);

  // ── View handler (could open a modal in future) ────────────────────────
  const viewInsight = useCallback(() => {
    setShowToast(false);
    setTimeout(() => setCurrentInsight(null), 400);
    // Future: open insight detail modal
  }, []);

  // ── Manual trigger for testing ─────────────────────────────────────────
  const triggerMilestone = useCallback((milestoneId) => {
    const milestone = MILESTONES.find((m) => m.id === milestoneId);
    if (milestone) {
      setCurrentInsight(milestone);
      setShowToast(true);
    }
  }, []);

  // ── Reset (for testing) ────────────────────────────────────────────────
  const reset = useCallback(() => {
    const fresh = { seen: [], counts: {}, pending: null };
    setState(fresh);
    saveAhaState(fresh);
    setShowToast(false);
    setCurrentInsight(null);
  }, []);

  return {
    // State
    showToast,
    currentInsight,
    seenMilestones: state.seen,
    eventCounts: state.counts,

    // Actions
    recordEvent,
    dismissInsight,
    viewInsight,
    triggerMilestone,
    reset,
  };
}
