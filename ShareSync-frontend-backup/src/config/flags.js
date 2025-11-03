// src/config/flags.js
// Centralized feature flags with env + localStorage overrides.
// Defaults are chosen for fast rollback of new surfaces.

function parseBool(v, def = false) {
  if (v === undefined || v === null) return def;
  return /^(1|true|on|yes)$/i.test(String(v));
}

function envFlag(name, def = false) {
  const v = import.meta?.env?.[name];
  return parseBool(v, def);
}

// Optional runtime overrides for quick QA:
// localStorage.setItem('sharesync.flags', JSON.stringify({ FOCUS_DOCK_V1:false, PUBLIC_PAGES_V1:false }))
function loadOverrides() {
  try {
    const raw = localStorage.getItem('sharesync.flags');
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return typeof obj === 'object' && obj ? obj : {};
  } catch {
    return {};
  }
}

const overrides = loadOverrides();
const flag = (key, envName, def = false) =>
  (overrides[key] !== undefined ? overrides[key] : envFlag(envName, def));

// ─────────────────────────────────────────────────────────────
// Your existing flags (kept as-is, but normalized to use `flag()`
// where helpful so overrides work consistently)
// ─────────────────────────────────────────────────────────────
export const TRANSPARENCY_ENABLED = flag('TRANSPARENCY_ENABLED', 'VITE_FEATURE_TRANSPARENCY', false);
export const HABITS_ENABLED       = flag('HABITS_ENABLED', 'VITE_FEATURE_HABITS', false);

export const KPI_STRIP_ENABLED    = flag('KPI_STRIP_ENABLED', 'VITE_FEATURE_KPI_STRIP',    true);
export const SMART_SEARCH_ENABLED = flag('SMART_SEARCH_ENABLED', 'VITE_FEATURE_SMART_SEARCH', true);
export const FEED_ENABLED         = flag('FEED_ENABLED', 'VITE_FEATURE_FEED', true);
export const AI_COACH_ENABLED     = flag('AI_COACH_ENABLED', 'VITE_FEATURE_AI_COACH', true);
export const TENX_ENABLED         = flag('TENX_ENABLED', 'VITE_FEATURE_TENX', true);
export const LEADERBOARD_ENABLED  = flag('LEADERBOARD_ENABLED', 'VITE_FEATURE_LEADERBOARD', true);

export const MENTOR_V1 = parseBool(import.meta?.env?.VITE_FEATURE_MENTOR ?? "1", true);

export const CALENDAR_ACCOUNTABILITY = flag('CALENDAR_ACCOUNTABILITY', 'VITE_FEATURE_CALENDAR_ACCOUNTABILITY', true);
export const POSTS_V1                = flag('POSTS_V1', 'VITE_FEATURE_POSTS_V1', true);
export const GLOBAL_SEARCH           = flag('GLOBAL_SEARCH', 'VITE_FEATURE_GLOBAL_SEARCH', true);
export const DISCOVERABILITY         = flag('DISCOVERABILITY', 'VITE_FEATURE_DISCOVERABILITY', false);

export const IMPORT_WIZARD_V1 = flag('IMPORT_WIZARD_V1', 'VITE_FEATURE_IMPORT_WIZARD_V1', false);
export const MESSENGER_V1     = flag('MESSENGER_V1', 'VITE_FEATURE_MESSENGER_V1', false);
export const PRESENCE_V1      = flag('PRESENCE_V1', 'VITE_FEATURE_PRESENCE_V1', false);

export const BRAND_V2     = flag('BRAND_V2', 'VITE_FEATURE_BRAND_V2', false);
export const DISCOVERY_V1 = flag('DISCOVERY_V1', 'VITE_FEATURE_DISCOVERY_V1', false);

