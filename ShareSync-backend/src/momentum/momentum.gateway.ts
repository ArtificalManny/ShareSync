// src/momentum/momentum.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { MomentumService } from './momentum.service';
  import { PresenceService } from '../presence/presence.service';
  
  @WebSocketGateway({ cors: true })
  export class MomentumGateway {
    @WebSocketServer() server: Server;
  
    private clients = new Map<string, Socket>();
  
    constructor(
      private momentumService: MomentumService,
      private presenceService: PresenceService,
    ) {}
  
    afterInit() {
      console.log('Momentum WebSocket Gateway initialized');
    }
  
    handleConnection(client: Socket) {
      const userId = client.handshake.query.userId as string;
      if (userId) {
        this.clients.set(userId, client);
        this.presenceService.setOnline(userId, true);
        this.broadcastPresence();
      }
    }
  
    handleDisconnect(client: Socket) {
      const userId = client.handshake.query.userId as string;
      if (userId) {
        this.clients.delete(userId);
        this.presenceService.setOnline(userId, false);
        this.broadcastPresence();
      }
    }
  
    @SubscribeMessage('streak:get')
    async handleStreakGet(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
      const streak = await this.momentumService.getStreak(data.userId);
      client.emit('streak:update', streak);
    }
  
    @SubscribeMessage('leaderboard:get')
    async handleLeaderboardGet(@MessageBody() data: { limit?: number }) {
      const leaderboard = await this.momentumService.getLeaderboard(data.limit);
      this.server.emit('leaderboard:update', leaderboard);
    }
  
    @SubscribeMessage('momentum:get')
    async handleMomentumGet(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
      const score = await this.momentumService.getMomentumScore(data.userId);
      client.emit('momentum:update', score);
    }
  
    // Broadcast presence
    private broadcastPresence() {
      const online = this.presenceService.getOnlineUsers();
      this.server.emit('presence:update', { users: online, totalOnline: online.length });
    }
  }