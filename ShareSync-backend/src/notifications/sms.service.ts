import { Injectable } from '@nestjs/common';

type TwilioClient = {
  messages: {
    create: (args: { body: string; from?: string; to: string }) => Promise<any>;
  };
};

type SmsChannelState = {
  verified?: boolean;
  optIn?: boolean;
  phoneNumber?: string;
};

type UserLike = {
  phoneNumber?: string;
  notificationChannels?: {
    sms?: SmsChannelState;
  };
  notificationPrefs?: {
    channels?: {
      sms?: boolean;
    };
  };
};

@Injectable()
export class SmsService {
  private client?: TwilioClient;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      try {
        // Optional dependency: won't break build if twilio isn't installed yet
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
      } catch (_err) {
        // Intentionally silent-ish: SMS remains disabled
        console.warn('Twilio package not installed - SMS notifications disabled');
        this.client = undefined;
      }
    }
  }

  /**
   * PHASE 4 RULE:
   * - No SMS until user has verified + opted in
   * - Keep in-app as primary; SMS is best-effort + gated
   */
  async sendNotification(user: UserLike, notification: any): Promise<void> {
    const to = this.resolvePhone(user);

    // If no phone, or not verified/opted-in, do nothing (SAFE)
    if (!to || !this.isSmsAllowed(user)) return;

    if (!this.client) {
      // Not configured -> silently skip
      console.warn('Twilio not configured - SMS notification skipped');
      return;
    }

    const message = `${this.getEmojiForType(notification?.type)} ${notification?.title || 'Update'}\n${notification?.message || ''}`.trim();

    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  /**
   * Verification send (code generation).
   * Note: storing/validating the code is handled elsewhere in Phase 4 (controller/service).
   */
  async verifyPhoneNumber(phoneNumber: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.client.messages.create({
      body: `Your ShareSync verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return code;
  }

  private resolvePhone(user: UserLike): string | null {
    const p =
      user?.notificationChannels?.sms?.phoneNumber ||
      user?.phoneNumber ||
      null;

    if (!p) return null;
    return String(p).trim();
  }

  private isSmsAllowed(user: UserLike): boolean {
    const verified = Boolean(user?.notificationChannels?.sms?.verified);
    const optIn = Boolean(user?.notificationChannels?.sms?.optIn);

    // Optional global/channel prefs (default false if undefined to be strict)
    const channelEnabled = user?.notificationPrefs?.channels?.sms;
    const channelOk = channelEnabled === undefined ? true : Boolean(channelEnabled);

    return verified && optIn && channelOk;
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      mention: '@',
      deadline_reminder: '⏰',
      announcement_created: '📢',
      task_assigned: '📋',
      file_uploaded: '📎',
      comment_added: '💬',
      project_invite: '👋',
      follow_created: '⭐',
    };
    return emojiMap[type] || '🔔';
  }
}
