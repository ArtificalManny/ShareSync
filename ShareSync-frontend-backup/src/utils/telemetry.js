// Lightweight, no-op-safe telemetry wrapper.
// Usage: import { track } from '@/utils/telemetry'
//        track('task_created', { projectId, taskId })

/**
 * Send a telemetry event.
 * @param {string} event - Event name (e.g., "invite_sent", "task_updated").
 * @param {Object} [props={}] - Additional properties to attach.
 */
export function track(event, props = {}) {
    if (!event || typeof event !== "string") return;
  
    const payload = {
      ...props,
      // Attach a timestamp for basic sequencing in backends that don't add one.
      ts: Date.now(),
    };
  
    try {
      // Segment-style global (or any analytics lib that exposes track)
      if (typeof window !== "undefined" && window.analytics && typeof window.analytics.track === "function") {
        window.analytics.track(event, payload);
      }
    } catch {
      /* ignore */
    }
  
    // Dev fallback: print to console so you can see events while developing
    try {
      // Vite / modern bundlers expose import.meta.env.DEV
      if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug("[telemetry]", event, payload);
      }
    } catch {
      /* ignore */
    }
  }
  
  export default { track };
  