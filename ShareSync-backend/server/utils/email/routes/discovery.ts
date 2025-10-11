// server/utils/email/routes/discovery.ts
// Express route: maps query params → queryDiscoveryMongo / queryDiscoveryMongoNative → JSON response.

import { Router, Request, Response } from "express";
import {
  queryDiscoveryMongo,
  queryDiscoveryMongoNative,
} from "../discovery/queryMongo";
import { parseLimit, parseTimeRange, weightsForMix } from "../discovery/score";
import { redisGet, redisSet } from "../cache/redis"; // Redis helpers for short-lived personalized cache
import { pickVariant, weightsForVariant, logDiscoveryTop5 } from "../config/ab";

// If you have an auth middleware, you can import and enable it later:
// import { requireAuthOptional } from "../middleware/auth";

const router = Router();

router.get(
  "/discovery",
  /* requireAuthOptional, */ // uncomment if/when your middleware exists
  async (req: Request, res: Response) => {
    try {
      const {
        cursor = null,
        limit = 20,
        mix = "blended",
        personalized = "true",
        timeRange = "7d",
        onlyTransparent = "false",
        followingBoost = "false",
      } = req.query;

      // Map "7d|30d|90d" to days when using the native driver path
      const rangeMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
      const timeRangeDays = rangeMap[String(timeRange)] ?? 7;

      // If you have auth mounted elsewhere, it may set req.user; otherwise this stays null
      const userId: string | null = (req as any)?.user?._id ?? null;

      // Prefer native driver if available via app.locals.db (id-cursor style)
      const useNative = Boolean((req.app as any)?.locals?.db);

      // ---------------------------
      // A/B: pick variant (stable on userId or 'anon')
      // ---------------------------
      const variant = pickVariant(userId);
      res.setHeader("x-discovery-variant", variant);

      // ---------------------------
      // Personalized Redis caching
      // ---------------------------
      const wantsPersonal =
        String(personalized).toLowerCase() === "true" && !!userId;

      // Build a stable cache key per user + mix + range + transparency + cursor
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

      const TTL_PERSONALIZED = 30; // seconds

      if (wantsPersonal) {
        const cached = await redisGet<any>(cacheKey);
        if (cached) {
          res.setHeader("Cache-Control", "private, max-age=0, s-maxage=0");
          return res.json(cached);
        }
      }

      // ---------------------------
      // Fetch (native or mongoose)
      // ---------------------------
      const result = useNative
        ? await queryDiscoveryMongoNative((req.app as any).locals.db, {
            limit: parseLimit(limit),
            cursor: cursor ? String(cursor) : null,
            timeRangeDays,
            personalized:
              String(personalized).toLowerCase() === "true" && !!userId,
            userId,
            onlyTransparent: String(onlyTransparent).toLowerCase() === "true",
          })
        : await queryDiscoveryMongo({
            cursor: cursor ? String(cursor) : null,
            limit: parseLimit(limit),
            mix: (String(mix) as any) || "blended",
            personalized: String(personalized).toLowerCase() === "true",
            timeRange: parseTimeRange(timeRange),
            onlyTransparent: String(onlyTransparent).toLowerCase() === "true",
            followingBoost: String(followingBoost).toLowerCase() === "true",
            userId,
          });

      // ---------------------------------------
      // Edge cache headers (for public trending)
      // ---------------------------------------
      const isTrending = String(mix).toLowerCase() === "trending";
      const isPersonalized =
        String(personalized).toLowerCase() === "true" && !!userId;

      if (isTrending && !isPersonalized) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=60, s-maxage=120, stale-while-revalidate=60"
        );
      } else {
        res.setHeader("Cache-Control", "private, max-age=0, no-store");
      }

      // ---------------------------
      // A/B logging: top 5 + weights
      // ---------------------------
      // Use the same base weights as the scorer uses for the requested mix,
      // then apply a tiny variant nudge (doesn't change the list this time;
      // we log it so you can later choose to pass it into scoring if desired).
      const baseWeights = weightsForMix((mix as any) || "blended");
      const abWeights = weightsForVariant((mix as any) || "blended", variant);

      // Minimal top5 projection for logs
      const top5 = (result?.items || [])
        .slice(0, 5)
        .map((x) => ({ id: x.id, title: x.title, score: x.score }));

      logDiscoveryTop5({
        mix: String(mix),
        variant,
        userId,
        weights: abWeights,
        items: top5,
      });

      // WRITE personalized results into Redis (short TTL)
      if (wantsPersonal) {
        await redisSet(cacheKey, result, TTL_PERSONALIZED);
      }

      res.json(result);
    } catch (err: any) {
      console.error("[/api/discovery] error:", err);
      res.status(500).json({ error: "Failed to build discovery feed." });
    }
  }
);

export default router;