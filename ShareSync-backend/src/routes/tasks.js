const express = require('express');
const router = express.Router({ mergeParams: true });

const Task = require('../models/Task');
const Project = require('../models/Project'); // used for access checks + bumping lastActivityAt
const { loadProject, ensureProjectEditor } = require('../middleware/authz');

// Reuse loadProject by mapping :projectId -> :id
async function loadProjectByProjectId(req, res, next) {
  try {
    if (!req.params?.projectId) {
      return res.status(400).json({ message: 'Missing projectId' });
    }
    // Attach a fake :id param so loadProject can use it
    req.params.id = req.params.projectId;
    return loadProject(req, res, next);
  } catch (e) {
    return next(e);
  }
}

/** Allow any project member (owner/member/viewer) to read tasks */
function ensureProjectAccess(req, res, next) {
  const userId = req.user?.id || req.user?._id;
  const p = req.project;
  if (!userId || !p) return res.status(403).json({ message: 'Forbidden' });

  const isMember =
    String(p.userId) === String(userId) ||
    (Array.isArray(p.members) &&
      p.members.some((m) => String(m.userId) === String(userId)));

  if (!isMember) return res.status(403).json({ message: 'Forbidden' });
  return next();
}

function toPublic(doc) {
  const d = doc?.toObject ? doc.toObject() : doc;
  const id = String(d._id);
  return {
    _id: id, // ✅ include _id for existing FE comparisons
    id,      //    keep `id` for places using id || _id
    projectId: String(d.projectId),
    title: d.title,
    status: d.status,
    assigneeId: d.assigneeId ? String(d.assigneeId) : null,
    dueDate: d.dueDate || null,
    labels: Array.isArray(d.labels) ? d.labels : [],
    notes: d.notes || '',
    createdBy: d.createdBy ? String(d.createdBy) : null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function getRoom(req, projectId) {
  if (typeof req.projectRoom === 'function') return req.projectRoom(projectId);
  return `project:${String(projectId)}`;
}

/* -------------------------------------------
 * GET /api/projects/:projectId/tasks
 * ----------------------------------------- */
router.get('/:projectId/tasks', loadProjectByProjectId, ensureProjectAccess, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const q = { projectId };
    if (cursor) {
      // paginate by _id (newest first, so use $lt)
      q._id = { $lt: cursor };
    }

    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const docs = await Task.find(q).sort({ _id: -1 }).limit(lim + 1).lean();
    const hasMore = docs.length > lim;
    const slice = hasMore ? docs.slice(0, lim) : docs;

    return res.json({
      items: slice.map(toPublic),
      nextCursor: hasMore ? String(slice[slice.length - 1]._id) : null,
    });
  } catch (e) {
    next(e);
  }
});

/* -------------------------------------------
 * POST /api/projects/:projectId/tasks
 * Body: { title, status?, assigneeId?, dueDate?, labels?, notes? }
 * ----------------------------------------- */
router.post('/:projectId/tasks', loadProjectByProjectId, ensureProjectEditor, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const {
      title,
      status = 'todo',
      assigneeId = null,
      dueDate = null,
      labels = [],
      notes = '',
    } = req.body || {};

    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ message: 'title is required' });
    }

    const doc = await Task.create({
      projectId,
      title: String(title).trim(),
      status,
      assigneeId,
      dueDate,
      labels: Array.isArray(labels) ? labels : [],
      notes: String(notes || ''),
      createdBy: userId,
    });

    const task = toPublic(doc);

    // 🔵 Bump project lastActivityAt (server-truth for unread)
    try {
      await Project.findByIdAndUpdate(projectId, { $set: { lastActivityAt: new Date() } }).lean();
    } catch {}

    // 🔴 Emit realtime (room-scoped)
    try {
      const io = req.app.get('io');
      io.to(getRoom(req, projectId)).emit('tasks:created', { projectId, task });

      // 🔔 Optional global ping so Home can bump unread without polling
      io.emit('activity:new', {
        projectId: String(projectId),
        kind: 'task.created',
        taskId: task._id,
        at: task.createdAt || new Date().toISOString(),
      });
    } catch {}

    return res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

/* -------------------------------------------
 * PATCH /api/projects/:projectId/tasks/:taskId
 * Body: partial fields to update
 * ----------------------------------------- */
router.patch('/:projectId/tasks/:taskId', loadProjectByProjectId, ensureProjectEditor, async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;

    const doc = await Task.findById(taskId);
    if (!doc) return res.status(404).json({ message: 'Task not found' });
    if (String(doc.projectId) !== String(projectId)) {
      return res.status(400).json({ message: 'Task does not belong to this project' });
    }

    // Whitelist fields
    const patch = {};
    if (req.body.title !== undefined) patch.title = String(req.body.title || '').trim();
    if (req.body.status !== undefined) patch.status = String(req.body.status || 'todo');
    if (req.body.assigneeId !== undefined) patch.assigneeId = req.body.assigneeId || null;
    if (req.body.dueDate !== undefined) patch.dueDate = req.body.dueDate || null;
    if (req.body.labels !== undefined) patch.labels = Array.isArray(req.body.labels) ? req.body.labels : [];
    if (req.body.notes !== undefined) patch.notes = String(req.body.notes || '');

    Object.assign(doc, patch);
    await doc.save();

    const task = toPublic(doc);

    // 🔵 Bump project lastActivityAt
    try {
      await Project.findByIdAndUpdate(projectId, { $set: { lastActivityAt: new Date() } }).lean();
    } catch {}

    // 🔴 Emit realtime (room + global)
    try {
      const io = req.app.get('io');
      io.to(getRoom(req, projectId)).emit('tasks:updated', { projectId, task });

      io.emit('activity:new', {
        projectId: String(projectId),
        kind: 'task.updated',
        taskId: task._id,
        at: task.updatedAt || new Date().toISOString(),
      });
    } catch {}

    return res.json(task);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
