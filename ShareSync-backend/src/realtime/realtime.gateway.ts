import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';
import { LiveAccessService, MEMBER_STANDINGS, PUBLIC_STANDINGS } from './live-access.service';

// openshare-live-access-v1 (R52b)
//
// The main live-update channel. Every connection signs in with its token, the
// same way the web requests do; one that can't is closed. A socket then joins:
//   - its own person room (user:<id>), and no one else's;
//   - a project room (project:<id>) only as the owner or a member;
//   - a public project room (public:project:<id>) only while the project is
//     public or listed and not archived, or as a member.
// Everything sent to these rooms goes through LiveAccessService, which checks
// each recipient again at the moment of sending. Who is who comes from the
// verified sign-in, never from what the client says.

const PROJECT_ID = /^[0-9a-f]{24}$/i;

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly live: LiveAccessService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  async handleConnection(socket: Socket) {
    const userId = await this.signedIn(socket);
    if (userId) await socket.join(`user:${userId}`);
  }

  // The signed-in account, or '' after closing a socket that has none.
  private async signedIn(socket: Socket): Promise<string> {
    const userId = await this.live.signIn(socket, this.jwt);
    if (!userId) socket.disconnect(true);
    return userId;
  }

  private projectIdOf(value: unknown): string {
    return typeof value === 'string' && PROJECT_ID.test(value) ? value.toLowerCase() : '';
  }

  private buildUserPayload(socket: Socket) {
    const userId = String(socket.data?.userId || socket.id);
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

  // Who is in the project room, sent only to the people allowed to be there.
  private async emitProjectRoomUsers(projectId: string) {
    if (!this.server || !projectId) return;

    try {
      const sockets = await this.live.allowedInProject(this.server, projectId);
      const users = sockets
        .filter((s) => !s.data?.isInvisible)
        .map((s) => {
          const sUserId = String(s.data?.userId || s.id);
          return {
            userId: sUserId,
            id: sUserId,
            sessionId: s.id,
            status: 'online',
          };
        });

      for (const s of sockets) s.emit('room:users', users);
    } catch (e) {
      console.error(`[RealtimeGateway] Failed to emit room users for project:${projectId}`, e);
    }
  }

  // Joins a project room after checking membership, and tells the room.
  private async enterProjectRoom(socket: Socket, userId: string, projectId: string): Promise<boolean> {
    if (!MEMBER_STANDINGS.has(await this.live.standingOf(projectId, userId))) return false;

    const room = `project:${projectId}`;
    await socket.join(room);

    this.ensureProjectRoomSet(socket);
    socket.data.projectRooms.add(projectId);

    if (!socket.data?.isInvisible) {
      await this.live.sendToProject(this.server, projectId, 'userJoined', this.buildUserPayload(socket), socket.id);
    }

    await this.emitProjectRoomUsers(projectId);
    return true;
  }

  async handleDisconnect(socket: Socket) {
    const userPayload = this.buildUserPayload(socket);
    const rooms: Set<string> = socket.data?.projectRooms || new Set<string>();

    for (const projectId of rooms) {
      if (!socket.data?.isInvisible) {
        await this.live.sendToProject(this.server, projectId, 'userLeft', userPayload);
      }

      await this.emitProjectRoomUsers(projectId);
    }
  }

  // An account that is deleted loses its live connections at once.
  @OnEvent('account.deleted')
  handleAccountDeleted(payload: { userId?: string }) {
    const userId = String(payload?.userId || '').trim();
    if (!userId || !this.server) return;
    this.server.in(`user:${userId}`).disconnectSockets(true);
  }

  emitToProject(projectId: string, event: string, payload: any) {
    if (!projectId || !this.server) return;
    void this.live.sendToProject(this.server, projectId, event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    void this.live.sendToUser(this.server, userId, event, payload);
  }

  @SubscribeMessage('joinProject')
  async joinProject(
    @MessageBody() body: { projectId?: string; userId?: string; isInvisible?: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = await this.signedIn(socket);
    const projectId = this.projectIdOf(body?.projectId);
    if (!userId || !projectId) return;

    socket.data.isInvisible = body?.isInvisible === true;
    if (!(await this.enterProjectRoom(socket, userId, projectId))) return;

    socket.emit('joinedProject', { room: `project:${projectId}` });
  }

  @SubscribeMessage('presence:update')
  async updatePresence(
    @MessageBody() body: { projectId?: string; isInvisible?: boolean; status?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = await this.signedIn(socket);
    const projectId = this.projectIdOf(body?.projectId);
    if (!userId || !projectId) return;

    // Only for a project room this socket is in.
    if (!socket.rooms.has(`project:${projectId}`)) return;

    const wasInvisible = socket.data?.isInvisible === true;
    const nowInvisible = body?.isInvisible === true;

    socket.data.isInvisible = nowInvisible;

    const payload = this.buildUserPayload(socket);

    if (wasInvisible && !nowInvisible) {
      await this.live.sendToProject(this.server, projectId, 'userJoined', payload, socket.id);
    } else if (!wasInvisible && nowInvisible) {
      await this.live.sendToProject(this.server, projectId, 'userLeft', payload, socket.id);
    }

    await this.emitProjectRoomUsers(projectId);
  }

  @SubscribeMessage('leaveProject')
  async leaveProject(
    @MessageBody() body: { projectId?: string; userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const projectId = this.projectIdOf(body?.projectId);
    if (!projectId) return;

    const room = `project:${projectId}`;
    const wasIn = socket.rooms.has(room);

    if (wasIn && !socket.data?.isInvisible) {
      await this.live.sendToProject(this.server, projectId, 'userLeft', this.buildUserPayload(socket), socket.id);
    }

    if (socket.data.projectRooms) {
      socket.data.projectRooms.delete(projectId);
    }

    await socket.leave(room);
    if (wasIn) await this.emitProjectRoomUsers(projectId);

    socket.emit('leftProject', { room });
  }

  @SubscribeMessage('joinUser')
  async joinUser(
    @MessageBody() body: { userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = await this.signedIn(socket);
    if (!userId) return;

    // Only your own room, whatever ID was asked for.
    const asked = String(body?.userId ?? userId).trim().toLowerCase();
    if (asked !== userId) return;

    const room = `user:${userId}`;
    await socket.join(room);
    socket.emit('joinedUser', { room });
  }

  @SubscribeMessage('leaveUser')
  async leaveUser(
    @MessageBody() body: { userId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = String(socket.data?.userId || '');
    const asked = String(body?.userId ?? userId).trim().toLowerCase();
    if (!userId || asked !== userId) return;

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

    const match = /^(public:)?project:([0-9a-f]{24})$/i.exec(room.trim());
    if (!match) return;

    const userId = await this.signedIn(socket);
    if (!userId) return;

    const projectId = match[2].toLowerCase();

    if (match[1]) {
      if (!PUBLIC_STANDINGS.has(await this.live.standingOf(projectId, userId))) return;
      const publicRoom = `public:project:${projectId}`;
      await socket.join(publicRoom);
      socket.emit('joinedRoom', { room: publicRoom });
      return;
    }

    if (!(await this.enterProjectRoom(socket, userId, projectId))) return;
    socket.emit('joinedRoom', { room: `project:${projectId}` });
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!room || typeof room !== 'string') return;

    if (room.startsWith('project:')) {
      const projectId = this.projectIdOf(room.split(':')[1]);
      const wasIn = socket.rooms.has(room);

      if (projectId && wasIn && !socket.data?.isInvisible) {
        await this.live.sendToProject(this.server, projectId, 'userLeft', this.buildUserPayload(socket), socket.id);
      }

      if (socket.data.projectRooms && projectId) {
        socket.data.projectRooms.delete(projectId);
      }

      await socket.leave(room);
      if (projectId && wasIn) await this.emitProjectRoomUsers(projectId);
      socket.emit('leftRoom', { room });
      return;
    }

    await socket.leave(room);
    socket.emit('leftRoom', { room });
  }
}
