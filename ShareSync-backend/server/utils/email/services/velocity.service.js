// server/services/velocity.service.js

/**
 * Returns weekly buckets for the last N weeks:
 * [{ weekStart: 'YYYY-MM-DD', created, completed, wip }]
 * Also returns activeUsers count over the window.
 *
 * Plug your DB where indicated (Mongoose examples included as comments).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfISOWeek(d) {
  // ISO: Monday = day 1; we want Monday 00:00
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // Sun=0 -> 7
  if (day > 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function fmtYYYYMMDDUTC(d) {
  return d.toISOString().slice(0, 10);
}

async function getWeeklyVelocity({ projectId, weeks = 10, now = new Date() }) {
  // Compute the week starts for the past N weeks (inclusive of current week)
  const end = startOfISOWeek(now);
  const weekStarts = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const w = new Date(end.getTime() - i * 7 * MS_PER_DAY);
    weekStarts.push(w);
  }

  // --- TODO: Replace with real DB queries ---
  // Example Mongoose model `Task` with fields:
  // { projectId, status, createdAt, completedAt, dueDate, assigneeId }
  //
  // const since = new Date(weekStarts[0]); // earliest week
  // const tasks = await Task.find({ projectId, $or: [
  //   { createdAt: { $gte: since } },
  //   { completedAt: { $gte: since } }
  // ]}).lean();

  // For now, a stub empty array
  const tasks = []; // ← replace with DB results
  // -----------------------------------------

  // Aggregate per-week
  const histogram = weekStarts.map(ws => ({
    weekStart: fmtYYYYMMDDUTC(ws),
    created: 0,
    completed: 0,
    wip: 0,
  }));

  // Helpers: find bucket index by date
  const weekIndexByDate = (date) => {
    if (!date) return -1;
    const t = startOfISOWeek(new Date(date)).getTime();
    return weekStarts.findIndex(ws => ws.getTime() === t);
  };

  // Accumulate created + completed
  for (const t of tasks) {
    const iCreated = weekIndexByDate(t.createdAt);
    if (iCreated >= 0) histogram[iCreated].created += 1;

    if (t.completedAt) {
      const iDone = weekIndexByDate(t.completedAt);
      if (iDone >= 0) histogram[iDone].completed += 1;
    }
  }

  // WIP snapshot per bucket = tasks existing during that week with status not 'done'
  // Simple approximation: count tasks with createdAt <= weekEnd and (no completedAt or completedAt > weekEnd)
  for (let i = 0; i < weekStarts.length; i++) {
    const ws = weekStarts[i];
    const weekEnd = new Date(ws.getTime() + 7 * MS_PER_DAY - 1);
    let wipCount = 0;
    for (const t of tasks) {
      const createdOK = new Date(t.createdAt) <= weekEnd;
      const stillOpen = !t.completedAt || new Date(t.completedAt) > weekEnd;
      if (createdOK && stillOpen && t.status !== 'done') wipCount += 1;
    }
    histogram[i].wip = wipCount;
  }

  // Active users = distinct assigneeId who touched tasks (created or completed) within the window
  const sinceWindow = weekStarts[0];
  const activeUserSet = new Set();
  for (const t of tasks) {
    const createdInWindow = t.createdAt && new Date(t.createdAt) >= sinceWindow;
    const completedInWindow = t.completedAt && new Date(t.completedAt) >= sinceWindow;
    if ((createdInWindow || completedInWindow) && t.assigneeId) {
      activeUserSet.add(String(t.assigneeId));
    }
  }

  return {
    histogram,
    activeUsers: activeUserSet.size,
  };
}

module.exports = {
  getWeeklyVelocity,
};
