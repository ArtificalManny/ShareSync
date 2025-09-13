import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  // Clients join rooms like: user:{userId}, project:{projectId}
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    if (!data?.room) return;
    client.join(data.room);
    this.logger.debug(`Client ${client.id} joined ${data.room}`);
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    if (!data?.room) return;
    client.leave(data.room);
    this.logger.debug(`Client ${client.id} left ${data.room}`);
  }

  // Emission helpers
  emitToRoom(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }

  /** Emit to a specific project room: project:{projectId} */
  emitToProject(projectId: string, event: string, payload: any) {
    if (!projectId) return;
    this.emitToRoom(`project:${projectId}`, event, payload);
  }

  /** Emit to a specific user room: user:{userId} */
  emitToUser(userId: string, event: string, payload: any) {
    if (!userId) return;
    this.emitToRoom(`user:${userId}`, event, payload);
  }

  /** Convenience specifically for habits UI */
  emitHabitsUpdated(userId: string, projectId?: string) {
    if (userId) this.emitToUser(userId, 'habits:updated', { projectId: projectId || null });
  }
}
