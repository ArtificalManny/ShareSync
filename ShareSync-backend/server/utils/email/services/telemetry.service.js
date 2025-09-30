// server/utils/email/services/telemetry.service.js
// MVP: log or send to Segment/posthog later
function track(event, props) {
    // console.log('[telemetry]', event, props);
    return true;
  }
  module.exports = { track };
  