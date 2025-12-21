/**
 * performanceMonitor.js
 * Monitor API performance and log slow requests
 */

/**
 * Request timing middleware
 */
function requestTimer(req, res, next) {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (>1 second)
    if (duration > 1000) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log very slow requests (>3 seconds)
    if (duration > 3000) {
      console.error(`�� VERY SLOW REQUEST: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
}

/**
 * Database query monitor
 */
function monitorDatabaseQueries(mongoose) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    const start = Date.now();
    
    console.log(`📊 DB Query: ${collectionName}.${method}`, {
      query: JSON.stringify(query),
      duration: `${Date.now() - start}ms`,
    });
  });
}

/**
 * Memory usage monitor
 */
function logMemoryUsage() {
  const used = process.memoryUsage();
  
  console.log('💾 Memory Usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
  });
}

/**
 * Performance summary
 */
function getPerformanceMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
}

module.exports = {
  requestTimer,
  monitorDatabaseQueries,
  logMemoryUsage,
  getPerformanceMetrics,
};
