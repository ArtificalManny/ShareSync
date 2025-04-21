import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(userData: { email: string; firstName: string; lastName: string; password: string }): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, { password: newPassword }, { new: true }).exec();
  }

  async addPoints(userId: string, points: number): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, { $inc: { points: points } }, { new: true }).exec();
  }

  async getPoints(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec();
    return user ? user.points || 0 : 0;
  }

  async getLeaderboard(): Promise<User[]> {
    return this.userModel.find().sort({ points: -1 }).limit(10).exec();
  }
}