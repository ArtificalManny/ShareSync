// src/utils/insightGenerator.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Insight Generator
// ═══════════════════════════════════════════════════════════════════════════════
//
// Generates AI-like insights from user's weekly activity data.
// Analyzes patterns in:
// - Task completion times
// - Peak productivity hours
// - Category preferences
// - Collaboration patterns
// - Streak performance
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Insight types for categorization
 */
export const INSIGHT_TYPES = {
  PRODUCTIVITY: 'productivity',
  TIME: 'time',
  COLLABORATION: 'collaboration',
  STREAK: 'streak',
  CATEGORY: 'category',
  IMPROVEMENT: 'improvement',
  CELEBRATION: 'celebration',
};

/**
 * Insight priorities
 */
export const INSIGHT_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Generate insights from weekly data
 * 
 * @param {object} weeklyData - The user's weekly activity data
 * @returns {array} Array of insight objects
 */
export function generateInsights(weeklyData) {
  const insights = [];
  
  const {
    tasksCompleted = [],
    focusSessions = [],
    streak = { current: 0, longest: 0 },
    collaborations = [],
    previousWeek = null,
  } = weeklyData;

  // Analyze task completion patterns
  insights.push(...analyzeTaskPatterns(tasksCompleted, previousWeek));
  
  // Analyze peak hours
  insights.push(...analyzePeakHours(tasksCompleted, focusSessions));
  
  // Analyze categories
  insights.push(...analyzeCategories(tasksCompleted));
  
  // Analyze collaborations
  insights.push(...analyzeCollaborations(collaborations));
  
  // Analyze streak
  insights.push(...analyzeStreak(streak));
  
  // Analyze focus sessions
  insights.push(...analyzeFocusSessions(focusSessions));

  // Sort by priority and limit
  return insights
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 8); // Max 8 insights
}

/**
 * Analyze task completion patterns
 */
function analyzeTaskPatterns(tasks, previousWeek) {
  const insights = [];
  const totalTasks = tasks.length;
  
  if (totalTasks === 0) {
    insights.push({
      id: 'no-tasks',
      type: INSIGHT_TYPES.IMPROVEMENT,
      priority: INSIGHT_PRIORITY.HIGH,
      emoji: '🎯',
      title: 'Fresh Start Ahead',
      message: "No tasks shipped this week. Every expert was once a beginner - let's start small!",
      tip: 'Try shipping just one small task tomorrow to build momentum.',
      metric: null,
    });
    return insights;
  }

  // Compare to previous week
  if (previousWeek) {
    const prevTotal = previousWeek.tasksCompleted?.length || 0;
    const diff = totalTasks - prevTotal;
    const percentChange = prevTotal > 0 ? Math.round((diff / prevTotal) * 100) : 100;
    
    if (diff > 0) {
      insights.push({
        id: 'week-improvement',
        type: INSIGHT_TYPES.CELEBRATION,
        priority: INSIGHT_PRIORITY.HIGH,
        emoji: '��',
        title: 'Momentum Building!',
        message: `You shipped ${totalTasks} tasks this week - ${Math.abs(percentChange)}% more than last week!`,
        tip: 'Keep this energy going. Consistency compounds.',
        metric: { value: `+${diff}`, label: 'vs last week' },
      });
    } else if (diff < 0 && Math.abs(percentChange) > 20) {
      insights.push({
        id: 'week-dip',
        type: INSIGHT_TYPES.IMPROVEMENT,
        priority: INSIGHT_PRIORITY.MEDIUM,
        emoji: '💪',
        title: 'Slight Dip Detected',
        message: `${totalTasks} tasks this week vs ${prevTotal} last week. Fluctuations are normal!`,
        tip: 'Consider what made last week strong and replicate those conditions.',
        metric: { value: `${diff}`, label: 'vs last week' },
      });
    }
  }

  // Analyze task completion speed
  const tasksWithDuration = tasks.filter(t => t.createdAt && t.completedAt);
  if (tasksWithDuration.length >= 3) {
    const avgHours = tasksWithDuration.reduce((sum, t) => {
      const created = new Date(t.createdAt);
      const completed = new Date(t.completedAt);
      return sum + (completed - created) / (1000 * 60 * 60);
    }, 0) / tasksWithDuration.length;

    if (avgHours < 24) {
      insights.push({
        id: 'fast-shipper',
        type: INSIGHT_TYPES.PRODUCTIVITY,
        priority: INSIGHT_PRIORITY.MEDIUM,
        emoji: '⚡',
        title: 'Speed Demon',
        message: `Average task completion: ${avgHours < 1 ? 'under an hour' : `${Math.round(avgHours)} hours`}. You don't let things linger!`,
        tip: 'Your bias toward action is a superpower. Keep shipping.',
        metric: { value: avgHours < 1 ? '<1h' : `${Math.round(avgHours)}h`, label: 'avg completion' },
      });
    }
  }

  return insights;
}

