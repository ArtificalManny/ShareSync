import { Injectable } from '@nestjs/common';

/**
 * NotificationPolicy (Phase 4)
 * Central place to decide channel routing rules.
 *
 * MVP goal:
 * - Keep in-app first
 * - Email is digest-only for now
 * - Block noisy/low-signal types from digest if you want
 *
 * This file is intentionally conservative and easy to expand.
 */
@Injectable()
export class NotificationPolicy {
  /**
   * Return true if this notification should appear inside an EMAIL DIGEST.
   * You can tighten this later by checking type/priority/etc.
   */
  allowInEmailDigest(n: any): boolean {
    const type = String(n?.type || '').toLowerCase();
    const priority = String(n?.priority || '').toLowerCase();

    // Example: never email extremely spammy realtime chatter
    const blockedTypes = new Set<string>([
      'message_mention', // you may decide to keep this in-app only initially
    ]);

    if (blockedTypes.has(type)) return false;

    // Example: always allow high/urgent
    if (priority === 'high' || priority === 'urgent') return true;

    // Default allow (safe MVP)
    return true;
  }

  /**
   * Future: Decide real-time email/sms. Keep false for MVP.
   */
  allowInstantEmail(_n: any): boolean {
    return false;
  }

  allowInstantSms(_n: any): boolean {
    return false;
  }
}
