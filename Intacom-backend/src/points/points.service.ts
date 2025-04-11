import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class PointsService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async addPoints(userId: string, points: number, reason?: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $inc: { points } });
    if (reason) {
      console.log(`Added ${points} points to user ${userId} for reason: ${reason}`);
    }
  }

  async getLeaderboard(): Promise<User[]> {
    return this.userModel
      .find()
      .sort({ points: -1 }) // Sort by points in descending order
      .limit(10) // Get top 10 users
      .exec();
  }
}