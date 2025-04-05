var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
// src/app.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, } from '@nestjs/websockets';
import { Socket } from 'socket.io';
let AppGateway = class AppGateway {
    handleJoinProject(data, client) {
        client.join(`project_${data.projectId}`);
    }
};
__decorate([
    SubscribeMessage('joinProject'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinProject", null);
AppGateway = __decorate([
    WebSocketGateway({
        cors: {
            origin: '*',
        },
    })
], AppGateway);
export { AppGateway };
