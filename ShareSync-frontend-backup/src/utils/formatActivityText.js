// src/utils/formatActivityText.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 6.3: Format activity feed items into human-readable text
//
// Fixes: "demo posted a task on Updated recently" →
//        "Manny completed 'Fix auth bug' in ShareSync Core • 2h ago"
//
// Handles all known activity types from the backend.
// ═══════════════════════════════════════════════════════════════════════════════

import { resolveDisplayName } from './resolveDisplayName';

/**
 * Activity type → verb mapping
 */
const VERB_MAP = {
  // Task actions
  task_complete:    'completed',
  task_completed:   'completed',
  TASK_COMPLETE:    'completed',
  task_create:      'created',
  task_created:     'created',
  TASK_CREATE:      'created',
  task_update:      'updated',
  task_updated:     'updated',
  TASK_UPDATE:      'updated',
  task_assign:      'was assigned',
  task_assigned:    'was assigned',
  TASK_ASSIGN:      'was assigned',
  task_delete:      'deleted',
  task_deleted:     'deleted',
  TASK_DELETE:      'deleted',
  task_comment:     'commented on',
  TASK_COMMENT:     'commented on',

  // Project actions
  project_create:   'created project',
  project_created:  'created project',
  PROJECT_CREATE:   'created project',
  project_update:   'updated project',
  project_updated:  'updated project',
  PROJECT_UPDATE:   'updated project',
  project_ship:     'shipped',
  PROJECT_SHIP:     'shipped',
  project_archive:  'archived',
  PROJECT_ARCHIVE:  'archived',

  // Ship actions
  ship:             'shipped',
  SHIP:             'shipped',
  ship_create:      'shipped',
  SHIP_CREATE:      'shipped',

  // Social actions
  comment:          'commented on',
  COMMENT:          'commented on',
  like:             'liked',
  LIKE:             'liked',
  follow:           'started following',
  FOLLOW:           'started following',
  join:             'joined',
  JOIN:             'joined',

  // Milestone
  milestone:        'reached a milestone in',
  MILESTONE:        'reached a milestone in',
  milestone_complete: 'completed a milestone in',
  MILESTONE_COMPLETE: 'completed a milestone in',

  // XP / Gamification
  xp_earn:          'earned XP in',
  XP_EARN:          'earned XP in',
  level_up:         'leveled up in',
  LEVEL_UP:         'leveled up in',
  streak:           'extended their streak',
  STREAK:           'extended their streak',
  achievement:      'unlocked an achievement',
  ACHIEVEMENT:      'unlocked an achievement',

  // Focus
  focus_start:      'started a focus session on',
  FOCUS_START:      'started a focus session on',
  focus_complete:   'completed a focus session on',
  FOCUS_COMPLETE:   'completed a focus session on',
};

/**
 * Format a raw status string into human-readable text.
 * "Updated recently" → "updated recently"
 * "in_progress" → "In Progress"
 * "todo" → "To Do"
 */
export function formatStatus(raw) {
  if (!raw || typeof raw !== 'string') return '';

  const lower = raw.toLowerCase().trim();

  const STATUS_MAP = {
    'todo':             'To Do',
    'to_do':            'To Do',
    'in_progress':      'In Progress',
    'in progress':      'In Progress',
    'inprogress':       'In Progress',
    'review':           'In Review',
    'in_review':        'In Review',
    'done':             'Done',
    'completed':        'Completed',
    'archived':         'Archived',
    'blocked':          'Blocked',
    'on_hold':          'On Hold',
    'active':           'Active',
    'planning':         'Planning',
    'updated recently': '', // This is the bug — it's a status being shown as text
  };

  if (STATUS_MAP[lower] !== undefined) return STATUS_MAP[lower];

  // Generic: capitalize first letter of each word
  return raw.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

/**
 * Format relative time: Date → "2h ago", "3d ago", "just now"
 */
export function formatTimeAgo(date) {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = Date.now();
  const diff = now - d.getTime();

  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a single activity item into a human-readable description string.
 *
 * @param {Object} activity - Raw activity object from the API
 * @returns {string} Formatted text like "Manny completed 'Fix auth bug' in ShareSync Core • 2h ago"
 */
export function formatActivityText(activity) {
  if (!activity || typeof activity !== 'object') return '';

  // ── Extract fields (handle multiple shapes) ────────────────────────────
  const activityType = activity.type || activity.action || activity.actionType || activity.event || 'update';

  // User name
  const userName = resolveActivityUserName(activity);

  // Verb
  const verb = VERB_MAP[activityType] || VERB_MAP[activityType.toLowerCase?.()] || 'updated';

  // Task / item name
  const taskName =
    activity.taskTitle || activity.task_title ||
    activity.taskName || activity.task_name ||
    activity.title || activity.itemTitle ||
    activity.target?.title || activity.target?.name ||
    activity.task?.title || activity.task?.name ||
    '';

  // Project name
  const projectName =
    activity.projectName || activity.project_name ||
    activity.projectTitle || activity.project_title ||
    activity.project?.name || activity.project?.title ||
    activity.target?.projectName || activity.target?.project?.name ||
    '';

  // Time
  const timestamp = activity.createdAt || activity.created_at || activity.timestamp || activity.date || activity.time || null;
  const timeAgo = formatTimeAgo(timestamp);

  // ── Assemble description ───────────────────────────────────────────────
  let text = userName;

  // Verb
  text += ` ${verb}`;

  // Task name (if present)
  if (taskName) {
    text += ` '${taskName}'`;
  }

  // Project context
  if (projectName) {
    // Avoid "created project in ProjectName" duplication
    if (verb.includes('project')) {
      text += ` '${projectName}'`;
    } else {
      text += ` in ${projectName}`;
    }
  }

  // Time
  if (timeAgo) {
    text += ` • ${timeAgo}`;
  }

  return text.trim();
}

/**
 * Resolve the user name from an activity object
 */
function resolveActivityUserName(activity) {
  // Direct name fields
  const directName =
    activity.userName || activity.user_name ||
    activity.actorName || activity.actor_name ||
    activity.author?.name || activity.author?.displayName ||
    '';

  if (directName && directName.toLowerCase() !== 'user' && directName.toLowerCase() !== 'demo user' && directName.toLowerCase() !== 'demo') {
    return directName;
  }

  // User object
  const userObj = activity.user || activity.actor || activity.author || null;
  if (userObj && typeof userObj === 'object') {
    const resolved = resolveDisplayName(userObj);
    if (resolved.fullName && resolved.fullName !== 'Anonymous') {
      return resolved.fullName;
    }
  }

  // Last resort
  return activity.username || activity.handle || 'Someone';
}

/**
 * Transform an array of raw activity items, adding formatted description fields.
 * Safe to call on items that already have descriptions.
 *
 * @param {Array} items - Raw activity items from the API
 * @returns {Array} Items with added `formattedText` field
 */
export function formatActivityItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map(item => {
    // Skip interstitials or items without type
    if (item.type === 'interstitial' || !item) return item;

    return {
      ...item,
      formattedText: formatActivityText(item),
      // Also fix any raw status display
      statusDisplay: item.status ? formatStatus(item.status) : undefined,
      // Ensure timeAgo is computed
      timeAgo: formatTimeAgo(item.createdAt || item.created_at || item.timestamp),
    };
  });
}

export default formatActivityText;
