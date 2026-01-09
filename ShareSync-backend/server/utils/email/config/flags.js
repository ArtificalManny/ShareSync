"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLAGS = exports.DISCOVERY_ENABLED = exports.DEFAULT_DISCOVERY_WEIGHTS = exports.DISCOVERY_MAX_LIMIT = void 0;
const toNumber = (v, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};
const toBool = (v, def = false) => /^(1|true|on|yes)$/i.test(String(v !== null && v !== void 0 ? v : (def ? "1" : "0")));
exports.DISCOVERY_MAX_LIMIT = toNumber(process.env.DISCOVERY_MAX_LIMIT, 50);
exports.DEFAULT_DISCOVERY_WEIGHTS = {
    velocity: toNumber(process.env.W_VELOCITY, 2),
    xpGrowth: toNumber(process.env.W_XP_GROWTH, 1.5),
    reactions: toNumber(process.env.W_REACTIONS, 0.5),
    transparency: toNumber(process.env.W_TRANSPARENCY, 1),
    inactivityPenaltyPer24h: toNumber(process.env.W_INACTIVITY_PENALTY_24H, 3),
};
exports.DISCOVERY_ENABLED = toBool(process.env.DISCOVERY_ENABLED, true);
exports.FLAGS = {
    DISCOVERY_ENABLED: exports.DISCOVERY_ENABLED,
    DISCOVERY_MAX_LIMIT: exports.DISCOVERY_MAX_LIMIT,
    DEFAULT_DISCOVERY_WEIGHTS: exports.DEFAULT_DISCOVERY_WEIGHTS,
};
exports.default = exports.FLAGS;
//# sourceMappingURL=flags.js.map