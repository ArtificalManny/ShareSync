import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class PointsService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async addPoints(userId: string, points: number): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }
    user.points += points;
    return user.save();
  }

  async getLeaderboard(): Promise<User[]> {
    return this.userModel.find().sort({ points: -1 }).limit(10).exec();
  }
}