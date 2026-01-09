export type TimeRangeKey = "7d" | "30d" | "90d";
export interface ProjectSignals {
    velocityPerWeek: number;
    xpGrowth: number;
    reactions: number;
    transparency: number;
    inactivityHours: number;
}
export interface ScoreWeights {
    velocity: number;
    xpGrowth: number;
    reactions: number;
    transparency: number;
    inactivityPenaltyPer24h: number;
}
export declare const DEFAULT_WEIGHTS: ScoreWeights;
export declare function inactivityPenalty(inactivityHours: number, penaltyPer24h: number): number;
export declare function scoreProject(s: ProjectSignals, weights?: ScoreWeights): number;
export declare function weightsForMix(mix: "trending" | "personalized" | "blended"): ScoreWeights;
export declare function parseLimit(raw: any, fallback?: number, max?: number): number;
export declare function parseTimeRange(raw: any): TimeRangeKey;
export declare function windowStart(key: TimeRangeKey): Date;
export interface CursorPayload {
    score: number;
    lastActivity: string;
    id: string;
}
export declare function encodeCursor(c: CursorPayload): string;
export declare function decodeCursor(raw?: string | null): CursorPayload | null;
