/**
 * Normalize API and socket payloads into a single unified activity item shape.
 *
 * Unified shape:
 * {
 *   id: string,
 *   type: 'update' | 'task' | 'file' | 'system',
 *   subtype?: string,
 *   projectId: string,
 *   userId?: string,
 *   ts: string,
 *   text?: string,
 *   task?: object,
 *   files?: Array<object>,
 *   meta?: Record<string,any>,
 *   freshUntil?: number        // ⬅️ NEW: client-side "fresh" window (ms epoch)
 * }
 */

/** Safe getters */
const val = (v, d = null) => (v === undefined || v === null ? d : v);
const iso = (d) => (d ? new Date(d).toISOString() : new Date().toISOString());

/** Build a stable-ish id if one is not provided */
function fallbackId(base = 'evt', when, extra = '') {
  const t = iso(when);
  return `${base}:${t}:${String(extra || '').slice(0, 16)}`;
}

/** Map a raw activity/document coming from the REST API to unified shape */
export function fromApiActivity(raw = {}) {
  const rawType = String(raw.type || raw.kind || '').toLowerCase();

  // Common fields
  const projectId = String(
    raw.projectId ||
      raw.meta?.projectId ||
      raw.project?.id ||
      raw.project?._id ||
      ''
  );
  const userId = String(raw.userId || raw.actorId || raw.meta?.userId || '') || undefined;
  const ts = iso(raw.createdAt || raw.ts || Date.now());

  // NOTE: API-loaded items are not considered "fresh" (no freshUntil),
  // but if server ever sends one, preserve it.
  const freshUntil = typeof raw.freshUntil === 'number' ? raw.freshUntil : undefined;

  // Updates
  if (
    rawType.startsWith('update') ||
    rawType === 'update' ||
    (!raw.type && (raw.text || raw.title))
  ) {
    const text =
      raw.text ||
      raw.title ||
      raw.meta?.text ||
      raw.meta?.message ||
      '';
    const files =
      Array.isArray(raw.attachments) ? raw.attachments :
      Array.isArray(raw.files) ? raw.files :
      Array.isArray(raw.meta?.files) ? raw.meta.files : [];
    return {
      id: String(raw._id || raw.id || fallbackId('update', ts, text)),
      type: 'update',
      subtype: raw.type || 'update.posted',
      projectId,
      userId,
      ts,
      text,
      files,
      meta: raw.meta || {},
      freshUntil,
    };
  }

  // Tasks
  if (rawType.includes('task') || raw.task || raw.meta?.task) {
    const task = raw.task || raw.meta?.task || {};
    const title = task.title || raw.title || raw.text || '';
    let subtype = 'task.updated';
    if (rawType.includes('created')) subtype = 'task.created';
    else if (rawType.includes('completed') || rawType.includes('done')) subtype = 'task.completed';
    else if (rawType.includes('due')) subtype = 'task.due_changed';

    return {
      id: String(raw._id || raw.id || task._id || task.id || fallbackId(subtype, ts, title)),
      type: 'task',
      subtype,
      projectId,
      userId,
      ts,
      text: title,
      task: {
        id: task._id || task.id,
        title,
        status: val(task.status, raw.status),
        assigneeId: val(task.assigneeId, raw.assigneeId),
        dueDate: val(task.dueDate, raw.dueDate),
        labels: Array.isArray(task.labels) ? task.labels : raw.labels,
        notes: val(task.notes, raw.notes),
      },
      meta: raw.meta || {},
      freshUntil,
    };
  }

  // Files
  if (rawType.includes('file') || Array.isArray(raw.files) || Array.isArray(raw.meta?.files)) {
    const files =
      Array.isArray(raw.files) ? raw.files :
      Array.isArray(raw.meta?.files) ? raw.meta.files : [];
    const subtype = rawType.includes('removed') ? 'files.removed' : 'files.added';
    const text =
      raw.text ||
      raw.title ||
      (files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ${subtype.includes('removed') ? 'removed' : 'added'}` : 'Files');

    return {
      id: String(raw._id || raw.id || fallbackId(subtype, ts, text)),
      type: 'file',
      subtype,
      projectId,
      userId,
      ts,
      text,
      files,
      meta: raw.meta || {},
      freshUntil,
    };
  }

  // System / audit
  if (
    rawType.includes('system') ||
    rawType.includes('audit') ||
    rawType.includes('members') ||
    rawType.includes('icon') ||
    rawType.includes('public') ||
    rawType.includes('settings') ||
    raw.meta?.patch
  ) {
    const text =
      raw.text ||
      raw.meta?.message ||
      inferSystemMessage({ type: rawType, meta: raw.meta });
    return {
      id: String(raw._id || raw.id || fallbackId('system', ts, text)),
      type: 'system',
      subtype: raw.type || rawType || 'system',
      projectId,
      userId,
      ts,
      text,
      meta: raw.meta || {},
      freshUntil,
    };
  }

  // Fallback → treat as update
  return {
    id: String(raw._id || raw.id || fallbackId('update', ts, raw.text || raw.title || '')),
    type: 'update',
    subtype: raw.type || 'update',
    projectId,
    userId,
    ts,
    text: raw.text || raw.title || '',
    meta: raw.meta || {},
    freshUntil,
  };
}

/**
 * Map a socket event + payload to unified shape.
 * On socket/creation, attach `freshUntil = now + 10_000`.
 */
export function fromSocketEvent(event, payload = {}) {
  const name = String(event || '').toLowerCase();
  const ts = iso(payload.createdAt || payload.ts || Date.now());
  const freshUntil = Date.now() + 10_000; // ⬅️ NEW

  if (name === 'tasks:created' && payload.task) {
    const t = payload.task;
    return {
      id: String(t._id || t.id || fallbackId('task.created', ts, t.title)),
      type: 'task',
      subtype: 'task.created',
      projectId: String(payload.projectId || t.projectId || ''),
      userId: t.userId || payload.userId,
      ts,
      text: t.title || 'Task created',
      task: pickTaskFields(t),
      meta: { socket: true },
      freshUntil,
    };
  }

  if (name === 'tasks:updated' && payload.task) {
    const t = payload.task;
    const subtype = t.status === 'Completed' || t.status === 'Done' ? 'task.completed' : 'task.updated';
    return {
      id: String(t._id || t.id || fallbackId(subtype, ts, t.title)),
      type: 'task',
      subtype,
      projectId: String(payload.projectId || t.projectId || ''),
      userId: t.userId || payload.userId,
      ts,
      text: t.title || 'Task updated',
      task: pickTaskFields(t),
      meta: { socket: true },
      freshUntil,
    };
  }

  if (name === 'project:filesadded' && Array.isArray(payload.files)) {
    const files = payload.files;
    const text = `${files.length} file${files.length > 1 ? 's' : ''} added`;
    return {
      id: fallbackId('files.added', ts, text),
      type: 'file',
      subtype: 'files.added',
      projectId: String(payload.projectId || ''),
      userId: payload.userId,
      ts,
      text,
      files,
      meta: { socket: true },
      freshUntil,
    };
  }

  if (name === 'project:updated' && payload.patch) {
    const patch = payload.patch || {};
    const text =
      inferSystemMessage({
        type: 'project.updated',
        meta: { patch, ...payload },
      }) || 'Project updated';
    return {
      id: fallbackId('project.updated', ts, JSON.stringify(patch).slice(0, 24)),
      type: 'system',
      subtype: 'project.updated',
      projectId: String(payload.projectId || ''),
      userId: payload.userId,
      ts,
      text,
      meta: { patch, socket: true },
      freshUntil,
    };
  }

  if (name === 'activity:new') {
    // Reuse API normalizer (no auto-fresh), then *add* fresh window client-side.
    const base = fromApiActivity(payload);
    return { ...base, freshUntil: Date.now() + 10_000 };
  }

  // Unknown socket event → best-effort system item
  return {
    id: fallbackId('system', ts, name),
    type: 'system',
    subtype: name,
    projectId: String(payload.projectId || payload.meta?.projectId || ''),
    userId: payload.userId,
    ts,
    text: payload.text || `Event: ${event}`,
    meta: payload,
    freshUntil,
  };
}

/** Helpers */

function pickTaskFields(t = {}) {
  return {
    id: t._id || t.id,
    title: t.title,
    status: t.status,
    assigneeId: t.assigneeId || t.assignee?.id || t.assignee?._id,
    dueDate: t.dueDate,
    labels: Array.isArray(t.labels) ? t.labels : [],
    notes: t.notes,
  };
}

function inferSystemMessage({ type = '', meta = {} }) {
  const t = String(type).toLowerCase();

  // project public visibility change
  if (t.includes('public') || 'publicToken' in meta || 'publicEnabled' in meta) {
    const on = !!(meta.publicEnabled || meta.publicToken);
    return on ? 'Public status enabled' : 'Public status disabled';
    }

  // icon change
  if (t.includes('icon') || meta.patch?.icon || meta.icon) {
    const ic = meta.patch?.icon || meta.icon;
    if (ic?.kind === 'emoji' && ic?.value) return `Project icon set to ${ic.value}`;
    return 'Project icon updated';
  }

  // members updated
  if (t.includes('members') || Array.isArray(meta.members)) {
    const add = (meta.members || []).filter((m) => m?.__action === 'added').length;
    const rem = (meta.members || []).filter((m) => m?.__action === 'removed').length;
    if (add || rem) {
      const parts = [];
      if (add) parts.push(`${add} added`);
      if (rem) parts.push(`${rem} removed`);
      return `Members updated (${parts.join(', ')})`;
    }
    return 'Members updated';
  }

  // generic
  if (t.includes('updated') && meta.patch) return 'Project settings updated';

  return null;
}

/** Convenience: normalize an array of API activities */
export function fromApiList(list = []) {
  return (Array.isArray(list) ? list : []).map(fromApiActivity);
}

/** Merge a single realtime item to the top of an array (de-duped by id) */
export function mergeRealtime(items = [], realtimeItem) {
  if (!realtimeItem) return items;
  const id = realtimeItem.id;
  if (!id) return [realtimeItem, ...items];
  const exists = items.findIndex((x) => x.id === id);
  if (exists >= 0) {
    const clone = items.slice();
    // Preserve whichever freshUntil is later (keeps highlight if a newer event refreshes)
    const prev = items[exists];
    const nextFresh = Math.max(Number(prev.freshUntil || 0), Number(realtimeItem.freshUntil || 0)) || undefined;
    clone[exists] = { ...prev, ...realtimeItem, ...(nextFresh ? { freshUntil: nextFresh } : {}) };
    return clone;
  }
  return [realtimeItem, ...items];
}