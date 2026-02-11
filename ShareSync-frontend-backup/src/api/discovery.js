// /src/api/discovery.js
// Simple client and local fallback for the Discover surface.

import client from "./client";

/**
 * Return a list of discoverable projects.
 * MUST always resolve to an array (never undefined).
 * Each project should tolerate partial stats; UI is defensive.
 */
export async function getDiscoveryFeed(params = {}) {
  try {
    const res = await client.get("/discovery", { params });
    const items = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.items)
      ? res.data.items
      : [];
    return items;
  } catch {
    return [];
  }
}

/**
 * Helper: safely coerce numbers.
 */
function n(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

/**
 * Helper: safely coerce strings.
 */
function s(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/**
 * Convert a raw discovery item into the exact shapes your UI expects.
 * This lets your UI stay identical while your backend evolves.
 */
function normalizeProjectItem(item) {
  // Project-ish
  const id = s(item?._id || item?.id);
  const projectName = s(item?.projectName || item?.name || item?.title, "Untitled Project");
  const teamName = s(item?.teamName || item?.orgName || item?.ownerName || item?.owner?.name, "Unknown Team");
  const emoji = s(item?.emoji, "✨");

  // Stats-ish
  const streak = n(item?.streakDays ?? item?.streak ?? item?.stats?.streakDays, 0);
  const members = n(item?.membersCount ?? item?.members ?? item?.stats?.membersCount, 1);
  const totalShips = n(item?.shipsCount ?? item?.totalShips ?? item?.stats?.shipsCount, 0);
  const completionRate = n(item?.completionRate ?? item?.progress ?? item?.stats?.completionRate, 0);

  // Activity-ish
  const lastShip = s(item?.lastShip ?? item?.latestUpdate ?? item?.stats?.lastShip, "No recent public update");
  const lastActivityDays = n(item?.lastActivityDays ?? item?.stats?.lastActivityDays, 0);
  const lastActivity = lastActivityDays ? `${lastActivityDays} days ago` : s(item?.lastActivity, "recently");

  // People-ish (optional)
  const personName = s(item?.personName || item?.user?.name || item?.name);
  const workStyle = s(item?.workStyle);
  const similarity = n(item?.similarity, 0);
  const peakTime = s(item?.peakTime);
  const currentProject = s(item?.currentProject || item?.projectName);

  return {
    // For project sections
    project: {
      id,
      projectName,
      teamName,
      emoji,
      streak,
      members,
      lastShip,
      totalShips,
      completionRate,
      lastActivity,
      lastActivityDays,
      // optional tags from backend
      tags: Array.isArray(item?.tags) ? item.tags : [],
    },

    // For people section (if backend provides it)
    person: personName
      ? {
          id,
          name: personName,
          avatar: s(item?.avatar, "👤"),
          workStyle: workStyle || "Deep Focus",
          similarity: similarity || 80,
          peakTime: peakTime || "Varies",
          currentProject: currentProject || "Project",
          streak: streak || 0,
          reason: s(item?.reason, "Similar momentum patterns"),
        }
      : null,
  };
}

/**
 * Return sectioned data for the Discover page.
 * Works with a flat /discovery endpoint today.
 */
export async function getDiscoverySections(params = {}) {
  const raw = await getDiscoveryFeed(params);
  const normalized = raw.map(normalizeProjectItem);

  // Build Hot Streaks
  const hotStreaks = normalized
    .map((x) => x.project)
    .filter((p) => n(p.streak) >= 10)
    .sort((a, b) => n(b.streak) - n(a.streak))
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      projectName: p.projectName,
      teamName: p.teamName,
      emoji: p.emoji,
      streak: p.streak,
      members: p.members,
      lastShip: p.lastShip,
      momentum:
        p.streak >= 60 ? "blazing" : p.streak >= 25 ? "high" : "steady",
      avatar: "👥",
    }));

  // Build Quiet but Promising
  const quietPromising = normalized
    .map((x) => x.project)
    .filter((p) => n(p.lastActivityDays) >= 7 || /days ago/.test(p.lastActivity))
    .sort((a, b) => n(b.completionRate) - n(a.completionRate))
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      projectName: p.projectName,
      ownerName: p.teamName, // UI expects "by {ownerName}" — keep it
      emoji: p.emoji,
      lastActivity: p.lastActivity,
      reason: "Strong start, needs momentum",
      completionRate: Math.max(0, Math.min(100, n(p.completionRate, 50))),
      totalShips: n(p.totalShips, 0),
      avatar: "🚀",
    }));

  // Build People Who Work Like You
  const peopleLikeYou = normalized
    .map((x) => x.person)
    .filter(Boolean)
    .sort((a, b) => n(b.similarity) - n(a.similarity))
    .slice(0, 12);

  return { hotStreaks, quietPromising, peopleLikeYou };
}

export async function getDiscoveryPage(params = {}) {
  const items = await getDiscoveryFeed(params);
  return { items, next: null };
}

export default { getDiscoveryFeed, getDiscoverySections, getDiscoveryPage };
