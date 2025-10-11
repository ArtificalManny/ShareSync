// src/api/discovery.ts
// Thin client wrapper around GET /api/discovery

export type MixMode = "trending" | "personalized" | "blended";

export interface ProjectSignals {
  velocityPerWeek: number;
  xpGrowth: number;
  reactions: number;
  transparency: number;
  inactivityHours: number;
}

export interface DiscoveryItem {
  id: string;
  title: string;
  icon?: { kind: string; value: string };
  public: boolean;
  score: number;
  signals: ProjectSignals;
  lastActivityAt: string;
  transparency: number;
}

export interface DiscoveryResponse {
  items: DiscoveryItem[];
  nextCursor: string | null;
}

export interface DiscoveryParams {
  cursor?: string | null;
  limit?: number; // default 20
  mix?: MixMode; // default "blended"
  personalized?: boolean; // default true
  timeRange?: "7d" | "30d" | "90d";
  onlyTransparent?: boolean;
  followingBoost?: boolean;
}

// If you have a centralized client, replace fetch with that.
// e.g. import api from "./client"; and use api.get(...)
const API_BASE = "/api/discovery";

export async function getDiscoveryFeed(
  params: DiscoveryParams = {}
): Promise<DiscoveryResponse> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.mix) q.set("mix", params.mix);
  if (params.personalized != null)
    q.set("personalized", String(params.personalized));
  if (params.timeRange) q.set("timeRange", params.timeRange);
  if (params.onlyTransparent != null)
    q.set("onlyTransparent", String(params.onlyTransparent));
  if (params.followingBoost != null)
    q.set("followingBoost", String(params.followingBoost));

  const url = q.toString() ? `${API_BASE}?${q.toString()}` : API_BASE;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Discovery fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as DiscoveryResponse;
  return data;
}
