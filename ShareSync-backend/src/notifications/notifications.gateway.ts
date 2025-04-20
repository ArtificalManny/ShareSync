import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:54693',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  sendNotification(userId: string, message: string) {
    this.server.to(userId).emit('notification', message);
  }
}