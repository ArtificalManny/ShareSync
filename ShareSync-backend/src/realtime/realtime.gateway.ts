// backend/src/realtime/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:54693',
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  // Allow main.ts to inject the server
  setServer(io: Server) {
    this.server = io;
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { projectId?: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.projectId) {
      client.join(`project:${data.projectId}`);
    }
    if (data.userId) {
      client.join(`user:${data.userId}`);
    }
  }

  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() data: { projectId?: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.projectId) {
      client.leave(`project:${data.projectId}`);
    }
    if (data.userId) {
      client.leave(`user:${data.userId}`);
    }
  }

  emitToProject(projectId: string, event: string, data: any) {
    this.server?.to(`project:${projectId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server?.to(`user:${userId}`).emit(event, data);
  }
}