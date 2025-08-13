// src/realtime/realtime.service.ts
import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private gw: RealtimeGateway) {}

  projectEmit(projectId: string, event: string, payload: any) {
    if (!projectId) return;
    this.gw.emitToProject(projectId, event, payload);
  }

  userEmit(userId: string, event: string, payload: any) {
    if (!userId) return;
    this.gw.emitToUser(userId, event, payload);
  }
}
