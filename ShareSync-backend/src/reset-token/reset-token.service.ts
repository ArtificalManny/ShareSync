import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResetToken } from './reset-token.schema';
import * as crypto from 'crypto';

@Injectable()
export class ResetTokenService {
  constructor(@InjectModel('ResetToken') private resetTokenModel: Model<ResetToken>) {}

  async createToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    const resetToken = new this.resetTokenModel({ userId, token, expiresAt });
    await resetToken.save();
    return token;
  }

  async findToken(token: string): Promise<ResetToken | null> {
    return this.resetTokenModel.findOne({ token }).exec();
  }

  async deleteToken(token: string): Promise<void> {
    await this.resetTokenModel.deleteOne({ token }).exec();
  }
}