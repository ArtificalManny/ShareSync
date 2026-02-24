// /src/api/discovery.js
import client from "./client";

export async function getDiscoveryFeed(params = {}) {
  try {
    const { signal, ...rest } = params || {};
    const res = await client.get("/discovery", { params: rest, signal });
    return Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.items) ? res.data.items : [];
  } catch {
    return [];
  }
}

// 🎰 NEW: Fetches the live Algorithmic Time-Decay Feed and maps it to UI cards
export async function getAlgorithmicFeed({ cursor, limit = 10 } = {}) {
  try {
    const qs = new URLSearchParams();
    if (cursor) qs.set("cursor", cursor);
    if (limit) qs.set("limit", String(limit));

    const res = await client.get(`/discovery/feed?${qs.toString()}`);
    
    // Safety unwrap depending on Axios configuration
    const payload = res?.data?.items ? res.data : res?.data?.data;
    const rawItems = payload?.items || [];
    const nextCursor = payload?.nextCursor || null;

    const activities = rawItems.map((p) => {
      // Use math hash to ensure the same project gets the same icon/color
      const hash = p.id.charCodeAt(0) % 4;
      const actions = ['shipped an update for', 'hit a milestone in', 'posted a task on', 'made progress on'];
      const icons = ['Rocket', 'TrendingUp', 'CheckCircle', 'Sparkles'];
      const colors = ['purple', 'emerald', 'blue', 'orange'];
      
      return {
        id: `feed-item-${p.id}`,
        type: 'ship',
        user: p.ownerInfo?.username || p.ownerInfo?.firstName || p.teamName || 'A creator',
        action: actions[hash],
        content: p.lastShip || p.description || 'working hard on the vision',
        project: p.projectName,
        timestamp: p.lastActivity || 'recently',
        icon: icons[hash],
        color: colors[hash],
        rawScore: p.algorithmicScore // Passed back from algorithm
      };
    });

    return { items: activities, nextCursor };
  } catch (err) {
    console.error("Discovery algorithm fetch error:", err);
    return { items: [], nextCursor: null };
  }
}

function n(v, fallback = 0) { const x = Number(v); return Number.isFinite(x) ? x : fallback; }
function s(v, fallback = "") { return typeof v === "string" && v.trim() ? v : fallback; }

function normalizeProjectItem(item) {
  const id = s(item?._id || item?.id);
  const projectName = s(item?.projectName || item?.name || item?.title, "Untitled Project");
  const teamName = s(item?.teamName || item?.orgName || item?.ownerName || item?.owner?.name, "Unknown Team");
  const emoji = s(item?.emoji, "✨");
  const streak = n(item?.streakDays ?? item?.streak ?? item?.stats?.streakDays, 0);
  const members = n(item?.membersCount ?? item?.members ?? item?.stats?.membersCount, 1);
  const totalShips = n(item?.shipsCount ?? item?.totalShips ?? item?.stats?.shipsCount, 0);
  const completionRate = n(item?.completionRate ?? item?.progress ?? item?.stats?.completionRate, 0);
  const lastShip = s(item?.lastShip ?? item?.latestUpdate ?? item?.stats?.lastShip, "No recent public update");
  const lastActivityDays = n(item?.lastActivityDays ?? item?.stats?.lastActivityDays, 0);
  const lastActivity = lastActivityDays ? `${lastActivityDays} days ago` : s(item?.lastActivity, "recently");
  const personName = s(item?.personName || item?.user?.name || item?.name);
  const workStyle = s(item?.workStyle);
  const similarity = n(item?.similarity, 0);
  const peakTime = s(item?.peakTime);
  const currentProject = s(item?.currentProject || item?.projectName);

  return {
    project: { id, projectName, teamName, emoji, streak, members, lastShip, totalShips, completionRate, lastActivity, lastActivityDays, tags: Array.isArray(item?.tags) ? item.tags : [], moderationStatus: item?.moderationStatus },
    person: personName ? { id, name: personName, avatar: s(item?.avatar, "👤"), workStyle: workStyle || "Deep Focus", similarity: similarity || 80, peakTime: peakTime || "Varies", currentProject: currentProject || "Project", streak: streak || 0, reason: s(item?.reason, "Similar momentum patterns"), moderationStatus: item?.moderationStatus } : null,
  };
}

export async function getDiscoverySections(params = {}) {
  const raw = await getDiscoveryFeed(params);
  const normalized = raw.map(normalizeProjectItem);

  const hotStreaks = normalized.map((x) => x.project).filter((p) => n(p.streak) >= 10).sort((a, b) => n(b.streak) - n(a.streak)).slice(0, 12).map((p) => ({ id: p.id, projectName: p.projectName, teamName: p.teamName, emoji: p.emoji, streak: p.streak, members: p.members, lastShip: p.lastShip, momentum: p.streak >= 60 ? "blazing" : p.streak >= 25 ? "high" : "steady", avatar: "👥", moderationStatus: p.moderationStatus }));
  const quietPromising = normalized.map((x) => x.project).filter((p) => n(p.lastActivityDays) >= 7 || /days ago/.test(p.lastActivity)).sort((a, b) => n(b.completionRate) - n(a.completionRate)).slice(0, 12).map((p) => ({ id: p.id, projectName: p.projectName, ownerName: p.teamName, emoji: p.emoji, lastActivity: p.lastActivity, reason: "Strong start, needs momentum", completionRate: Math.max(0, Math.min(100, n(p.completionRate, 50))), totalShips: n(p.totalShips, 0), avatar: "🚀", moderationStatus: p.moderationStatus }));
  const peopleLikeYou = normalized.map((x) => x.person).filter(Boolean).sort((a, b) => n(b.similarity) - n(a.similarity)).slice(0, 12);

  return { hotStreaks, quietPromising, peopleLikeYou };
}

export async function getDiscoveryPage(params = {}) {
  const items = await getDiscoveryFeed(params);
  return { items, next: null };
}

export default { getDiscoveryFeed, getDiscoverySections, getDiscoveryPage, getAlgorithmicFeed };
