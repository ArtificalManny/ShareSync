import { type ScoreWeights } from "../discovery/score";
export declare function bucketOf(key: string): number;
export declare function pickVariant(userKey: string | null): "A" | "B";
export declare function weightsForVariant(mix: "trending" | "personalized" | "blended", variant: "A" | "B"): ScoreWeights;
export declare function logDiscoveryTop5(ctx: {
    mix: string;
    variant: string;
    userId: string | null;
    weights: ScoreWeights;
    items: Array<{
        id: string;
        title: string;
        score: number;
    }>;
}): void;
