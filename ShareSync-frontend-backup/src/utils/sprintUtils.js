// /src/utils/sprintUtils.js

/**
 * Utility helpers for Focus Sprint (frontend).
 * These handle formatting, persistence, and safe math.
 */

const STORAGE_KEY = "sharesync.sprint.v1";

/**
 * Clamp a number between min and max.
 */
export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Format milliseconds → MM:SS
 */
export function formatMMSS(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * Compute remaining milliseconds given an endTime.
 */
export function computeRemaining(endTime) {
  if (!endTime) return 0;
  return Math.max(0, endTime - Date.now());
}

/**
 * Load saved sprint state from localStorage.
 * Returns null if none or invalid.
 */
export function loadSprintState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save sprint state to localStorage.
 */
export function saveSprintState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota/privacy errors
  }
}

/**
 * Clear saved sprint state.
 */
export function clearSprintState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
