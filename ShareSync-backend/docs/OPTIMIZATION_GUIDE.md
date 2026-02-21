cat > docs/OPTIMIZATION_GUIDE.md << 'EOF'
# ShareSync Optimization Guide

## Overview

This guide covers all performance optimizations implemented in ShareSync backend.

---

## 1. Database Indexing

### Creating Indexes

Run the index creation script:
```bash
node scripts/create-indexes.js
```

Or set environment variable to auto-create on startup:
```bash
CREATE_INDEXES=true npm start
```

### Indexes Created

**Users:**
- email (unique)
- username (unique)
- gamification.totalXP (desc) - for leaderboards
- gamification.level (desc)
- gamification.currentStreak (desc)
- Text search: username, firstName, lastName, email

**Projects:**
- owner
- members.user
- status
- privacy
- createdAt (desc)
- updatedAt (desc)
- Compound: owner + status
- Compound: owner + createdAt
- Text search: title, description

**Focus Sessions:**
- userId
- userId + startTime (desc)
- status
- status + userId
- projectId + startTime (desc)

**Messages:**
- projectId
- sender
- projectId + createdAt (desc)
- Text search: content

### Query Performance Tips

1. **Always use indexed fields in filters:**
```javascript
   // Good
   User.find({ email: 'user@example.com' })
   
   // Bad (no index)
   User.find({ age: 25 })
```

2. **Use compound indexes for common queries:**
```javascript
   // Good (uses owner + status index)
   Project.find({ owner: userId, status: 'Active' })
```

3. **Limit fields with .select():**
```javascript
   // Good
   User.find({}).select('username profilePicture')
   
   // Bad (loads all fields)
   User.find({})
```

---

## 2. Rate Limiting

### Configured Limits

- **General API:** 100 requests / 15 minutes
- **Authentication:** 5 requests / 15 minutes
- **File Uploads:** 10 uploads / hour
- **Search:** 50 requests / minute
- **Notifications:** 20 requests / minute

### Customizing Limits

Edit `middleware/rateLimiter.js`:
```javascript
const customLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Custom rate limit exceeded',
});
```

### Bypassing Rate Limits (Development)

Set environment variable:
```bash
DISABLE_RATE_LIMIT=true npm start
```

---

## 3. Query Optimization

### Use Lean Queries

For read-only operations:
```javascript
const { leanQuery } = require('./utils/queryOptimizer');

// Returns plain JavaScript objects (faster)
const users = await leanQuery(User.find({}));
```

### Pagination
```javascript
const { paginateQuery } = require('./utils/queryOptimizer');

const users = await paginateQuery(
  User.find({}),
  page,
  limit
);
```

### Selective Population
```javascript
const { optimizedPopulate } = require('./utils/queryOptimizer');

const projects = await optimizedPopulate(
  Project.find({}),
  'owner',
  'members'
);
```

### Batch Operations
```javascript
const { batchUpdate } = require('./utils/queryOptimizer');

await batchUpdate(User, [
  { id: userId1, data: { level: 5 } },
  { id: userId2, data: { level: 6 } },
]);
```

---

## 4. Caching (Redis - Optional)

### Setup Redis

1. Install Redis:
```bash
# Mac
brew install redis

# Ubuntu
sudo apt-get install redis-server
```

2. Start Redis:
```bash
redis-server
```

3. Install npm package:
```bash
npm install redis
```

4. Configure in .env:
```
REDIS_URL=redis://localhost:6379
```

5. Uncomment code in `utils/cache.js`

### Using Cache
```javascript
const cache = require('./utils/cache');

// Initialize
await cache.initRedis();

// Get from cache
let data = await cache.get('user:123');

if (!data) {
  // Cache miss - fetch from database
  data = await User.findById('123');
  
  // Store in cache for 1 hour
  await cache.set('user:123', data, 3600);
}
```

### Cache Invalidation
```javascript
// Delete specific key
await cache.del('user:123');

// Clear all cache
await cache.flush();
```

### Recommended Cache Keys

