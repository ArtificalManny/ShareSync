import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';

import { User, UserDocument } from '../user/schemas/user.schema';

type UnsubPayload = {
  userId: string;
  channel: 'email';
  ts: number;
};

@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(@InjectModel(User.name) private readonly users: Model<UserDocument>) {}

  /**
   * Public unsubscribe
   * GET /api/unsubscribe/:token
   *
   * Token is stateless: base64url(payload).base64url(sig)
   * sig = HMAC_SHA256(UNSUBSCRIBE_SECRET, base64url(payload))
   */
  @Get(':token')
  async unsubscribe(@Param('token') token: string) {
    const payload = this.verifyToken(token);

    // Only email for Phase 4 MVP
    if (payload.channel !== 'email') {
      throw new BadRequestException('Unsupported channel');
    }

    const userId = new Types.ObjectId(payload.userId);

    await this.users.updateOne(
      { _id: userId },
      {
        $set: {
          'notificationChannels.email.optIn': false,
          'notificationPrefs.channels.email': false,
        },
      },
    );

    return {
      ok: true,
      message: 'You have been unsubscribed from ShareSync email updates.',
    };
  }

  private verifyToken(token: string): UnsubPayload {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) throw new BadRequestException('Invalid token');

    const [payloadB64, sigB64] = parts;

    const secret = process.env.UNSUBSCRIBE_SECRET;
    if (!secret) {
      throw new BadRequestException('Unsubscribe not configured');
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    if (!this.safeEqual(expectedSig, sigB64)) {
      throw new BadRequestException('Invalid token signature');
    }

    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    let payload: any;
    try {
      payload = JSON.parse(json);
    } catch {
      throw new BadRequestException('Invalid token payload');
    }

    if (!payload?.userId || !payload?.channel || !payload?.ts) {
      throw new BadRequestException('Invalid token payload');
    }

    // Optional: token max age (e.g., 180 days)
    const maxAgeDays = Number(process.env.UNSUBSCRIBE_TOKEN_MAX_DAYS || 180);
    const ageMs = Date.now() - Number(payload.ts);
    if (Number.isFinite(maxAgeDays) && ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Token expired');
    }

    return payload as UnsubPayload;
  }

  private safeEqual(a: string, b: string): boolean {
    const aa = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  }
}
