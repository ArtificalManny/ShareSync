import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './activity.schema';

@Injectable()
export class ActivityService {
  constructor(@InjectModel('Activity') private activityModel: Model<Activity>) {}

  async createActivity(projectId: string, userId: string, action: string): Promise<Activity> {
    const activity = new this.activityModel({ projectId, userId, action });
    return activity.save();
  }

  async getActivities(projectId: string): Promise<Activity[]> {
    return this.activityModel.find({ projectId }).sort({ timestamp: -1 }).limit(20).exec();
  }
}