Use the pre-defined cache key generators:
```javascript
const { cacheKeys } = require('./utils/queryOptimizer');

await cache.set(cacheKeys.user(userId), userData);
await cache.set(cacheKeys.leaderboard('weekly'), leaderboardData);
```

---

## 5. Performance Monitoring

### Request Timing

All requests are automatically timed. Slow requests are logged:

- **Warning:** Requests > 1 second
- **Error:** Requests > 3 seconds

### Memory Monitoring
```javascript
const { logMemoryUsage } = require('./middleware/performanceMonitor');

// Log current memory usage
logMemoryUsage();
```

### Performance Metrics
```javascript
const { getPerformanceMetrics } = require('./middleware/performanceMonitor');

const metrics = getPerformanceMetrics();
// Returns: { uptime, memory, cpu }
```

### Health Check Endpoint
```
GET /health
```

Returns server health status and metrics.

---

## 6. Error Monitoring (Sentry - Optional)

### Setup Sentry

1. Sign up at [sentry.io](https://sentry.io)

2. Create a new Node.js project

3. Install package:
```bash
npm install @sentry/node
```

4. Add to .env:
```
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

5. Uncomment code in `utils/errorMonitoring.js`

6. Update server.js:
```javascript
const { initSentry, sentryErrorHandler } = require('./utils/errorMonitoring');

// Initialize (must be first)
initSentry(app);

// Error handler (must be last)
app.use(sentryErrorHandler());
```

### Manual Error Tracking
```javascript
const { captureError, captureMessage } = require('./utils/errorMonitoring');

try {
  // Your code
} catch (error) {
  captureError(error, { userId, context: 'payment' });
}

// Log important events
captureMessage('User upgraded to premium', 'info');
```

---

## 7. Production Optimizations

### Environment Variables

Create `.env.production`:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://production-host/sharesync
FRONTEND_URL=https://sharesync.app
REDIS_URL=redis://production-redis:6379
SENTRY_DSN=https://your-dsn@sentry.io/project
CREATE_INDEXES=false
```

### Compression

Automatically enabled for all responses. Reduces bandwidth by ~70%.

### Security Headers (Helmet)

Automatically adds security headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (HTTPS)

### Payload Limits

Maximum request size: 10MB

### Process Management

Use PM2 for production:
```bash
npm install -g pm2

# Start
pm2 start server.js --name sharesync

# Monitor
pm2 monit

# Logs
pm2 logs sharesync

# Restart
pm2 restart sharesync
```

---

## 8. Performance Checklist

- [ ] Database indexes created
- [ ] Rate limiting enabled
- [ ] Queries using .lean() where possible
- [ ] Selective field loading with .select()
- [ ] Pagination implemented
- [ ] Redis caching enabled (optional)
- [ ] Sentry error monitoring enabled (optional)
- [ ] Compression enabled
- [ ] Security headers enabled
- [ ] PM2 process manager configured
- [ ] Health check endpoint working
- [ ] Slow query logging active

---

## 9. Monitoring in Production

### Key Metrics to Track

1. **Response Time:** Average < 200ms
2. **Error Rate:** < 0.1%
3. **Memory Usage:** Stable, no leaks
4. **CPU Usage:** < 70% average
5. **Database Connections:** Stable pool
6. **Cache Hit Rate:** > 80% (if using Redis)

### Tools

- **Sentry:** Error tracking
- **PM2:** Process monitoring
- **MongoDB Atlas:** Database monitoring
- **Redis Commander:** Cache monitoring
- **New Relic / DataDog:** APM (optional)

---

## 10. Troubleshooting

### Slow Queries

1. Check if indexes exist:
```javascript
db.users.getIndexes()
```

2. Explain query performance:
```javascript
User.find({}).explain('executionStats')
```

3. Add missing indexes

### High Memory Usage

1. Check for memory leaks:
```bash
pm2 monit
```

2. Limit query results:
```javascript
.limit(100)
```

3. Use .lean() for read-only queries

### Rate Limit Issues

1. Check current limits in `middleware/rateLimiter.js`

2. Adjust limits for specific routes

3. Implement IP whitelisting for trusted clients

EOF

echo "✅ Optimization guide created!"