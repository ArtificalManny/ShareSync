import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly realtime: RealtimeService) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
    const rooms = socket.data.projectRooms || new Set();

    rooms.forEach((projectId: string) => {
      this.server.to(`project:${projectId}`).emit('userLeft', { userId, id: userId, sessionId: socket.id });
    });
  }

  emitToProject(projectId: string, event: string, payload: any) {
    if (!projectId || !this.server) return;
    this.server.to(`project:${projectId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  // ─────────────────────────────────────────────────────────────
  // ⭐ THE GHOST PROTOCOL: Filter invisible users!
  // ─────────────────────────────────────────────────────────────

  @SubscribeMessage('joinProject')
  async joinProject(
    @MessageBody() body: { projectId?: string; userId?: string; isInvisible?: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.join(room);

    socket.data.projectRooms = socket.data.projectRooms || new Set();
    socket.data.projectRooms.add(projectId);
    
    // ⭐ Save the privacy state to the active connection
    socket.data.isInvisible = body.isInvisible === true;

    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || body?.userId || socket.id;
    const userPayload = { userId, id: userId, sessionId: socket.id, status: 'online' };

    // 1. Broadcast presence ONLY if the user is not a ghost
    if (!socket.data.isInvisible) {
      socket.to(room).emit('userJoined', userPayload);
    }

    // 2. Fetch active users, explicitly filtering out the ghosts
    try {
      const sockets = await this.server.in(room).fetchSockets();
      const users = sockets
        .filter(s => !s.data.isInvisible) // �� Exclude invisible users!
        .map(s => {
          const sUserId = s.handshake?.auth?.userId || s.handshake?.query?.userId || s.id;
          return { userId: sUserId, id: sUserId, sessionId: s.id, status: 'online' };
        });
      socket.emit('room:users', users);
    } catch (e) {
      console.error("Failed to fetch sockets for room users", e);
    }

    socket.emit('joinedProject', { room });
  }

  // ⭐ NEW: Listen for live settings toggles without needing a refresh
  @SubscribeMessage('presence:update')
  async updatePresence(
    @MessageBody() body: { projectId?: string; isInvisible?: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    socket.data.isInvisible = body.isInvisible === true;

    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
    const payload = { userId, id: userId, sessionId: socket.id, status: 'online' };

    if (socket.data.isInvisible) {
      // User turned on Invisible Mode -> Tell everyone they left
      socket.to(room).emit('userLeft', payload);
    } else {
      // User turned off Invisible Mode -> Tell everyone they appeared
      socket.to(room).emit('userJoined', payload);
    }
  }

  @SubscribeMessage('leaveProject')
  async leaveProject(
    @MessageBody() body: { projectId?: string; userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || body?.userId || socket.id;
    
    socket.to(room).emit('userLeft', { userId, id: userId, sessionId: socket.id });

    if (socket.data.projectRooms) {
       socket.data.projectRooms.delete(projectId);
    }

    await socket.leave(room);
    socket.emit('leftProject', { room });
  }

  @SubscribeMessage('joinUser')
  async joinUser( @MessageBody() body: { userId?: string }, @ConnectedSocket() socket: Socket ) {
    const userId = body?.userId;
    if (!userId) return;
    const room = `user:${userId}`;
    await socket.join(room);
    socket.emit('joinedUser', { room });
  }

  @SubscribeMessage('leaveUser')
  async leaveUser( @MessageBody() body: { userId?: string }, @ConnectedSocket() socket: Socket ) {
    const userId = body?.userId;
    if (!userId) return;
    const room = `user:${userId}`;
    await socket.leave(room);
    socket.emit('leftUser', { room });
  }

  @SubscribeMessage('joinRoom')
  async joinRoom( @MessageBody() room: string, @ConnectedSocket() socket: Socket ) {
    if (!room || typeof room !== 'string') return;
    if (room.startsWith('public:project:') || room.startsWith('project:')) {
      await socket.join(room);
      if (room.startsWith('project:')) {
        const projectId = room.split(':')[1];
        socket.data.projectRooms = socket.data.projectRooms || new Set();
        socket.data.projectRooms.add(projectId);

        const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
        const userPayload = { userId, id: userId, sessionId: socket.id, status: 'online' };

        if (!socket.data.isInvisible) {
           socket.to(room).emit('userJoined', userPayload);
        }

        try {
          const sockets = await this.server.in(room).fetchSockets();
          const users = sockets
             .filter(s => !s.data.isInvisible)
             .map(s => {
            const sUserId = s.handshake?.auth?.userId || s.handshake?.query?.userId || s.id;
            return { userId: sUserId, id: sUserId, sessionId: s.id, status: 'online' };
          });
          socket.emit('room:users', users);
        } catch (e) {}
      }
      socket.emit('joinedRoom', { room });
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom( @MessageBody() room: string, @ConnectedSocket() socket: Socket ) {
    if (!room || typeof room !== 'string') return;
    if (room.startsWith('project:')) {
      const projectId = room.split(':')[1];
      const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
      socket.to(room).emit('userLeft', { userId, id: userId, sessionId: socket.id });
      if (socket.data.projectRooms) {
         socket.data.projectRooms.delete(projectId);
      }
    }
    await socket.leave(room);
    socket.emit('leftRoom', { room });
  }
}
