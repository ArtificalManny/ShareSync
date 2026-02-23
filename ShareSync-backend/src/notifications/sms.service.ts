// src/notifications/sms.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SMS SERVICE: Phone verification and SMS notifications
// Phase 9: Stub implementation - integrate with Twilio/SNS when ready
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly enabled: boolean;

  constructor() {
    // Check if SMS is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    this.enabled = Boolean(accountSid && authToken && fromNumber);

    if (!this.enabled) {
      this.logger.warn('SMS not configured (TWILIO_* env vars missing) - SMS features disabled');
    }
  }

  /**
   * Send verification code to phone number
   * Returns the code that was sent (for verification)
   */
  async verifyPhoneNumber(phoneNumber: string): Promise<string> {
    const code = this.generateCode6();

    if (!this.enabled) {
      this.logger.warn(`[DEV] SMS disabled - verification code for ${phoneNumber}: ${code}`);
      return code;
    }

    try {
      await this.sendSms(phoneNumber, `Your ShareSync verification code is: ${code}`);
      return code;
    } catch (error) {
      this.logger.error('Failed to send SMS verification:', error);
      throw error;
    }
  }

  /**
   * Send an SMS notification
   */
  async sendNotification(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn(`[DEV] SMS disabled - would send to ${phoneNumber}: ${message}`);
      return false;
    }

    try {
      await this.sendSms(phoneNumber, message);
      return true;
    } catch (error) {
      this.logger.error('Failed to send SMS notification:', error);
      return false;
    }
  }

  /**
   * Internal: Send SMS via Twilio (or other provider)
   */
  private async sendSms(to: string, body: string): Promise<void> {
    // Twilio integration
    let twilio: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      twilio = require('twilio');
    } catch {
      this.logger.warn('Twilio package not installed - SMS sending skipped');
      return;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn('Twilio credentials not configured');
      return;
    }

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    this.logger.log(`SMS sent to ${to}`);
  }

  private generateCode6(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
