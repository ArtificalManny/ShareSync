/**
 * search.js
 * Search and filter utility functions
 */

// ============================================
// TEXT SEARCH
// ============================================

/**
 * Create text search query for MongoDB
 */
function createTextSearchQuery(searchTerm) {
  if (!searchTerm) return {};
  
  // Escape special regex characters
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Case-insensitive search
  return { $regex: escapedTerm, $options: 'i' };
}

/**
 * Search in multiple fields
 */
function createMultiFieldSearch(searchTerm, fields) {
  if (!searchTerm || !fields || fields.length === 0) return {};
  
  const searchQuery = createTextSearchQuery(searchTerm);
  
  return {
    $or: fields.map(field => ({ [field]: searchQuery }))
  };
}

// ============================================
// DATE FILTERS
// ============================================

/**
 * Create date range filter
 */
function createDateRangeFilter(field, startDate, endDate) {
  const filter = {};
  
  if (startDate || endDate) {
    filter[field] = {};
    
    if (startDate) {
      filter[field].$gte = new Date(startDate);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      filter[field].$lte = end;
    }
  }
  
  return filter;
}

/**
 * Parse date shortcuts (today, yesterday, this-week, etc.)
 */
function parseDateShortcut(shortcut) {
  const now = new Date();
  
  switch (shortcut) {
    case 'today':
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      return { start: todayStart, end: todayEnd };
      
    case 'yesterday':
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(now.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start: yesterdayStart, end: yesterdayEnd };
      
    case 'this-week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end: now };
      
    case 'last-week':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return { start: lastWeekStart, end: lastWeekEnd };
      
    case 'this-month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
      
    case 'last-30-days':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return { start: thirtyDaysAgo, end: now };
      
    default:
      return null;
  }
}

// ============================================
// PAGINATION
// ============================================

/**
 * Create pagination parameters
 */
function createPagination(page = 1, limit = 20) {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
  
  return {
    skip: (parsedPage - 1) * parsedLimit,
    limit: parsedLimit,
    page: parsedPage,
  };
}

/**
 * Create pagination response metadata
 */
function createPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ============================================
// SORTING
// ============================================

/**
 * Parse sort parameter
 */
function parseSort(sortParam, defaultSort = { createdAt: -1 }) {
  if (!sortParam) return defaultSort;
  
  const sortObj = {};
  
  // Format: "field:order" or "-field" for desc
  if (sortParam.startsWith('-')) {
    const field = sortParam.substring(1);
    sortObj[field] = -1;
  } else if (sortParam.includes(':')) {
    const [field, order] = sortParam.split(':');
    sortObj[field] = order === 'asc' ? 1 : -1;
  } else {
    sortObj[sortParam] = 1;
  }
  
  return sortObj;
}

// ============================================
// FILTER BUILDERS
// ============================================

/**
 * Build task filter query
 */
function buildTaskFilter(filters) {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.assignee) {
    query.assignee = filters.assignee;
  }
  
  if (filters.completed !== undefined) {
    query.completed = filters.completed === 'true' || filters.completed === true;
  }
  
  if (filters.effort) {
    query.effort = filters.effort;
  }
  
  // Date filters
  if (filters.dueBefore || filters.dueAfter) {
    Object.assign(query, createDateRangeFilter('dueDate', filters.dueAfter, filters.dueBefore));
  }
  
  if (filters.createdBefore || filters.createdAfter) {
    Object.assign(query, createDateRangeFilter('createdAt', filters.createdAfter, filters.createdBefore));
  }
  
  return query;
}

/**
 * Build message filter query
 */
function buildMessageFilter(filters) {
  const query = {};
  
  if (filters.sender) {
    query.sender = filters.sender;
  }
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  // Date range
  if (filters.before || filters.after || filters.date) {
    if (filters.date) {
      const dateRange = parseDateShortcut(filters.date);
      if (dateRange) {
        Object.assign(query, createDateRangeFilter('createdAt', dateRange.start, dateRange.end));
      }
    } else {
      Object.assign(query, createDateRangeFilter('createdAt', filters.after, filters.before));
    }
  }
  
  return query;
}

/**
 * Build project filter query
 */
function buildProjectFilter(filters) {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.privacy) {
    query.privacy = filters.privacy;
  }
  
  if (filters.owner) {
    query.owner = filters.owner;
  }
  
  return query;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createTextSearchQuery,
  createMultiFieldSearch,
  createDateRangeFilter,
  parseDateShortcut,
  createPagination,
  createPaginationMeta,
  parseSort,
  buildTaskFilter,
  buildMessageFilter,
  buildProjectFilter,
};
