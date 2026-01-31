// src/api/fairness.js
// ═══════════════════════════════════════════════════════════════════════════════
// API: Fairness Engine Endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get project contribution data
 */
export async function getProjectContributions(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/contributions`);
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Contributions error:', error);
    return getMockContributions(projectId);
  }
}

/**
 * Get user's contribution across projects
 */
export async function getUserContributions(userId) {
  try {
    const response = await client.get(`/users/${userId}/contributions`);
    return response.data;
  } catch (error) {
    console.error('[Fairness API] User contributions error:', error);
    return getMockUserContributions(userId);
  }
}

/**
 * Get fairness report for project
 */
export async function getFairnessReport(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/fairness-report`);
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Report error:', error);
    return getMockFairnessReport(projectId);
  }
}

/**
 * Get contribution trends
 */
export async function getContributionTrends(projectId, weeks = 8) {
  try {
    const response = await client.get(`/projects/${projectId}/contributions/trends`, {
      params: { weeks },
    });
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Trends error:', error);
    return [];
  }
}

// Mock data
function getMockContributions(projectId) {
  return {
    projectId,
    members: [
      {
        userId: 'u1',
        name: 'Manny',
        metrics: { tasksCompleted: 45, shipsParticipated: 8, unblockingComments: 12, fireModeMinutes: 240, codeReviewsCompleted: 15 },
        score: 835,
        percentage: 55,
      },
      {
        userId: 'u2',
        name: 'Sarah',
        metrics: { tasksCompleted: 28, shipsParticipated: 5, unblockingComments: 8, fireModeMinutes: 120, codeReviewsCompleted: 10 },
        score: 495,
        percentage: 25,
      },
      {
        userId: 'u3',
        name: 'Alex',
        metrics: { tasksCompleted: 15, shipsParticipated: 3, unblockingComments: 5, fireModeMinutes: 60, codeReviewsCompleted: 5 },
        score: 280,
        percentage: 15,
      },
    ],
    isSkewed: true,
    entropyScore: 0.65,
  };
}

function getMockUserContributions(userId) {
  return {
    userId,
    totalScore: 835,
    rank: 1,
    projects: [
      { projectId: 'p1', name: 'ShareSync', score: 600, percentage: 55 },
      { projectId: 'p2', name: 'API Service', score: 235, percentage: 40 },
    ],
  };
}

function getMockFairnessReport(projectId) {
  return {
    projectId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalMembers: 5,
      totalScore: 1610,
      avgScore: 322,
      balanceScore: 65,
    },
    topContributors: [
      { userId: 'u1', name: 'Manny', score: 835, badge: '🏆' },
      { userId: 'u2', name: 'Sarah', score: 495, badge: '🥈' },
      { userId: 'u3', name: 'Alex', score: 280, badge: '🥉' },
    ],
    recommendations: [
      { priority: 'high', text: 'Redistribute workload from Manny to other team members' },
      { priority: 'medium', text: 'Engage Jordan and Taylor with more tasks' },
    ],
  };
}

export default {
  getProjectContributions,
  getUserContributions,
  getFairnessReport,
  getContributionTrends,
};
