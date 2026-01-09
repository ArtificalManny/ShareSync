"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queryMongo_1 = require("../discovery/queryMongo");
const score_1 = require("../discovery/score");
const redis_1 = require("../cache/redis");
const ab_1 = require("../config/ab");
const router = (0, express_1.Router)();
router.get("/discovery", async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const { cursor = null, limit = 20, mix = "blended", personalized = "true", timeRange = "7d", onlyTransparent = "false", followingBoost = "false", } = req.query;
        const rangeMap = { "7d": 7, "30d": 30, "90d": 90 };
        const timeRangeDays = (_a = rangeMap[String(timeRange)]) !== null && _a !== void 0 ? _a : 7;
        const userId = (_c = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b._id) !== null && _c !== void 0 ? _c : null;
        const useNative = Boolean((_e = (_d = req.app) === null || _d === void 0 ? void 0 : _d.locals) === null || _e === void 0 ? void 0 : _e.db);
        const variant = (0, ab_1.pickVariant)(userId);
        res.setHeader("x-discovery-variant", variant);
        const wantsPersonal = String(personalized).toLowerCase() === "true" && !!userId;
        const cacheKey = (() => {
            const k = {
                u: userId || "anon",
                mix: String(mix || "blended").toLowerCase(),
                range: String(timeRange || "7d").toLowerCase(),
                onlyT: String(onlyTransparent).toLowerCase() === "true" ? "1" : "0",
                cursor: cursor ? String(cursor) : "first",
                var: variant,
            };
            return `discovery:${k.u}:${k.mix}:${k.range}:${k.onlyT}:${k.cursor}:${k.var}`;
        })();
        const TTL_PERSONALIZED = 30;
        if (wantsPersonal) {
            const cached = await (0, redis_1.redisGet)(cacheKey);
            if (cached) {
                res.setHeader("Cache-Control", "private, max-age=0, s-maxage=0");
                return res.json(cached);
            }
        }
        const result = useNative
            ? await (0, queryMongo_1.queryDiscoveryMongoNative)(req.app.locals.db, {
                limit: (0, score_1.parseLimit)(limit),
                cursor: cursor ? String(cursor) : null,
                timeRangeDays,
                personalized: String(personalized).toLowerCase() === "true" && !!userId,
                userId,
                onlyTransparent: String(onlyTransparent).toLowerCase() === "true",
            })
            : await (0, queryMongo_1.queryDiscoveryMongo)({
                cursor: cursor ? String(cursor) : null,
                limit: (0, score_1.parseLimit)(limit),
                mix: String(mix) || "blended",
                personalized: String(personalized).toLowerCase() === "true",
                timeRange: (0, score_1.parseTimeRange)(timeRange),
                onlyTransparent: String(onlyTransparent).toLowerCase() === "true",
                followingBoost: String(followingBoost).toLowerCase() === "true",
                userId,
            });
        const isTrending = String(mix).toLowerCase() === "trending";
        const isPersonalized = String(personalized).toLowerCase() === "true" && !!userId;
        if (isTrending && !isPersonalized) {
            res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=60");
        }
        else {
            res.setHeader("Cache-Control", "private, max-age=0, no-store");
        }
        const baseWeights = (0, score_1.weightsForMix)(mix || "blended");
        const abWeights = (0, ab_1.weightsForVariant)(mix || "blended", variant);
        const top5 = ((result === null || result === void 0 ? void 0 : result.items) || [])
            .slice(0, 5)
            .map((x) => ({ id: x.id, title: x.title, score: x.score }));
        (0, ab_1.logDiscoveryTop5)({
            mix: String(mix),
            variant,
            userId,
            weights: abWeights,
            items: top5,
        });
        if (wantsPersonal) {
            await (0, redis_1.redisSet)(cacheKey, result, TTL_PERSONALIZED);
        }
        res.json(result);
    }
    catch (err) {
        console.error("[/api/discovery] error:", err);
        res.status(500).json({ error: "Failed to build discovery feed." });
    }
});
exports.default = router;
//# sourceMappingURL=discovery.js.map