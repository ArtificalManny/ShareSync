// server/utils/email/jobs/scheduleState.job.js
const cron = require('node-cron');
const { recomputeScheduleStates } = require('../services/schedule.service');

function registerScheduleStateCron() {
  // Every hour at minute 5 (tune as you like)
  // Cron format: m h dom mon dow
  cron.schedule('5 * * * *', async () => {
    try {
      const { updated } = await recomputeScheduleStates();
      // Optional: log
      // console.log(`[cron] scheduleState updated: ${updated}`);
    } catch (err) {
      console.error('[cron] scheduleState error', err);
    }
  });
}

module.exports = { registerScheduleStateCron };
