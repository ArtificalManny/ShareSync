// src/api/identity.js
// ═══════════════════════════════════════════════════════════════════════════════
// API: Identity & Growth Track Endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get user's archetype and skill profile
 */
export async function getIdentityProfile(userId) {
  try {
    const response = await client.get(`/users/${userId}/identity`);
    return response.data;
  } catch (error) {
    console.error('[Identity API] Profile error:', error);
    return getMockIdentityProfile(userId);
  }
}

/**
 * Get user's evolution history
 */
export async function getEvolutionHistory(userId) {
  try {
    const response = await client.get(`/users/${userId}/evolution`);
    return response.data;
  } catch (error) {
    console.error('[Identity API] Evolution error:', error);
    return getMockEvolution(userId);
  }
}

/**
 * Get growth suggestions
 */
export async function getGrowthSuggestions(userId) {
  try {
    const response = await client.get(`/users/${userId}/growth-suggestions`);
    return response.data;
  } catch (error) {
    console.error('[Identity API] Suggestions error:', error);
    return getMockSuggestions(userId);
  }
}

/**
 * Get skill trends over time
 */
export async function getSkillTrends(userId, weeks = 12) {
  try {
    const response = await client.get(`/users/${userId}/skills/trends`, {
      params: { weeks },
    });
    return response.data;
  } catch (error) {
    console.error('[Identity API] Trends error:', error);
    return getMockSkillTrends(userId, weeks);
  }
}

// Mock data functions imported from growthTrack.js pattern
function getMockIdentityProfile(userId) {
  return {
    userId,
    archetype: {
      current: 'Architect',
      previous: 'Builder',
      confidence: 0.85,
    },
    skills: [
      { name: 'execution', score: 85, trend: 'up' },
      { name: 'leadership', score: 72, trend: 'up' },
      { name: 'technical', score: 90, trend: 'stable' },
      { name: 'collaboration', score: 78, trend: 'up' },
      { name: 'communication', score: 65, trend: 'up' },
      { name: 'strategy', score: 70, trend: 'up' },
    ],
    strengths: ['technical', 'execution'],
    growthAreas: ['communication', 'leadership'],
  };
}

function getMockEvolution(userId) {
  return [
    {
      id: 'ev1',
      from: 'Builder',
      to: 'Architect',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Consistent system design and mentorship',
    },
  ];
}

function getMockSuggestions(userId) {
  return [
    {
      id: 'gs1',
      type: 'skill',
      priority: 'high',
      title: 'Strengthen Documentation',
      description: 'Your docs contributions are below average',
    },
  ];
}

function getMockSkillTrends(userId, weeks) {
  const data = [];
  for (let i = 0; i < weeks; i++) {
    data.push({
      week: `W${i + 1}`,
      execution: 75 + Math.random() * 15,
      technical: 85 + Math.random() * 10,
      collaboration: 60 + Math.random() * 20,
    });
  }
  return { userId, weeks, data };
}

export default {
  getIdentityProfile,
  getEvolutionHistory,
  getGrowthSuggestions,
  getSkillTrends,
};
