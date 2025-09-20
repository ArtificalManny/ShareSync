// src/services/highlights.js
// Produce a recent "highlights" feed for a user from Activities/Tasks.
// Falls back gracefully if collections are missing.

let Activity = null;
let Task = null;
try { Activity = require('../models/Activity'); } catch {}
try { Task = require('../models/Task'); } catch {}

function toHighlightId(prefix, id) {
  return `${prefix}:${String(id)}`;
}

/**
 * listHighlightsForUser(userId, { limit = 20 })
 * Returns: Array<{ id, type, title, at: Date, meta: {} }>
 */
async function listHighlightsForUser(userId, { limit = 20 } = {}) {
  const out = [];

  // 1) Activities-based (if available)
  if (Activity && userId) {
    try {
      const acts = await Activity.find({ userId: String(userId) })
        .sort({ createdAt: -1 })
        .limit(limit * 2) // oversample, we’ll filter below
        .lean();

      for (const a of acts) {
        // Map a few common activity types into highlights
        if (a.type === 'task.completed' || a.type === 'tasks:completed') {
          out.push({
            id: toHighlightId('act', a._id),
            type: 'task_completed',
            title: a.title || a.taskTitle || 'Task completed',
            at: a.createdAt || a.updatedAt || new Date(),
            meta: { projectId: a.projectId || null, taskId: a.taskId || null },
          });
        } else if (a.type === 'project.milestone') {
          out.push({
            id: toHighlightId('act', a._id),
            type: 'milestone',
            title: a.title || 'Milestone reached',
            at: a.createdAt || a.updatedAt || new Date(),
            meta: { projectId: a.projectId || null, milestone: a.milestone || null },
          });
        } else if (a.type === 'sprint.finished') {
          out.push({
            id: toHighlightId('act', a._id),
            type: 'sprint',
            title: a.title || 'Sprint finished',
            at: a.createdAt || a.updatedAt || new Date(),
            meta: { projectId: a.projectId || null, sprintId: a.sprintId || null },
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  // 2) Tasks fallback (if no Activity model or feed is thin)
  if (Task && out.length < limit) {
    try {
      const tasks = await Task.find({
        $and: [
          {
            $or: [
              { createdBy: userId },
              { assigneeId: userId },
              { userId },
            ],
          },
          {
            $or: [
              { status: /done/i },
              { completed: true },
              { completedAt: { $exists: true, $ne: null } },
              { state: /done/i },
            ],
          },
        ],
      })
        .sort({ completedAt: -1, updatedAt: -1, _id: -1 })
        .limit(limit)
        .lean();

      for (const t of tasks) {
        out.push({
          id: toHighlightId('task', t._id),
          type: 'task_completed',
          title: t.title || 'Task completed',
          at: t.completedAt || t.updatedAt || t.createdAt || new Date(),
          meta: { projectId: t.projectId || null, taskId: t._id },
        });
      }
    } catch {
      /* ignore */
    }
  }

  // Sort newest first and trim to limit
  out.sort((a, b) => new Date(b.at) - new Date(a.at));
  return out.slice(0, limit);
}

module.exports = { listHighlightsForUser };
