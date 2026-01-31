// src/api/growthTrack.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Identity & Growth Track - API Layer
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get user's skill profile
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export async function getSkillProfile(userId) {
  try {
    const response = await client.get(`/users/${userId}/skills`);
    return response.data;
  } catch (error) {
    console.error('[GrowthTrack API] Skills error:', error);
    return getMockSkillProfile(userId);
  }
}

/**
 * Get evolution moments (role transitions)
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export async function getEvolutionMoments(userId) {
  try {
    const response = await client.get(`/users/${userId}/evolution`);
    return response.data;
  } catch (error) {
    console.error('[GrowthTrack API] Evolution error:', error);
    return getMockEvolutionMoments(userId);
  }
}

/**
 * Get AI-generated growth suggestions
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export async function getGrowthSuggestions(userId) {
  try {
    const response = await client.get(`/users/${userId}/growth-suggestions`);
    return response.data;
  } catch (error) {
    console.error('[GrowthTrack API] Suggestions error:', error);
    return getMockGrowthSuggestions(userId);
  }
}

/**
 * Get historical trend data
 * @param {string} userId 
 * @param {string} metric - 'velocity' | 'quality' | 'collaboration' | 'all'
 * @param {number} weeks 
 * @returns {Promise<Object>}
 */
export async function getGrowthTrends(userId, metric = 'all', weeks = 12) {
  try {
    const response = await client.get(`/users/${userId}/trends`, {
      params: { metric, weeks },
    });
    return response.data;
  } catch (error) {
    console.error('[GrowthTrack API] Trends error:', error);
    return getMockGrowthTrends(userId, metric, weeks);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

function getMockSkillProfile(userId) {
  return {
    userId,
    archetype: {
      current: 'architect',
      previous: 'builder',
      transitionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    skills: [
      { name: 'execution', score: 85, trend: 'up', change: 8 },
      { name: 'leadership', score: 72, trend: 'up', change: 12 },
      { name: 'technical', score: 90, trend: 'stable', change: 2 },
      { name: 'collaboration', score: 78, trend: 'up', change: 5 },
      { name: 'communication', score: 65, trend: 'up', change: 10 },
      { name: 'strategy', score: 70, trend: 'up', change: 15 },
    ],
    strengths: ['technical', 'execution'],
    growthAreas: ['communication', 'leadership'],
    overallGrowth: 18, // % improvement over last quarter
  };
}

function getMockEvolutionMoments(userId) {
  return [
    {
      id: 'ev1',
      from: 'Builder',
      to: 'Architect',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      explanation: 'Your consistent delivery of complex features and mentoring of junior developers triggered this evolution. You\'ve shipped 3 major systems and reviewed 45 PRs in the last quarter.',
      achievements: [
        'Led Momentum Engine architecture',
        'Mentored 2 junior developers',
        '45 code reviews completed',
        'Introduced new design patterns',
      ],
      metrics: {
        systemsDesigned: 3,
        mentoringSessions: 12,
        architectureDecisions: 8,
      },
      badge: '🏗️',
    },
    {
      id: 'ev2',
      from: 'Contributor',
      to: 'Builder',
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      explanation: 'You transitioned from individual contributions to owning entire features end-to-end. Your completion rate and complexity of tasks increased significantly.',
      achievements: [
        'First feature owned end-to-end',
        '100 tasks completed milestone',
        'Started code review contributions',
      ],
      metrics: {
        tasksCompleted: 100,
        featuresOwned: 5,
        avgComplexity: 'medium',
      },
      badge: '🔨',
    },
    {
      id: 'ev3',
      from: 'Beginner',
      to: 'Contributor',
      date: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
      explanation: 'You\'ve established yourself as a reliable team member with consistent contributions.',
      achievements: [
        'First 10 tasks completed',
        'Joined first project team',
        'First ship participation',
      ],
      metrics: {
        tasksCompleted: 10,
        shipsParticipated: 1,
      },
      badge: '🌱',
    },
  ];
}

function getMockGrowthSuggestions(userId) {
  return [
    {
      id: 'gs1',
      type: 'skill',
      priority: 'high',
      title: 'Strengthen Technical Writing',
      description: 'Your documentation contributions are below average. Better docs would multiply your architectural impact.',
      reason: 'Based on low doc contributions despite high architecture decisions',
      actionItems: [
        'Document the Momentum Engine architecture',
        'Write ADRs for recent decisions',
        'Create onboarding guide for new developers',
      ],
      expectedImpact: '+15 communication score',
      timeEstimate: '2-3 hours/week',
    },
    {
      id: 'gs2',
      type: 'behavior',
      priority: 'medium',
      title: 'Expand Collaboration Hours',
      description: 'You tend to work solo during focus time. Pairing sessions could accelerate team learning.',
      reason: 'Low pair programming activity detected',
      actionItems: [
        'Schedule weekly pairing sessions',
        'Join more code review discussions',
        'Host architecture walkthroughs',
      ],
      expectedImpact: '+10 collaboration score, team velocity +8%',
      timeEstimate: '3-4 hours/week',
    },
    {
      id: 'gs3',
      type: 'stretch',
      priority: 'low',
      title: 'Try Product Thinking',
      description: 'Your execution is strong. Developing product intuition could prepare you for Staff+ roles.',
      reason: 'Strong technical skills, room for strategic growth',
      actionItems: [
        'Attend product planning sessions',
        'Propose one feature improvement per sprint',
        'Analyze user feedback for your features',
      ],
      expectedImpact: '+20 strategy score over 3 months',
      timeEstimate: '1-2 hours/week',
    },
  ];
}

function getMockGrowthTrends(userId, metric, weeks) {
  const data = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));

    const baseVelocity = 75 + Math.random() * 20;
    const baseQuality = 80 + Math.random() * 15;
    const baseCollab = 65 + Math.random() * 25;
    
    data.push({
      week: weekStart.toISOString(),
      weekLabel: `W${weeks - i}`,
      velocity: Math.round(baseVelocity + (weeks - i) * 0.5),
      quality: Math.round(baseQuality + (weeks - i) * 0.3),
      collaboration: Math.round(baseCollab + (weeks - i) * 0.8),
      overall: Math.round((baseVelocity + baseQuality + baseCollab) / 3 + (weeks - i) * 0.5),
    });
  }

  return {
    userId,
    weeks,
    data,
    summary: {
      velocityGrowth: 12,
      qualityGrowth: 8,
      collaborationGrowth: 18,
      overallGrowth: 15,
    },
  };
}

export default {
  getSkillProfile,
  getEvolutionMoments,
  getGrowthSuggestions,
  getGrowthTrends,
};
