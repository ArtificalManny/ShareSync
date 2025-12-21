/**
 * queryOptimizer.js
 * Query optimization utilities
 */

// ============================================
// PAGINATION HELPERS
// ============================================

/**
 * Create optimized pagination query
 */
function paginateQuery(query, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return query
    .skip(skip)
    .limit(Math.min(limit, 100)); // Max 100 per page
}

/**
 * Get total count efficiently (without loading docs)
 */
async function getTotalCount(Model, filter = {}) {
  return await Model.countDocuments(filter);
}

// ============================================
// SELECTIVE FIELD LOADING
// ============================================

/**
 * Common field selections for different models
 */
const fieldSelections = {
  user: {
    minimal: 'username profilePicture',
    basic: 'username firstName lastName profilePicture email',
    stats: 'username gamification.level gamification.totalXP gamification.currentStreak',
  },
  project: {
    minimal: 'title status',
    basic: 'title description status privacy createdAt',
    full: 'title description status privacy createdAt progress owner members',
  },
  task: {
    minimal: 'title status',
    basic: 'title description status assignee dueDate',
  },
};

/**
 * Select only needed fields
 */
function selectFields(query, model, selection = 'basic') {
  const fields = fieldSelections[model]?.[selection];
  if (fields) {
    return query.select(fields);
  }
  return query;
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Batch update multiple documents
 */
async function batchUpdate(Model, updates) {
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { _id: update.id },
      update: { $set: update.data },
    },
  }));
  
  return await Model.bulkWrite(bulkOps);
}

/**
 * Batch create multiple documents
 */
async function batchCreate(Model, documents) {
  return await Model.insertMany(documents, { ordered: false });
}

// ============================================
// LEAN QUERIES (NO MONGOOSE OVERHEAD)
// ============================================

/**
 * Execute lean query for read-only operations
 */
function leanQuery(query) {
  return query.lean();
}

// ============================================
// POPULATE OPTIMIZATION
// ============================================

/**
 * Optimized populate for common scenarios
 */
const populateOptions = {
  user: {
    path: 'user',
    select: 'username profilePicture',
  },
  owner: {
    path: 'owner',
    select: 'username profilePicture email',
  },
  members: {
    path: 'members.user',
    select: 'username profilePicture',
  },
  author: {
    path: 'author',
    select: 'username profilePicture',
  },
};

/**
 * Apply optimized populate
 */
function optimizedPopulate(query, ...populations) {
  populations.forEach(pop => {
    const options = populateOptions[pop];
    if (options) {
      query = query.populate(options);
    }
  });
  return query;
}

// ============================================
// CACHE KEYS
// ============================================

/**
 * Generate cache keys for common queries
 */
const cacheKeys = {
  user: (userId) => `user:${userId}`,
  userStats: (userId) => `user:${userId}:stats`,
  project: (projectId) => `project:${projectId}`,
  projectMembers: (projectId) => `project:${projectId}:members`,
  leaderboard: (period) => `leaderboard:${period}`,
  analytics: (userId, days) => `analytics:${userId}:${days}`,
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  paginateQuery,
  getTotalCount,
  selectFields,
  fieldSelections,
  batchUpdate,
  batchCreate,
  leanQuery,
  optimizedPopulate,
  populateOptions,
  cacheKeys,
};
