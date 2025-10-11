// Centralized feature flags with env + localStorage overrides.
// Defaults are chosen for fast rollback of new surfaces.

function parseBool(v, def = false) {
  if (v === undefined || v === null) return def;
  return /^(1|true|on|yes)$/i.test(String(v));
}

function envFlag(name, def = false) {
  // Vite exposes env as import.meta.env
  const v = import.meta?.env?.[name];
  return parseBool(v, def);
}

// Optional runtime overrides for quick QA:
// localStorage.setItem('sharesync.flags', JSON.stringify({ HABITS_ENABLED: true }))
function loadOverrides() {
  try {
    const raw = localStorage.getItem('sharesync.flags');
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return typeof obj === 'object' && obj ? obj : {};
  } catch { return {}; }
}

const overrides = loadOverrides();

// Behind a flag by default
export const TRANSPARENCY_ENABLED = overrides.TRANSPARENCY_ENABLED ??
  envFlag('VITE_FEATURE_TRANSPARENCY', false);

export const HABITS_ENABLED = overrides.HABITS_ENABLED ??
  envFlag('VITE_FEATURE_HABITS', false);

// Stable defaults (can still be disabled by env/overrides)
export const KPI_STRIP_ENABLED    = overrides.KPI_STRIP_ENABLED    ?? envFlag('VITE_FEATURE_KPI_STRIP',    true);
export const SMART_SEARCH_ENABLED = overrides.SMART_SEARCH_ENABLED ?? envFlag('VITE_FEATURE_SMART_SEARCH', true);
export const FEED_ENABLED         = overrides.FEED_ENABLED         ?? envFlag('VITE_FEATURE_FEED',         true);
export const AI_COACH_ENABLED     = overrides.AI_COACH_ENABLED     ?? envFlag('VITE_FEATURE_AI_COACH',     true);
export const TENX_ENABLED         = overrides.TENX_ENABLED         ?? envFlag('VITE_FEATURE_TENX',         true);
export const LEADERBOARD_ENABLED  = overrides.LEADERBOARD_ENABLED  ?? envFlag('VITE_FEATURE_LEADERBOARD',  true);

// AI mentor (Charles Xavier)
export const MENTOR_V1 =
  /^(1|true|on|yes)$/i.test(String(import.meta?.env?.VITE_FEATURE_MENTOR ?? "1"));

// ✅ NEW: Calendar scheduling + accountability
export const CALENDAR_ACCOUNTABILITY = overrides.CALENDAR_ACCOUNTABILITY ??
  envFlag('VITE_FEATURE_CALENDAR_ACCOUNTABILITY', true);

// ✅ NEW: Interactive posts system
export const POSTS_V1 = overrides.POSTS_V1 ??
  envFlag('VITE_FEATURE_POSTS_V1', true);

// ✅ NEW: Global search surface
export const GLOBAL_SEARCH = overrides.GLOBAL_SEARCH ??
  envFlag('VITE_FEATURE_GLOBAL_SEARCH', true);

// ✅ NEW: Discoverability toggles (user/project visibility in global search)
export const DISCOVERABILITY = overrides.DISCOVERABILITY ??
  envFlag('VITE_FEATURE_DISCOVERABILITY', false);

// NEW: Messenger (DMs + project chat)
export const MESSENGER_V1 = overrides.MESSENGER_V1 ??
  envFlag('VITE_FEATURE_MESSENGER_V1', false);

// ✅ NEW: Brand V2
export const BRAND_V2 = overrides.BRAND_V2 ??
  envFlag('VITE_FEATURE_BRAND_V2', false);

export const DISCOVERY_V1 = overrides.DISCOVERY_V1 ??
  envFlag('VITE_FEATURE_DISCOVERY_V1', false);

export const FLAGS = {
  TRANSPARENCY_ENABLED,
  HABITS_ENABLED,
  KPI_STRIP_ENABLED,
  SMART_SEARCH_ENABLED,
  FEED_ENABLED,
  AI_COACH_ENABLED,
  TENX_ENABLED,
  LEADERBOARD_ENABLED,
  MENTOR_V1,
  CALENDAR_ACCOUNTABILITY, // existing
  POSTS_V1,                // posts system
  GLOBAL_SEARCH,           // NEW
  DISCOVERABILITY,         // NEW
  MESSENGER_V1,            // NEW
  BRAND_V2,                // NEW
  DISCOVERY_V1,
};

export default FLAGS;
