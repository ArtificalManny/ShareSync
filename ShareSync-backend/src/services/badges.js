// src/services/badges.js
// Compute earned/locked badges for a user. Optionally pulls task counts if Task model exists.

let Task = null;
try {
  // Optional: only if you have a Task model
  Task = require('../models/Task');
} catch {
  /* no task model available — we'll skip task-based badges */
}

/** Count tasks this user has completed (best-effort; supports a few common shapes) */
async function countCompletedTasksByUser(userId) {
  if (!Task || !userId) return 0;

  // Try a few common "done" signals:
  // - status === 'done'
  // - completed === true
  // - completedAt exists
  const q = {
    $and: [
      {
        $or: [
          { createdBy: userId }, // common field name
          { assigneeId: userId }, // alternative
          { userId }, // some schemas store userId
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
  };

  try {
    return await Task.countDocuments(q);
  } catch {
    return 0;
  }
}

/** Static badge definitions */
function getBadgeDefinitions() {
  return [
    // Streak
    { id: 'streak_3',  name: 'Getting Warm',     icon: '🌤️',  rule: (u) => (u.streakDays || 0) >= 3 },
    { id: 'streak_7',  name: '1-Week Streak',    icon: '🔥',   rule: (u) => (u.streakDays || 0) >= 7 },
    { id: 'streak_30', name: 'Marathon',         icon: '🏃',   rule: (u) => (u.streakDays || 0) >= 30 },

    // XP
    { id: 'xp_100',    name: 'Level 100+',       icon: '🌱',   rule: (u) => (u.xp || 0) >= 100 },
    { id: 'xp_500',    name: 'Level 500+',       icon: '🚀',   rule: (u) => (u.xp || 0) >= 500 },
    { id: 'xp_1000',   name: 'Level 1000+',      icon: '🏆',   rule: (u) => (u.xp || 0) >= 1000 },

    // Tasks completed (computed below with DB count, if available)
    { id: 'tasks_10',  name: '10 Tasks Done',    icon: '🛠️',  rule: (u, m) => (m.tasksCompleted || 0) >= 10 },
    { id: 'tasks_50',  name: '50 Tasks Done',    icon: '📈',   rule: (u, m) => (m.tasksCompleted || 0) >= 50 },
    { id: 'tasks_200', name: '200 Tasks Done',   icon: '🥇',   rule: (u, m) => (m.tasksCompleted || 0) >= 200 },
  ];
}

/**
 * listBadgesForUser(user)
 * Returns: [{ id, name, icon, earned, earnedAt? }]
 * - earnedAt is filled from persisted `user.badges[]` if present; otherwise null.
 */
async function listBadgesForUser(user) {
  if (!user) return [];

  const meta = {
    tasksCompleted: await countCompletedTasksByUser(user._id || user.id),
  };

  const defs = getBadgeDefinitions();
  const earnedMap = new Map();
  if (Array.isArray(user.badges)) {
    for (const b of user.badges) {
      earnedMap.set(b.id, b.earnedAt || b.createdAt || b.updatedAt || null);
    }
  }

  return defs.map((d) => {
    const earned = !!d.rule(user, meta);
    const earnedAt = earnedMap.get(d.id) || null;
    return { id: d.id, name: d.name, icon: d.icon, earned, ...(earnedAt ? { earnedAt } : {}) };
  });
}

module.exports = {
  listBadgesForUser,
  getBadgeDefinitions,
};
