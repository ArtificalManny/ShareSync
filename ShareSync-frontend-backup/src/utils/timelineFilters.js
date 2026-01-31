// src/utils/timelineFilters.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Timeline Filter Logic
// ═══════════════════════════════════════════════════════════════════════════════

export const EVENT_TYPES = {
  all: { label: 'All Events', icon: 'list', color: 'text-text-secondary' },
  ship: { label: 'Ships', icon: 'rocket', color: 'text-brand' },
  blocker: { label: 'Blockers', icon: 'alert-triangle', color: 'text-error-500' },
  decision: { label: 'Decisions', icon: 'git-branch', color: 'text-warning' },
  milestone: { label: 'Milestones', icon: 'flag', color: 'text-success' },
};

export const IMPACT_LEVELS = {
  high: { label: 'High Impact', color: 'text-error-500', bg: 'bg-error-500/10' },
  medium: { label: 'Medium Impact', color: 'text-warning', bg: 'bg-warning/10' },
  low: { label: 'Low Impact', color: 'text-text-tertiary', bg: 'bg-surface-2' },
};

export const DECISION_TYPES = {
  descope: { label: 'Descope', icon: 'scissors', color: 'text-warning' },
  technical: { label: 'Technical', icon: 'code', color: 'text-cyan-400' },
  process: { label: 'Process', icon: 'settings', color: 'text-brand' },
  priority: { label: 'Priority', icon: 'arrow-up-down', color: 'text-success' },
};

/**
 * Filter timeline events
 */
export function filterEvents(events, filters) {
  let filtered = [...events];

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(e => e.type === filters.type);
  }

  if (filters.impact) {
    filtered = filtered.filter(e => e.impact === filters.impact);
  }

  if (filters.actor) {
    filtered = filtered.filter(e => e.actor?.id === filters.actor);
  }

  if (filters.startDate) {
    filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
  }

  if (filters.endDate) {
    filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Group events by date
 */
export function groupEventsByDate(events) {
  const groups = {};

  events.forEach(event => {
    const date = new Date(event.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = {
        date,
        dateObj: new Date(event.timestamp),
        events: [],
      };
    }
    groups[date].events.push(event);
  });

  return Object.values(groups).sort((a, b) => b.dateObj - a.dateObj);
}

/**
 * Get relative time string
 */
export function getRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format date for display
 */
export function formatTimelineDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short', 
    day: 'numeric',
  });
}

/**
 * Calculate timeline statistics
 */
export function calculateTimelineStats(events) {
  return {
    total: events.length,
    byType: {
      ship: events.filter(e => e.type === 'ship').length,
      blocker: events.filter(e => e.type === 'blocker').length,
      decision: events.filter(e => e.type === 'decision').length,
      milestone: events.filter(e => e.type === 'milestone').length,
    },
    byImpact: {
      high: events.filter(e => e.impact === 'high').length,
      medium: events.filter(e => e.impact === 'medium').length,
      low: events.filter(e => e.impact === 'low').length,
    },
    resolvedBlockers: events.filter(e => e.type === 'blocker' && e.metadata?.resolved).length,
  };
}

export default {
  EVENT_TYPES,
  IMPACT_LEVELS,
  DECISION_TYPES,
  filterEvents,
  groupEventsByDate,
  getRelativeTime,
  formatTimelineDate,
  calculateTimelineStats,
};
