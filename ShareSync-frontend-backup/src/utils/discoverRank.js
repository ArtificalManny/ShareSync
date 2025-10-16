// /src/utils/discoverRank.js
const DAY = 24 * 60 * 60 * 1000;

export function normalizeArray(values = []) {
  const arr = Array.isArray(values) ? values : [];
  const nums = arr.map((v) => Number(v ?? 0));
  if (nums.length === 0) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (!isFinite(min) || !isFinite(max)) return nums.map(() => 0);
  if (max === min) return nums.map((v) => (v == null ? 0 : 0.5));
  const span = max - min;
  return nums.map((v) => (v - min) / span);
}

function getVelocity30d(p) {
  return (
    p?.velocity_30d ??
    p?.velocity30d ??
    p?.stats?.velocity_30d ??
    p?.stats?.velocity30d ??
    p?.stats?.throughputPerWeek?.value ??
    0
  );
}
function getReactions14d(p) {
  return (
    p?.reactions_14d ??
    p?.reactions14d ??
    p?.stats?.reactions_14d ??
    p?.stats?.reactions14d ??
    p?.stats?.reactions?.last14 ??
    p?.reactionsLast14 ??
    0
  );
}
function getFreshnessTs(p) {
  return (
    (p?.lastActivityAt && Date.parse(p.lastActivityAt)) ||
    (p?.updatedAt && Date.parse(p.updatedAt)) ||
    (p?.stats?.lastActivityAt && Date.parse(p.stats.lastActivityAt)) ||
    (p?.createdAt && Date.parse(p.createdAt)) ||
    0
  );
}

function computeScoreParts(projects, { w1 = 0.6, w2 = 0.3, freshness = 0.1 } = {}) {
  const list = Array.isArray(projects) ? projects : [];
  const vVals = list.map(getVelocity30d);
  const rVals = list.map(getReactions14d);
  const vNorm = normalizeArray(vVals);
  const rNorm = normalizeArray(rVals);

  const now = Date.now();
  const HALF_LIFE_DAYS = 7;
  const k = Math.log(2) / (HALF_LIFE_DAYS * DAY);

  return list.map((p, i) => {
    const v = Number.isFinite(vNorm[i]) ? vNorm[i] : 0;
    const r = Number.isFinite(rNorm[i]) ? rNorm[i] : 0;
    const ts = getFreshnessTs(p);
    const ageMs = Math.max(0, now - (ts || 0));
    const freshnessBoost = Math.max(0, freshness) * Math.exp(-k * ageMs);
    const score = v * w1 + r * w2 + freshnessBoost;

    return {
      project: p,
      score,
      parts: { velocityNorm: v, reactionsNorm: r, freshnessBoost },
      weights: { w1, w2, freshness },
    };
  });
}

export function rankProjects(projects = [], opts = {}) {
  const list = Array.isArray(projects) ? projects.slice() : [];
  if (list.length === 0) return list;

  const scored = computeScoreParts(list, opts)
    .map((row) => ({
      ...row.project,
      __rank: {
        score: row.score,
        parts: row.parts,
        weights: row.weights,
        reason:
          `score = ${row.parts.velocityNorm.toFixed(2)}*w1 + ` +
          `${row.parts.reactionsNorm.toFixed(2)}*w2 + ` +
          `${row.parts.freshnessBoost.toFixed(2)} (freshness)`,
      },
    }))
    .sort((a, b) => (b.__rank?.score || 0) - (a.__rank?.score || 0));

  return scored;
}

export function explainRank(projectOrRanked) {
  const r = projectOrRanked?.__rank;
  return (
    r || {
      score: 0,
      parts: { velocityNorm: 0, reactionsNorm: 0, freshnessBoost: 0 },
      weights: { w1: 0.6, w2: 0.3, freshness: 0.1 },
      reason: "unranked",
    }
  );
}

export default { rankProjects, explainRank, normalizeArray };
