// server/utils/email/cache/redis.ts
import IORedis from "ioredis";

let client: IORedis | null = null;

export function getRedis(): IORedis | null {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  if (!url) return null;
  client = new IORedis(url, {
    // If you use Upstash REST or require auth, supply proper options here
    // password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  return client;
}

export async function redisGet<T = any>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  const v = await r.get(key);
  return v ? (JSON.parse(v) as T) : null;
}

export async function redisSet(
  key: string,
  value: any,
  ttlSec: number
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(key, JSON.stringify(value), "EX", ttlSec);
}

export async function redisDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(key);
}
