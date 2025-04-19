import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:54693', credentials: true } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) {}

  @SubscribeMessage('joinProject')
  handleJoinProject(client: any, projectId: string): void {
    client.join(projectId);
    console.log(`Client joined project room: ${projectId}`);
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(client: any, projectId: string): void {
    client.leave(projectId);
    console.log(`Client left project room: ${projectId}`);
  }

  async sendNotification(projectId: string, userId: string, message: string) {
    await this.notificationsService.createNotification(projectId, userId, message);
    this.server.to(projectId).emit('notification', { userId, message });
  }
}