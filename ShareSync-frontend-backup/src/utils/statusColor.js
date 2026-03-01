// src/utils/statusColor.js
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 2.2: Status Color Helper
// Maps task/project state → CSS status class
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Status CSS class names (apply alongside card tier classes)
 */
export const STATUS_CLASSES = {
  active: 'status-active',
  complete: 'status-complete',
  urgent: 'status-urgent',
  upcoming: 'status-upcoming',
  growth: 'status-growth',
};

/**
 * Hex colors for programmatic use (inline styles, charts, etc.)
 */
export const STATUS_COLORS = {
  active: '#7C3AED',
  complete: '#14B8A6',
  urgent: '#F43F5E',
  upcoming: '#22D3EE',
  growth: '#F59E0B',
};

/**
 * Infer the status class from a task or project object.
 *
 * @param {object} item - Task, project, or move
 * @returns {string} CSS class name (e.g. 'status-active')
 */
export function getStatusColor(item) {
  if (!item) return '';

  // Urgent / blocked / overdue
  const status = (item.status || '').toLowerCase();
  const isOverdue = item.isOverdue || item.overdue;
  const isBlocked = item.isBlocked || status === 'blocked';

  if (isOverdue || isBlocked || status === 'urgent' || status === 'critical') {
    return STATUS_CLASSES.urgent;
  }

  // Completed / shipped / done
  if (
    status === 'completed' || status === 'done' || status === 'shipped' ||
    item.isCompleted || item.isShipped || item.completedAt
  ) {
    return STATUS_CLASSES.complete;
  }

  // Upcoming / scheduled / planned
  if (status === 'upcoming' || status === 'scheduled' || status === 'planned' || status === 'todo') {
    return STATUS_CLASSES.upcoming;
  }

  // Growth / XP / learning
  if (item.isXP || item.isLevelUp || item.isGrowth || status === 'learning') {
    return STATUS_CLASSES.growth;
  }

  // Active / in progress (default for anything in motion)
  if (
    status === 'active' || status === 'in_progress' || status === 'in-progress' ||
    status === 'started' || item.isActive
  ) {
    return STATUS_CLASSES.active;
  }

  // No status strip for unknown states
  return '';
}

/**
 * Get the hex color for a status (for inline styles, charts, dots)
 * @param {object} item
 * @returns {string|null} Hex color or null
 */
export function getStatusHex(item) {
  const cls = getStatusColor(item);
  const key = Object.entries(STATUS_CLASSES).find(([, v]) => v === cls)?.[0];
  return key ? STATUS_COLORS[key] : null;
}

export default getStatusColor;
