import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const CacheKeys = {
  // User-related
  USER: (id: string) => `user:${id}`,
  USER_STATS: (id: string) => `user:${id}:stats`,
  USER_PROJECTS: (id: string) => `user:${id}:projects`,

  // Project-related
  PROJECT: (id: string) => `project:${id}`,
  PROJECT_MEMBERS: (id: string) => `project:${id}:members`,
  PROJECT_TASKS: (id: string) => `project:${id}:tasks`,

  // Task-related
  TASK: (id: string) => `task:${id}`,

  // Leaderboard
  LEADERBOARD: (type: string, projectId?: string) =>
    projectId ? `leaderboard:${type}:${projectId}` : `leaderboard:${type}`,

  // Analytics
  ANALYTICS_PROJECT: (id: string, type: string) => `analytics:${id}:${type}`,
  ANALYTICS_USER: (id: string, type: string) => `analytics:user:${id}:${type}`,

  // Sessions
  SESSION: (token: string) => `session:${token}`,

  // Rate limiting
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
};

export const CacheTTL = {
  SHORT: 30,        // 30s
  MEDIUM: 300,      // 5m
  LONG: 3600,       // 1h
  DAY: 86400,       // 24h
};

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cache.get<T>(key);
      return value === null ? undefined : value;
    } catch (error: any) {
      this.logger.warn(`Cache get error for key ${key}: ${error?.message || error}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.cache.set(key, value, ttlSeconds * 1000);
      } else {
        await this.cache.set(key, value);
      }
    } catch (error: any) {
      this.logger.warn(`Cache set error for key ${key}: ${error?.message || error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error: any) {
      this.logger.warn(`Cache delete error for key ${key}: ${error?.message || error}`);
    }
  }

  async reset(): Promise<void> {
    try {
      // not all cache stores implement reset; cache-manager does for memory store
      // @ts-ignore
      if (typeof (this.cache as any).reset === 'function') {
        // @ts-ignore
        await (this.cache as any).reset();
      }
    } catch (error: any) {
      this.logger.warn(`Cache reset error: ${error?.message || error}`);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.delete(CacheKeys.USER(userId)),
      this.delete(CacheKeys.USER_STATS(userId)),
      this.delete(CacheKeys.USER_PROJECTS(userId)),
    ]);
  }

  async invalidateProjectCache(projectId: string): Promise<void> {
    await Promise.all([
      this.delete(CacheKeys.PROJECT(projectId)),
      this.delete(CacheKeys.PROJECT_MEMBERS(projectId)),
      this.delete(CacheKeys.PROJECT_TASKS(projectId)),
    ]);
  }

  async invalidateTaskCache(taskId: string, projectId: string): Promise<void> {
    await Promise.all([
      this.delete(CacheKeys.TASK(taskId)),
      this.delete(CacheKeys.PROJECT_TASKS(projectId)),
    ]);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const cacheKey = CacheKeys.RATE_LIMIT(key);
    const current = await this.get<{ count: number; resetAt: number }>(cacheKey);
    const now = Date.now();

    if (!current || now > current.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      await this.set(cacheKey, { count: 1, resetAt }, windowSeconds);
      return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt) };
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: new Date(current.resetAt) };
    }

    const next = { count: current.count + 1, resetAt: current.resetAt };
    const ttl = Math.ceil((current.resetAt - now) / 1000);
    await this.set(cacheKey, next, ttl);

    return { allowed: true, remaining: Math.max(0, limit - next.count), resetAt: new Date(next.resetAt) };
  }

  async getStats(): Promise<{ keys?: number; hits?: number; misses?: number }> {
    // memory store doesn't expose consistent stats — keep as placeholder
    return {};
  }
}
