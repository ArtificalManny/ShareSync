// Lightweight, no-op-safe telemetry wrapper.
// Usage: import { track, trackSidebarToggled, trackMentorSettings } from '../utils/telemetry'
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
  } catch { /* ignore */ }

  // 2) Fallback: sendBeacon (tiny POST to a configurable endpoint)
  try {
    const url =
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TELEMETRY_BEACON_URL) ||
      ''; // e.g. /api/telemetry
    if (url && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify({ event, ...payload })], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  } catch { /* ignore */ }

  // 3) Dev console
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', event, payload);
    }
  } catch { /* ignore */ }
}

/** Convenience helper for your sidebar collapse/expand toggle */
export function trackSidebarToggled(collapsed) {
  track('sidebar_toggled', { collapsed: Boolean(collapsed) });
}

// ✅ Mentor typed helpers
export const trackMentorNudgeShown   = (props = {}) => track('mentor_nudge_shown', props);
export const trackMentorNudgeClicked = (props = {}) => track('mentor_nudge_clicked', props);
export const trackMentorDismissed    = (props = {}) => track('mentor_dismissed', props);
export const trackMentorSettings     = (props = {}) => track('mentor_settings_changed', props);

// ✅ NEW: Calendar & accountability typed helpers
export const trackCalendarLinked = (props = {}) => track('calendar_linked', props);
export const trackScheduleCreated = (props = {}) => track('schedule_created', props);
export const trackAccountabilityStateChanged = (props = {}) => track('accountability_state_changed', props);
export const trackXpAwardedPunctual = (props = {}) => track('xp_awarded_punctual', props);

// ✅ NEW: Posts/mentions helpers
export const trackPostCreated    = (props = {}) => track('post_created', props);
export const trackPostReacted    = (props = {}) => track('post_reacted', props);
export const trackPostCommented  = (props = {}) => track('post_commented', props);
export const trackMentionSent    = (props = {}) => track('mention_sent', props);

// NEW: Search & discoverability helpers
export const trackSearchUsed = (props = {}) => track('search_used', props);
export const trackSearchFilterApplied = (props = {}) => track('search_filter_applied', props);
export const trackProfileDiscoverToggle = (props = {}) => track('profile_discover_toggle', props);
export const trackProjectDiscoverToggle = (props = {}) => track('project_discover_toggle', props);

// NEW: Messenger / Chat helpers
export const trackDmSent            = (props = {}) => track('dm_sent', props);
export const trackChatMessage       = (props = {}) => track('chat_message', props);
export const trackChatReaction      = (props = {}) => track('chat_reaction', props);
export const trackChatSummarized    = (props = {}) => track('chat_summarized', props);
export const trackMessengerToggled  = (props = {}) => track('messenger_toggled', props);

// ✅ NEW: Brand switcher telemetry
export const trackBrandSwitched     = (props = {}) => track('brand_switched', props);

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

export default {
  track,
  trackSidebarToggled,
  trackMentorNudgeShown,
  trackMentorNudgeClicked,
  trackMentorDismissed,
  trackMentorSettings,
  trackCalendarLinked,
  trackScheduleCreated,
  trackAccountabilityStateChanged,
  trackXpAwardedPunctual,
  trackPostCreated,
  trackPostReacted,
  trackPostCommented,
  trackMentionSent,
  trackSearchUsed,
  trackSearchFilterApplied,
  trackProfileDiscoverToggle,
  trackProjectDiscoverToggle,
  trackDmSent,
  trackChatMessage,
  trackChatReaction,
  trackChatSummarized,
  trackMessengerToggled,
  trackBrandSwitched,
};
