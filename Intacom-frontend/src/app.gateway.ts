import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AppGateway {
  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(client: Socket, data: { projectId: string }): void {
    console.log(`Client ${client.id} joined project ${data.projectId}`);
    client.join(data.projectId);
    this.server.to(data.projectId).emit('userJoined', { userId: client.id });
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(client: Socket, data: { projectId: string }): void {
    console.log(`Client ${client.id} left project ${data.projectId}`);
    client.leave(data.projectId);
    this.server.to(data.projectId).emit('userLeft', { userId: client.id });
  }
}