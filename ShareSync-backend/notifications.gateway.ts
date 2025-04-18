import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../notification.schema';

@WebSocketGateway({ cors: { origin: 'http://localhost:54693', credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(@InjectModel('Notification') private notificationModel: Model<Notification>) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  async sendNotification(userId: string, message: string, type: string, relatedId?: string) {
    const notification = new this.notificationModel({
      userId,
      message,
      timestamp: new Date(),
      read: false,
      type,
      relatedId,
    });
    await notification.save();
    this.server.to(userId).emit('notification', notification);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(userId);
    console.log(`Client ${client.id} joined room ${userId}`);
  }
}