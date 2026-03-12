import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ProjectGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleDisconnect(socket: Socket) {
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
    const rooms = socket.data.projectRooms || new Set();
    
    rooms.forEach((projectId: string) => {
      // ⭐ Include sessionId so the frontend knows exactly which tab closed
      this.server.to(`project:${projectId}`).emit('userLeft', { userId, id: userId, sessionId: socket.id });
    });
  }

  @SubscribeMessage('joinProject')
  async onJoinProject(
    @MessageBody() body: any,
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.join(room);

    socket.data.projectRooms = socket.data.projectRooms || new Set();
    socket.data.projectRooms.add(projectId);

    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || body?.userId || socket.id;
    
    // ⭐ Include sessionId to distinguish multiple tabs from the same user
    const userPayload = { userId, id: userId, sessionId: socket.id, status: 'online' };

    socket.to(room).emit('userJoined', userPayload);

    try {
      const sockets = await this.server.in(room).fetchSockets();
      const users = sockets.map(s => {
        const sUserId = s.handshake?.auth?.userId || s.handshake?.query?.userId || s.id;
        return { userId: sUserId, id: sUserId, sessionId: s.id, status: 'online' };
      });
      socket.emit('room:users', users);
    } catch (e) {
      console.error("Failed to fetch sockets", e);
    }

    socket.emit('joinedProject', { room });
  }

  @SubscribeMessage('leaveProject')
  async onLeaveProject(
    @MessageBody() body: any,
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || body?.userId || socket.id;
    
    // ⭐ Include sessionId
    socket.to(room).emit('userLeft', { userId, id: userId, sessionId: socket.id });

    if (socket.data.projectRooms) {
       socket.data.projectRooms.delete(projectId);
    }

    await socket.leave(room);
    socket.emit('leftProject', { room });
  }

  emitTaskUpdated(projectId: string, task: any) {
    if (!projectId) return;
    this.server.to(`project:${projectId}`).emit('taskUpdated', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    if (!projectId || !taskId) return;
    this.server.to(`project:${projectId}`).emit('taskDeleted', { taskId });
  }
}
