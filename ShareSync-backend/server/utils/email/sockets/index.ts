// server/utils/email/sockets/index.ts
import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { registerDiscoveryRoom } from "./publish";

let ioSingleton: Server | null = null;

/**
 * Initialize Socket.IO on an existing HTTP server.
 * Call this once in your server bootstrap (after creating httpServer).
 */
export function initSocketIOServer(httpServer: HttpServer): Server {
  if (ioSingleton) return ioSingleton;

  const io = new Server(httpServer, {
    cors: {
      origin: true, // adjust if you need a specific origin
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  registerDiscoveryRoom(io); // joins/leave handlers for "discovery" room
  ioSingleton = io;
  return io;
}

/** Access the singleton Socket.IO instance, if initialized. */
export function getIO(): Server {
  if (!ioSingleton) {
    throw new Error("[sockets] Socket.IO not initialized. Call initSocketIOServer(httpServer) first.");
  }
  return ioSingleton;
}
