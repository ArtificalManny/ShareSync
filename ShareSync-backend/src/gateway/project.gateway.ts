import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// If you already have a gateway, keep your existing decorators/ports.
// This will work with your existing IoAdapter in main.ts.
@WebSocketGateway({
  cors: {
    origin: true, // dev-friendly; your main.ts already has CORS for HTTP
    credentials: true,
  },
})
export class ProjectGateway {
  @WebSocketServer()
  server!: Server;

  // Client calls: socket.emit("joinProject", { projectId })
  @SubscribeMessage('joinProject')
  async onJoinProject(
    @MessageBody() body: { projectId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.join(room);

    // optional ack
    socket.emit('joinedProject', { room });
  }

  // Client calls: socket.emit("leaveProject", { projectId })
  @SubscribeMessage('leaveProject')
  async onLeaveProject(
    @MessageBody() body: { projectId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.leave(room);

    socket.emit('leftProject', { room });
  }

  // ✅ This is what your services/controllers call after task changes.
  emitTaskUpdated(projectId: string, task: any) {
    if (!projectId) return;
    this.server.to(`project:${projectId}`).emit('taskUpdated', task);
  }

  // Optional: if you also want delete events
  emitTaskDeleted(projectId: string, taskId: string) {
    if (!projectId || !taskId) return;
    this.server.to(`project:${projectId}`).emit('taskDeleted', { taskId });
  }
}
