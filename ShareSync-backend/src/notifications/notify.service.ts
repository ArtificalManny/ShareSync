// src/notifications/notify.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

type QueueItem = {
  userId: string;
  to: string;                 // email address
  subject: string;
  html: string;               // or text; keeping html for richer digest
  reason?: string;            // e.g., 'mention', 'digest', etc.
  ts: number;                 // enqueue timestamp
};

type InAppPayload = {
  userId: string;
  title?: string;
  message: string;
  href?: string;
  priority?: 'mention' | 'digest' | 'info' | 'alert';
  meta?: Record<string, any>;
};

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  // In-memory queue (swap to DB/Redis later if needed)
  private emailQueue: QueueItem[] = [];

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    // If you have a gateway for realtime, inject it here and forward inApp events.
    // private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * In-app notification (already used in your controllers).
   * Keep behavior stable — if you have a Realtime gateway, emit here.
   */
  inApp(payload: InAppPayload) {
    try {
      // If you have a websocket gateway:
      // this.gateway.emitToUser(payload.userId, 'notify:inapp', payload);
      this.logger.debug(`In-app notify -> ${payload.userId}: ${payload.message}`);
    } catch (e) {
      this.logger.warn(`inApp notify failed: ${e?.message || e}`);
    }
  }

  /**
   * Queue a single email for later batching.
   * Use this for mentions, digest items, etc.
   */
  queueEmail(item: Omit<QueueItem, 'ts'>) {
    const qi: QueueItem = { ...item, ts: Date.now() };
    this.emailQueue.push(qi);
  }

  /**
   * Flush queued emails by user (simple daily/5-min batch).
   * Respects user.emailOptOut. Returns summary for logging.
   */
  async flushEmailBatches(): Promise<{ sent: number; skippedOptOut: number; empty: boolean }> {
    if (this.emailQueue.length === 0) {
      return { sent: 0, skippedOptOut: 0, empty: true };
    }

    // Group by userId
    const byUser = new Map<string, QueueItem[]>();
    for (const it of this.emailQueue) {
      if (!it?.userId || !it?.to) continue;
      const arr = byUser.get(it.userId) || [];
      arr.push(it);
      byUser.set(it.userId, arr);
    }

    let sent = 0;
    let skippedOptOut = 0;

    // Fetch user opt-outs in one go
    const userIds = Array.from(byUser.keys());
    const users = await this.userModel
      .find({ _id: { $in: userIds } }, { _id: 1, emailOptOut: 1, email: 1 })
      .lean();

    const userMap = new Map<string, { emailOptOut?: boolean; email?: string }>();
    for (const u of users) {
      userMap.set(String(u._id), { emailOptOut: !!u.emailOptOut, email: u.email });
    }

    // Process per user
    for (const [uid, items] of byUser.entries()) {
      const u = userMap.get(uid);
      const optOut = u?.emailOptOut === true;

      if (optOut) {
        skippedOptOut += items.length;
        continue;
      }

      // Build a digest email body
      const lines = items
        .sort((a, b) => a.ts - b.ts)
        .map((it) => {
          // keep it readable; you can render an HTML template here
          const when = new Date(it.ts).toLocaleString();
          const reason = it.reason ? ` (${it.reason})` : '';
          return `<li><div><strong>${when}</strong>${reason}</div><div>${it.subject}</div></li>`;
        });

      const html =
        `<div style="font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif">` +
        `<h2>ShareSync Notifications</h2>` +
        `<p>You have ${items.length} new updates:</p>` +
        `<ul>${lines.join('')}</ul>` +
        `<hr/><p style="color:#6b7280;font-size:12px">You can disable these emails in Settings.</p>` +
        `</div>`;

      // Choose a single subject for the batch
      const subject =
        items.length === 1 ? items[0].subject : `You have ${items.length} new updates`;

      // Send
      try {
        // Prefer the queued "to" address; fall back to user.email from DB
        const to = items[0].to || u?.email;
        if (!to) {
          this.logger.warn(`flushEmailBatches: missing recipient email for user ${uid}`);
          continue;
        }
        await this.sendEmail(to, subject, html);
        sent += items.length;
      } catch (e) {
        this.logger.error(`sendEmail failed for user ${uid}: ${e?.message || e}`);
      }
    }

    // Clear queue after flush
    this.emailQueue = [];

    this.logger.log(`flushEmailBatches -> sent:${sent} skipped(opt-out):${skippedOptOut}`);
    return { sent, skippedOptOut, empty: false };
    }

  /**
   * Minimal email sender — replace with your real MailerService integration.
   * You can inject a MailerService and call it here.
   */
  private async sendEmail(to: string, subject: string, html: string) {
    // TODO: integrate e.g. @nestjs-modules/mailer or a custom provider
    // For now, log to console as a stub.
    this.logger.log(`[MAIL] → ${to} :: ${subject}`);
    this.logger.verbose(html);
    // Simulate async IO
    await new Promise((r) => setTimeout(r, 5));
  }
}
