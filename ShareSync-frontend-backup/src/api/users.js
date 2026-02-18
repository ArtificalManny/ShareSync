import client from "./client";

export async function fetchMe() {
  const res = await client.get("/users/me");
  return res.data;
}

export async function fetchActivitySummary() {
  const res = await client.get("/users/activity-summary");
  return res.data;
}

export async function fetchPublicProfile(username) {
  const res = await client.get(`/users/public/${encodeURIComponent(username)}`);
  return res.data;
}

export async function fetchUserActivity(userId, limit = 80) {
  const res = await client.get(`/users/${userId}/activity`, {
    params: { limit },
  });
  return res.data;
}
