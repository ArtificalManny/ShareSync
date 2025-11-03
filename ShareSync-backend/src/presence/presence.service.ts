// src/presence/presence.service.ts
import { Injectable } from '@nestjs/common';

interface OnlineUser {
  userId: string;
  name: string;
  avatar?: string;
  lastSeen: Date;
}

@Injectable()
export class PresenceService {
  private online = new Map<string, OnlineUser>();

  setOnline(userId: string, online: boolean, info?: { name: string; avatar?: string }) {
    if (online) {
      this.online.set(userId, {
        userId,
        name: info?.name || 'User',
        avatar: info?.avatar,
        lastSeen: new Date(),
      });
    } else {
      this.online.delete(userId);
    }
  }

  getOnlineUsers() {
    return Array.from(this.online.values());
  }
}