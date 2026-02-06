import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY API (your current controller expects these)
  // ─────────────────────────────────────────────────────────────────────────────
  async getUserNotifications(_userId: string, _query?: any) {
    return [];
  }

  async deleteNotification(_id: string, _userId: string) {
    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NEWER API (in case you switch controllers later)
  // ─────────────────────────────────────────────────────────────────────────────
  async findByUser(_userId: string, _query?: any) {
    return { notifications: [], total: 0, unread: 0 };
  }

  async getUnreadCount(_userId: string) {
    return 0;
  }

  async getCountByType(_userId: string) {
    return {};
  }

  async markAsRead(_id: string, _userId: string) {
    return true;
  }

  async markAllAsRead(_userId: string) {
    return 0;
  }

  async markAsClicked(_id: string, _userId: string) {
    return true;
  }

  async dismiss(_id: string, _userId: string) {
    return true;
  }

  async delete(_id: string, _userId: string) {
    return true;
  }

  async deleteAllRead(_userId: string) {
    return 0;
  }
}
