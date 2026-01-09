"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_WEIGHTS = void 0;
exports.inactivityPenalty = inactivityPenalty;
exports.scoreProject = scoreProject;
exports.weightsForMix = weightsForMix;
exports.parseLimit = parseLimit;
exports.parseTimeRange = parseTimeRange;
exports.windowStart = windowStart;
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
const flags_1 = require("../config/flags");
exports.DEFAULT_WEIGHTS = flags_1.DEFAULT_DISCOVERY_WEIGHTS;
function inactivityPenalty(inactivityHours, penaltyPer24h) {
    if (!isFinite(inactivityHours) || inactivityHours <= 0)
        return 0;
    const periods = inactivityHours / 24;
    return -1 * periods * penaltyPer24h;
}
function scoreProject(s, weights = exports.DEFAULT_WEIGHTS) {
    const base = s.velocityPerWeek * weights.velocity +
        s.xpGrowth * weights.xpGrowth +
        s.reactions * weights.reactions +
        s.transparency * weights.transparency;
    const penalty = inactivityPenalty(s.inactivityHours, weights.inactivityPenaltyPer24h);
    const inactivityDays = s.inactivityHours / 24;
    const freshnessBoost = Math.max(0, 1 - Math.min(1, inactivityDays));
    const boosted = base + penalty + 0.75 * freshnessBoost;
    return boosted;
}
function weightsForMix(mix) {
    const W = exports.DEFAULT_WEIGHTS;
    switch (mix) {
        case "trending":
            return Object.assign(Object.assign({}, W), { reactions: Math.max(W.reactions, 0.8), xpGrowth: Math.max(W.xpGrowth, 1.2) });
        case "personalized":
            return Object.assign(Object.assign({}, W), { velocity: Math.max(W.velocity, 1.6), xpGrowth: Math.max(W.xpGrowth, 1.8) });
        case "blended":
        default:
            return W;
    }
}
function parseLimit(raw, fallback = 20, max = 50) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0)
        return fallback;
    return Math.min(n, max);
}
function parseTimeRange(raw) {
    const v = String(raw || "7d").toLowerCase();
    return ["7d", "30d", "90d"].includes(v) ? v : "7d";
}
function windowStart(key) {
    const now = new Date();
    const d = new Date(now);
    if (key === "7d")
        d.setDate(now.getDate() - 7);
    else if (key === "30d")
        d.setDate(now.getDate() - 30);
    else if (key === "90d")
        d.setDate(now.getDate() - 90);
    return d;
}
function encodeCursor(c) {
    return Buffer.from(JSON.stringify(c)).toString("base64url");
}
function decodeCursor(raw) {
    if (!raw)
        return null;
    try {
        const obj = JSON.parse(Buffer.from(String(raw), "base64url").toString("utf8"));
        if (typeof (obj === null || obj === void 0 ? void 0 : obj.score) === "number" && (obj === null || obj === void 0 ? void 0 : obj.lastActivity) && (obj === null || obj === void 0 ? void 0 : obj.id))
            return obj;
        return null;
    }
    catch (_a) {
        return null;
    }
}
//# sourceMappingURL=score.js.map