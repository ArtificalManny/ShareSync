import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Point, PointDocument } from './schemas/point.schema';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(Point.name) private pointModel: Model<PointDocument>,
    private usersService: UsersService,
  ) {}

  async addPoints(userId: string, points: number, action: string) {
    try {
      const point = new this.pointModel({
        userId,
        points,
        action,
      });
      await point.save();

      // Update user's total points
      const user: UserDocument = await this.usersService.findById(userId) as UserDocument;
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.points = (user.points || 0) + points;
      await user.save();

      return point;
    } catch (error) {
      console.error('Error in addPoints:', error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const users = await this.usersService.findAll();
      return users.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10); // Top 10 users
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      throw error;
    }
  }
}