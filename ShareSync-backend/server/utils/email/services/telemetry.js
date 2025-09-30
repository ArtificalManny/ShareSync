// server/utils/email/services/telemetry.js
const events = require('../system/events');
const https = require('https');
let analytics = null;

const SEGMENT_KEY = process.env.SEGMENT_WRITE_KEY || '';
const WEBHOOK_URL = process.env.TELEMETRY_WEBHOOK_URL || '';

if (SEGMENT_KEY) {
  try {
    // Lazy require to keep it optional
    const Analytics = require('analytics-node');
    analytics = new Analytics(SEGMENT_KEY, { flushInterval: 1000 });
  } catch {
    analytics = null;
  }
}

function sendWebhook(event, properties) {
  if (!WEBHOOK_URL) return;
  try {
    const url = new URL(WEBHOOK_URL);
    const body = JSON.stringify({ event, properties, ts: Date.now() });
    const opts = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(opts, (res) => res.resume());
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch {}
}

function track(event, props) {
  if (analytics) {
    analytics.track({ event, properties: props || {} });
  } else if (WEBHOOK_URL) {
    sendWebhook(event, props || {});
  } else {
    // dev fallback
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[telemetry]', event, props || {});
    }
  }
}

/** Wire server events to telemetry */
function wireTelemetry() {
  // Posts
  events.on('post_created',  (p) => track('post_created', p));
  events.on('post_reacted',  (p) => track('post_reacted', p));
  events.on('post_commented',(p) => track('post_commented', p));
  events.on('mention_sent',  (p) => track('mention_sent', p));

  // Mentor / schedule / xp (existing)
  events.on('xp_awarded_punctual',  (p) => track('xp_awarded_punctual', p));
  events.on('schedule_created',     (p) => track('schedule_created', p));
  events.on('calendar_linked',      (p) => track('calendar_linked', p));
  events.on('accountability_state_changed', (p) => track('accountability_state_changed', p));
  events.on('project_chat_toggle',  (p) => track('messenger_toggled', p));

  // Search / discoverability (existing)
  events.on('search_used',          (p) => track('search_used', p));
  events.on('profile_discover_toggle', (p) => track('profile_discover_toggle', p));
  events.on('project_discover_toggle', (p) => track('project_discover_toggle', p));

  // Chat / messenger (new)
  events.on('chat_message_created', (p) => track('chat_message', p));
  events.on('chat_message_updated', (p) => track('chat_message_updated', p));
  events.on('chat_reaction_toggled',(p) => track('chat_reaction', p));
  events.on('chat_presence',        (p) => track('chat_presence', p));
  events.on('chat_summarized',      (p) => track('chat_summarized', p));
}

module.exports = { wireTelemetry, track };
