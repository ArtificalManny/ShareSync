// server/utils/email/discovery/score.ts
// Scoring logic for the Discovery Feed.
// Safe, testable, and parameterized with tweakable weights.

import { DEFAULT_DISCOVERY_WEIGHTS } from "../config/flags";

export type TimeRangeKey = "7d" | "30d" | "90d";

export interface ProjectSignals {
  velocityPerWeek: number;   // tasks done per week (or normalized throughput)
  xpGrowth: number;          // XP delta over the time window
  reactions: number;         // likes + comments (weighted 1:1 for now)
  transparency: number;      // 1 if public, or a 0..1 score if you track more nuance
  inactivityHours: number;   // hours since last activity/update
}

export interface ScoreWeights {
  velocity: number;
  xpGrowth: number;
  reactions: number;
  transparency: number;
  inactivityPenaltyPer24h: number; // penalty per 24 hours of inactivity, multiplied
}

// DEFAULT WEIGHTS now come from env/config (no redeploy to tweak)
export const DEFAULT_WEIGHTS: ScoreWeights = DEFAULT_DISCOVERY_WEIGHTS;

/**
 * Convert hours of inactivity into a penalty scalar.
 * Example: 48h with penaltyPer24h=3 → 2 * 3 = -6 penalty.
 */
export function inactivityPenalty(
  inactivityHours: number,
  penaltyPer24h: number
): number {
  if (!isFinite(inactivityHours) || inactivityHours <= 0) return 0;
  const periods = inactivityHours / 24;
  return -1 * periods * penaltyPer24h;
}

/**
 * Core scoring function. Pure & deterministic.
 */
export function scoreProject(
  s: ProjectSignals,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const base =
    s.velocityPerWeek * weights.velocity +
    s.xpGrowth * weights.xpGrowth +
    s.reactions * weights.reactions +
    s.transparency * weights.transparency;

  const penalty = inactivityPenalty(s.inactivityHours, weights.inactivityPenaltyPer24h);

  // Soft freshness boost in first 24h (optional, tiny nudge)
  const inactivityDays = s.inactivityHours / 24;
  const freshnessBoost = Math.max(0, 1 - Math.min(1, inactivityDays)); // 0..1
  const boosted = base + penalty + 0.75 * freshnessBoost;

  return boosted;
}

/**
 * Quick helper for mapping mix mode to sort strategy weights (optional).
 * You can plug this into personalized blending later.
 */
export function weightsForMix(mix: "trending" | "personalized" | "blended"): ScoreWeights {
  const W = DEFAULT_WEIGHTS;
  switch (mix) {
    case "trending":
      return { ...W, reactions: Math.max(W.reactions, 0.8), xpGrowth: Math.max(W.xpGrowth, 1.2) };
    case "personalized":
      // Placeholder: you can later boost weights based on the user’s historical clicks
      return { ...W, velocity: Math.max(W.velocity, 1.6), xpGrowth: Math.max(W.xpGrowth, 1.8) };
    case "blended":
    default:
      return W;
  }
}

/** Parse and clamp limit */
export function parseLimit(raw: any, fallback = 20, max = 50): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/** Parse time range query param */
export function parseTimeRange(raw: any): TimeRangeKey {
  const v = String(raw || "7d").toLowerCase() as TimeRangeKey;
  return (["7d", "30d", "90d"] as const).includes(v) ? v : "7d";
}

/** Return Date lower-bound for the given window (UTC) */
export function windowStart(key: TimeRangeKey): Date {
  const now = new Date();
  const d = new Date(now);
  if (key === "7d") d.setDate(now.getDate() - 7);
  else if (key === "30d") d.setDate(now.getDate() - 30);
  else if (key === "90d") d.setDate(now.getDate() - 90);
  return d;
}

/** Opaque cursor helpers (base64 JSON of {score,lastActivity,id}) */
export interface CursorPayload {
  score: number;
  lastActivity: string; // ISO date
  id: string;
}

export function encodeCursor(c: CursorPayload): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(raw?: string | null): CursorPayload | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(String(raw), "base64url").toString("utf8"));
    if (typeof obj?.score === "number" && obj?.lastActivity && obj?.id) return obj;
    return null;
  } catch {
    return null;
  }
}