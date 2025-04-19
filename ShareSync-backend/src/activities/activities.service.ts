import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(@InjectModel('Activity') private activityModel: Model<Activity>) {}

  async logActivity(userId: string, action: string, projectId?: string, taskId?: string): Promise<void> {
    const activity = new this.activityModel({
      userId,
      action,
      projectId,
      taskId,
      timestamp: new Date(),
    });
    await activity.save();
  }

  async getActivities(projectId?: string): Promise<Activity[]> {
    if (projectId) {
      return this.activityModel.find({ projectId }).exec();
    }
    return this.activityModel.find().exec();
  }
}