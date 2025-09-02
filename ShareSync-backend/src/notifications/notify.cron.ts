// src/notifications/notify.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { NotifyService } from './notify.service';

@Injectable()
export class NotifyCron {
  private readonly logger = new Logger(NotifyCron.name);
  private isFlushing = false;

  constructor(private readonly notify: NotifyService) {}

  /** Warm-up flush ~30s after boot to clear any backlog after a restart. */
  @Timeout(30_000)
  async warmupFlush() {
    await this.safeFlush('startup');
  }

  /** Main cadence: every 5 minutes flush any queued emails. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async fiveMinuteFlush() {
    await this.safeFlush('5m');
  }

  /**
   * Optional daily digest at 8:00 AM server time.
   * Only runs if NotifyService provides a runDailyDigests() method.
   */
  @Cron('0 8 * * *')
  async morningDigest() {
    try {
      const maybeNotify: any = this.notify; // avoid TS error for optional method
      if (typeof maybeNotify.runDailyDigests !== 'function') return;
      const res = await maybeNotify.runDailyDigests();
      this.logger.log(
        `Daily digests processed${res ? `: ${JSON.stringify(res)}` : ''}`,
      );
    } catch (err: any) {
      this.logger.error(
        `runDailyDigests failed: ${err?.message || err}`,
        err?.stack,
      );
    }
  }

  // ---- internals ----
  private async safeFlush(label: string) {
    if (this.isFlushing) return; // prevent overlap if a previous run is slow
    this.isFlushing = true;
    try {
      const result = await this.notify.flushEmailBatches();
      const count =
        (result && typeof (result as any).count === 'number'
          ? (result as any).count
          : undefined) ?? 'unknown';
      this.logger.log(`flushEmailBatches (${label}) complete. Count=${count}`);
    } catch (err: any) {
      this.logger.error(
        `flushEmailBatches (${label}) failed: ${err?.message || err}`,
        err?.stack,
      );
    } finally {
      this.isFlushing = false;
    }
  }
}