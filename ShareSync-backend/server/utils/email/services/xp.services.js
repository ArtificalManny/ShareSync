// server/utils/email/services/xp.service.js
// MVP stub – swap with real User/Points model later

const events = require('../system/events');

async function award({ userId, projectId, amount, reason, meta }) {
  // TODO: persist to DB (e.g., User.points += amount, or a Points ledger)
  events.emit('xp_awarded', { userId: String(userId), projectId: String(projectId), amount, reason, meta });
  return { ok: true };
}

module.exports = { award };
