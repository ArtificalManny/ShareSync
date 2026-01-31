// src/api/projectStory.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Project Story Time Machine - API Layer
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get project timeline events
 * @param {string} projectId 
 * @param {Object} options - Filter options
 * @returns {Promise<Array>}
 */
export async function getProjectTimeline(projectId, options = {}) {
  try {
    const response = await client.get(`/projects/${projectId}/timeline`, { params: options });
    return response.data;
  } catch (error) {
    console.error('[ProjectStory API] Timeline error:', error);
    return getMockTimeline(projectId, options);
  }
}

/**
 * Get AI-generated weekly summary
 * @param {string} projectId 
 * @param {string} weekStart - ISO date string
 * @returns {Promise<Object>}
 */
export async function getWeeklySummary(projectId, weekStart) {
  try {
    const response = await client.get(`/projects/${projectId}/summary/weekly`, {
      params: { weekStart },
    });
    return response.data;
  } catch (error) {
    console.error('[ProjectStory API] Summary error:', error);
    return getMockWeeklySummary(projectId, weekStart);
  }
}

/**
 * Get decision log entries
 * @param {string} projectId 
 * @returns {Promise<Array>}
 */
export async function getDecisionLog(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/decisions`);
    return response.data;
  } catch (error) {
    console.error('[ProjectStory API] Decisions error:', error);
    return getMockDecisions(projectId);
  }
}

/**
 * Get project state at a specific point in time
 * @param {string} projectId 
 * @param {string} timestamp - ISO date string
 * @returns {Promise<Object>}
 */
export async function getProjectSnapshot(projectId, timestamp) {
  try {
    const response = await client.get(`/projects/${projectId}/snapshot`, {
      params: { timestamp },
    });
    return response.data;
  } catch (error) {
    console.error('[ProjectStory API] Snapshot error:', error);
    return getMockSnapshot(projectId, timestamp);
  }
}

/**
 * Get available weeks for the project
 * @param {string} projectId 
 * @returns {Promise<Array>}
 */
export async function getProjectWeeks(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/weeks`);
    return response.data;
  } catch (error) {
    console.error('[ProjectStory API] Weeks error:', error);
    return getMockWeeks(projectId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

function getMockTimeline(projectId, options = {}) {
  const now = new Date();
  const events = [
    {
      id: 'e1',
      type: 'ship',
      title: 'Momentum Engine v1.0 shipped',
      description: 'Core momentum tracking system deployed to production',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u1', name: 'Manny', avatar: 'https://i.pravatar.cc/150?u=manny' },
      metadata: { xp: 250, tasks: 8, reviewers: 3 },
      impact: 'high',
    },
    {
      id: 'e2',
      type: 'decision',
      title: 'Descoped real-time collaboration for v1',
      description: 'Team agreed to push WebSocket features to v1.1 to hit deadline',
      timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u2', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
      metadata: { reason: 'timeline', tasksDescoped: 12 },
      impact: 'medium',
    },
    {
      id: 'e3',
      type: 'blocker',
      title: 'Authentication timeout bug',
      description: 'Users getting logged out after 5 minutes - blocking beta launch',
      timestamp: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u3', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex' },
      metadata: { severity: 'critical', resolved: true, resolvedAt: new Date(now - 30 * 60 * 60 * 1000).toISOString() },
      impact: 'high',
    },
    {
      id: 'e4',
      type: 'ship',
      title: 'Design System v2 components merged',
      description: '23 new components following Quiet Confidence principles',
      timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u4', name: 'Jordan', avatar: 'https://i.pravatar.cc/150?u=jordan' },
      metadata: { xp: 180, tasks: 23, components: 23 },
      impact: 'medium',
    },
    {
      id: 'e5',
      type: 'milestone',
      title: 'Sprint 3 completed',
      description: 'All sprint goals achieved, velocity increased 15%',
      timestamp: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      actor: null,
      metadata: { velocity: 42, planned: 38, completed: 42, carryover: 0 },
      impact: 'high',
    },
    {
      id: 'e6',
      type: 'decision',
      title: 'Switched from REST to GraphQL for dashboard',
      description: 'Performance requirements necessitated query batching',
      timestamp: new Date(now - 96 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u1', name: 'Manny', avatar: 'https://i.pravatar.cc/150?u=manny' },
      metadata: { reason: 'performance', effort: 'medium' },
      impact: 'medium',
    },
    {
      id: 'e7',
      type: 'blocker',
      title: 'CI pipeline failures',
      description: 'Flaky tests causing 40% build failure rate',
      timestamp: new Date(now - 120 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u5', name: 'Taylor', avatar: 'https://i.pravatar.cc/150?u=taylor' },
      metadata: { severity: 'high', resolved: true, resolvedAt: new Date(now - 108 * 60 * 60 * 1000).toISOString() },
      impact: 'medium',
    },
    {
      id: 'e8',
      type: 'ship',
      title: 'Focus Mode feature launched',
      description: 'Pomodoro-style focus sessions with team visibility',
      timestamp: new Date(now - 144 * 60 * 60 * 1000).toISOString(),
      actor: { id: 'u2', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
      metadata: { xp: 320, tasks: 15, beta: false },
      impact: 'high',
    },
  ];

  // Apply filters
  let filtered = [...events];
  if (options.type && options.type !== 'all') {
    filtered = filtered.filter(e => e.type === options.type);
  }
  if (options.startDate) {
    filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(options.startDate));
  }
  if (options.endDate) {
    filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(options.endDate));
  }

  return {
    projectId,
    events: filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    totalCount: filtered.length,
    dateRange: {
      start: events[events.length - 1]?.timestamp,
      end: events[0]?.timestamp,
    },
  };
}

function getMockWeeklySummary(projectId, weekStart) {
  return {
    projectId,
    weekStart,
    generatedAt: new Date().toISOString(),
    summary: {
      headline: "Strong momentum with one critical blocker resolved",
      narrative: `This week saw exceptional progress with 3 major ships hitting production. The team navigated a critical authentication bug that briefly blocked the beta launch, demonstrating strong incident response. 

Key highlights:
- Momentum Engine v1.0 successfully deployed after 3 weeks of development
- Design System v2 added 23 new components
- Focus Mode feature launched to positive early feedback

The decision to descope real-time collaboration was strategic, allowing the team to maintain quality while hitting the Q1 deadline.`,
      sentiment: 'positive',
      momentumTrend: 'increasing',
    },
    stats: {
      ships: 3,
      tasksCompleted: 46,
      blockersResolved: 2,
      decisionsLogged: 2,
      xpEarned: 750,
    },
    highlights: [
      { type: 'achievement', text: 'Momentum Engine shipped to production' },
      { type: 'recovery', text: 'Auth bug resolved in under 6 hours' },
      { type: 'strategic', text: 'Scope adjustment saved 2 weeks of work' },
    ],
    concerns: [
      { type: 'watch', text: 'CI stability still needs monitoring' },
    ],
    contributors: [
      { userId: 'u1', name: 'Manny', ships: 2, xp: 430 },
      { userId: 'u2', name: 'Sarah', ships: 1, xp: 320 },
      { userId: 'u4', name: 'Jordan', ships: 1, xp: 180 },
    ],
  };
}

function getMockDecisions(projectId) {
  const now = new Date();
  
  return [
    {
      id: 'd1',
      type: 'descope',
      title: 'Real-time collaboration moved to v1.1',
      description: 'WebSocket-based live editing features descoped from v1 launch',
      reason: 'To meet Q1 deadline without compromising core feature quality',
      impact: 'Removes 12 tasks, saves ~2 weeks of development',
      timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      author: { id: 'u2', name: 'Sarah' },
      status: 'approved',
      linkedTasks: ['t45', 't46', 't47', 't48'],
    },
    {
      id: 'd2',
      type: 'technical',
      title: 'Switched to GraphQL for dashboard API',
      description: 'REST endpoints replaced with GraphQL for query batching',
      reason: 'Dashboard loading time reduced from 3.2s to 0.8s',
      impact: 'Required 3 days of refactoring, ongoing performance benefit',
      timestamp: new Date(now - 96 * 60 * 60 * 1000).toISOString(),
      author: { id: 'u1', name: 'Manny' },
      status: 'implemented',
      linkedTasks: ['t32', 't33'],
    },
    {
      id: 'd3',
      type: 'process',
      title: 'Adopted trunk-based development',
      description: 'Moving from feature branches to trunk-based with feature flags',
      reason: 'Reduce merge conflicts and improve deployment frequency',
      impact: 'Learning curve for team, but faster iteration expected',
      timestamp: new Date(now - 168 * 60 * 60 * 1000).toISOString(),
      author: { id: 'u1', name: 'Manny' },
      status: 'in-progress',
      linkedTasks: [],
    },
    {
      id: 'd4',
      type: 'priority',
      title: 'Focus Mode prioritized over Analytics v2',
      description: 'Swapped roadmap priority based on user feedback',
      reason: '68% of beta users requested productivity features over analytics',
      impact: 'Analytics v2 delayed by 1 sprint',
      timestamp: new Date(now - 240 * 60 * 60 * 1000).toISOString(),
      author: { id: 'u2', name: 'Sarah' },
      status: 'approved',
      linkedTasks: ['t28', 't29', 't30'],
    },
  ];
}

function getMockSnapshot(projectId, timestamp) {
  return {
    projectId,
    timestamp,
    state: {
      progress: 67,
      tasksTotal: 120,
      tasksCompleted: 80,
      activeBlockers: 1,
      teamMomentum: 4,
      sprintDay: 8,
      velocity: 38,
    },
    activeMembers: [
      { id: 'u1', name: 'Manny', status: 'focused' },
      { id: 'u2', name: 'Sarah', status: 'active' },
      { id: 'u3', name: 'Alex', status: 'idle' },
    ],
  };
}

function getMockWeeks(projectId) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    weeks.push({
      start: weekStart.toISOString(),
      label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} weeks ago`,
      stats: {
        ships: Math.floor(Math.random() * 5) + 1,
        events: Math.floor(Math.random() * 15) + 5,
      },
    });
  }
  
  return weeks;
}

export default {
  getProjectTimeline,
  getWeeklySummary,
  getDecisionLog,
  getProjectSnapshot,
  getProjectWeeks,
};
