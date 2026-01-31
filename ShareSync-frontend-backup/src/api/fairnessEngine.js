// src/api/fairnessEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Fairness & Contribution Engine - API Layer
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';
import { calculateTeamContributions, generateFairnessReport } from '../utils/contributionScore';

/**
 * Get team contributions for a project
 * @param {string} projectId 
 * @returns {Promise<Object>}
 */
export async function getProjectContributions(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/contributions`);
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Error fetching contributions:', error);
    return getMockProjectContributions(projectId);
  }
}

/**
 * Get user's contribution stats across all projects
 * @returns {Promise<Object>}
 */
export async function getUserContributions() {
  try {
    const response = await client.get('/users/me/contributions');
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Error fetching user contributions:', error);
    return getMockUserContributions();
  }
}

/**
 * Get fairness report for a project
 * @param {string} projectId 
 * @param {string} timeframe - 'sprint' | 'month' | 'project' | 'all'
 * @returns {Promise<Object>}
 */
export async function getFairnessReport(projectId, timeframe = 'sprint') {
  try {
    const response = await client.get(`/projects/${projectId}/fairness-report`, {
      params: { timeframe },
    });
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Error fetching fairness report:', error);
    return getMockFairnessReport(projectId, timeframe);
  }
}

/**
 * Get historical contribution trends
 * @param {string} projectId 
 * @param {number} weeks - Number of weeks of history
 * @returns {Promise<Array>}
 */
export async function getContributionTrends(projectId, weeks = 8) {
  try {
    const response = await client.get(`/projects/${projectId}/contributions/trends`, {
      params: { weeks },
    });
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Error fetching trends:', error);
    return getMockContributionTrends(projectId, weeks);
  }
}

/**
 * Suggest task reassignments to improve balance
 * @param {string} projectId 
 * @returns {Promise<Array>}
 */
export async function getRebalanceSuggestions(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/contributions/suggestions`);
    return response.data;
  } catch (error) {
    console.error('[Fairness API] Error fetching suggestions:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

function getMockProjectContributions(projectId) {
  const members = [
    {
      userId: 'u1',
      name: 'Manny',
      avatar: 'https://i.pravatar.cc/150?u=manny',
      role: 'Lead Developer',
      metrics: {
        tasksCompleted: 42,
        shipsParticipated: 18,
        unblockingComments: 24,
        fireModeMinutes: 320,
        codeReviewsCompleted: 12,
      },
    },
    {
      userId: 'u2',
      name: 'Sarah',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      role: 'Product Manager',
      metrics: {
        tasksCompleted: 28,
        shipsParticipated: 12,
        unblockingComments: 35,
        fireModeMinutes: 180,
        codeReviewsCompleted: 5,
      },
    },
    {
      userId: 'u3',
      name: 'Alex',
      avatar: 'https://i.pravatar.cc/150?u=alex',
      role: 'Designer',
      metrics: {
        tasksCompleted: 18,
        shipsParticipated: 8,
        unblockingComments: 12,
        fireModeMinutes: 240,
        codeReviewsCompleted: 3,
      },
    },
    {
      userId: 'u4',
      name: 'Jordan',
      avatar: 'https://i.pravatar.cc/150?u=jordan',
      role: 'Developer',
      metrics: {
        tasksCompleted: 15,
        shipsParticipated: 6,
        unblockingComments: 8,
        fireModeMinutes: 160,
        codeReviewsCompleted: 8,
      },
    },
    {
      userId: 'u5',
      name: 'Taylor',
      avatar: 'https://i.pravatar.cc/150?u=taylor',
      role: 'QA Engineer',
      metrics: {
        tasksCompleted: 22,
        shipsParticipated: 10,
        unblockingComments: 18,
        fireModeMinutes: 140,
        codeReviewsCompleted: 15,
      },
    },
  ];

  return {
    projectId,
    contributions: calculateTeamContributions(members),
    lastUpdated: new Date().toISOString(),
  };
}

function getMockUserContributions() {
  return {
    overall: {
      tasksCompleted: 156,
      shipsParticipated: 42,
      unblockingComments: 87,
      fireModeMinutes: 1240,
      codeReviewsCompleted: 38,
      totalScore: 3245,
    },
    byProject: [
      {
        projectId: 'p1',
        projectName: 'ShareSync Core',
        percentage: 35,
        score: 1135,
      },
      {
        projectId: 'p2',
        projectName: 'Design System',
        percentage: 28,
        score: 909,
      },
      {
        projectId: 'p3',
        projectName: 'API v2',
        percentage: 22,
        score: 714,
      },
    ],
    ranking: {
      global: 127,
      percentile: 94,
    },
  };
}

function getMockFairnessReport(projectId, timeframe) {
  const mockData = getMockProjectContributions(projectId);
  
  return generateFairnessReport({
    members: mockData.contributions.map(c => ({
      ...c,
      metrics: c.metrics || {
        tasksCompleted: Math.floor(c.score / 15),
        shipsParticipated: Math.floor(c.score / 40),
        unblockingComments: Math.floor(c.score / 30),
        fireModeMinutes: Math.floor(c.score / 2),
        codeReviewsCompleted: Math.floor(c.score / 50),
      },
    })),
    project: {
      id: projectId,
      name: 'ShareSync Core',
    },
    timeframe,
  });
}

function getMockContributionTrends(projectId, weeks) {
  const trends = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    
    trends.push({
      week: weekStart.toISOString(),
      weekLabel: `W${weeks - i}`,
      members: [
        { userId: 'u1', name: 'Manny', percentage: 30 + Math.random() * 20 },
        { userId: 'u2', name: 'Sarah', percentage: 20 + Math.random() * 15 },
        { userId: 'u3', name: 'Alex', percentage: 15 + Math.random() * 10 },
        { userId: 'u4', name: 'Jordan', percentage: 10 + Math.random() * 10 },
        { userId: 'u5', name: 'Taylor', percentage: 15 + Math.random() * 10 },
      ],
      entropyScore: 0.6 + Math.random() * 0.3,
    });
  }
  
  return trends;
}

export default {
  getProjectContributions,
  getUserContributions,
  getFairnessReport,
  getContributionTrends,
  getRebalanceSuggestions,
};
