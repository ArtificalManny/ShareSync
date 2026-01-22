// src/utils/timeUtils.js
// ═══════════════════════════════════════════════════════════════════════════════
// TIME UTILITIES - Formatting, calculations, and date manipulation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format seconds into MM:SS or HH:MM:SS
 * @param {number} seconds - Total seconds
 * @param {boolean} showHours - Force showing hours even if 0
 * @returns {string} Formatted time string
 */
export function formatTime(seconds, showHours = false) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  
  const absSeconds = Math.abs(Math.floor(seconds));
  const hours = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  
  const pad = (n) => String(n).padStart(2, '0');
  
  if (hours > 0 || showHours) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Format minutes into human-readable duration
 * @param {number} minutes - Total minutes
 * @returns {string} Human-readable duration (e.g., "2h 30m")
 */
export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '0m';
  
  const absMinutes = Math.abs(Math.floor(minutes));
  
  if (absMinutes < 60) {
    return `${absMinutes}m`;
  }
  
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format a duration in a compact way
 * @param {number} minutes - Total minutes
 * @returns {string} Compact duration (e.g., "2.5h" or "45m")
 */
export function formatDurationCompact(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '0m';
  
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = minutes / 60;
  if (hours < 10) {
    return `${hours.toFixed(1)}h`;
  }
  return `${Math.round(hours)}h`;
}

/**
 * Format hour into 12-hour format with AM/PM
 * @param {number} hour - Hour (0-23)
 * @returns {string} Formatted hour (e.g., "9AM", "2PM")
 */
export function formatHour(hour) {
  if (typeof hour !== 'number' || hour < 0 || hour > 23) return '';
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${period}`;
}

/**
 * Format hour range
 * @param {number} startHour - Start hour (0-23)
 * @param {number} endHour - End hour (0-23), defaults to startHour + 2
 * @returns {string} Formatted range (e.g., "9AM-11AM")
 */
export function formatHourRange(startHour, endHour) {
  const end = endHour ?? (startHour + 2) % 24;
  return `${formatHour(startHour)}-${formatHour(end)}`;
}

/**
 * Get time period name from hour
 * @param {number} hour - Hour (0-23)
 * @returns {object} Period info { name, emoji, color }
 */
export function getTimePeriod(hour) {
  if (hour >= 5 && hour < 12) {
    return { name: 'Morning', emoji: '🌅', color: 'warning' };
  }
  if (hour >= 12 && hour < 17) {
    return { name: 'Afternoon', emoji: '☀️', color: 'brand' };
  }
  if (hour >= 17 && hour < 21) {
    return { name: 'Evening', emoji: '🌆', color: 'accent' };
  }
  return { name: 'Night', emoji: '🌙', color: 'info' };
}

/**
 * Calculate peak hours from activity data
 * @param {Array} activities - Array of objects with timestamp/completedAt
 * @param {string} timestampKey - Key to use for timestamp (default: 'completedAt')
 * @returns {object} Peak hours analysis
 */
export function calculatePeakHours(activities, timestampKey = 'completedAt') {
  const hourCounts = new Array(24).fill(0);
  
  activities.forEach(activity => {
    const timestamp = activity[timestampKey];
    if (timestamp) {
      const hour = new Date(timestamp).getHours();
      hourCounts[hour]++;
    }
  });
  
  // Find peak hours (top 3)
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Calculate period totals
  const periods = [
    { name: 'Morning', hours: [6, 7, 8, 9, 10, 11], emoji: '🌅' },
    { name: 'Afternoon', hours: [12, 13, 14, 15, 16, 17], emoji: '☀️' },
    { name: 'Evening', hours: [18, 19, 20, 21], emoji: '🌆' },
    { name: 'Night', hours: [22, 23, 0, 1, 2, 3, 4, 5], emoji: '🌙' },
  ];
  
  const periodTotals = periods.map(period => ({
    ...period,
    total: period.hours.reduce((sum, h) => sum + hourCounts[h], 0),
  }));
  
  const topPeriod = [...periodTotals].sort((a, b) => b.total - a.total)[0];
  
  return {
    hourCounts,
    peakHours,
    periodTotals,
    topPeriod,
    totalActivities: activities.length,
  };
}

/**
 * Calculate day of week distribution
 * @param {Array} activities - Array of objects with timestamp
 * @param {string} timestampKey - Key to use for timestamp
 * @returns {object} Day distribution analysis
 */
export function calculateDayDistribution(activities, timestampKey = 'completedAt') {
  const dayCounts = new Array(7).fill(0);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  activities.forEach(activity => {
    const timestamp = activity[timestampKey];
    if (timestamp) {
      const day = new Date(timestamp).getDay();
      dayCounts[day]++;
    }
  });
  
  const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  
  return {
    dayCounts,
    dayNames,
    shortDayNames,
    peakDay: {
      index: peakDayIndex,
      name: dayNames[peakDayIndex],
      shortName: shortDayNames[peakDayIndex],
      count: dayCounts[peakDayIndex],
    },
  };
}

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Get short relative time (more compact)
 * @param {Date|string|number} date - The date to format
 * @returns {string} Short relative time string
 */
export function getShortRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

/**
 * Check if a date is today
 * @param {Date|string|number} date - The date to check
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/**
 * Check if a date is yesterday
 * @param {Date|string|number} date - The date to check
 * @returns {boolean}
 */
export function isYesterday(date) {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

/**
 * Check if a date is within this week
 * @param {Date|string|number} date - The date to check
 * @returns {boolean}
 */
export function isThisWeek(date) {
  const d = new Date(date);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

/**
 * Get week boundaries (Monday to Sunday)
 * @param {Date} referenceDate - Reference date (defaults to now)
 * @returns {object} { start, end } dates
 */
export function getWeekBoundaries(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const dayOfWeek = d.getDay();
  
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

/**
 * Format date range string
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} Formatted range (e.g., "Jan 15 - Jan 21")
 */
export function formatDateRange(start, end) {
  const format = (date) => date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  return `${format(start)} - ${format(end)}`;
}

/**
 * Get greeting based on time of day
 * @returns {string} Appropriate greeting
 */
export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/**
 * Calculate average completion time for tasks
 * @param {Array} tasks - Array of tasks with createdAt and completedAt
 * @returns {object} Average time stats
 */
export function calculateAvgCompletionTime(tasks) {
  const tasksWithTime = tasks.filter(t => t.createdAt && t.completedAt);
  
  if (tasksWithTime.length === 0) {
    return { avgHours: 0, avgDays: 0, count: 0 };
  }
  
  const totalMs = tasksWithTime.reduce((sum, t) => {
    const created = new Date(t.createdAt);
    const completed = new Date(t.completedAt);
    return sum + (completed - created);
  }, 0);
  
  const avgMs = totalMs / tasksWithTime.length;
  const avgHours = avgMs / (1000 * 60 * 60);
  const avgDays = avgHours / 24;
  
  return {
    avgHours: Math.round(avgHours * 10) / 10,
    avgDays: Math.round(avgDays * 10) / 10,
    count: tasksWithTime.length,
  };
}

export default {
  formatTime,
  formatDuration,
  formatDurationCompact,
  formatHour,
  formatHourRange,
  getTimePeriod,
  calculatePeakHours,
  calculateDayDistribution,
  getRelativeTime,
  getShortRelativeTime,
  isToday,
  isYesterday,
  isThisWeek,
  getWeekBoundaries,
  formatDateRange,
  getTimeGreeting,
  calculateAvgCompletionTime,
};
