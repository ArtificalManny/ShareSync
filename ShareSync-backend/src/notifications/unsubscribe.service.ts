import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { CryptoUtil } from '../common/utils/crypto';

export type UnsubscribeChannel = 'email';

export type UnsubscribePayload = {
  userId: string;
  channel: UnsubscribeChannel;
  ts: number;
};

@Injectable()
export class UnsubscribeService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly crypto: CryptoUtil,
  ) {}

  /**
   * Create a stateless one-click unsubscribe token.
   * The token is HMAC-signed using UNSUBSCRIBE_SECRET.
   */
  createToken(userId: string, channel: UnsubscribeChannel = 'email'): string {
    if (!userId) throw new BadRequestException('Missing userId');
    return this.crypto.signToken<UnsubscribePayload>(
      { userId, channel, ts: Date.now() },
      'UNSUBSCRIBE_SECRET',
    );
  }

  /**
   * Verify token + return payload.
   * Optionally enforces max age via UNSUBSCRIBE_TOKEN_MAX_DAYS (default 180).
   */
  verifyToken(token: string): UnsubscribePayload {
    const payload = this.crypto.verifyToken<UnsubscribePayload>(token, 'UNSUBSCRIBE_SECRET');

    if (!payload?.userId || !payload?.channel || !payload?.ts) {
      throw new BadRequestException('Invalid unsubscribe token payload');
    }
    if (payload.channel !== 'email') {
      throw new BadRequestException('Unsupported unsubscribe channel');
    }

    const maxAgeDays = Number(process.env.UNSUBSCRIBE_TOKEN_MAX_DAYS || 180);
    const ageMs = Date.now() - Number(payload.ts);
    if (Number.isFinite(maxAgeDays) && ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Unsubscribe token expired');
    }

    return payload;
  }

  /**
   * One-click unsubscribe: flips optIn=false and disables email channel in prefs.
   * Safe even if notificationChannels/notificationPrefs objects do not exist yet.
   */
  async oneClickUnsubscribe(token: string) {
    const payload = this.verifyToken(token);
    const userId = new Types.ObjectId(payload.userId);

    const user = await this.users.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

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
      channel: payload.channel,
      message: 'You have been unsubscribed from ShareSync email updates.',
    };
  }
}
