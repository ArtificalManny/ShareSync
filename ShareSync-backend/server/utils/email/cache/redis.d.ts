import IORedis from "ioredis";
export declare function getRedis(): IORedis | null;
export declare function redisGet<T = any>(key: string): Promise<T | null>;
export declare function redisSet(key: string, value: any, ttlSec: number): Promise<void>;
export declare function redisDel(key: string): Promise<void>;
