// server/utils/email/routes/mentor.routes.js
// If your file lives at server/routes/mentor.routes.js instead,
// just adjust the relative requires below accordingly.

const express = require('express');
const router = express.Router();

const { requireFlag } = require('../middleware/flags');
const {
  getVelocity,
  predict,
  listNudges,
  createNudge,
} = require('../controllers/mentor.controller');

// ---- Mentor / Velocity ----
// GET /api/projects/:id/velocity
router.get('/projects/:id/velocity', requireFlag('AI_MENTOR'), getVelocity);

// POST /api/projects/:id/mentor/predict
router.post('/projects/:id/mentor/predict', requireFlag('AI_MENTOR'), predict);

// ---- Nudges (optional) ----
// GET /api/mentor/nudges
router.get('/mentor/nudges', requireFlag('AI_MENTOR'), listNudges);

// POST /api/mentor/nudges
router.post('/mentor/nudges', requireFlag('AI_MENTOR'), createNudge);

// ---- iCal export (project tasks) ----
// GET /api/projects/:id/tasks.ics
// You can gate this behind AI_MENTOR if you want; leaving open here is fine too.
const { buildProjectTasksICS } = require('../services/ical.service');
router.get('/projects/:id/tasks.ics', async (req, res, next) => {
  try {
    const ics = await buildProjectTasksICS(req.params.id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${req.params.id}-tasks.ics"`
    );
    res.send(ics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
