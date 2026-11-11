import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import type { Server, Socket } from 'socket.io';
import { validateWsSession } from '../auth/ws-session.validator';
import {
  OBJECT_ID,
  PROJECT_STANDING_FIELDS,
  ProjectStanding,
  idText,
  projectStanding,
} from '../common/guards/project-standing';

// openshare-live-access-v1 (R52b)
//
// Who may receive live updates. Used by the main live-update channel ('/'), the
// focus gateway and the notifications channel ('/notifications').
//
// Signing in: a socket proves who it is once, with the same token and session
// check as the web requests (signature, expiry, the account still exists and its
// sessions weren't revoked). The result is kept on the socket.
//
// Sending: every update for a project or a person is checked at the moment it is
// sent, against the database as it is then:
//   - a project room: only the owner and members (viewers included) get it;
//   - a public project room: also anyone signed in, while the project is public
//     or listed and not archived;
//   - a person's room: only that person.
// A socket that may no longer have an update is taken out of the room, and a
// socket whose session was revoked (password changed, account deleted, signed
// out everywhere) is disconnected. If the database can't be asked, nobody gets
// the update: an outage never becomes access.

type LiveSocket = Pick<Socket, 'id' | 'handshake' | 'data' | 'emit' | 'disconnect'> & {
  leave(room: string): unknown;
};

const PROJECT_PROJECTION = Object.fromEntries(
  PROJECT_STANDING_FIELDS.split(' ').map((field) => [field, 1]),
);

export const MEMBER_STANDINGS: ReadonlySet<ProjectStanding> = new Set(['writer', 'reader']);
export const PUBLIC_STANDINGS: ReadonlySet<ProjectStanding> = new Set(['writer', 'reader', 'spectator']);

function tokenOf(socket: Pick<Socket, 'handshake'>): string {
  const fromAuth = (socket.handshake as any)?.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth.trim()) return fromAuth.trim();
  const header = socket.handshake?.headers?.authorization;
  if (typeof header === 'string' && /^Bearer\s+\S+$/i.test(header.trim())) {
    return header.trim().replace(/^Bearer\s+/i, '');
  }
  return '';
}

@Injectable()
export class LiveAccessService {
  private readonly logger = new Logger(LiveAccessService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  // Sign a socket in once. Returns the account ID, or '' when the socket has no
  // valid, current session. Safe to call from every handler: the first call does
  // the work and later calls wait for the same answer.
  signIn(socket: LiveSocket, jwt: JwtService): Promise<string> {
    const data = (socket.data = socket.data || {});
    if (!data.liveSignIn) {
      data.liveSignIn = (async () => {
        try {
          const token = tokenOf(socket);
          if (!token) return '';
          const payload: any = jwt.verify(token);
          const session = await validateWsSession(this.connection, payload);
          const userId = idText(session.userId);
          if (!userId) return '';
          data.userId = userId;
          data.tokenVersion = Number(payload?.tokenVersion ?? 0);
          return userId;
        } catch {
          return '';
        }
      })();
    }
    return data.liveSignIn;
  }

  // Where the user stands in the project now. A malformed ID, a missing project
  // or a database error all count as 'none'.
  async standingOf(projectId: unknown, userId: string): Promise<ProjectStanding> {
    if (typeof projectId !== 'string' || !OBJECT_ID.test(projectId) || !idText(userId)) return 'none';
    const project = await this.loadProject(projectId).catch(() => null);
    return projectStanding(project, userId);
  }

  async sendToProject(server: Server | undefined, projectId: unknown, event: string, payload: unknown, exceptSocketId?: string) {
    await this.send(server, 'project', projectId, event, payload, exceptSocketId);
  }

  async sendToPublicProject(server: Server | undefined, projectId: unknown, event: string, payload: unknown) {
    await this.send(server, 'public', projectId, event, payload);
  }

  async sendToUser(server: Server | undefined, userId: unknown, event: string, payload: unknown) {
    await this.send(server, 'user', userId, event, payload);
  }

  // The sockets in a project room that may be there now (see allowedIn).
  allowedInProject(server: Server | undefined, projectId: unknown): Promise<LiveSocket[]> {
    return this.allowedIn(server, 'project', projectId);
  }

  private async loadProject(projectId: string): Promise<any> {
    return this.connection
      .collection('projects')
      .findOne({ _id: new Types.ObjectId(projectId) }, { projection: PROJECT_PROJECTION });
  }

  // The current tokenVersion of each account, or null if the database can't be asked.
  private async sessionsOf(userIds: string[]): Promise<Map<string, number> | null> {
    const ids = [...new Set(userIds.filter((id) => OBJECT_ID.test(id)))];
    const sessions = new Map<string, number>();
    if (!ids.length) return sessions;
    try {
      const users = await this.connection
        .collection('users')
        .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } }, { projection: { tokenVersion: 1 } })
        .toArray();
      for (const user of users) sessions.set(idText(user._id), Number((user as any).tokenVersion ?? 0));
      return sessions;
    } catch {
      return null;
    }
  }

  private async send(
    server: Server | undefined,
    kind: 'project' | 'public' | 'user',
    target: unknown,
    event: string,
    payload: unknown,
    exceptSocketId?: string,
  ) {
    if (typeof event !== 'string' || !event) return;
    const sockets = await this.allowedIn(server, kind, target);
    for (const socket of sockets) {
      if (socket.id !== exceptSocketId) socket.emit(event, payload);
    }
  }

  // The sockets in a room that may have its updates now. Everyone else is taken
  // out of the room, and a socket whose session was revoked is disconnected. If
  // the database can't be asked, the answer is nobody and nothing is changed.
  private async allowedIn(server: Server | undefined, kind: 'project' | 'public' | 'user', target: unknown): Promise<LiveSocket[]> {
    const id = typeof target === 'string' && OBJECT_ID.test(target) ? target.toLowerCase() : '';
    if (!server || !id) return [];
    const room = kind === 'project' ? `project:${id}` : kind === 'public' ? `public:project:${id}` : `user:${id}`;

    try {
      const sockets = (await server.in(room).fetchSockets()) as unknown as LiveSocket[];
      if (!sockets.length) return [];

      let project: any = null;
      if (kind !== 'user') {
        try {
          project = await this.loadProject(id);
        } catch {
          return [];
        }
      }
      const sessions = await this.sessionsOf(sockets.map((s) => String(s.data?.userId || '')));
      if (!sessions) return [];

      const allowed: LiveSocket[] = [];
      for (const socket of sockets) {
        const userId = idText(socket.data?.userId);
        const current = userId ? sessions.get(userId) : undefined;
        if (!userId || current === undefined || current !== Number(socket.data?.tokenVersion ?? Number.NaN)) {
          // No account, or its sessions were revoked since this socket signed in.
          socket.disconnect(true);
          continue;
        }

        let ok: boolean;
        if (kind === 'user') ok = userId === id;
        else if (kind === 'project') ok = MEMBER_STANDINGS.has(projectStanding(project, userId));
        else ok = PUBLIC_STANDINGS.has(projectStanding(project, userId));

        if (ok) allowed.push(socket);
        else socket.leave(room);
      }
      return allowed;
    } catch (error) {
      this.logger.warn(`Live update to a ${kind} room skipped: ${(error as Error)?.message || error}`);
      return [];
    }
  }
}
