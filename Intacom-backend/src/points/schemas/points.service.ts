import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Point, PointDocument } from './schemas/point.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(Point.name) private pointModel: Model<PointDocument>,
    private usersService: UsersService,
  ) {}

  async addPoints(userId: string, points: number, action: string) {
    const point = new this.pointModel({
      userId,
      points,
      action,
    });
    await point.save();

    // Update user's total points
    const user = await this.usersService.findById(userId);
    user.points += points;
    await user.save();

    return point;
  }

  async getLeaderboard() {
    const users = await this.usersService.findAll();
    return users.sort((a, b) => b.points - a.points).slice(0, 10); // Top 10 users
  }
}