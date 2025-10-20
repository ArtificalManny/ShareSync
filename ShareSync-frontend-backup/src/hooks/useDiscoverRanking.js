import { useMemo } from "react";

/**
 * useDiscoverRanking
 * Ranks public items by freshness + reactions (with decay) + lightweight quality.
 *
 * Args:
 *  - items: Array<{ id, title, ts, reactions?: { clap, like, fire }, followers?: number }>
 *  - options?: {
 *      halfLifeHours?: number,         // freshness decay
 *      weights?: { freshness: number, reactions: number, follow: number },
 *      reactionWeights?: { clap: number, like: number, fire: number }
 *    }
 *
 * Returns:
 *  { ranked, scoreOf(id), explainOf(id) }
 */
export default function useDiscoverRanking(items = [], options = {}) {
  const {
    halfLifeHours = 24,
    weights = { freshness: 0.6, reactions: 0.3, follow: 0.1 },
    reactionWeights = { clap: 1.0, like: 0.8, fire: 1.2 },
  } = options;

  const now = Date.now();
  const decayK = Math.log(2) / (halfLifeHours * 60 * 60 * 1000);

  const scored = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list
      .map((it) => {
        const ts = toTime(it.ts || it.updatedAt || it.createdAt) || (now - 12 * 60 * 60 * 1000);
        const age = Math.max(0, now - ts);
        const fresh = Math.exp(-decayK * age); // 1 now, halves each half-life

        const r = it.reactions || {};
        const reacts =
          (r.clap || 0) * reactionWeights.clap +
          (r.like || 0) * reactionWeights.like +
          (r.fire || 0) * reactionWeights.fire;

        // normalize reactions with log to avoid runaway
        const reactScore = Math.log2(1 + reacts);

        // small network signal
        const followScore = Math.log2(1 + (it.followers || 0)) / 6;

        const score =
          weights.freshness * fresh +
          weights.reactions * reactScore +
          weights.follow * followScore;

        return {
          ...it,
          _score: score,
          _explain: {
            freshness: fresh,
            reactions: reactScore,
            follow: followScore,
            weights,
          },
        };
      })
      .sort((a, b) => b._score - a._score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), halfLifeHours, weights.freshness, weights.reactions, weights.follow, reactionWeights.clap, reactionWeights.like, reactionWeights.fire]);

  const map = useMemo(() => {
    const m = new Map();
    for (const it of scored) m.set(it.id || it._id, it);
    return m;
  }, [scored]);

  const scoreOf = (id) => map.get(id)?._score ?? 0;
  const explainOf = (id) => map.get(id)?._explain ?? null;

  return { ranked: scored, scoreOf, explainOf };
}

function toTime(x) { const t = x ? new Date(x).getTime() : NaN; return Number.isFinite(t) ? t : null; }
