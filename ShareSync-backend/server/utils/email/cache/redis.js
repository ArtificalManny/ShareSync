"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.redisGet = redisGet;
exports.redisSet = redisSet;
exports.redisDel = redisDel;
const ioredis_1 = __importDefault(require("ioredis"));
let client = null;
function getRedis() {
    if (client)
        return client;
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || "";
    if (!url)
        return null;
    client = new ioredis_1.default(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
    });
    return client;
}
async function redisGet(key) {
    const r = getRedis();
    if (!r)
        return null;
    const v = await r.get(key);
    return v ? JSON.parse(v) : null;
}
async function redisSet(key, value, ttlSec) {
    const r = getRedis();
    if (!r)
        return;
    await r.set(key, JSON.stringify(value), "EX", ttlSec);
}
async function redisDel(key) {
    const r = getRedis();
    if (!r)
        return;
    await r.del(key);
}
//# sourceMappingURL=redis.js.map