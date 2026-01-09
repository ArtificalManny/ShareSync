"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketIOServer = initSocketIOServer;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const publish_1 = require("./publish");
let ioSingleton = null;
function initSocketIOServer(httpServer) {
    if (ioSingleton)
        return ioSingleton;
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });
    (0, publish_1.registerDiscoveryRoom)(io);
    ioSingleton = io;
    return io;
}
function getIO() {
    if (!ioSingleton) {
        throw new Error("[sockets] Socket.IO not initialized. Call initSocketIOServer(httpServer) first.");
    }
    return ioSingleton;
}
//# sourceMappingURL=index.js.map