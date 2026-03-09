// /src/api/gamification.js
// ═══════════════════════════════════════════════════════════════════════════════
// API Client: Gamification & Real-Time Analytics
// ⭐ UPGRADE: Item 10 - Wired to gamification backend
// ═══════════════════════════════════════════════════════════════════════════════

import client from "./client";

export async function getGamificationStats() {
  try {
    const res = await client.get("/gamification/stats");
    // Safely unwrap depending on your Axios interceptor setup
    return res?.data?.data || res?.data || null;
  } catch (err) {
    console.error("Failed to load gamification stats:", err);
    return null;
  }
}

export default { getGamificationStats };
