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
    // keep service in sync with the live socket server
    this.realtime.setServer(server);
  }

  // ⭐ NEW: Handle abrupt disconnections (e.g., closing the Incognito tab)
  handleDisconnect(socket: Socket) {
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
    const rooms = socket.data.projectRooms || new Set();

    // Broadcast to every project room this user was in that they vanished
    rooms.forEach((projectId: string) => {
      this.server.to(`project:${projectId}`).emit('userLeft', { userId, id: userId, sessionId: socket.id });
    });
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
    @MessageBody() body: { projectId?: string; userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.join(room);

    // ⭐ Track the room in memory so we know where to send disconnect alerts
    socket.data.projectRooms = socket.data.projectRooms || new Set();
    socket.data.projectRooms.add(projectId);

    // ⭐ Extract user info & broadcast presence
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || body?.userId || socket.id;
    const userPayload = { userId, id: userId, sessionId: socket.id, status: 'online' };

    // 1. Broadcast to EVERYONE ELSE in the room that this user joined
    socket.to(room).emit('userJoined', userPayload);

    // 2. Send the NEW user a list of everyone ALREADY in the room
    try {
      const sockets = await this.server.in(room).fetchSockets();
      const users = sockets.map(s => {
        const sUserId = s.handshake?.auth?.userId || s.handshake?.query?.userId || s.id;
        return { userId: sUserId, id: sUserId, sessionId: s.id, status: 'online' };
      });
      socket.emit('room:users', users);
    } catch (e) {
      console.error("Failed to fetch sockets for room users", e);
    }

    socket.emit('joinedProject', { room });
  }

  @SubscribeMessage('leaveProject')
  async leaveProject(
    @MessageBody() body: { projectId?: string; userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;

    // ⭐ Broadcast departure to the room
    const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || body?.userId || socket.id;
    socket.to(room).emit('userLeft', { userId, id: userId, sessionId: socket.id });

    if (socket.data.projectRooms) {
       socket.data.projectRooms.delete(projectId);
    }

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

      // ⭐ Mirror the live presence logic if this is a project room (Fail-safe)
      if (room.startsWith('project:')) {
        const projectId = room.split(':')[1];
        socket.data.projectRooms = socket.data.projectRooms || new Set();
        socket.data.projectRooms.add(projectId);

        const userId = socket.handshake?.auth?.userId || socket.handshake?.query?.userId || socket.id;
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
          console.error("Failed to fetch sockets for room users", e);
        }
      }

      socket.emit('joinedRoom', { room });
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!room || typeof room !== 'string') return;
    
    // ⭐ Mirror the live presence departure logic if this is a project room
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
