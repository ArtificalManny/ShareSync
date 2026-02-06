import { Injectable } from '@nestjs/common';

type TwilioClient = {
  messages: {
    create: (args: { body: string; from?: string; to: string }) => Promise<any>;
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
      } catch (err) {
        console.warn('Twilio package not installed - SMS notifications disabled');
        this.client = undefined;
      }
    }
  }

  async sendNotification(phoneNumber: string, notification: any): Promise<void> {
    if (!this.client) {
      console.warn('Twilio not configured - SMS notification skipped');
      return;
    }

    const message = `${this.getEmojiForType(notification.type)} ${notification.title}\n${notification.message}`;

    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      mention: '@',
      deadline_reminder: '⏰',
      announcement_created: '📢',
    };
    return emojiMap[type] || '🔔';
  }

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
}
