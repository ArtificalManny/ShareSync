import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: { username: string; email: string; password: string }) {
    const user = new this.userModel({ ...createUserDto, points: 0 });
    return user.save();
  }

  async addPoints(userId: string, points: number) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { points } },
      { new: true },
    ).exec();
  }

  async getPoints(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    return { points: user?.points || 0 };
  }

  async getLeaderboard() {
    return this.userModel.find().sort({ points: -1 }).limit(10).select('username points').exec();
  }
}