import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';

// MVP in-app + stubbed email queue
type NotifyPayload = {
  userId: string;               // recipient
  title?: string;
  message: string;
  href?: string;                // deep link
  meta?: Record<string, any>;
  priority?: 'normal'|'mention';
};

@Injectable()
export class NotifyService {
  private emailQueue: NotifyPayload[] = []; // naive in-memory batch

  constructor(private readonly realtime: RealtimeGateway) {}

  /** in-app toast via socket */
  inApp(payload: NotifyPayload) {
    this.realtime.emitToUser(payload.userId, 'notify:new', {
      title: payload.title || 'Notification',
      message: payload.message,
      href: payload.href || null,
      meta: payload.meta || {},
      ts: new Date().toISOString(),
    });
  }

  /** queue for email digest (daily/weekly) */
  queueEmail(payload: NotifyPayload) {
    this.emailQueue.push(payload);
  }

  /** called by a cron job (stub here) */
  flushEmailBatches() {
    // TODO: group by userId, render emails, send via your MailerModule
    this.emailQueue = [];
  }
}
