import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * Simple in-memory rate limit guard (MVP-safe).
 *
 * ✅ No external dependencies
 * ✅ No data model changes
 * ✅ Works for polling endpoints like /api/discovery
 *
 * Notes:
 * - In-memory means per-instance. If you scale horizontally, use Redis-based throttling.
 * - Intended as a light safety net, not a perfect abuse-prevention system.
 */

type Bucket = {
  count: number;
  resetAt: number; // epoch ms
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  // key -> bucket
  private static buckets = new Map<string, Bucket>();

  // Default: 60 requests per 60 seconds per key
  private readonly windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  private readonly maxRequests = Number(process.env.RATE_LIMIT_MAX || 60);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const now = Date.now();

    const key = this.buildKey(req);

    const bucket = RateLimitGuard.buckets.get(key);

    // New bucket
    if (!bucket || bucket.resetAt <= now) {
      RateLimitGuard.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      this.maybeCleanup(now);
      return true;
    }

    // Existing bucket
    bucket.count += 1;

    if (bucket.count > this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

      // Optional: expose retry-after on the response
      try {
        const res = context.switchToHttp().getResponse();
        res?.setHeader?.('Retry-After', String(retryAfterSeconds));
      } catch {
        // ignore
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ~${retryAfterSeconds}s.`,
          error: 'Too Many Requests',
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildKey(req: any): string {
    // Prefer authenticated user, else fall back to IP.
    const userId = req?.user?.sub || req?.user?.id || req?.user?.userId;

    // Express / Nest usually sets req.ip; fallback to x-forwarded-for if behind proxy.
    const ip =
      req?.ip ||
      req?.headers?.['x-forwarded-for']?.split?.(',')?.[0]?.trim?.() ||
      req?.connection?.remoteAddress ||
      'unknown';

    // Partition by route so other endpoints aren’t affected if reused.
    const path = req?.route?.path || req?.path || 'unknown-path';

    return userId ? `u:${userId}|p:${path}` : `ip:${ip}|p:${path}`;
  }

  private maybeCleanup(now: number) {
    // Lightweight cleanup occasionally to avoid unbounded growth (1% chance per request)
    if (Math.random() > 0.01) return;

    for (const [k, b] of RateLimitGuard.buckets.entries()) {
      if (b.resetAt <= now) RateLimitGuard.buckets.delete(k);
    }
  }
}
