"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let AppGateway = class AppGateway {
    afterInit(server) {
        console.log('WebSocket server initialized');
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    handleJoinProject(client, data) {
        console.log(`Client ${client.id} joined project ${data.projectId}`);
        client.join(data.projectId);
        this.server.to(data.projectId).emit('userJoined', { userId: client.id });
    }
    handleLeaveProject(client, data) {
        console.log(`Client ${client.id} left project ${data.projectId}`);
        client.leave(data.projectId);
        this.server.to(data.projectId).emit('userLeft', { userId: client.id });
    }
    handleJoinUser(client, data) {
        console.log(`Client ${client.id} joined user room ${data.userId}`);
        client.join(data.userId);
    }
    emitProjectCreated(project) {
        this.server.emit('projectCreated', project);
    }
    emitNotificationCreated(notification) {
        this.server.to(notification.userId).emit('notificationCreated', notification);
    }
    emitTaskCompleted(task) {
        this.server.to(task.assignedTo).emit('taskCompleted', task);
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinProject'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveProject'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleLeaveProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinUser'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinUser", null);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: 'http://localhost:54693', credentials: true } })
], AppGateway);
//# sourceMappingURL=app.gateway.js.map