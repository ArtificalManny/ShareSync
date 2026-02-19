// src/api/projectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// API: Project Overview Endpoint (Main data for ProjectHome)
// - Tries /projects/:id/overview first
// - If backend doesn't have it (404), falls back to /projects/:id
// - Normalizes response into a consistent "overview" shape
// ═══════════════════════════════════════════════════════════════════════════════

import client from "./client";

/**
 * Normalize any backend response into the frontend "overview" shape.
 * This keeps ProjectHome stable while backend endpoints are still evolving.
 */
function normalizeOverview(projectId, raw) {
  // If your backend already returns a proper overview object, pass it through.
  if (raw?.project && (raw?.momentum || raw?.metrics || raw?.heartbeat)) {
    return { projectId, ...raw };
  }

  // If backend returns a plain project document:
  const project =
    raw?.project ||
    raw || {
      name: "Untitled Project",
      mission: "",
      status: "active",
    };

  return {
    projectId,
    project: {
      name: project?.name || project?.title || "Untitled Project",
      mission: project?.mission || project?.description || "",
      status: project?.status || "active",
      createdAt: project?.createdAt || new Date().toISOString(),
    },

    // Keep these aligned with your hook compat layer
    momentum: {
      level: 1,
      percentage: 0,
      trend: 0,
      isFireMode: false,
    },
    heartbeat: {
      shipsPerWeek: 0,
      trend: 0,
      health: "unknown",
    },

    energySync: { level: "low", busyMembers: 0, totalMembers: 0 },
    teamBalance: { isSkewed: false, topContributor: null },

    criticalMoves: [],
    objectives: [],
    sprint: null,
    recentActivity: [],
    announcement: null,
  };
}

/**
 * Get comprehensive project overview for ProjectHome
 */
export async function getProjectOverview(projectId) {
  try {
    // 1) Preferred endpoint (if backend has it)
    const response = await client.get(`/projects/${projectId}/overview`);
    return normalizeOverview(projectId, response.data);
  } catch (error) {
    const status = error?.response?.status;

    // 2) If /overview doesn't exist, fall back to /projects/:id
    if (status === 404) {
      try {
        const response2 = await client.get(`/projects/${projectId}`);
        return normalizeOverview(projectId, response2.data);
      } catch (error2) {
        console.error("[ProjectOverview API] /projects/:id failed:", error2);
        return getMockProjectOverview(projectId);
      }
    }

    console.error("[ProjectOverview API] Error:", error);
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
    console.error("[ProjectOverview API] Pulse error:", error);
    return getMockPulse(projectId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (fallback)
// ═══════════════════════════════════════════════════════════════════════════════

function getMockProjectOverview(projectId) {
  return {
    projectId,
    project: {
      name: "ShareSync v2",
      mission: "Build the most engaging project management tool",
      status: "active",
      createdAt: "2024-01-15T00:00:00Z",
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
      health: "healthy",
    },
    energySync: {
      level: "medium",
      busyMembers: 2,
      totalMembers: 5,
    },
    teamBalance: {
      isSkewed: true,
      topContributor: { name: "Manny", percentage: 55 },
    },
    criticalMoves: [
      { id: "m1", title: "Ship Sprint 3 retro", momentum: 220, type: "ship" },
      { id: "m2", title: "Close API bug #24", momentum: 160, type: "fix" },
      { id: "m3", title: "Review PRs", momentum: 120, unblocks: 3 },
    ],
    objectives: [
      { id: "o1", name: "Beta Launch", progress: 54, momentum: 320 },
      { id: "o2", name: "API v2", progress: 80, momentum: 180 },
      { id: "o3", name: "Documentation", progress: 30, momentum: 120 },
    ],
    sprint: {
      name: "Sprint 5 - Beta",
      daysLeft: 5,
      progress: 78,
    },
    recentActivity: [
      {
        id: "a1",
        action: "shipped",
        target: "API refactor",
        actor: { name: "Manny", avatar: null },
        momentum: 480,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "a2",
        action: "created objective",
        target: "Launch Beta",
        actor: { name: "Alex", avatar: null },
        momentum: 160,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    announcement: {
      title: "Beta Launch Next Week!",
      body: "Final push - let's make it count.",
      author: { name: "Sarah", avatar: null },
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
