// server/utils/email/services/schedule.service.js
const Task = require('../models/Task');
const events = require('../system/events');
const xp = require('./xp.service');
const telemetry = require('./telemetry.service');
const feed = require('./feed.service');

async function recomputeScheduleStates({ projectId } = {}) {
  const query = projectId ? { projectId } : {};
  const tasks = await Task.find(query).lean(false); // need document methods

  const results = [];
  const now = new Date();

  for (const doc of tasks) {
    const prev = doc.scheduleState || 'unknown';
    const next = doc.computeScheduleState(now);

    if (next !== prev) {
      doc.scheduleState = next;
      await doc.save();

      results.push({ id: String(doc._id), prev, next });

      // XP + events when good states achieved on transition
      if ((next === 'early' || next === 'on_time') && prev !== next) {
        const amount = next === 'early' ? 15 : 10; // pick your values
        if (doc.assigneeId) {
          await xp.award({
            userId: doc.assigneeId,
            projectId: doc.projectId,
            amount,
            reason: `task_${next}`,
            meta: { taskId: String(doc._id) },
          });
          telemetry.track('xp_awarded_punctual', {
            userId: String(doc.assigneeId),
            projectId: String(doc.projectId),
            taskId: String(doc._id),
            scheduleState: next,
            amount,
          });
          feed.publish('xp_awarded_punctual', {
            projectId: String(doc.projectId),
            userId: String(doc.assigneeId),
            taskId: String(doc._id),
            scheduleState: next,
            xp: amount,
          });
          events.emit('xp_awarded_punctual', {
            userId: String(doc.assigneeId),
            projectId: String(doc.projectId),
            taskId: String(doc._id),
            amount,
            scheduleState: next,
          });
        }
      }

      events.emit('accountability_state_changed', {
        taskId: String(doc._id),
        projectId: String(doc.projectId),
        prev,
        next,
      });
    }
  }

  return { updated: results.length, changes: results };
}

module.exports = {
  recomputeScheduleStates,
};
