import { type DiscoveryQuery, type DiscoveryResult } from "../types/discovery";
export declare function queryDiscoveryMongo(params: DiscoveryQuery): Promise<DiscoveryResult>;
type NativeArgs = {
    limit?: number;
    cursor?: string | null;
    timeRangeDays?: number;
    personalized?: boolean;
    userId?: string | null;
    onlyTransparent?: boolean;
};
export declare function queryDiscoveryMongoNative(db: any, { limit, cursor, timeRangeDays, personalized, userId, onlyTransparent }: NativeArgs): Promise<DiscoveryResult>;
export {};
