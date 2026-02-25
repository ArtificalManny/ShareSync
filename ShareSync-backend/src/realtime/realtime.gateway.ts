import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly realtime: RealtimeService) {}

  afterInit(server: Server) {
    // keep service in sync with the live socket server
    this.realtime.setServer(server);
  }

  // ─────────────────────────────────────────────────────────────
  // ✅ Compatibility Methods (to satisfy existing codebase)
  // ─────────────────────────────────────────────────────────────

  emitToProject(projectId: string, event: string, payload: any) {
    if (!projectId || !this.server) return;
    this.server.to(`project:${projectId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  // ─────────────────────────────────────────────────────────────
  // Rooms
  // ─────────────────────────────────────────────────────────────

  @SubscribeMessage('joinProject')
  async joinProject(
    @MessageBody() body: { projectId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.join(room);
    socket.emit('joinedProject', { room });
  }

  @SubscribeMessage('leaveProject')
  async leaveProject(
    @MessageBody() body: { projectId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.leave(room);
    socket.emit('leftProject', { room });
  }

  // Optional: if parts of your frontend already join user rooms
  @SubscribeMessage('joinUser')
  async joinUser(
    @MessageBody() body: { userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = body?.userId;
    if (!userId) return;

    const room = `user:${userId}`;
    await socket.join(room);
    socket.emit('joinedUser', { room });
  }

  @SubscribeMessage('leaveUser')
  async leaveUser(
    @MessageBody() body: { userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = body?.userId;
    if (!userId) return;

    const room = `user:${userId}`;
    await socket.leave(room);
    socket.emit('leftUser', { room });
  }

  // ─────────────────────────────────────────────────────────────
  // ✅ NEW: Generic Room Handlers for Spectator Sockets (Phase 4)
  // Catch strings emitted by useSocket's joinRoom/leaveRoom calls
  // ─────────────────────────────────────────────────────────────

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!room || typeof room !== 'string') return;
    
    // Safety check: Only allow generic joining for public spectator rooms 
    // or standard project rooms to prevent unauthorized snooping
    if (room.startsWith('public:project:') || room.startsWith('project:')) {
      await socket.join(room);
      socket.emit('joinedRoom', { room });
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!room || typeof room !== 'string') return;
    await socket.leave(room);
    socket.emit('leftRoom', { room });
  }
}
