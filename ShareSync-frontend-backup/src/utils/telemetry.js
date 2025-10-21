// Lightweight, no-op-safe telemetry wrapper.
// Usage: import { track, trackSidebarToggled, trackMentorSettings } from '../utils/telemetry'
//        track('task_created', { projectId, taskId })

/**
 * Normalize event names to snake_case as a guardrail.
 */
function toSnakeCase(name) {
  return String(name || "")
    .trim()
    .replaceAll(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/**
 * Send a telemetry event.
 * @param {string} event - Event name (e.g., "invite_sent", "task_updated").
 * @param {Object} [context={}] - Additional properties to attach.
 */
export function track(event, context = {}) {
  if (!event || typeof event !== "string") return;

  const eventName = toSnakeCase(event);
  const payload = {
    ...context,
    // Attach a timestamp for basic sequencing in backends that don't add one.
    ts: Date.now(),
    // Attach a stable session id if you want (optional)
    sid: getSessionId(),
  };

  // 1) Preferred: analytics library (Segment, Rudder, etc.)
  try {
    if (typeof window !== "undefined" && window.analytics && typeof window.analytics.track === "function") {
      window.analytics.track(eventName, payload);
    }
  } catch { /* ignore */ }

  // 2) Fallback: sendBeacon (tiny POST to a configurable endpoint)
  try {
    const url =
      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_TELEMETRY_BEACON_URL) ||
      ""; // e.g. /api/telemetry
    if (url && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify({ event: eventName, ...payload })], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    }
  } catch { /* ignore */ }

  // 3) Dev console
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[telemetry]", eventName, payload);
    }
  } catch { /* ignore */ }
}

/** Convenience helper for your sidebar collapse/expand toggle */
export function trackSidebarToggled(collapsed) {
  track("sidebar_toggled", { collapsed: Boolean(collapsed) });
}

// ✅ Mentor typed helpers
export const trackMentorNudgeShown   = (props = {}) => track("mentor_nudge_shown", props);
export const trackMentorNudgeClicked = (props = {}) => track("mentor_nudge_clicked", props);
export const trackMentorDismissed    = (props = {}) => track("mentor_dismissed", props);
export const trackMentorSettings     = (props = {}) => track("mentor_settings_changed", props);

// ✅ NEW: Calendar & accountability typed helpers
export const trackCalendarLinked             = (props = {}) => track("calendar_linked", props);
export const trackScheduleCreated            = (props = {}) => track("schedule_created", props);
export const trackAccountabilityStateChanged = (props = {}) => track("accountability_state_changed", props);
export const trackXpAwardedPunctual          = (props = {}) => track("xp_awarded_punctual", props);

// ✅ NEW: Posts/mentions helpers
export const trackPostCreated    = (props = {}) => track("post_created", props);
export const trackPostReacted    = (props = {}) => track("post_reacted", props);
export const trackPostCommented  = (props = {}) => track("post_commented", props);
export const trackMentionSent    = (props = {}) => track("mention_sent", props);

// NEW: Search & discoverability helpers
export const trackSearchUsed             = (props = {}) => track("search_used", props);
export const trackSearchFilterApplied    = (props = {}) => track("search_filter_applied", props);
export const trackProfileDiscoverToggle  = (props = {}) => track("profile_discover_toggle", props);
export const trackProjectDiscoverToggle  = (props = {}) => track("project_discover_toggle", props);

// NEW: Messenger / Chat helpers
export const trackDmSent            = (props = {}) => track("dm_sent", props);
export const trackChatMessage       = (props = {}) => track("chat_message", props);
export const trackChatReaction      = (props = {}) => track("chat_reaction", props);
export const trackChatSummarized    = (props = {}) => track("chat_summarized", props);
export const trackMessengerToggled  = (props = {}) => track("messenger_toggled", props);

// ✅ NEW: Brand switcher telemetry
export const trackBrandSwitched     = (props = {}) => track("brand_switched", props);

// ✅ NEW: Admin Console telemetry
export const trackAdminConsoleOpened        = (props = {}) => track("admin_console_opened", props);
export const trackAdminConsoleTabChanged    = (props = {}) => track("admin_console_tab_changed", props);
export const trackAdminConsoleFilterChanged = (props = {}) => track("admin_console_filter_changed", props);

// Aliases requested (keep both sets so nothing breaks)
export const trackAdminConsoleViewed     = (props = {}) => track("admin_console_viewed", props);
export const trackAdminTabChanged        = (props = {}) => track("admin_tab_changed", props);
export const trackAdminCsvExported       = (props = {}) => track("admin_csv_exported", props);

// Optional, if you add CSV export per tab
export const trackAdminConsoleExportClicked = (props = {}) => track("admin_console_export_clicked", props);

// ✅ NEW: Import wizard helpers
export const trackImportStarted       = (props = {}) => track("import_started", props);
export const trackImportPreviewShown  = (props = {}) => track("import_preview_shown", props);
export const trackImportConfirmed     = (props = {}) => track("import_confirmed", props);
export const trackImportFailed        = (props = {}) => track("import_failed", props);
// CTA used in ProjectHome action bar
export const trackImportCtaClicked    = (props = {}) => track("import_cta_clicked", props);

// Presence telemetry
export const trackPresenceHeartbeatSent = (props = {}) => track("presence_heartbeat_sent", props);
export const trackPresenceMemberSeen    = (props = {}) => track("presence_member_seen", props);

// ✅ NEW: Home polish telemetry
export const trackKpiStripViewed   = (props = {}) => track("kpi_strip_viewed", props);
export const trackFeedTabChanged   = (props = {}) => track("feed_tab_changed", props);

// ────────────────────────────────────────────────────────────────────────────
// 🚀 NEW GROUPS matching the features you just wired
// ────────────────────────────────────────────────────────────────────────────

