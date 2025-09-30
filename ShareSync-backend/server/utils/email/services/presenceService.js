// server/utils/email/services/presenceService.js
const events = require('../system/events');

class PresenceService {
  constructor({ ttlMs = 60_000 } = {}) {
    this.ttlMs = ttlMs;
    this.map = new Map(); // userId -> { last: number }
    this.timer = setInterval(() => this.sweep(), Math.min(ttlMs, 10_000));
    this.timer.unref?.();
  }

  heartbeat(userId) {
    const now = Date.now();
    const prev = this.map.get(userId);
    this.map.set(userId, { last: now });
    if (!prev) {
      // transitioned to online
      events.emit('chat_presence', { userId, state: 'online' });
    }
  }

  sweep() {
    const now = Date.now();
    for (const [userId, rec] of this.map.entries()) {
      if (now - rec.last > this.ttlMs) {
        this.map.delete(userId);
        events.emit('chat_presence', { userId, state: 'offline' });
      }
    }
  }

  isOnline(userId) {
    const rec = this.map.get(userId);
    return !!rec && Date.now() - rec.last <= this.ttlMs;
  }

  stop() {
    clearInterval(this.timer);
  }
}

module.exports = new PresenceService({ ttlMs: 65_000 });
