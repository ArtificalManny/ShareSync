// Lightweight, no-op-safe telemetry wrapper.
// Usage: import { track, trackSidebarToggled } from '../utils/telemetry'
//        track('task_created', { projectId, taskId })

/**
 * Send a telemetry event.
 * @param {string} event - Event name (e.g., "invite_sent", "task_updated").
 * @param {Object} [props={}] - Additional properties to attach.
 */
export function track(event, props = {}) {
    if (!event || typeof event !== 'string') return;
  
    const payload = {
      ...props,
      // Attach a timestamp for basic sequencing in backends that don't add one.
      ts: Date.now(),
      // Attach a stable session id if you want (optional)
      sid: getSessionId(),
    };
  
    // 1) Preferred: analytics library (Segment, Rudder, etc.)
    try {
      if (typeof window !== 'undefined' && window.analytics && typeof window.analytics.track === 'function') {
        window.analytics.track(event, payload);
      }
    } catch {
      /* ignore */
    }
  
    // 2) Fallback: sendBeacon (tiny POST to a configurable endpoint)
    try {
      const url =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TELEMETRY_BEACON_URL) ||
        ''; // e.g. /api/telemetry
      if (url && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify({ event, ...payload })], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      }
    } catch {
      /* ignore */
    }
  
    // 3) Dev console
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', event, payload);
      }
    } catch {
      /* ignore */
    }
  }
  
  /** Convenience helper for your sidebar collapse/expand toggle */
  export function trackSidebarToggled(collapsed) {
    track('sidebar_toggled', { collapsed: Boolean(collapsed) });
  }
  
  // Simple ephemeral session id (tab-scoped)
  let __sid = null;
  function getSessionId() {
    if (__sid) return __sid;
    try {
      const key = 'ss.sid';
      __sid = sessionStorage.getItem(key);
      if (!__sid) {
        __sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(key, __sid);
      }
    } catch {
      __sid = 'sid-' + Math.random().toString(36).slice(2);
    }
    return __sid;
  }
  
  export default { track, trackSidebarToggled };
  