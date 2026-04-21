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

  private resolveSocketUserId(socket: Socket, fallbackUserId?: string) {
    return (
      socket.handshake?.auth?.userId ||
      socket.handshake?.query?.userId ||
      fallbackUserId ||
      socket.id
    );
  }

  private buildUserPayload(socket: Socket, fallbackUserId?: string) {
    const userId = this.resolveSocketUserId(socket, fallbackUserId);
    return {
      userId,
      id: userId,
      sessionId: socket.id,
      status: 'online',
    };
  }

  private ensureProjectRoomSet(socket: Socket) {
    if (!socket.data.projectRooms || !(socket.data.projectRooms instanceof Set)) {
      socket.data.projectRooms = new Set<string>();
    }
  }

  private async emitProjectRoomUsers(projectIdOrRoom: string) {
    if (!this.server || !projectIdOrRoom) return;

    const room = projectIdOrRoom.startsWith('project:')
      ? projectIdOrRoom
      : `project:${projectIdOrRoom}`;

    try {
      const sockets = await this.server.in(room).fetchSockets();

      const users = sockets
        .filter((s) => !s.data?.isInvisible)
        .map((s) => {
          const sUserId =
            s.handshake?.auth?.userId ||
            s.handshake?.query?.userId ||
            s.id;

          return {
            userId: sUserId,
            id: sUserId,
            sessionId: s.id,
            status: 'online',
          };
        });

      this.server.to(room).emit('room:users', users);
    } catch (e) {
      console.error(`[RealtimeGateway] Failed to emit room users for ${room}`, e);
    }
  }

  async handleDisconnect(socket: Socket) {
    const userPayload = this.buildUserPayload(socket);
    const rooms: Set<string> = socket.data.projectRooms || new Set<string>();

    for (const projectId of rooms) {
      const room = `project:${projectId}`;

      if (!socket.data?.isInvisible) {
        this.server.to(room).emit('userLeft', userPayload);
      }

      await this.emitProjectRoomUsers(projectId);
    }
  }

  emitToProject(projectId: string, event: string, payload: any) {
    if (!projectId || !this.server) return;
    this.server.to(`project:${projectId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  @SubscribeMessage('joinProject')
  async joinProject(
    @MessageBody() body: { projectId?: string; userId?: string; isInvisible?: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    await socket.join(room);

    this.ensureProjectRoomSet(socket);
    socket.data.projectRooms.add(projectId);
    socket.data.isInvisible = body?.isInvisible === true;

    const userPayload = this.buildUserPayload(socket, body?.userId);

    if (!socket.data.isInvisible) {
      socket.to(room).emit('userJoined', userPayload);
    }

    await this.emitProjectRoomUsers(projectId);

    socket.emit('joinedProject', { room });
  }

  @SubscribeMessage('presence:update')
  async updatePresence(
    @MessageBody() body: { projectId?: string; isInvisible?: boolean; status?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    const wasInvisible = socket.data?.isInvisible === true;
    const nowInvisible = body?.isInvisible === true;

    socket.data.isInvisible = nowInvisible;

    const payload = this.buildUserPayload(socket);

    if (wasInvisible && !nowInvisible) {
      socket.to(room).emit('userJoined', payload);
    } else if (!wasInvisible && nowInvisible) {
      socket.to(room).emit('userLeft', payload);
    }

    await this.emitProjectRoomUsers(projectId);
  }

  @SubscribeMessage('leaveProject')
  async leaveProject(
    @MessageBody() body: { projectId?: string; userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = body?.projectId;
    if (!projectId) return;

    const room = `project:${projectId}`;
    const userPayload = this.buildUserPayload(socket, body?.userId);

    if (!socket.data?.isInvisible) {
      socket.to(room).emit('userLeft', userPayload);
    }

    if (socket.data.projectRooms) {
      socket.data.projectRooms.delete(projectId);
    }

    await socket.leave(room);
    await this.emitProjectRoomUsers(projectId);

    socket.emit('leftProject', { room });
  }

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

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!room || typeof room !== 'string') return;

    if (room.startsWith('public:project:') || room.startsWith('project:')) {
      await socket.join(room);

      if (room.startsWith('project:')) {
        const projectId = room.split(':')[1];

        this.ensureProjectRoomSet(socket);
        socket.data.projectRooms.add(projectId);

        const userPayload = this.buildUserPayload(socket);

        if (!socket.data?.isInvisible) {
          socket.to(room).emit('userJoined', userPayload);
        }

        await this.emitProjectRoomUsers(projectId);
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

    if (room.startsWith('project:')) {
      const projectId = room.split(':')[1];
      const userPayload = this.buildUserPayload(socket);

      if (!socket.data?.isInvisible) {
        socket.to(room).emit('userLeft', userPayload);
      }

      if (socket.data.projectRooms) {
        socket.data.projectRooms.delete(projectId);
      }

      await socket.leave(room);
      await this.emitProjectRoomUsers(projectId);
      socket.emit('leftRoom', { room });
      return;
    }

    await socket.leave(room);
    socket.emit('leftRoom', { room });
  }
}
