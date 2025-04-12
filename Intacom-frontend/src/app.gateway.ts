import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// From "The Effortless Experience": Enable real-time project collaboration.
@WebSocketGateway({ cors: true })
export class AppGateway {
  @WebSocketServer() server: Server;

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