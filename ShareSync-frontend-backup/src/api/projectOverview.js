// src/api/projectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// API: Project Overview Endpoint (Main data for ProjectHome)
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get comprehensive project overview for ProjectHome
 */
export async function getProjectOverview(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/overview`);
    return response.data;
  } catch (error) {
    console.error('[ProjectOverview API] Error:', error);
    return getMockProjectOverview(projectId);
  }
}

/**
 * Get project pulse (real-time heartbeat data)
 */
export async function getProjectPulse(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/pulse`);
    return response.data;
  } catch (error) {
    console.error('[ProjectOverview API] Pulse error:', error);
    return getMockPulse(projectId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

function getMockProjectOverview(projectId) {
  return {
    projectId,
    project: {
      name: 'ShareSync v2',
      mission: 'Build the most engaging project management tool',
      status: 'active',
      createdAt: '2024-01-15T00:00:00Z',
    },
    momentum: {
      level: 4,
      percentage: 78,
      trend: 12,
      isFireMode: false,
    },
    heartbeat: {
      shipsPerWeek: 12,
      trend: 4,
      health: 'healthy',
    },
    energySync: {
      level: 'medium',
      busyMembers: 2,
      totalMembers: 5,
    },
    teamBalance: {
      isSkewed: true,
      topContributor: { name: 'Manny', percentage: 55 },
    },
    criticalMoves: [
      { id: 'm1', title: 'Ship Sprint 3 retro', momentum: 220, type: 'ship' },
      { id: 'm2', title: 'Close API bug #24', momentum: 160, type: 'fix' },
      { id: 'm3', title: 'Review PRs', momentum: 120, unblocks: 3 },
    ],
    objectives: [
      { id: 'o1', name: 'Beta Launch', progress: 54, momentum: 320 },
      { id: 'o2', name: 'API v2', progress: 80, momentum: 180 },
      { id: 'o3', name: 'Documentation', progress: 30, momentum: 120 },
    ],
    sprint: {
      name: 'Sprint 5 - Beta',
      daysLeft: 5,
      progress: 78,
    },
    recentActivity: [
      {
        id: 'a1',
        action: 'shipped',
        target: 'API refactor',
        actor: { name: 'Manny', avatar: null },
        momentum: 480,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'a2',
        action: 'created objective',
        target: 'Launch Beta',
        actor: { name: 'Alex', avatar: null },
        momentum: 160,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    announcement: {
      title: 'Beta Launch Next Week!',
      body: 'Final push - let\'s make it count.',
      author: { name: 'Sarah', avatar: null },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  };
}

function getMockPulse(projectId) {
  return {
    projectId,
    lastShipAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    activeUsers: 3,
    liveActivity: true,
  };
}

export default {
  getProjectOverview,
  getProjectPulse,
};
