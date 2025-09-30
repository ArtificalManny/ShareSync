// server/services/prediction.service.js
const velocityService = require('./velocity.service');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(a, b) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / MS_PER_DAY));
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/**
 * history item shape (flexible, best-effort):
 * {
 *   id, title, status, createdAt, completedAt, dueDate, assigneeId
 * }
 */
function computeAtRiskAndSuggestions({ history = [], now, horizonDays = 30 }) {
  const NOW = now || new Date();
  const X = horizonDays;         // due date within next X days is “soon”
  const Y = 14;                  // aging threshold (days since created)
  const atRisk = [];
  const suggestions = [];

  for (const t of history) {
    const status = (t.status || '').toLowerCase();
    const createdAt = t.createdAt ? new Date(t.createdAt) : null;
    const due = t.dueDate ? new Date(t.dueDate) : null;
    const isDone = status === 'done' || !!t.completedAt;

    let risky = false;
    if (!isDone && due) {
      const daysToDue = daysBetween(NOW, due);
      if (daysToDue <= X) risky = true;
      if (due.getTime() < NOW.getTime()) risky = true; // overdue
    }
    if (!isDone && createdAt) {
      const aging = daysBetween(createdAt, NOW);
      if (aging >= Y) risky = true;
    }

    if (risky) {
      atRisk.push({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate || null,
        createdAt: t.createdAt || null,
        assigneeId: t.assigneeId || null,
        reason: buildRiskReason({ t, NOW, X, Y }),
      });

      // Generate simple suggestions
      const s = [];
      s.push('Consider reassigning to an available teammate.');
      s.push('Split into smaller subtasks with nearer milestones.');
      if (t.dueDate) s.push('Bring the due date forward and add buffer.');
      else s.push('Set a due date to create urgency and trackability.');
      suggestions.push({
        taskId: t.id,
        title: t.title || 'Task',
        suggestions: s,
      });
    }
  }

  return { atRisk, suggestions };
}

function buildRiskReason({ t, NOW, X, Y }) {
  const parts = [];
  if (t.dueDate) {
    const due = new Date(t.dueDate);
    const dd = daysBetween(NOW, due);
    if (due.getTime() < NOW.getTime()) parts.push('overdue');
    else if (dd <= X) parts.push(`due in ${dd} day(s)`);
  }
  if (t.createdAt) {
    const created = new Date(t.createdAt);
    const aging = daysBetween(created, NOW);
    if (aging >= Y) parts.push(`aging ${aging} day(s)`);
  }
  if (t.status && t.status !== 'done') parts.push(`status: ${t.status}`);
  return parts.join(', ');
}

/**
 * Forecast ETA from recent done/week.
 * If history provided, use it for completed count; else derive from velocity histogram.
 */
async function predict({ projectId, totalScope, history, horizonDays = 30, now = new Date() }) {
  let completedSoFar = 0;
  let avgDonePerWeek = 0;

  if (Array.isArray(history)) {
    completedSoFar = history.filter(h => h.completedAt || (h.status || '').toLowerCase() === 'done').length;

    // Recent done/week: look at last 4 weeks from history
    const byWeek = {};
    for (const h of history) {
      if (!h.completedAt) continue;
      const d = new Date(h.completedAt);
      const weekKey = isoWeekKey(d);
      byWeek[weekKey] = (byWeek[weekKey] || 0) + 1;
    }
    const last4 = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-4)
      .map(([, v]) => v);
    if (last4.length) {
      avgDonePerWeek = last4.reduce((a, b) => a + b, 0) / last4.length;
    }
  } else {
    // No history given: fall back to velocity service (DB-backed when you wire it)
    const v = await velocityService.getWeeklyVelocity({ projectId, weeks: 8, now });
    const last4 = v.histogram.slice(-4).map(b => b.completed || 0);
    if (last4.length) {
      avgDonePerWeek = last4.reduce((a, b) => a + b, 0) / last4.length;
    }
    // Best guess for completed so far (may be unknown)—use cumulative sum across histogram
    completedSoFar = v.histogram.reduce((acc, b) => acc + (b.completed || 0), 0);
  }

  // Sanity guards
  avgDonePerWeek = clamp(avgDonePerWeek || 0, 0, 1e6);
  completedSoFar = clamp(completedSoFar || 0, 0, 1e9);

  // If totalScope not provided, estimate from completedSoFar + one horizon of throughput
  const scope = typeof totalScope === 'number'
    ? totalScope
    : Math.max(completedSoFar, completedSoFar + Math.round((avgDonePerWeek || 1) * 4));

  const remaining = Math.max(0, scope - completedSoFar);

  // Convert throughput to per-day
  const donePerDay = (avgDonePerWeek || 0) / 7;
  const etaDays = donePerDay > 0 ? Math.ceil(remaining / donePerDay) : Infinity;
  const etaDate = isFinite(etaDays) ? new Date(now.getTime() + etaDays * MS_PER_DAY) : null;

  // Build at-risk + suggestions (only meaningful if history exists)
  const { atRisk, suggestions } = computeAtRiskAndSuggestions({
    history: Array.isArray(history) ? history : [],
    now,
    horizonDays,
  });

  const result = {
    projectId,
    avgDailyVelocity: Number((donePerDay || 0).toFixed(2)),
    horizonDays,
    totalScope: scope,
    eta: etaDate ? etaDate.toISOString().slice(0, 10) : null,
    atRiskTasks: atRisk,
    suggestions,
  };

  return result;
}

function isoWeekKey(date) {
  const ws = startOfISOWeek(date);
  return ws.toISOString().slice(0, 10);
}

function startOfISOWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  if (day > 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

module.exports = {
  predict,
};
