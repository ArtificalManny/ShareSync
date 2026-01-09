import type { Server } from "socket.io";
export type DiscoveryMetricsPartial = {
    metrics?: {
        velocityPerWeek?: number;
        xpDelta7d?: number;
        reactions7d?: number;
        updatedAt?: string;
    };
};
export declare function publishDiscoveryBump(io: Server, projectId: string, partial: DiscoveryMetricsPartial): void;
export declare function registerDiscoveryRoom(io: Server): void;
