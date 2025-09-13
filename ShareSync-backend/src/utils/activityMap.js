/**
 * Map backend event types → unified FE category + display meta.
 * Used by the unified feed to keep icons/labels/colors consistent.
 *
 * Categories: 'updates' | 'tasks' | 'files' | 'system'
 *
 * You can extend the map below with any custom backend types.
 */

export const TYPE_MAP = {
    // ---- Updates / posts ----
    'update.posted':   { cat: 'updates', label: 'Update',   icon: 'Megaphone',  color: 'indigo' },
    'update.edited':   { cat: 'updates', label: 'Update',   icon: 'Megaphone',  color: 'indigo' },
  
    // ---- Tasks ----
    'task.created':    { cat: 'tasks',   label: 'Task',     icon: 'ClipboardList', color: 'indigo' },
    'task.updated':    { cat: 'tasks',   label: 'Task',     icon: 'PencilLine',    color: 'amber'  },
    'task.completed':  { cat: 'tasks',   label: 'Task',     icon: 'CheckCircle2',  color: 'emerald' },
    'task.assigned':   { cat: 'tasks',   label: 'Task',     icon: 'UserRoundCheck', color: 'sky'    },
  
    // ---- Files ----
    'file.uploaded':   { cat: 'files',   label: 'File',     icon: 'FileText',    color: 'sky'     },
    'file.image':      { cat: 'files',   label: 'Image',    icon: 'Image',       color: 'sky'     },
  
    // ---- System / Audit ----
    'audit.member_joined': { cat: 'system', label: 'Member joined', icon: 'UserPlus',  color: 'slate' },
    'audit.member_left':   { cat: 'system', label: 'Member left',   icon: 'UserMinus', color: 'slate' },
    'audit.permission':    { cat: 'system', label: 'Permissions',   icon: 'ShieldAlert', color: 'slate' },
    'project.updated':     { cat: 'system', label: 'Project',       icon: 'Settings',  color: 'slate' },
  
    // any other backend events you emit:
    'activity':        { cat: 'updates', label: 'Activity', icon: 'Megaphone', color: 'indigo' },
  };
  
  const FALLBACK = { cat: 'updates', label: 'Update', icon: 'Megaphone', color: 'indigo' };
  
  /** Normalize a raw event type string to our map key. */
  export function normalizeType(t) {
    if (!t) return '';
    const s = String(t).toLowerCase().trim();
    // permit short forms like "task.create"
    if (s.startsWith('task.')) return s.replace('task.', 'task.');
    if (s.startsWith('file.')) return s.replace('file.', 'file.');
    if (s.startsWith('update.')) return s.replace('update.', 'update.');
    if (s.startsWith('audit.')) return s;
    if (s === 'project:updated' || s === 'project.updated') return 'project.updated';
    return s;
  }
  
  /** Return { cat, label, icon, color } for a given event. */
  export function getActivityMeta(evt) {
    const key = normalizeType(evt?.type || evt?.kind || '');
    return TYPE_MAP[key] || inferFromText(evt) || FALLBACK;
  }
  
  /** Quick heuristic if we don’t recognize the backend type. */
  function inferFromText(evt = {}) {
    const txt = `${evt.text || evt.title || ''}`.toLowerCase();
    if (txt.includes('.png') || txt.includes('.jpg') || txt.includes('uploaded')) {
      return { cat: 'files', label: 'File', icon: 'FileText', color: 'sky' };
    }
    if (txt.includes('task') || txt.includes('assigned') || txt.includes('completed')) {
      return { cat: 'tasks', label: 'Task', icon: 'ClipboardList', color: 'indigo' };
    }
    return null;
  }
  
  /** Classify → 'updates' | 'tasks' | 'files' | 'system' */
  export function classifyEvent(evt) {
    return getActivityMeta(evt).cat;
  }
  
  /**
   * Map lucide-react icon name string → actual component.
   * Import this where you render (so the map stays tree-shakeable).
   *
   * Example:
   *   import { iconsMap } from './activityMap';
   *   const Icon = iconsMap[meta.icon] ?? Megaphone;
   */
  export const iconsMap = {
    Megaphone:      require('lucide-react').Megaphone,
    ClipboardList:  require('lucide-react').ClipboardList,
    PencilLine:     require('lucide-react').PencilLine,
    CheckCircle2:   require('lucide-react').CheckCircle2,
    FileText:       require('lucide-react').FileText,
    Image:          require('lucide-react').Image,
    ShieldAlert:    require('lucide-react').ShieldAlert,
    UserPlus:       require('lucide-react').UserPlus,
    UserMinus:      require('lucide-react').UserMinus,
    Settings:       require('lucide-react').Settings,
  };
  