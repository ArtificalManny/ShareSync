// src/services/momentum.js
import client from "../api/client";
import { track } from "../utils/telemetry";

/**
 * Momentum API service
 * Handles streak, leaderboard, and momentum score
 */

export async function getStreak() {
  try {
    const res = await client.get("/momentum/streak");
    track("momentum_streak_fetched");
    return res.data;
  } catch (err) {
    console.error("Failed to fetch streak", err);
    throw err;
  }
}

export async function getLeaderboard(limit = 10) {
  try {
    const res = await client.get("/momentum/leaderboard", { params: { limit } });
    track("momentum_leaderboard_fetched", { limit });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch leaderboard", err);
    throw err;
  }
}

export async function getMomentumScore() {
  try {
    const res = await client.get("/momentum/score");
    track("momentum_score_fetched");
    return res.data;
  } catch (err) {
    console.error("Failed to fetch momentum score", err);
    throw err;
  }
}