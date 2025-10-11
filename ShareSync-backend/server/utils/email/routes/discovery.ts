// server/utils/email/routes/discovery.ts
// Express route: maps query params → queryDiscoveryMongo / queryDiscoveryMongoNative → JSON response.

import { Router, Request, Response } from "express";
import { queryDiscoveryMongo, queryDiscoveryMongoNative } from "../discovery/queryMongo";
import { parseLimit, parseTimeRange } from "../discovery/score";

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

      const result = useNative
        ? await queryDiscoveryMongoNative((req.app as any).locals.db, {
            limit: parseLimit(limit),
            cursor: cursor ? String(cursor) : null,
            timeRangeDays,
            personalized: String(personalized).toLowerCase() === "true" && !!userId,
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

      res.json(result);
    } catch (err: any) {
      console.error("[/api/discovery] error:", err);
      res.status(500).json({ error: "Failed to build discovery feed." });
    }
  }
);

export default router;