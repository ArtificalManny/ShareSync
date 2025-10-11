// src/types/discovery.ts
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