// Admin / metrics
export const ADMIN_METRICS_V1 = flag('ADMIN_METRICS_V1', 'VITE_FEATURE_ADMIN_METRICS_V1', true);
export const ADMIN_CONSOLE_V1 = flag('ADMIN_CONSOLE_V1', 'VITE_FEATURE_ADMIN_CONSOLE_V1', false);
export const PULSE_ADMIN_V1   = parseBool(import.meta?.env?.VITE_PULSE_ADMIN_V1 ?? "", false);

// SSO
export const SSO_ENABLED       = parseBool(import.meta.env.VITE_SSO_ENABLED || "", false);
export const SSO_PROVIDER_NAME = String(import.meta.env.VITE_SSO_PROVIDER_NAME || "SSO");
export const SSO_DOCS_URL      = String(import.meta.env.VITE_SSO_DOCS_URL || "https://yourdocs.example.com/sso");
export const SSO_START_URL     = String(import.meta.env.VITE_SSO_START_URL || "/auth/sso/start");

// Reactions v1 (Phase 3)
export const REACTIONS_V1 = parseBool(import.meta.env.VITE_FEATURE_REACTIONS_V1 ?? "", false);

// ─────────────────────────────────────────────────────────────
// ✅ NEW FLAGS used by the new components/pages
// ─────────────────────────────────────────────────────────────

// Focus dock + toasts (guard the provider/dock so the shell never blanks)
export const FOCUS_DOCK_V1 = flag('FOCUS_DOCK_V1', 'VITE_FEATURE_FOCUS_DOCK_V1', false);

// KPI ticker in navbar
export const KPI_TICKER_V1 = flag('KPI_TICKER_V1', 'VITE_FEATURE_KPI_TICKER_V1', false);

// ETA explainer card in ProjectHome
export const ETA_EXPLAINER_V1 = flag('ETA_EXPLAINER_V1', 'VITE_FEATURE_ETA_EXPLAINER_V1', false);

// Shareable public pages
export const PUBLIC_PAGES_V1 = flag('PUBLIC_PAGES_V1', 'VITE_FEATURE_PUBLIC_PAGES_V1', false);

// Mini social (follow/react)
export const SOCIAL_MINI_V1 = flag('SOCIAL_MINI_V1', 'VITE_FEATURE_SOCIAL_MINI_V1', false);

// ─────────────────────────────────────────────────────────────
// NEW MOMENTUM FLAGS
// ─────────────────────────────────────────────────────────────
export const STREAK_FLAME_V1    = flag('STREAK_FLAME_V1',    'VITE_FEATURE_STREAK_FLAME_V1',    true);
export const TOP_TEN_PULSE_V1   = flag('TOP_TEN_PULSE_V1',   'VITE_FEATURE_TOP_TEN_PULSE_V1',   true);
export const MOMENTUM_SCORE_V1  = flag('MOMENTUM_SCORE_V1',  'VITE_FEATURE_MOMENTUM_SCORE_V1',  true);

// ─────────────────────────────────────────────────────────────

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
  CALENDAR_ACCOUNTABILITY,
  POSTS_V1,
  GLOBAL_SEARCH,
  DISCOVERABILITY,
  IMPORT_WIZARD_V1,
  MESSENGER_V1,
  PRESENCE_V1,
  BRAND_V2,
  DISCOVERY_V1,
  ADMIN_METRICS_V1,
  ADMIN_CONSOLE_V1,
  PULSE_ADMIN_V1,

  // New
  FOCUS_DOCK_V1,
  KPI_TICKER_V1,
  ETA_EXPLAINER_V1,
  PUBLIC_PAGES_V1,
  SOCIAL_MINI_V1,
  REACTIONS_V1,

  // Momentum
  STREAK_FLAME_V1,
  TOP_TEN_PULSE_V1,
  MOMENTUM_SCORE_V1,

  // SSO (for dashboards)
  SSO_ENABLED,
  SSO_PROVIDER_NAME,
  SSO_DOCS_URL,
  SSO_START_URL,
};

export default FLAGS;