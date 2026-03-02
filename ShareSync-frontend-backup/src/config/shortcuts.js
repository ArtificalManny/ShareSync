// src/config/shortcuts.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.4: Single source of truth for all keyboard shortcuts
//
// Each entry:
//   key      — shortcut string (parsed by useKeyboardShortcuts.js)
//   label    — human-readable label
//   action   — action identifier (dispatched as window event or matched by ShortcutProvider)
//   category — grouping for ShortcutGuide display
//   description — longer description (optional)
//   allowInInput — if true, fires even when focused in input/textarea
//   hidden   — if true, not shown in ShortcutGuide
//
// Modifier key convention:
//   cmd  — ⌘ on Mac, Ctrl on Windows/Linux (handled by useKeyboardShortcuts)
//   ctrl — always Ctrl (even on Mac)
//   alt  — Alt / ⌥ Option
//   shift — Shift
//
// This file is PURE DATA — no React, no side effects, no imports.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORTCUT_CATEGORIES = {
  general: { label: 'General', order: 0 },
  navigation: { label: 'Navigation', order: 1 },
  tasks: { label: 'Tasks', order: 2 },
  views: { label: 'Views', order: 3 },
  focus: { label: 'Focus & Productivity', order: 4 },
  projects: { label: 'Projects', order: 5 },
};

export const SHORTCUTS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: 'cmd+k',
    label: 'Command palette',
    action: 'COMMAND_PALETTE_OPEN',
    category: 'general',
    description: 'Search commands, projects, tasks',
    allowInInput: true,
    hidden: false,
  },
  {
    key: '?',
    label: 'Keyboard shortcuts',
    action: 'SHORTCUT_GUIDE_OPEN',
    category: 'general',
    description: 'Show this shortcuts guide',
    allowInInput: false,
    hidden: false,
  },
  {
    key: 'escape',
    label: 'Close / Cancel',
    action: 'CLOSE_MODAL',
    category: 'general',
    description: 'Close any open modal or panel',
    allowInInput: true,
    hidden: true, // handled by individual modals
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: 'g+h',
    label: 'Go to Home',
    action: 'NAV_HOME',
    category: 'navigation',
    description: 'Navigate to Mission Control',
  },
  {
    key: 'g+p',
    label: 'Go to Projects',
    action: 'NAV_PROJECTS',
    category: 'navigation',
    description: 'Navigate to Project Deck',
  },
  {
    key: 'g+a',
    label: 'Go to Arena',
    action: 'NAV_ARENA',
    category: 'navigation',
    description: 'Navigate to Team Arena',
  },
  {
    key: 'g+s',
    label: 'Go to Settings',
    action: 'NAV_SETTINGS',
    category: 'navigation',
    description: 'Open Settings',
  },
  {
    key: 'g+i',
    label: 'Go to Profile',
    action: 'NAV_PROFILE',
    category: 'navigation',
    description: 'Open your Profile',
  },
  {
    key: 'g+m',
    label: 'Go to Messages',
    action: 'NAV_MESSAGES',
    category: 'navigation',
    description: 'Open Messenger',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TASKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: 'n',
    label: 'New task',
    action: 'QUICK_ADD_OPEN',
    category: 'tasks',
    description: 'Open quick add task modal',
  },
  {
    key: 'cmd+shift+t',
    label: 'New task (from anywhere)',
    action: 'QUICK_ADD_OPEN',
    category: 'tasks',
    description: 'Open quick add even in inputs',
    allowInInput: true,
    hidden: true, // duplicate of 'n' for discoverability
  },
  {
    key: 'e',
    label: 'Edit task',
    action: 'TASK_EDIT',
    category: 'tasks',
    description: 'Edit the currently selected task',
  },
  {
    key: 'x',
    label: 'Complete task',
    action: 'TASK_COMPLETE',
    category: 'tasks',
    description: 'Toggle completion on selected task',
  },
  {
    key: 'd',
    label: 'Set due date',
    action: 'TASK_DUE_DATE',
    category: 'tasks',
    description: 'Open due date picker for selected task',
  },
  {
    key: 'p',
    label: 'Set priority',
    action: 'TASK_PRIORITY',
    category: 'tasks',
    description: 'Open priority picker for selected task',
  },
  {
    key: 'l',
    label: 'Set label / tag',
    action: 'TASK_LABEL',
    category: 'tasks',
    description: 'Add or remove labels on selected task',
  },
  {
    key: 'cmd+backspace',
    label: 'Delete task',
    action: 'TASK_DELETE',
    category: 'tasks',
    description: 'Delete the selected task',
    allowInInput: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: 'v+l',
    label: 'List view',
    action: 'VIEW_LIST',
    category: 'views',
    description: 'Switch to stack / list view',
  },
  {
    key: 'v+b',
    label: 'Board view',
    action: 'VIEW_BOARD',
    category: 'views',
    description: 'Switch to kanban board view',
  },
  {
    key: 'v+c',
    label: 'Calendar view',
    action: 'VIEW_CALENDAR',
    category: 'views',
    description: 'Switch to calendar view',
  },
  {
    key: 'v+t',
    label: 'Timeline view',
    action: 'VIEW_TIMELINE',
    category: 'views',
    description: 'Switch to roadmap timeline',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FOCUS & PRODUCTIVITY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: 'cmd+shift+f',
    label: 'Start focus session',
    action: 'FOCUS_START',
    category: 'focus',
    description: 'Begin a Pomodoro focus block',
    allowInInput: true,
  },
  {
    key: 'cmd+shift+s',
    label: 'Ship update',
    action: 'SHIP_OPEN',
    category: 'focus',
    description: 'Record a ship / deploy',
    allowInInput: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: 'cmd+shift+n',
    label: 'New project',
    action: 'PROJECT_CREATE',
    category: 'projects',
    description: 'Create a new project',
    allowInInput: true,
  },
];

/**
 * Get shortcuts by category, sorted by category order.
 * Returns: { [category]: { label, shortcuts: [...] } }
 */
export function getShortcutsByCategory() {
  const grouped = {};

  SHORTCUTS.forEach((s) => {
    if (s.hidden) return;
    const cat = s.category || 'general';
    if (!grouped[cat]) {
      const catConfig = SHORTCUT_CATEGORIES[cat] || { label: cat, order: 99 };
      grouped[cat] = { ...catConfig, shortcuts: [] };
    }
    grouped[cat].shortcuts.push(s);
  });

  // Sort categories by order
  const sorted = Object.entries(grouped)
    .sort((a, b) => a[1].order - b[1].order)
    .reduce((acc, [key, val]) => { acc[key] = val; return acc; }, {});

  return sorted;
}

/**
 * Find a shortcut by action name
 */
export function getShortcutByAction(action) {
  return SHORTCUTS.find((s) => s.action === action) || null;
}

/**
 * Get all non-hidden shortcuts as a flat array
 */
export function getVisibleShortcuts() {
  return SHORTCUTS.filter((s) => !s.hidden);
}

export default SHORTCUTS;
