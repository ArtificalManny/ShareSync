// src/utils/contributionScore.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Fairness & Contribution Engine - Scoring Algorithm
// ═══════════════════════════════════════════════════════════════════════════════
//
// CONTRIBUTION SCORE FORMULA:
// score = (tasksCompleted × 10) + (shipsParticipated × 25) + 
//         (unblockingComments × 5) + (fireModeMinutes × 0.5) + 
//         (codeReviewsCompleted × 15)
//
// This weights:
// 1. Ships (25pts) - Highest value, driving completion
// 2. Code Reviews (15pts) - High value, quality gates
// 3. Tasks (10pts) - Core work units
// 4. Unblocking (5pts) - Team collaboration
// 5. Fire Mode (0.5pts/min) - Sustained focus
//
// ═══════════════════════════════════════════════════════════════════════════════

// Score weights (can be configured per org)
export const CONTRIBUTION_WEIGHTS = {
  tasksCompleted: 10,
  shipsParticipated: 25,
  unblockingComments: 5,
  fireModeMinutes: 0.5,
  codeReviewsCompleted: 15,
};

/**
 * Calculate contribution score for a single member
 * 
 * @param {Object} metrics - Member's activity metrics
 * @param {number} metrics.tasksCompleted - Number of tasks completed
 * @param {number} metrics.shipsParticipated - Number of ships participated in
 * @param {number} metrics.unblockingComments - Comments that unblocked others
 * @param {number} metrics.fireModeMinutes - Minutes spent in fire mode
 * @param {number} metrics.codeReviewsCompleted - Code reviews completed
 * @param {Object} customWeights - Optional custom weights
 * @returns {number} Total contribution score
 */
export function calculateContributionScore(metrics, customWeights = CONTRIBUTION_WEIGHTS) {
  const {
    tasksCompleted = 0,
    shipsParticipated = 0,
    unblockingComments = 0,
    fireModeMinutes = 0,
    codeReviewsCompleted = 0,
  } = metrics;

  return (
    (tasksCompleted * customWeights.tasksCompleted) +
    (shipsParticipated * customWeights.shipsParticipated) +
    (unblockingComments * customWeights.unblockingComments) +
    (fireModeMinutes * customWeights.fireModeMinutes) +
    (codeReviewsCompleted * customWeights.codeReviewsCompleted)
  );
}

/**
 * Calculate contribution breakdown (score by category)
 * 
 * @param {Object} metrics 
 * @param {Object} customWeights 
 * @returns {Object} Score breakdown by category
 */
export function calculateContributionBreakdown(metrics, customWeights = CONTRIBUTION_WEIGHTS) {
  const {
    tasksCompleted = 0,
    shipsParticipated = 0,
    unblockingComments = 0,
    fireModeMinutes = 0,
    codeReviewsCompleted = 0,
  } = metrics;

  const breakdown = {
    tasks: tasksCompleted * customWeights.tasksCompleted,
    ships: shipsParticipated * customWeights.shipsParticipated,
    unblocking: unblockingComments * customWeights.unblockingComments,
    fireMode: fireModeMinutes * customWeights.fireModeMinutes,
    codeReviews: codeReviewsCompleted * customWeights.codeReviewsCompleted,
  };

  breakdown.total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return breakdown;
}

/**
 * Calculate team contribution percentages
 * 
 * @param {Array<Object>} members - Array of member objects with metrics
 * @returns {Array<Object>} Members with calculated scores and percentages
 */
export function calculateTeamContributions(members) {
  if (!members || members.length === 0) {
    return [];
  }

  // Calculate scores for each member
  const membersWithScores = members.map(member => ({
    ...member,
    score: calculateContributionScore(member.metrics || {}),
    breakdown: calculateContributionBreakdown(member.metrics || {}),
  }));

  // Calculate total team score
  const totalScore = membersWithScores.reduce((sum, m) => sum + m.score, 0);

  // Calculate percentages
  return membersWithScores.map(member => ({
    ...member,
    percentage: totalScore > 0 ? Math.round((member.score / totalScore) * 100) : 0,
  })).sort((a, b) => b.score - a.score); // Sort by score descending
}

