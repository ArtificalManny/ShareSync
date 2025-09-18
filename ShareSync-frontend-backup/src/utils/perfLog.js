// Lightweight perf helpers (safe in all envs) + FPS meter facade.

import { start as _fpsStart } from "./perf/fps";

const isDev =
  (typeof importMeta !== "undefined" && importMeta?.env?.DEV) ||
  (typeof import.meta !== "undefined" && import.meta?.env?.DEV) ||
  (typeof process !== "undefined" && process?.env?.NODE_ENV !== "production");

export function mark(name) {
  try {
    performance.mark(name);
  } catch {}
}

export function measure(name, startMark, endMark) {
  try {
    // If endMark provided, create it first
    if (endMark) performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    if (isDev) {
      const entries = performance.getEntriesByName(name);
      const last = entries[entries.length - 1];
      if (last) {
        // Round to 1 decimal for readability
        const ms = Math.round(last.duration * 10) / 10;
        // eslint-disable-next-line no-console
        console.debug(`[perf] ${name}: ${ms} ms`);
      }
    }
  } catch {}
}

export const fpsMeter = {
  /**
   * Start an FPS loop. Returns a handle with stop().
   * opts: { overlay?: boolean, position?: 'tr'|'tl'|'br'|'bl' }
   */
  start(label = "fps", opts = {}) {
    return _fpsStart(label, opts);
  },
};