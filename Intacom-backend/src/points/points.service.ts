import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class PointsService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  // Example method
  async addPoints(userId: string, points: number): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $inc: { points } });
  }
}