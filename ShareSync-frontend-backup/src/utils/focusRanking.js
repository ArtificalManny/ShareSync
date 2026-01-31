// src/utils/focusRanking.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - Ranking Algorithm
// ═══════════════════════════════════════════════════════════════════════════════
//
// The core algorithm that determines which moves are most important.
// 
// RANKING FORMULA:
//   score = (unblockCount × 3) + (deadlineUrgency × 2) + momentumValue
//
// This prioritizes:
// 1. Moves that unblock teammates (collaborative impact)
// 2. Moves with approaching deadlines (time sensitivity)
// 3. Moves with high momentum value (progress impact)
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate deadline urgency score (0-100)
 * Higher score = more urgent
 * 
 * @param {string|Date|null} deadline - ISO date string or Date object
 * @returns {number} Urgency score 0-100
 */
export function calculateDeadlineUrgency(deadline) {
  if (!deadline) return 0;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60);
  
  // Past deadline = maximum urgency
  if (hoursUntilDeadline <= 0) return 100;
  
  // Within 4 hours = very high urgency (90-100)
  if (hoursUntilDeadline <= 4) return 90 + (4 - hoursUntilDeadline) * 2.5;
  
  // Within 24 hours = high urgency (70-90)
  if (hoursUntilDeadline <= 24) return 70 + ((24 - hoursUntilDeadline) / 20) * 20;
  
  // Within 3 days = medium urgency (40-70)
  if (hoursUntilDeadline <= 72) return 40 + ((72 - hoursUntilDeadline) / 48) * 30;
  
  // Within 7 days = low urgency (10-40)
  if (hoursUntilDeadline <= 168) return 10 + ((168 - hoursUntilDeadline) / 96) * 30;
  
  // More than 7 days = minimal urgency (0-10)
  return Math.max(0, 10 - (hoursUntilDeadline - 168) / 168 * 10);
}

/**
 * Calculate the focus score for a single move
 * 
 * @param {Object} move - The move object
 * @param {number} move.unblocks - Number of teammates unblocked
 * @param {string|Date|null} move.deadline - Deadline date
 * @param {number} move.momentum - Momentum value
 * @returns {number} Focus score
 */
export function calculateFocusScore(move) {
  const unblockScore = (move.unblocks || 0) * 3;
  const urgencyScore = calculateDeadlineUrgency(move.deadline) * 2;
  const momentumScore = (move.momentum || 0) / 10; // Normalize momentum (typically 50-500)
  
  return unblockScore + urgencyScore + momentumScore;
}

/**
 * Rank moves by focus score (highest first)
 * 
 * @param {Array<Object>} moves - Array of move objects
 * @returns {Array<Object>} Sorted moves with score attached
 */
export function rankMoves(moves) {
  if (!moves || !Array.isArray(moves)) return [];
  
  return moves
    .map(move => ({
      ...move,
      focusScore: calculateFocusScore(move),
      urgencyLevel: getUrgencyLevel(move.deadline),
    }))
    .sort((a, b) => b.focusScore - a.focusScore);
}

/**
 * Get top N moves across all projects
 * 
 * @param {Array<Object>} moves - Array of move objects
 * @param {number} count - Number of top moves to return
 * @returns {Array<Object>} Top N moves
 */
export function getTopMoves(moves, count = 3) {
  return rankMoves(moves).slice(0, count);
}

/**
 * Get urgency level category
 * 
 * @param {string|Date|null} deadline 
 * @returns {'critical'|'high'|'medium'|'low'|'none'}
 */
export function getUrgencyLevel(deadline) {
  if (!deadline) return 'none';
  
  const urgency = calculateDeadlineUrgency(deadline);
  
  if (urgency >= 90) return 'critical';
  if (urgency >= 70) return 'high';
  if (urgency >= 40) return 'medium';
  if (urgency >= 10) return 'low';
  return 'none';
}

/**
 * Calculate impact summary for a set of moves
 * 
 * @param {Array<Object>} moves 
 * @returns {Object} Impact summary
 */
export function calculateImpactSummary(moves) {
  if (!moves || !moves.length) {
    return {
      totalMomentum: 0,
      totalUnblocks: 0,
      criticalCount: 0,
      highCount: 0,
    };
  }
  
  return moves.reduce((summary, move) => ({
    totalMomentum: summary.totalMomentum + (move.momentum || 0),
    totalUnblocks: summary.totalUnblocks + (move.unblocks || 0),
    criticalCount: summary.criticalCount + (getUrgencyLevel(move.deadline) === 'critical' ? 1 : 0),
    highCount: summary.highCount + (getUrgencyLevel(move.deadline) === 'high' ? 1 : 0),
  }), {
    totalMomentum: 0,
    totalUnblocks: 0,
    criticalCount: 0,
    highCount: 0,
  });
}

/**
 * Group moves by project
 * 
 * @param {Array<Object>} moves 
 * @returns {Object} Moves grouped by project ID
 */
export function groupMovesByProject(moves) {
  if (!moves || !Array.isArray(moves)) return {};
  
  return moves.reduce((groups, move) => {
    const projectId = move.project?.id || move.projectId || 'unknown';
    if (!groups[projectId]) {
      groups[projectId] = {
        project: move.project,
        moves: [],
      };
    }
    groups[projectId].moves.push(move);
    return groups;
  }, {});
}

/**
 * Get time until deadline as human-readable string
 * 
 * @param {string|Date|null} deadline 
 * @returns {string} Human readable time
 */
export function getTimeUntilDeadline(deadline) {
  if (!deadline) return '';
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate - now;
  
  if (diffMs <= 0) return 'Overdue';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return 'Less than 1 hour';
  if (hours < 24) return `${hours}h left`;
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days left`;
  
  return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default {
  calculateDeadlineUrgency,
  calculateFocusScore,
  rankMoves,
  getTopMoves,
  getUrgencyLevel,
  calculateImpactSummary,
  groupMovesByProject,
  getTimeUntilDeadline,
};
