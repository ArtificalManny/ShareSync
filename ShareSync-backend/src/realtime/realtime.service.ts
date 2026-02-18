import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Realtime server attached ✅');
  }

  // Emit to canonical project room: project:{projectId}
  projectEmit(projectId: string, event: string, payload: any) {
    if (!projectId || !this.server) return;
    this.server.to(`project:${projectId}`).emit(event, payload);
  }

  // Emit to canonical user room: user:{userId}
  userEmit(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  // ✅ NEW: emit to ANY explicit room string (e.g. public:project:{projectId})
  // This fixes TS error: "Property 'roomEmit' does not exist on type 'RealtimeService'."
  roomEmit(room: string, event: string, payload: any) {
    if (!room || !this.server) return;
    this.server.to(room).emit(event, payload);
  }

  // ✅ Step 5 naming aliases (no breaking changes)
  emitToProjectRoom(projectId: string, event: string, payload: any) {
    return this.projectEmit(projectId, event, payload);
  }

  emitToUserRoom(userId: string, event: string, payload: any) {
    return this.userEmit(userId, event, payload);
  }
}
