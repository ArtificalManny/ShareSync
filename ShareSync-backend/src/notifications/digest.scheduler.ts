import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../user/schemas/user.schema';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { NotificationPolicy } from './notification-policy';

/**
 * DigestScheduler (Phase 4)
 * - Safest MVP: digests only (daily/weekly)
 * - Email is gated:
 *   - channel verified + opt-in
 *   - prefs allow email
 *   - digest frequency not "off"
 *
 * IMPORTANT:
 * - This file does NOT change backend behavior unless ScheduleModule is enabled.
 * - Keep in-app first; digests only when stable.
 */
@Injectable()
export class DigestScheduler {
  private readonly logger = new Logger(DigestScheduler.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly notifications: NotificationsService,

    // Optional to prevent boot failure if EmailService wiring is incomplete
    @Optional() private readonly email?: EmailService,

    private readonly policy?: NotificationPolicy,
  ) {}

  /**
   * Daily digest run (9am server time).
   * Weekly digests are also sent on Mondays during this daily run.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runDaily() {
    await this.run({ mode: 'daily' });
  }

  /**
   * Weekly digest run (Mondays at 9am).
   * If you prefer a single schedule, you can remove this and keep only runDaily().
   */
  @Cron(CronExpression.EVERY_WEEK)
  async runWeekly() {
    // EVERY_WEEK fires at Sunday 00:00 by default. We'll still gate by user pref below.
    await this.run({ mode: 'weekly' });
  }

  private async run(args: { mode: 'daily' | 'weekly' }) {
    if (!this.email) {
      this.logger.warn('EmailService not wired — skipping digest run');
      return;
    }

    // Pull a limited user set to avoid huge scans.
    // This is intentionally conservative. Expand later with batching/cursors.
    const candidates = await this.users
      .find(
        {
          isActive: true,
          // If the object doesn't exist yet, user won't qualify (safe)
          'notificationChannels.email.verified': true,
          'notificationChannels.email.optIn': true,
          'notificationPrefs.channels.email': true,
          'notificationPrefs.digest.email': { $in: ['daily', 'weekly'] },
        },
        {
          _id: 1,
          email: 1,
          notificationPrefs: 1,
          notificationChannels: 1,
        },
      )
      .limit(500)
      .lean();

    if (!candidates || candidates.length === 0) {
      this.logger.log('No digest candidates found');
      return;
    }

    const today = new Date();
    const isMonday = today.getDay() === 1;

    for (const u of candidates) {
      const freq = (u as any)?.notificationPrefs?.digest?.email || 'weekly';

      // Decide if we should send this run
      const shouldSend =
        freq === args.mode ||
        (freq === 'weekly' && args.mode === 'daily' && isMonday); // weekly can piggyback daily Mondays

      if (!shouldSend) continue;

      const userId = u._id?.toString?.();
      const email = (u as any)?.notificationChannels?.email?.email || (u as any)?.email;

      if (!userId || !email) continue;

      // Pull unread notifications not yet digested
      const unread = await this.notifications.getUnreadForDigest(userId, {
        limit: 50,
        window: freq === 'daily' ? '1d' : '7d',
      });

      if (!unread || unread.length === 0) continue;

      // Optional: policy can prune by type/channel if you want tighter control
      const policy = this.policy || new NotificationPolicy();
      const filtered = unread.filter((n: any) => policy.allowInEmailDigest(n));

      if (filtered.length === 0) continue;

      try {
        await this.email.sendDailyDigest(
          { email },
          filtered.map((n: any) => ({
            title: n.title,
            message: n.body,
            projectId: n?.data?.projectId,
          })),
        );

        // Mark digested (safe even if schema doesn't declare digestedAt)
        await this.notifications.markDigested(filtered.map((n: any) => n._id?.toString?.() || n.id), userId);

        this.logger.log(`Digest sent: user=${userId} freq=${freq} count=${filtered.length}`);
      } catch (err) {
        this.logger.error(`Digest failed for user=${userId}`, err as any);
      }
    }
  }
}
