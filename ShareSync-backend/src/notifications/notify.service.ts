// src/notifications/notify.service.ts
import { Injectable, Logger } from '@nestjs/common';

type AnyObj = Record<string, any>;

@Injectable()
export class NotifyService {
  private readonly log = new Logger(NotifyService.name);

  async sendEmail(to: string, subject: string, html: string) {
    this.log.debug(`email -> ${to} :: ${subject}`);
    return { ok: true };
  }

  async enqueueInApp(userId: string, payload: AnyObj) {
    this.log.debug(`in-app -> ${userId} :: ${JSON.stringify(payload)}`);
    return { ok: true };
  }

  async inApp(payload: { userId: string } & AnyObj) {
    const { userId, ...rest } = payload || ({} as any);
    if (!userId) {
      this.log.warn('inApp called without userId');
      return { ok: false };
    }
    return this.enqueueInApp(userId, rest);
  }

  // 👇 Allow extra fields (like userId) without failing type checks
  async queueEmail(args: { to: string; subject: string; html: string } & AnyObj) {
    const { to, subject, html } = args || ({} as any);
    if (!to) {
      this.log.warn('queueEmail called without "to"');
      return { ok: false };
    }
    return this.sendEmail(to, subject ?? '(no subject)', html ?? '');
  }

  async flushEmailBatches() {
    this.log.debug('flushEmailBatches noop');
    return { ok: true };
  }
}
