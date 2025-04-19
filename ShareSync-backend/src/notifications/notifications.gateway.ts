import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:54693', credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private notificationsService: NotificationsService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    console.log('User joined:', userId);
    client.join(userId);
  }

  async sendNotification(userId: string, notification: { message: string; timestamp: Date; read: boolean; type: string; relatedId?: string }) {
    console.log('Sending notification to user:', userId, 'notification:', notification);
    await this.notificationsService.create(userId, notification);
    this.server.to(userId).emit('notification', notification);
  }
}