// server/sockets/publish.ts
// Emits lean "discovery:projectUpdated" bumps to clients in the "discovery" room.

import type { Server, Socket } from "socket.io";

export type DiscoveryMetricsPartial = {
  metrics?: {
    velocityPerWeek?: number;
    xpDelta7d?: number;
    reactions7d?: number;
    updatedAt?: string; // ISO string
  };
  // You can extend with other partial fields (title, icon, etc.) as your UI needs
};

export function publishDiscoveryBump(
  io: Server,
  projectId: string,
  partial: DiscoveryMetricsPartial
) {
  io.to("discovery").emit("discovery:projectUpdated", { projectId, partial });
}

/**
 * Optional helper to register simple room join/leave handlers.
 * Call this once when you initialize your Socket.IO server.
 *
 * Example:
 *   import { createServer } from "http";
 *   import { Server } from "socket.io";
 *   import { registerDiscoveryRoom } from "./sockets/publish";
 *
 *   const httpServer = createServer(app);
 *   const io = new Server(httpServer, { cors: { origin: "*" } });
 *   registerDiscoveryRoom(io);
 */
export function registerDiscoveryRoom(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Client can explicitly join the "discovery" room
    socket.on("join:discovery", () => {
      socket.join("discovery");
    });

    // Allow clients to leave if they unmount the feed
    socket.on("leave:discovery", () => {
      socket.leave("discovery");
    });

    // (Optional) clean up on disconnect
    socket.on("disconnect", () => {
      // nothing special; Socket.IO removes socket from rooms automatically
    });
  });
}
