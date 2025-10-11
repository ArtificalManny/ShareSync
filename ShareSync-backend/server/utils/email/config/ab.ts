// server/utils/email/config/ab.ts
import { createHash } from "crypto";
import { weightsForMix, type ScoreWeights } from "../discovery/score";

/** Stable 0..99 bucket from userId (or cookie) */
export function bucketOf(key: string): number {
  const h = createHash("sha1").update(String(key || "anon")).digest("hex");
  // take first 8 hex chars → int
  const n = parseInt(h.slice(0, 8), 16);
  return Math.abs(n) % 100;
}

/** Map bucket → variant label */
export function pickVariant(userKey: string | null): "A" | "B" {
  const b = bucketOf(userKey || "anon");
  return b < 50 ? "A" : "B"; // 50/50 split
}

/** Optionally tweak weights by variant (kept minimal for safety) */
export function weightsForVariant(mix: "trending" | "personalized" | "blended", variant: "A" | "B"): ScoreWeights {
  const base = weightsForMix(mix);
  if (variant === "B") {
    // Slightly favor velocity & reactions in B
    return {
      ...base,
      velocity: base.velocity * 1.1,
      reactions: base.reactions * 1.1,
    };
  }
  return base;
}

/** Minimal request logger: top5 + weights (replace with your telemetry sink) */
export function logDiscoveryTop5(ctx: {
  mix: string;
  variant: string;
  userId: string | null;
  weights: ScoreWeights;
  items: Array<{ id: string; title: string; score: number }>;
}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        evt: "discovery_top5",
        mix: ctx.mix,
        variant: ctx.variant,
        userId: ctx.userId ? "u" : "anon",
        weights: ctx.weights,
        items: ctx.items.slice(0, 5),
        ts: new Date().toISOString(),
      },
      null,
      0
    )
  );
}