/**
 * Detect team balance issues (skew)
 * 
 * @param {Array<Object>} contributions - Array with percentage field
 * @param {Object} thresholds - Warning thresholds
 * @returns {Object} Skew analysis
 */
export function detectSkew(contributions, thresholds = { warning: 40, critical: 60 }) {
  if (!contributions || contributions.length === 0) {
    return { isSkewed: false, level: 'balanced', warnings: [] };
  }

  const warnings = [];
  let maxPercentage = 0;
  let heavyLifter = null;
  let minContributors = [];

  contributions.forEach(member => {
    if (member.percentage > maxPercentage) {
      maxPercentage = member.percentage;
      heavyLifter = member;
    }
    if (member.percentage < 10) {
      minContributors.push(member);
    }
  });

  // Check for heavy lifter
  if (maxPercentage >= thresholds.critical) {
    warnings.push({
      type: 'critical_imbalance',
      severity: 'critical',
      message: `${heavyLifter?.name || 'One member'} is carrying ${maxPercentage}% of the workload`,
      member: heavyLifter,
      suggestion: 'Consider redistributing tasks to prevent burnout',
    });
  } else if (maxPercentage >= thresholds.warning) {
    warnings.push({
      type: 'imbalance',
      severity: 'warning',
      message: `Load skewed toward ${heavyLifter?.name || 'one member'} (${maxPercentage}%)`,
      member: heavyLifter,
      suggestion: 'Review task distribution for better balance',
    });
  }

  // Check for low contributors
  if (minContributors.length > 0 && contributions.length > 2) {
    minContributors.forEach(member => {
      warnings.push({
        type: 'low_contribution',
        severity: 'info',
        message: `${member.name} has contributed ${member.percentage}%`,
        member,
        suggestion: 'Consider assigning more tasks or checking in on blockers',
      });
    });
  }

  // Calculate entropy score (0 = one person does everything, 1 = perfectly balanced)
  const entropyScore = calculateEntropyScore(contributions);

  return {
    isSkewed: maxPercentage >= thresholds.warning,
    level: maxPercentage >= thresholds.critical ? 'critical' : 
           maxPercentage >= thresholds.warning ? 'skewed' : 'balanced',
    maxPercentage,
    heavyLifter,
    minContributors,
    warnings,
    entropyScore,
  };
}

/**
 * Calculate entropy score (distribution evenness)
 * 0 = one person does everything
 * 1 = perfectly even distribution
 * 
 * @param {Array<Object>} contributions 
 * @returns {number} Entropy score 0-1
 */
export function calculateEntropyScore(contributions) {
  if (!contributions || contributions.length <= 1) return 1;

  const n = contributions.length;
  const idealPercentage = 100 / n;

  // Calculate mean absolute deviation from ideal
  const totalDeviation = contributions.reduce((sum, member) => {
    return sum + Math.abs(member.percentage - idealPercentage);
  }, 0);

  // Maximum possible deviation (one person has 100%)
  const maxDeviation = (100 - idealPercentage) + (idealPercentage * (n - 1));

  // Convert to 0-1 scale (higher = more balanced)
  return Math.max(0, 1 - (totalDeviation / maxDeviation));
}

/**
 * Generate fairness report for a project
 * 
 * @param {Object} projectData - Project with members and their metrics
 * @returns {Object} Comprehensive fairness report
 */
