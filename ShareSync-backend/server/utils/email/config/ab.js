"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucketOf = bucketOf;
exports.pickVariant = pickVariant;
exports.weightsForVariant = weightsForVariant;
exports.logDiscoveryTop5 = logDiscoveryTop5;
const crypto_1 = require("crypto");
const score_1 = require("../discovery/score");
function bucketOf(key) {
    const h = (0, crypto_1.createHash)("sha1").update(String(key || "anon")).digest("hex");
    const n = parseInt(h.slice(0, 8), 16);
    return Math.abs(n) % 100;
}
function pickVariant(userKey) {
    const b = bucketOf(userKey || "anon");
    return b < 50 ? "A" : "B";
}
function weightsForVariant(mix, variant) {
    const base = (0, score_1.weightsForMix)(mix);
    if (variant === "B") {
        return Object.assign(Object.assign({}, base), { velocity: base.velocity * 1.1, reactions: base.reactions * 1.1 });
    }
    return base;
}
function logDiscoveryTop5(ctx) {
    console.log(JSON.stringify({
        evt: "discovery_top5",
        mix: ctx.mix,
        variant: ctx.variant,
        userId: ctx.userId ? "u" : "anon",
        weights: ctx.weights,
        items: ctx.items.slice(0, 5),
        ts: new Date().toISOString(),
    }, null, 0));
}
//# sourceMappingURL=ab.js.map