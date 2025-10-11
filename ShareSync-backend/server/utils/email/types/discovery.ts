// server/types/discovery.ts
export type MixMode = "trending" | "personalized" | "blended";

export type { TimeRangeKey, ProjectSignals } from "../discovery/score";

export interface DiscoveryQuery {
  cursor?: string | null;
  limit?: number;
  mix?: MixMode;
  personalized?: boolean;
  timeRange?: import("../discovery/score").TimeRangeKey;
  onlyTransparent?: boolean;
  followingBoost?: boolean;
  userId?: string | null;
}

export interface DiscoveryItem {
  id: string;
  title: string;
  icon?: { kind: string; value: string };
  public: boolean;
  score: number;
  signals: import("../discovery/score").ProjectSignals;
  lastActivityAt: string; // ISO
  transparency: number;
}

export interface DiscoveryResult {
  items: DiscoveryItem[];
  nextCursor: string | null;
}