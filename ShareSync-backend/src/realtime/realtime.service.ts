import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import { LiveAccessService } from './live-access.service';

// openshare-live-access-v1 (R52b): every send goes through LiveAccessService,
// which checks each recipient at the moment of sending.

const ROOM = /^(public:project|project|user):([0-9a-f]{24})$/i;

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server?: Server;

  constructor(private readonly live: LiveAccessService) {}

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Realtime server attached ✅');
  }

  // Emit to canonical project room: project:{projectId}
  projectEmit(projectId: string, event: string, payload: any) {
    if (!projectId || !this.server) return;
    void this.live.sendToProject(this.server, projectId, event, payload);
  }

  // Emit to canonical user room: user:{userId}
  userEmit(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    void this.live.sendToUser(this.server, userId, event, payload);
  }

  // Emit to an explicit room string: project:{id}, public:project:{id} or user:{id}.
  // Any other room name is not used by the app and is ignored.
  roomEmit(room: string, event: string, payload: any) {
    if (!room || !this.server) return;
    const match = ROOM.exec(String(room));
    if (!match) return;
    const kind = match[1].toLowerCase();
    const id = match[2].toLowerCase();
    if (kind === 'project') void this.live.sendToProject(this.server, id, event, payload);
    else if (kind === 'user') void this.live.sendToUser(this.server, id, event, payload);
    else void this.live.sendToPublicProject(this.server, id, event, payload);
  }

  // ✅ Step 5 naming aliases (no breaking changes)
  emitToProjectRoom(projectId: string, event: string, payload: any) {
    return this.projectEmit(projectId, event, payload);
  }

  emitToUserRoom(userId: string, event: string, payload: any) {
    return this.userEmit(userId, event, payload);
  }
}
