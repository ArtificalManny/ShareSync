import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';

import { User, UserDocument } from '../user/schemas/user.schema';
import {
  NotificationVerification,
  NotificationVerificationDocument,
  VerificationChannel,
} from './schemas/notification-verification.schema';

import { SmsService } from './sms.service';

type StartEmailArgs = { userId: string; email: string };
type StartSmsArgs = { userId: string; phoneNumber: string };

type VerifyArgs = { userId: string; channel: VerificationChannel; destination: string; code: string };

type OptInArgs = {
  userId: string;
  channel: 'email' | 'sms';
  optIn: boolean;
};

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 6;

@Injectable()
export class NotificationChannelsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(NotificationVerification.name)
    private readonly verifs: Model<NotificationVerificationDocument>,
    private readonly sms: SmsService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // START EMAIL VERIFICATION
  // POST /api/notifications/channels/email/start
  // ─────────────────────────────────────────────────────────────
  async startEmailVerification(args: StartEmailArgs) {
    const userId = new Types.ObjectId(args.userId);
    const email = String(args.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid email');
    }

    // Ensure user exists
    const user = await this.users.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const code = this.generateCode6();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    // Invalidate prior pending codes for same user+channel+destination
    await this.verifs.deleteMany({ userId, channel: 'email', destination: email });

    await this.verifs.create({
      userId,
      channel: 'email',
      destination: email,
      codeHash: this.hashCode(code),
      expiresAt,
      attempts: 0,
    });

    const sent = await this.trySendEmailCode(email, code);

    // Never return the code in production
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

    return {
      ok: true,
      channel: 'email',
      destination: email,
      expiresAt: expiresAt.toISOString(),
      sent,
      ...(isProd ? {} : { devCode: sent ? undefined : code }),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // START SMS VERIFICATION
  // POST /api/notifications/channels/sms/start
  // ─────────────────────────────────────────────────────────────
  async startSmsVerification(args: StartSmsArgs) {
    const userId = new Types.ObjectId(args.userId);
    const phoneNumber = String(args.phoneNumber || '').trim();

    if (!phoneNumber || phoneNumber.length < 8) {
      throw new BadRequestException('Invalid phone number');
    }

    const user = await this.users.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    // Let SmsService send and return the code (verification is allowed even before opt-in)
    const code = await this.sms.verifyPhoneNumber(phoneNumber);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await this.verifs.deleteMany({ userId, channel: 'sms', destination: phoneNumber });

    await this.verifs.create({
      userId,
      channel: 'sms',
      destination: phoneNumber,
      codeHash: this.hashCode(code),
      expiresAt,
      attempts: 0,
    });

    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

    return {
      ok: true,
      channel: 'sms',
      destination: phoneNumber,
      expiresAt: expiresAt.toISOString(),
      sent: true,
      ...(isProd ? {} : { devCode: undefined }), // SMS already sent; no dev code needed
    };
  }

  // ─────────────────────────────────────────────────────────────
  // VERIFY (EMAIL/SMS)
  // POST /api/notifications/channels/:channel/verify
  // ─────────────────────────────────────────────────────────────
  async verifyCode(args: VerifyArgs) {
    const userId = new Types.ObjectId(args.userId);
    const channel = args.channel;
    const destination =
      channel === 'email'
        ? String(args.destination || '').trim().toLowerCase()
        : String(args.destination || '').trim();

    const code = String(args.code || '').trim();

    if (!code || code.length < 4) throw new BadRequestException('Invalid code');

    const doc = await this.verifs.findOne({ userId, channel, destination }).exec();
    if (!doc) throw new BadRequestException('No pending verification found');

    if (doc.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Please restart verification.');
    }

    if (doc.expiresAt.getTime() < Date.now()) {
      await this.verifs.deleteOne({ _id: doc._id });
      throw new BadRequestException('Code expired. Please restart verification.');
    }

    const expected = Buffer.from(doc.codeHash);
    const actual = Buffer.from(this.hashCode(code));

    // constant-time compare guard
    const match =
      expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

    await this.verifs.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } }).exec();

    if (!match) throw new BadRequestException('Incorrect code');

    // Mark user channel verified (do NOT auto-opt-in)
    const verifiedAt = new Date();

    if (channel === 'email') {
      await this.users.updateOne(
        { _id: userId },
        {
          $set: {
            'notificationChannels.email.email': destination,
            'notificationChannels.email.verified': true,
            'notificationChannels.email.verifiedAt': verifiedAt,
          },
          // keep optIn as-is (default false)
        },
      );
    } else {
      await this.users.updateOne(
        { _id: userId },
        {
          $set: {
            'notificationChannels.sms.phoneNumber': destination,
            'notificationChannels.sms.verified': true,
            'notificationChannels.sms.verifiedAt': verifiedAt,
          },
        },
      );
    }

    // Cleanup verification doc
    await this.verifs.deleteOne({ _id: doc._id }).exec();

    return {
      ok: true,
      channel,
      destination,
      verifiedAt: verifiedAt.toISOString(),
      optIn: false,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // OPT-IN TO A VERIFIED CHANNEL
  // PATCH /api/notifications/channels/:channel/opt-in
  // ─────────────────────────────────────────────────────────────
  async setOptIn(args: OptInArgs) {
    const userId = new Types.ObjectId(args.userId);
    const channel = args.channel;
    const optIn = Boolean(args.optIn);

    const user = await this.users.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    if (channel === 'email') {
      const verified = Boolean((user as any)?.notificationChannels?.email?.verified);
      if (!verified) throw new BadRequestException('Email not verified');

      await this.users.updateOne(
        { _id: userId },
        {
          $set: {
            'notificationChannels.email.optIn': optIn,
            'notificationPrefs.channels.email': optIn ? true : (user as any)?.notificationPrefs?.channels?.email ?? false,
          },
        },
      );
    } else if (channel === 'sms') {
      const verified = Boolean((user as any)?.notificationChannels?.sms?.verified);
      if (!verified) throw new BadRequestException('Phone not verified');

      await this.users.updateOne(
        { _id: userId },
        {
          $set: {
            'notificationChannels.sms.optIn': optIn,
            'notificationPrefs.channels.sms': optIn ? true : (user as any)?.notificationPrefs?.channels?.sms ?? false,
          },
        },
      );
    } else {
      throw new BadRequestException('Unsupported channel');
    }

    return { ok: true, channel, optIn };
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private generateCode6(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private hashCode(code: string): string {
    const secret = process.env.NOTIFICATION_CODE_SECRET || 'dev-secret-change-me';
    return crypto.createHash('sha256').update(`${secret}:${code}`).digest('hex');
  }

  private async trySendEmailCode(email: string, code: string): Promise<boolean> {
    const subject = 'Your ShareSync verification code';
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:20px">
        <h2 style="margin:0 0 12px 0">Verify your email</h2>
        <p style="margin:0 0 16px 0;color:#334155">Your ShareSync verification code is:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:3px;margin:0 0 18px 0">${code}</div>
        <p style="margin:0;color:#64748b;font-size:12px">This code expires in ${CODE_TTL_MINUTES} minutes.</p>
      </div>
    `;
    const text = `Your code: ${code}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM || process.env.EMAIL_FROM;

    if (resendApiKey && resendFrom && typeof globalThis.fetch === 'function') {
      try {
        const response = await globalThis.fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: email,
            subject,
            html,
            text,
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          console.warn(`Resend verification email failed (${response.status}): ${body}`);
          return false;
        }

        return true;
      } catch (err) {
        console.error('Failed to send Resend verification email:', err);
        return false;
      }
    }

    // Fallback: optional SMTP/nodemailer support.
    let nodemailer: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nodemailer = require('nodemailer');
    } catch {
      console.warn('Nodemailer not installed - email verification code not sent');
      return false;
    }

    const host = process.env.SMTP_HOST;
    const portRaw = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !portRaw || !user || !pass) {
      console.warn('Email verification env not configured - code not sent');
      return false;
    }

    const port = Number(portRaw);
    if (!Number.isFinite(port)) return false;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const from = process.env.EMAIL_FROM || `"ShareSync" <${user}>`;

    try {
      await transporter.sendMail({ from, to: email, subject, html, text });
      return true;
    } catch (err) {
      console.error('Failed to send verification email:', err);
      return false;
    }
  }
}