/**
 * Analyze peak productivity hours
 */
function analyzePeakHours(tasks, focusSessions) {
  const insights = [];
  const hourCounts = new Array(24).fill(0);
  
  // Count completions by hour
  tasks.forEach(task => {
    if (task.completedAt) {
      const hour = new Date(task.completedAt).getHours();
      hourCounts[hour]++;
    }
  });

  // Add focus session hours
  focusSessions.forEach(session => {
    if (session.completedAt) {
      const hour = new Date(session.completedAt).getHours();
      hourCounts[hour] += 2; // Weight focus sessions more
    }
  });

  // Find peak hours (top 3)
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (peakHours.length > 0) {
    const topHour = peakHours[0].hour;
    const timeLabel = formatHourRange(topHour);
    const period = getPeriodName(topHour);

    insights.push({
      id: 'peak-hours',
      type: INSIGHT_TYPES.TIME,
      priority: INSIGHT_PRIORITY.HIGH,
      emoji: period.emoji,
      title: `${period.name} Peak`,
      message: `Your most productive hours are ${timeLabel}. You shipped ${peakHours[0].count} tasks during this window.`,
      tip: `Protect your ${timeLabel} slot - schedule deep work here.`,
      metric: { value: timeLabel, label: 'peak time' },
      data: { peakHours: peakHours.map(h => h.hour) },
    });
  }

  // Day of week analysis
  const dayCounts = new Array(7).fill(0);
  tasks.forEach(task => {
    if (task.completedAt) {
      const day = new Date(task.completedAt).getDay();
      dayCounts[day]++;
    }
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
  const peakDayCount = dayCounts[peakDay];

  if (peakDayCount >= 3) {
    insights.push({
      id: 'peak-day',
      type: INSIGHT_TYPES.TIME,
      priority: INSIGHT_PRIORITY.MEDIUM,
      emoji: peakDay === 0 || peakDay === 6 ? '🏠' : '💼',
      title: `${days[peakDay]} Warrior`,
      message: `${days[peakDay]}s are your power day - ${peakDayCount} tasks shipped!`,
      tip: peakDay === 1 ? 'Strong Monday = strong week.' : `Stack important work on ${days[peakDay]}s.`,
      metric: { value: days[peakDay].slice(0, 3), label: 'best day' },
    });
  }

  return insights;
}

/**
 * Analyze task categories
 */
function analyzeCategories(tasks) {
  const insights = [];
  const categories = {};

  tasks.forEach(task => {
    const cat = task.category || task.type || 'general';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0) {
    const [topCategory, topCount] = sortedCategories[0];
    const percentage = Math.round((topCount / tasks.length) * 100);

    if (percentage >= 40) {
      insights.push({
        id: 'top-category',
        type: INSIGHT_TYPES.CATEGORY,
        priority: INSIGHT_PRIORITY.MEDIUM,
        emoji: getCategoryEmoji(topCategory),
        title: `${capitalize(topCategory)} Specialist`,
        message: `${percentage}% of your work was ${topCategory} tasks. You're building deep expertise here.`,
        tip: sortedCategories.length > 2 
          ? 'Consider diversifying to stay well-rounded.' 
          : 'Specialization is powerful. Keep sharpening this skill.',
        metric: { value: `${percentage}%`, label: topCategory },
        data: { categories: Object.fromEntries(sortedCategories) },
      });
    }
  }

  return insights;
}

/**
 * Analyze collaboration patterns
 */
function analyzeCollaborations(collaborations) {
  const insights = [];
  
  if (collaborations.length === 0) return insights;

  // Find most frequent collaborator
  const collaboratorCounts = {};
  collaborations.forEach(collab => {
    const name = collab.partnerName || collab.partner;
    if (name) {
      collaboratorCounts[name] = (collaboratorCounts[name] || 0) + 1;
    }
  });

  const topCollaborator = Object.entries(collaboratorCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (topCollaborator && topCollaborator[1] >= 2) {
    insights.push({
      id: 'top-collaborator',
      type: INSIGHT_TYPES.COLLABORATION,
      priority: INSIGHT_PRIORITY.MEDIUM,
      emoji: '🤝',
      title: 'Dynamic Duo',
      message: `You and ${topCollaborator[0]} worked together ${topCollaborator[1]} times this week.`,
      tip: 'Great partnerships accelerate growth. Nurture this connection.',
      metric: { value: topCollaborator[1], label: 'co-works' },
    });
  }

  // Co-work productivity boost
  const avgTasksWithCollab = collaborations.length > 0 
    ? collaborations.reduce((sum, c) => sum + (c.tasksCompleted || 0), 0) / collaborations.length
    : 0;

  if (avgTasksWithCollab >= 2) {
    insights.push({
      id: 'cowork-boost',
      type: INSIGHT_TYPES.COLLABORATION,
      priority: INSIGHT_PRIORITY.LOW,
      emoji: '🚀',
      title: 'Co-Work Power',
      message: `You average ${avgTasksWithCollab.toFixed(1)} tasks per co-work session. Teamwork makes the dream work!`,
      tip: 'Schedule regular co-work sessions to maintain this boost.',
      metric: { value: avgTasksWithCollab.toFixed(1), label: 'tasks/session' },
    });
  }

  return insights;
}

/**
 * Analyze streak performance
 */
function analyzeStreak(streak) {
  const insights = [];
  const { current = 0, longest = 0, startDate } = streak;

  if (current >= 7) {
    insights.push({
      id: 'streak-strong',
      type: INSIGHT_TYPES.STREAK,
      priority: INSIGHT_PRIORITY.HIGH,
      emoji: current >= 30 ? '��' : '⚡',
      title: current >= 30 ? 'Legendary Streak!' : 'Streak on Fire!',
      message: `${current} day streak and counting! You've shipped every single day.`,
      tip: current >= 30 
        ? "You're in the top 1% of consistent shippers. Incredible." 
        : 'Every day you ship, you become harder to beat.',
      metric: { value: `${current}d`, label: 'streak' },
    });
  } else if (current >= 3) {
    insights.push({
      id: 'streak-building',
      type: INSIGHT_TYPES.STREAK,
      priority: INSIGHT_PRIORITY.MEDIUM,
      emoji: '🌱',
      title: 'Streak Growing',
      message: `${current} day streak! You're building momentum.`,
      tip: `${7 - current} more days to hit a full week. You got this!`,
      metric: { value: `${current}d`, label: 'streak' },
    });
  } else if (current === 0 && longest > 0) {
    insights.push({
      id: 'streak-restart',
      type: INSIGHT_TYPES.STREAK,
      priority: INSIGHT_PRIORITY.MEDIUM,
      emoji: '🔄',
      title: 'Fresh Start',
      message: `Your streak reset, but your ${longest}-day record stands. Time to beat it!`,
      tip: 'Ship one small task today to start rebuilding.',
      metric: { value: `${longest}d`, label: 'record' },
    });
  }

  return insights;
}

/**
 * Analyze focus sessions
 */
function analyzeFocusSessions(sessions) {
  const insights = [];
  
  if (sessions.length === 0) return insights;

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 25), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  const avgSession = Math.round(totalMinutes / sessions.length);

  if (sessions.length >= 5) {
    insights.push({
      id: 'focus-master',
      type: INSIGHT_TYPES.PRODUCTIVITY,
      priority: INSIGHT_PRIORITY.MEDIUM,
      emoji: '🎯',
      title: 'Focus Master',
      message: `${sessions.length} focus sessions totaling ${totalHours} hours of deep work.`,
      tip: avgSession >= 40 
        ? 'Your long focus sessions show serious discipline.' 
        : 'Consider extending sessions to 45 min for deeper work.',
      metric: { value: `${totalHours}h`, label: 'deep work' },
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function formatHourRange(hour) {
  const start = hour;
  const end = (hour + 2) % 24;
  const format = h => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}${period}`;
  };
  return `${format(start)}-${format(end)}`;
}

function getPeriodName(hour) {
  if (hour >= 5 && hour < 12) return { name: 'Morning', emoji: '🌅' };
  if (hour >= 12 && hour < 17) return { name: 'Afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 21) return { name: 'Evening', emoji: '🌆' };
  return { name: 'Night', emoji: '🌙' };
}

function getCategoryEmoji(category) {
  const emojis = {
    development: '💻',
    dev: '💻',
    code: '💻',
    design: '🎨',
    ui: '🎨',
    ux: '🎨',
    marketing: '📣',
    writing: '✍️',
    content: '✍️',
    meeting: '👥',
    meetings: '👥',
    planning: '📋',
    research: '🔬',
    bug: '🐛',
    bugfix: '🐛',
    feature: '✨',
    security: '🔒',
    testing: '🧪',
    ops: '⚙️',
    devops: '⚙️',
    general: '📌',
  };
  return emojis[category.toLowerCase()] || '📌';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a weekly summary message
 */
export function generateWeeklySummary(weeklyData) {
  const {
    tasksCompleted = [],
    focusSessions = [],
    streak = { current: 0 },
  } = weeklyData;

  const totalTasks = tasksCompleted.length;
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 25), 0);
  const focusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;

  if (totalTasks === 0) {
    return {
      headline: "A Fresh Week Awaits",
      subtext: "Every accomplishment starts with the decision to try.",
      grade: 'C',
    };
  }

  if (totalTasks >= 20 && streak.current >= 7) {
    return {
      headline: "Absolutely Crushing It! ��",
      subtext: `${totalTasks} ships, ${streak.current}d streak, ${focusHours}h focused. You're unstoppable.`,
      grade: 'A+',
    };
  }

  if (totalTasks >= 15) {
    return {
      headline: "Outstanding Week! ⭐",
      subtext: `${totalTasks} tasks shipped with ${focusHours}h of deep work. Impressive output.`,
      grade: 'A',
    };
  }

  if (totalTasks >= 10) {
    return {
      headline: "Solid Progress 💪",
      subtext: `${totalTasks} ships this week. You're building real momentum.`,
      grade: 'B+',
    };
  }

  if (totalTasks >= 5) {
    return {
      headline: "Moving Forward 📈",
      subtext: `${totalTasks} tasks done. Every ship counts toward your goals.`,
      grade: 'B',
    };
  }

  return {
    headline: "Getting Started 🌱",
    subtext: `${totalTasks} tasks shipped. Small wins add up - keep going!`,
    grade: 'B-',
  };
}

export default {
  generateInsights,
  generateWeeklySummary,
  INSIGHT_TYPES,
  INSIGHT_PRIORITY,
};
