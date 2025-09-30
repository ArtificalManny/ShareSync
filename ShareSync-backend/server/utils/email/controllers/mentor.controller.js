// server/controllers/mentor.controller.js
const velocityService = require('../services/velocity.service');
const predictionService = require('../services/prediction.service');

// ---- GET /api/projects/:id/velocity ----
// Derive weekly created/done (and WIP snapshot) for the last 8–12 weeks.
async function getVelocity(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const weeks = Math.min(
      Math.max(parseInt(req.query.weeks || '10', 10), 1),
      26
    ); // sane guard: 1..26

    const data = await velocityService.getWeeklyVelocity({
      projectId,
      weeks,
      now: new Date(),
    });

    // Frontend-friendly summary + histogram
    const currentWindow = data.histogram.slice(-1)[0] || { completed: 0 };
    const prevWindow = data.histogram.slice(-2, -1)[0] || { completed: 0 };
    const trendPct =
      prevWindow.completed > 0
        ? Math.round(((currentWindow.completed - prevWindow.completed) / prevWindow.completed) * 100)
        : (currentWindow.completed > 0 ? 100 : 0);

    res.json({
      projectId,
      windowDays: 7,
      current: {
        completed: currentWindow.completed || 0,
        perDay: (currentWindow.completed || 0) / 7,
        perUserPerDay:
          data.activeUsers > 0 ? ((currentWindow.completed || 0) / 7) / data.activeUsers : 0,
        activeUsers: data.activeUsers || 0,
      },
      previous: {
        completed: prevWindow.completed || 0,
        windowDays: 7,
      },
      trendPct,
      histogram: data.histogram, // [{weekStart, created, completed, wip}]
    });
  } catch (err) {
    next(err);
  }
}

// ---- POST /api/projects/:id/mentor/predict ----
// Rule-based MVP: at-risk, suggestions, ETA from recent done/week.
async function predict(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { totalScope, history, horizonDays } = req.body || {};

    const result = await predictionService.predict({
      projectId,
      totalScope: typeof totalScope === 'number' ? totalScope : undefined,
      history: Array.isArray(history) ? history : undefined,
      horizonDays: typeof horizonDays === 'number' ? horizonDays : 30,
      now: new Date(),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ---- Optional Nudges (in-memory stub; swap to DB later) ----
const _nudges = []; // [{id, projectId, title, body, createdAt, read:false}]

async function listNudges(req, res, next) {
  try {
    const { projectId } = req.query || {};
    const list = projectId ? _nudges.filter(n => n.projectId === projectId) : _nudges;
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function createNudge(req, res, next) {
  try {
    const { projectId, title, body, actions } = req.body || {};
    const nudge = {
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      projectId: projectId || null,
      title: title || 'Nudge',
      body: body || '',
      actions: Array.isArray(actions) ? actions : [],
      createdAt: new Date().toISOString(),
      read: false,
    };
    _nudges.push(nudge);
    res.status(201).json(nudge);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getVelocity,
  predict,
  listNudges,
  createNudge,
};
