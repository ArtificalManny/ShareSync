import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private client: Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
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
      'mention': '@',
      'deadline_reminder': '⏰',
      'announcement_created': '📢',
    };
    return emojiMap[type] || '🔔';
  }

  async verifyPhoneNumber(phoneNumber: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    // Send verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.client.messages.create({
      body: `Your ShareSync verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return code;
  }
}
