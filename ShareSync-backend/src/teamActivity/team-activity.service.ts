import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamActivity } from '../notification/teamActivity.schema';

@Injectable()
export class TeamActivityService {
  constructor(@InjectModel(TeamActivity.name) private teamActivityModel: Model<TeamActivity>) {}

  async create(userId: string, message: string): Promise<TeamActivity> {
    const activity = new this.teamActivityModel({ userId, message });
    return activity.save();
  }

  async findAll(): Promise<TeamActivity[]> {
    return this.teamActivityModel.find().sort({ createdAt: -1 }).exec();
  }

  async like(activityId: string, userId: string): Promise<TeamActivity> {
    const activity = await this.teamActivityModel.findById(activityId).exec();
    if (!activity) throw new Error('Activity not found');
    if (!activity.likedBy.includes(userId)) {
      activity.likedBy.push(userId);
      activity.likes += 1;
    }
    return activity.save();
  }
}