import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
export declare function initSocketIOServer(httpServer: HttpServer): Server;
export declare function getIO(): Server;
