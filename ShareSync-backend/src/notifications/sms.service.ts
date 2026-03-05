// src/notifications/sms.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SMS SERVICE: Phone verification and SMS notifications
// Phase 9: Fully integrated Twilio Verify & Notification Engine
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly enabled: boolean;
  private readonly verifyEnabled: boolean;
  private client: any = null;

  constructor() {
    // Check if SMS is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    this.enabled = Boolean(accountSid && authToken && fromNumber);
    this.verifyEnabled = Boolean(accountSid && authToken && verifySid);

    if (!this.enabled && !this.verifyEnabled) {
      this.logger.warn('SMS not configured (TWILIO_* env vars missing) - SMS features operating in DEV MOCK mode');
    }

    if (this.enabled || this.verifyEnabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
      } catch {
        this.logger.warn('Twilio package not installed - SMS sending skipped');
        this.enabled = false;
        this.verifyEnabled = false;
      }
    }
  }

  /**
   * Send verification code to phone number (Uses Twilio Verify API)
   */
  async verifyPhoneNumber(phoneNumber: string): Promise<string> {
    if (!this.verifyEnabled || !this.client) {
      const code = this.generateCode6();
      this.logger.warn(`[DEV] SMS verify disabled - mock verification code for ${phoneNumber}: ${code}`);
      return code; // Return mock code for development fallback
    }

    try {
      const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
      const verification = await this.client.verify.v2
        .services(verifySid)
        .verifications.create({ to: phoneNumber, channel: 'sms' });
        
      this.logger.log(`Verification SMS sent to ${phoneNumber}. Status: ${verification.status}`);
      return 'pending';
    } catch (error) {
      this.logger.error('Failed to send SMS verification via Twilio:', error);
      throw error;
    }
  }

  /**
   * Check verification code (Uses Twilio Verify API)
   */
  async checkVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!this.verifyEnabled || !this.client) {
      this.logger.warn(`[DEV] SMS verify disabled - auto-approving code ${code} for ${phoneNumber}`);
      return true; // Auto-approve in dev environment if Twilio isn't set up
    }

    try {
      const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
      const verificationCheck = await this.client.verify.v2
        .services(verifySid)
        .verificationChecks.create({ to: phoneNumber, code });
        
      return verificationCheck.status === 'approved';
    } catch (error) {
      this.logger.error('Failed to check Twilio verification code:', error);
      return false;
    }
  }

  /**
   * Send a standard SMS notification (Non-OTP)
   */
  async sendNotification(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.enabled || !this.client) {
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
   * Internal: Send SMS via Twilio Messages API
   */
  private async sendSms(to: string, body: string): Promise<void> {
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    await this.client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    this.logger.log(`Standard SMS sent to ${to}`);
  }

  private generateCode6(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
