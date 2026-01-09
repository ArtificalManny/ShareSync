import type { DiscoveryResult } from "../types/discovery";
type Args = {
    limit?: number;
    cursorId?: string | null;
    timeRangeDays?: number;
    personalized?: boolean;
    userId?: string | null;
};
export declare function queryDiscoverySql({ limit, cursorId, timeRangeDays, personalized, userId, }: Args): Promise<DiscoveryResult>;
export {};
