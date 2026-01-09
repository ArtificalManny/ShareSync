"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishDiscoveryBump = publishDiscoveryBump;
exports.registerDiscoveryRoom = registerDiscoveryRoom;
function publishDiscoveryBump(io, projectId, partial) {
    io.to("discovery").emit("discovery:projectUpdated", { projectId, partial });
}
function registerDiscoveryRoom(io) {
    io.on("connection", (socket) => {
        socket.on("join:discovery", () => {
            socket.join("discovery");
        });
        socket.on("leave:discovery", () => {
            socket.leave("discovery");
        });
        socket.on("disconnect", () => {
        });
    });
}
//# sourceMappingURL=publish.js.map