// Focus Dock (Plan → Focus → Share loop)
export const trackFocusStartClicked  = (props = {}) => track("focus_start_clicked", props);
export const trackFocusPaused        = (props = {}) => track("focus_paused", props);
export const trackFocusResumed       = (props = {}) => track("focus_resumed", props);
export const trackFocusCanceled      = (props = {}) => track("focus_canceled", props);
export const trackFocusCompleted     = (props = {}) => track("focus_completed", props);
export const trackFocusUpdatePosted  = (props = {}) => track("focus_update_posted", props);

// KPI interactions (ticker + chart points + comments)
export const trackKpiTickerOpened    = (props = {}) => track("kpi_ticker_opened", props);
export const trackKpiDeltaHovered    = (props = {}) => track("kpi_delta_hovered", props);
export const trackKpiPointOpened     = (props = {}) => track("kpi_point_opened", props);
export const trackKpiCommentAdded    = (props = {}) => track("kpi_comment_added", props);

// Today Capsule on Home
export const trackTodayCapsuleActionStarted = (props = {}) => track("today_capsule_action_started", props);
export const trackTodayCapsuleDismissed     = (props = {}) => track("today_capsule_dismissed", props);

// ETA Explainer (Project)
export const trackEtaExplainerOpened = (props = {}) => track("eta_explainer_opened", props);
export const trackEtaReasonExpanded  = (props = {}) => track("eta_reason_expanded", props);

// Presence → Focus awareness
export const trackFocusJoinClicked   = (props = {}) => track("focus_join_clicked", props);
export const trackFocusToastSeen     = (props = {}) => track("focus_toast_seen", props);

// Discover: follow + react (social mini)
export const trackFollowClicked      = (props = {}) => track("follow_clicked", props);
export const trackUnfollowClicked    = (props = {}) => track("unfollow_clicked", props);
export const trackReactionClicked    = (props = {}) => track("reaction_clicked", props);

// Public status / public pages
export const trackPublicToggleEnabled   = (props = {}) => track("public_toggle_enabled", props);
export const trackPublicToggleDisabled  = (props = {}) => track("public_toggle_disabled", props);
export const trackPublicLinkRegenerated = (props = {}) => track("public_link_regenerated", props);
export const trackPublicLinkCopied      = (props = {}) => track("public_link_copied", props);
export const trackPublicPageViewed      = (props = {}) => track("public_page_viewed", props);

// Project header bits you’re emitting
export const trackProjectSeen       = (props = {}) => track("project_seen", props);
export const trackProjectMarkRead   = (props = {}) => track("project_mark_read", props);

// Sprint share toggle (from SprintCompleteModal)
export const trackShareToggleUsed   = (props = {}) => track("share_toggle_used", props);

// ────────────────────────────────────────────────────────────────────────────
// Internal: simple ephemeral session id (tab-scoped)
// ────────────────────────────────────────────────────────────────────────────
let __sid = null;
function getSessionId() {
  if (__sid) return __sid;
  try {
    const key = "ss.sid";
    __sid = sessionStorage.getItem(key);
    if (!__sid) {
      __sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, __sid);
    }
  } catch {
    __sid = "sid-" + Math.random().toString(36).slice(2);
  }
  return __sid;
}

export default {
  track,
  trackSidebarToggled,

  // Mentor
  trackMentorNudgeShown,
  trackMentorNudgeClicked,
  trackMentorDismissed,
  trackMentorSettings,

  // Calendar & accountability
  trackCalendarLinked,
  trackScheduleCreated,
  trackAccountabilityStateChanged,
  trackXpAwardedPunctual,

  // Posts / mentions
  trackPostCreated,
  trackPostReacted,
  trackPostCommented,
  trackMentionSent,

  // Search / discoverability
  trackSearchUsed,
  trackSearchFilterApplied,
  trackProfileDiscoverToggle,
  trackProjectDiscoverToggle,

  // Messenger
  trackDmSent,
  trackChatMessage,
  trackChatReaction,
  trackChatSummarized,
  trackMessengerToggled,

  // Brand
  trackBrandSwitched,

  // Import wizard
  trackImportStarted,
  trackImportPreviewShown,
  trackImportConfirmed,
  trackImportFailed,
  trackImportCtaClicked,

  // Admin Console
  trackAdminConsoleOpened,
  trackAdminConsoleTabChanged,
  trackAdminConsoleFilterChanged,
  trackAdminConsoleExportClicked,
  // Aliases
  trackAdminConsoleViewed,
  trackAdminTabChanged,
  trackAdminCsvExported,

  // Presence
  trackPresenceHeartbeatSent,
  trackPresenceMemberSeen,

  // Home polish
  trackKpiStripViewed,
  trackFeedTabChanged,

  // NEW groups you added
  trackFocusStartClicked,
  trackFocusPaused,
  trackFocusResumed,
  trackFocusCanceled,
  trackFocusCompleted,
  trackFocusUpdatePosted,

  trackKpiTickerOpened,
  trackKpiDeltaHovered,
  trackKpiPointOpened,
  trackKpiCommentAdded,

  trackTodayCapsuleActionStarted,
  trackTodayCapsuleDismissed,

  trackEtaExplainerOpened,
  trackEtaReasonExpanded,

  trackFocusJoinClicked,
  trackFocusToastSeen,

  trackFollowClicked,
  trackUnfollowClicked,
  trackReactionClicked,

  trackPublicToggleEnabled,
  trackPublicToggleDisabled,
  trackPublicLinkRegenerated,
  trackPublicLinkCopied,
  trackPublicPageViewed,

  trackProjectSeen,
  trackProjectMarkRead,

  trackShareToggleUsed,
};