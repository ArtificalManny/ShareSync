// server/utils/email/config/flags.ts
// Simple env-backed knobs for Discovery.

import type { ScoreWeights } from "../discovery/score"; // <-- fixed path

/** Parse helpers */
const toNumber = (v: any, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const toBool = (v: any, def = false) =>
  /^(1|true|on|yes)$/i.test(String(v ?? (def ? "1" : "0")));

/** Max page size for discovery endpoint */
export const DISCOVERY_MAX_LIMIT = toNumber(process.env.DISCOVERY_MAX_LIMIT, 50);

/**
 * Weights compatible with score.ts (ScoreWeights requires inactivityPenaltyPer24h).
 * Override by env vars as needed.
 */
export const DEFAULT_DISCOVERY_WEIGHTS: ScoreWeights = {
  velocity: toNumber(process.env.W_VELOCITY, 2),
  xpGrowth: toNumber(process.env.W_XP_GROWTH, 1.5),
  reactions: toNumber(process.env.W_REACTIONS, 0.5),
  transparency: toNumber(process.env.W_TRANSPARENCY, 1),
  inactivityPenaltyPer24h: toNumber(process.env.W_INACTIVITY_PENALTY_24H, 3),
};

/** Optional feature toggle */
export const DISCOVERY_ENABLED = toBool(process.env.DISCOVERY_ENABLED, true);

/** Bundle for convenience */
export const FLAGS = {
  DISCOVERY_ENABLED,
  DISCOVERY_MAX_LIMIT,
  DEFAULT_DISCOVERY_WEIGHTS,
};

export default FLAGS;