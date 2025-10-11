// server/discovery/score.ts
// Scoring logic for the Discovery Feed.
// Safe, testable, and parameterized with tweakable weights.

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

export const DEFAULT_WEIGHTS: ScoreWeights = {
  velocity: 2.0,
  xpGrowth: 1.5,
  reactions: 0.5,
  transparency: 1.0,
  inactivityPenaltyPer24h: 3.0,
};

/** ---------------- Guardrails + Freshness helpers ---------------- **/

/** Clamp a number to a safe finite range. */
function clamp(n: unknown, min = -1e9, max = 1e9): number {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.min(max, Math.max(min, x));
  }
  
  /** Ensure 0..1 transparency */
  function clamp01(n: unknown): number {
    const x = clamp(n, 0, 1);
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
  
  /**
   * Freshness boost in the first ~24h since last activity.
   * inactivityHours = 0 → boost 1.0 ; inactivityHours >= 24 → boost 0.0
   */
  function freshnessBoost(inactivityHours: number): number {
    const days = clamp(inactivityHours, 0) / 24;
    // 1.0 → 0.0 linearly over 1 day
    return Math.max(0, 1 - Math.min(1, days));
  }  

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
 * Matches your requested formula + guardrails + soft freshness boost.
 *
 * ProjectScore =
 *   (Velocity * 2) + (XPGrowth * 1.5) + (Reactions * 0.5) + (Transparency * 1)
 *   - (InactivityDays * 3)
 *   + (0.75 * freshnessBoost[0..1])
 */
export function scoreProject(
    s: ProjectSignals,
    weights: ScoreWeights = DEFAULT_WEIGHTS
  ): number {
    // ----- guardrails / coalescing -----
    const Velocity     = clamp(s.velocityPerWeek, 0);  // tasks/week (rolling)
    const XPGrowth     = clamp(s.xpGrowth, 0);
    const Reactions    = clamp(s.reactions, 0);
    const Transparency = clamp01(s.transparency);      // 0..1
    const InactivityH  = clamp(s.inactivityHours, 0);
  
    // ----- base per weights (kept parametric) -----
    const base =
      Velocity     * weights.velocity +
      XPGrowth     * weights.xpGrowth +
      Reactions    * weights.reactions +
      Transparency * weights.transparency;
  
    // penalty per 24h @ configured rate (defaults to 3.0/day)
    const penalty = inactivityPenalty(InactivityH, weights.inactivityPenaltyPer24h);
  
    // ----- soft freshness boost during first 24h -----
    // maps 0h→+0.75 down to 24h→+0.0
    const boost = 0.75 * freshnessBoost(InactivityH);
  
    return base + penalty + boost;
  }
    
/**
 * Quick helper for mapping mix mode to sort strategy weights (optional).
 * You can plug this into personalized blending later.
 */
export function weightsForMix(mix: "trending" | "personalized" | "blended"): ScoreWeights {
  switch (mix) {
    case "trending":
      return { ...DEFAULT_WEIGHTS, reactions: 0.8, xpGrowth: 1.2 };
    case "personalized":
      // Placeholder: you can later boost weights based on the user’s historical clicks
      return { ...DEFAULT_WEIGHTS, velocity: 1.6, xpGrowth: 1.8 };
    case "blended":
    default:
      return DEFAULT_WEIGHTS;
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
