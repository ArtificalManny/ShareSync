// src/hooks/useMomentumContagion.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.2: Momentum Contagion Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Manages the live team activity feed for social proof.
// Accepts injected activities (from useHomeRealtime or props)
// AND listens for local browser events (local-ship, local-task-complete).
//
// ZERO BACKEND DEPENDENCY — works with whatever activity data is already
// flowing through the app. When socket events are wired up later,
// just inject them the same way.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────
const MAX_FEED_ITEMS = 20;
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// ─────────────────────────────────────────────────────────────────────────
// TIME HELPERS
// ─────────────────────────────────────────────────────────────────────────
export function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date.getTime?.() ?? date;
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────
// NORMALIZE ACTIVITY
// Handles multiple shapes: useHomeRealtime items, socket events, local events
// ─────────────────────────────────────────────────────────────────────────
function normalizeActivity(raw) {
  if (!raw) return null;

  // Already normalized
  if (raw._normalized) return raw;

  const id = raw.id || raw._id || `contagion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const userName = raw.userName
    || raw.actorName
    || raw.user?.name
    || (raw.userId?.firstName ? raw.userId.firstName + ' ' + (raw.userId.lastName || '') : null)
    || (raw.actorId?.firstName ? raw.actorId.firstName + ' ' + (raw.actorId.lastName || '') : null)
    || raw.actor
    || raw.name
    || 'A teammate';
  const userAvatar = raw.userAvatar || raw.profilePicture || raw.user?.avatar || raw.userId?.profilePicture || raw.actorId?.profilePicture || raw.avatar || raw.raw?.userId?.profilePicture || null;

  // Determine action type
  let actionType = raw.actionType || raw.type || raw.action || 'activity';
  if (typeof actionType === 'string') {
    actionType = actionType.toLowerCase().replace(/_/g, '-');
  }

  // Determine what they did
  const taskName = raw.taskName
    || raw.payload?.snapshot?.title
    || raw.raw?.payload?.snapshot?.title
    || raw.raw?.taskTitle
    || raw.metadata?.taskTitle
    || raw.task?.title
    || raw.title
    || raw.description
    || raw.message
    || '';
  const projectName = raw.projectName || raw.project?.name || raw.project || '';

  // Timestamp
  const timestamp = raw.timestamp || raw.createdAt || raw.at || new Date().toISOString();

  // XP earned (if available)
  const xp = raw.xp || raw.xpEarned || 0;

  return {
    _normalized: true,
    id,
    userName,
    userAvatar,
    actionType,
    taskName,
    projectName,
    timestamp,
    xp,
    isLocal: Boolean(raw._isLocal),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// ACTION LABELS
// ─────────────────────────────────────────────────────────────────────────
export function getActionLabel(actionType) {
  const labels = {
    'project-ship': 'shipped',
    'task-complete': 'completed',
    'task-completed': 'completed',
    'task-start': 'started working on',
    'task-started': 'started working on',
    'focus-start': 'entered focus mode for',
    'focus-complete': 'finished focus session on',
    'ship': 'shipped',
    'complete': 'completed',
    'start': 'started',
    'comment': 'commented on',
    'review': 'reviewed',
  };
  return labels[actionType] || 'worked on';
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────
export function useMomentumContagion({
  injectedActivities = [],
  maxItems = MAX_FEED_ITEMS,
  enabled = true,
} = {}) {
  const [localItems, setLocalItems] = useState([]);
  const [optedIn, setOptedIn] = useState(() => {
    try {
      const stored = localStorage.getItem('ss.contagion.optIn');
      return stored === null ? true : stored === '1';
    } catch {
      return true;
    }
  });
  const seenIdsRef = useRef(new Set());

  // ── Persist opt-in preference ──
  const updateOptIn = useCallback((value) => {
    setOptedIn(value);
    try { localStorage.setItem('ss.contagion.optIn', value ? '1' : '0'); } catch {}
  }, []);

  // ── Listen for local browser events (local-ship, etc.) ──
  useEffect(() => {
    if (!enabled) return;

    function handleLocalShip(e) {
      const detail = e.detail;
      if (!detail) return;

      const item = normalizeActivity({
        id: `local-ship-${Date.now()}`,
        userName: 'You',
        actionType: 'project-ship',
        taskName: detail.project?.name || '',
        projectName: detail.project?.name || '',
        xp: detail.xp || 0,
        timestamp: new Date().toISOString(),
        _isLocal: true,
      });

      if (item) {
        setLocalItems((prev) => [item, ...prev].slice(0, maxItems));
      }
    }

    function handleLocalTaskComplete(e) {
      const detail = e.detail;
      if (!detail) return;

      const item = normalizeActivity({
        id: `local-task-${Date.now()}`,
        userName: 'You',
        actionType: 'task-complete',
        taskName: detail.task?.title || detail.title || '',
        projectName: detail.project?.name || '',
        xp: detail.xp || 0,
        timestamp: new Date().toISOString(),
        _isLocal: true,
      });

      if (item) {
        setLocalItems((prev) => [item, ...prev].slice(0, maxItems));
      }
    }

    window.addEventListener('local-ship', handleLocalShip);
    window.addEventListener('local-task-complete', handleLocalTaskComplete);

    return () => {
      window.removeEventListener('local-ship', handleLocalShip);
      window.removeEventListener('local-task-complete', handleLocalTaskComplete);
    };
  }, [enabled, maxItems]);

  // ── Merge injected + local, deduplicate, sort ──
  const feed = useMemo(() => {
    if (!enabled || !optedIn) return [];

    const normalized = injectedActivities
      .map(normalizeActivity)
      .filter(Boolean);

    // Combine
    const all = [...localItems, ...normalized];

    // Deduplicate by id
    const deduped = [];
    const seen = new Set();
    for (const item of all) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduped.push(item);
      }
    }

    // Sort newest first
    deduped.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return tB - tA;
    });

    // Trim
    return deduped.slice(0, maxItems);
  }, [injectedActivities, localItems, enabled, optedIn, maxItems]);

  // ── Stats ──
  const stats = useMemo(() => {
    const now = Date.now();
    const recentThreshold = 15 * 60 * 1000; // 15 min

    const recentItems = feed.filter((item) => {
      const t = new Date(item.timestamp).getTime();
      return now - t < recentThreshold;
    });

    const shippingNow = recentItems.filter((item) =>
      ['project-ship', 'ship', 'task-complete', 'task-completed', 'complete'].includes(item.actionType)
    ).length;

    const uniqueUsers = new Set(recentItems.map((item) => item.userName)).size;

    return {
      totalRecent: recentItems.length,
      shippingNow,
      uniqueActiveUsers: uniqueUsers,
      isEmpty: feed.length === 0,
    };
  }, [feed]);

  return {
    feed,
    stats,
    optedIn,
    setOptedIn: updateOptIn,
    enabled,
  };
}

export default useMomentumContagion;