export function generateFairnessReport(projectData) {
  const { members, project, timeframe } = projectData;

  const contributions = calculateTeamContributions(members);
  const skewAnalysis = detectSkew(contributions);

  // Calculate category leaders
  const categoryLeaders = {
    mostTasks: [...contributions].sort((a, b) => 
      (b.breakdown?.tasks || 0) - (a.breakdown?.tasks || 0)
    )[0],
    mostShips: [...contributions].sort((a, b) => 
      (b.breakdown?.ships || 0) - (a.breakdown?.ships || 0)
    )[0],
    mostUnblocking: [...contributions].sort((a, b) => 
      (b.breakdown?.unblocking || 0) - (a.breakdown?.unblocking || 0)
    )[0],
    mostFocus: [...contributions].sort((a, b) => 
      (b.breakdown?.fireMode || 0) - (a.breakdown?.fireMode || 0)
    )[0],
    mostReviews: [...contributions].sort((a, b) => 
      (b.breakdown?.codeReviews || 0) - (a.breakdown?.codeReviews || 0)
    )[0],
  };

  // Calculate team totals
  const teamTotals = contributions.reduce((totals, member) => ({
    tasks: totals.tasks + (member.metrics?.tasksCompleted || 0),
    ships: totals.ships + (member.metrics?.shipsParticipated || 0),
    unblocking: totals.unblocking + (member.metrics?.unblockingComments || 0),
    fireMode: totals.fireMode + (member.metrics?.fireModeMinutes || 0),
    codeReviews: totals.codeReviews + (member.metrics?.codeReviewsCompleted || 0),
    totalScore: totals.totalScore + member.score,
  }), { tasks: 0, ships: 0, unblocking: 0, fireMode: 0, codeReviews: 0, totalScore: 0 });

  return {
    project,
    timeframe,
    generatedAt: new Date().toISOString(),
    
    // Overview
    summary: {
      totalMembers: contributions.length,
      totalScore: teamTotals.totalScore,
      averageScore: teamTotals.totalScore / (contributions.length || 1),
      balanceScore: Math.round(skewAnalysis.entropyScore * 100),
      status: skewAnalysis.level,
    },
    
    // Individual contributions
    contributions,
    
    // Skew analysis
    skewAnalysis,
    
    // Category leaders
    categoryLeaders,
    
    // Team totals
    teamTotals,
    
    // Recommendations
    recommendations: generateRecommendations(skewAnalysis, contributions),
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(skewAnalysis, contributions) {
  const recommendations = [];

  if (skewAnalysis.isSkewed && skewAnalysis.heavyLifter) {
    recommendations.push({
      priority: 'high',
      type: 'redistribute',
      title: 'Redistribute Workload',
      description: `${skewAnalysis.heavyLifter.name} is carrying ${skewAnalysis.maxPercentage}% of the work. Consider reassigning some tasks to balance the load.`,
    });
  }

  if (skewAnalysis.minContributors.length > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'engage',
      title: 'Engage Low Contributors',
      description: `${skewAnalysis.minContributors.map(m => m.name).join(', ')} may need more assignments or support.`,
    });
  }

  if (skewAnalysis.entropyScore > 0.8) {
    recommendations.push({
      priority: 'low',
      type: 'celebrate',
      title: 'Great Balance! 🎉',
      description: 'Your team has excellent workload distribution. Keep it up!',
    });
  }

  return recommendations;
}

/**
 * Get contribution tier based on percentage
 */
export function getContributionTier(percentage) {
  if (percentage >= 40) return { tier: 'heavy-lifter', label: 'Heavy Lifter', color: 'warning' };
  if (percentage >= 25) return { tier: 'core-contributor', label: 'Core Contributor', color: 'brand' };
  if (percentage >= 15) return { tier: 'active', label: 'Active', color: 'success' };
  if (percentage >= 5) return { tier: 'participating', label: 'Participating', color: 'text-secondary' };
  return { tier: 'minimal', label: 'Minimal', color: 'text-tertiary' };
}

/**
 * Format score for display
 */
export function formatScore(score) {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return Math.round(score).toString();
}

export default {
  CONTRIBUTION_WEIGHTS,
  calculateContributionScore,
  calculateContributionBreakdown,
  calculateTeamContributions,
  detectSkew,
  calculateEntropyScore,
  generateFairnessReport,
  getContributionTier,
  formatScore,
};
