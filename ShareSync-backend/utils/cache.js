/**
 * cache.js
 * Redis caching layer (optional)
 */

/**
 * To enable Redis caching:
 * 1. Install Redis: brew install redis (Mac) or apt-get install redis (Linux)
 * 2. npm install redis
 * 3. Start Redis: redis-server
 * 4. Set REDIS_URL in .env
 * 5. Uncomment code below
 */

/*
const redis = require('redis');

let client;

async function initRedis() {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => console.log('✅ Redis connected'));
    
    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  }
}

async function get(key) {
  if (!client) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function set(key, value, ttl = 3600) {
  if (!client) return false;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

async function del(key) {
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis del error:', error);
    return false;
  }
}

async function flush() {
  if (!client) return false;
  try {
    await client.flushAll();
    return true;
  } catch (error) {
    console.error('Redis flush error:', error);
    return false;
  }
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  flush,
};
*/

// Placeholder functions when Redis is not configured
module.exports = {
  initRedis: async () => console.log('⚠️  Redis not configured'),
  get: async () => null,
  set: async () => false,
  del: async () => false,
  flush: async () => false,
};